import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Database, Product, StockEntry, Godown, Category } from "./db.js";

// Load env variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini SDK if API key exists
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenerativeAI | null = null;
if (geminiApiKey) {
  ai = new GoogleGenerativeAI(geminiApiKey);
  console.log("Gemini API initialized successfully.");
} else {
  console.log("No GEMINI_API_KEY found in environment. Falling back to Local NLP / Prompt Generator.");
}

interface KBArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

const KB_FILE = path.join(__dirname, "data", "kb.json");
const articles: KBArticle[] = JSON.parse(fs.readFileSync(KB_FILE, "utf-8"));

export interface AIResponseTelemetry {
  intent: string;
  entities: Record<string, string | number>;
  retrievedDocs: KBArticle[];
  databaseContext: any;
  promptSent: string;
  responseText: string;
  modelUsed: string;
  processingTimeMs: number;
}

// Simple RAG retrieval: Cosine Similarity/Tf-Idf keyword matcher in pure JS
function retrieveKB(query: string, limit = 2): { article: KBArticle; score: number }[] {
  const queryTokens = query.toLowerCase().split(/[\s,.\-!?]+/);
  
  const scored = articles.map(art => {
    let score = 0;
    const artContent = (art.title + " " + art.content + " " + art.tags.join(" ")).toLowerCase();
    
    // Count exact keyword matches
    queryTokens.forEach(token => {
      if (token.length < 3) return; // ignore short words
      
      // Full word match gives higher score
      const regex = new RegExp("\\b" + token + "\\b", "g");
      const matches = artContent.match(regex);
      if (matches) {
        score += matches.length * 3;
      } else if (artContent.includes(token)) {
        score += 1; // partial match
      }
      
      // Tag match multiplier
      art.tags.forEach(tag => {
        if (tag.includes(token) || token.includes(tag)) {
          score += 5;
        }
      });
    });
    
    return { article: art, score };
  });

  // Sort and filter non-zero scores
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// NLP Engine: Intent and Entity Extractor
function parseNLP(query: string) {
  const q = query.toLowerCase();
  
  const result = {
    intent: "general_kb",
    entities: {} as Record<string, any>
  };

  // Find Products
  const products = Database.getProducts();
  const matchedProduct = products.find(p => q.includes(p.name.toLowerCase()));
  if (matchedProduct) {
    result.entities.productId = matchedProduct.id;
    result.entities.productName = matchedProduct.name;
    result.entities.productCategory = matchedProduct.category;
  }

  // Find Godown (A to R)
  const godownMatch = q.match(/\bgodown\s+([a-r])\b/i);
  if (godownMatch && "abcdefghijklmnopqr".includes(godownMatch[1].toLowerCase())) {
    result.entities.godown = godownMatch[1].toUpperCase() as Godown;
  } else {
    // try matching single letter in range A-R
    const letters = q.split(/[\s,.\-!?]+/);
    const matchedLetter = letters.find(l => l.length === 1 && "abcdefghijklmnopqr".includes(l.toLowerCase()));
    if (matchedLetter) {
      result.entities.godown = matchedLetter.toUpperCase() as Godown;
    }
  }

  // Quantity extraction
  const qtyMatch = q.match(/(\d+)\s*(?:units|kg|bags|boxes|tons|gm|liters|packets)?\s*(?:of)?/i);
  if (qtyMatch) {
    result.entities.quantity = parseInt(qtyMatch[1], 10);
  }

  // Price extraction
  const priceMatch = q.match(/(?:at|for|price|rate|cost|rs|inr)\s*(?:of)?\s*(\d+)/i);
  if (priceMatch) {
    result.entities.pricePerUnit = parseInt(priceMatch[1], 10);
  }

  // Partner extraction
  const toPartnerMatch = q.match(/to\s+([a-z0-9\s&]+?)(?:\s+at|\s+from|\s+in|\s+rate|for|\s+godown|$)/i);
  const fromPartnerMatch = q.match(/from\s+([a-z0-9\s&]+?)(?:\s+at|\s+to|\s+in|\s+rate|for|\s+godown|$)/i);
  if (toPartnerMatch) {
    result.entities.partner = toPartnerMatch[1].trim().replace(/\b(us|me|the)\b/gi, "").trim();
    result.entities.transactionType = "out";
  } else if (fromPartnerMatch) {
    result.entities.partner = fromPartnerMatch[1].trim().replace(/\b(us|me|the)\b/gi, "").trim();
    result.entities.transactionType = "in";
  }

  // Set default partner if none matched but user says sell/buy
  if (!result.entities.partner) {
    if (q.includes("sell") || q.includes("export")) {
      result.entities.transactionType = "out";
      result.entities.partner = "General Client";
    } else if (q.includes("buy") || q.includes("import")) {
      result.entities.transactionType = "in";
      result.entities.partner = "General Supplier";
    }
  }

  // Intent classification
  if (q.includes("invoice") || q.includes("bill") || q.includes("post") || q.includes("draft") || (q.includes("sell") && q.includes("to")) || (q.includes("buy") && q.includes("from"))) {
    result.intent = "create_invoice";
  } else if (q.includes("chart") || q.includes("graph") || q.includes("plot") || q.includes("compare visual") || q.includes("visualize")) {
    result.intent = "chart";
  } else if (q.includes("profit") || q.includes("loss") || q.includes("revenue") || q.includes("margin") || q.includes("cost") || q.includes("p&l") || q.includes("earn")) {
    result.intent = "financials";
  } else if (q.includes("stock") || q.includes("how many") || q.includes("inventory") || q.includes("left") || q.includes("quantity") || q.includes("present") || q.includes("remain")) {
    result.intent = "inventory";
  } else if (q.includes("expire") || q.includes("freshness") || q.includes("spoiled") || q.includes("spoil") || q.includes("rotten") || q.includes("perishable") || q.includes("fresh")) {
    result.intent = "perishables";
  } else if (q.includes("export") || q.includes("import") || q.includes("shipment") || q.includes("logistics") || q.includes("partner")) {
    result.intent = "logistics";
  }

  return result;
}

// Generate context-driven answer using Local Smart Template System
function generateLocalFallback(intent: string, entities: Record<string, any>, dbContext: any, retrievedDocs: { article: KBArticle; score: number }[]): string {
  const fmtMoney = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  const q = entities.queryText ? entities.queryText.toLowerCase() : "";
  let response = "";

  if (intent === "create_invoice") {
    const { products } = dbContext;
    const transType = entities.transactionType === "in" ? "Import (Purchase)" : "Export (Sale)";
    const prodName = entities.productName || (products[0] ? products[0].name : "Selected Product");
    const qty = entities.quantity || 50;
    const rate = entities.pricePerUnit || 150;
    const partnerName = entities.partner || (entities.transactionType === "in" ? "General Supplier" : "General Client");
    const godownName = entities.godown || "A";
    
    response = `I have parsed your request and prepared a draft **${transType}** voucher:\n\n` +
      `• **Product**: ${prodName}\n` +
      `• **Partner**: ${partnerName}\n` +
      `• **Quantity**: ${qty} units\n` +
      `• **Price per Unit**: ${fmtMoney(rate)} (Total: ${fmtMoney(qty * rate)})\n` +
      `• **Warehouse Allocation**: Godown ${godownName}\n\n` +
      `Please review the draft voucher widget in the chat feed below and click **"Confirm & Post Invoice"** to save it to the official transactions ledger.\n\n` +
      `<DIRECTIVE>${JSON.stringify({
        action: "draft_invoice",
        invoice: {
          type: entities.transactionType || "out",
          productId: entities.productId || (products[0] ? products[0].id : "p1"),
          productName: prodName,
          quantity: qty,
          pricePerUnit: rate,
          partner: partnerName,
          godown: godownName
        }
      })}</DIRECTIVE>`;
  }

  else if (intent === "chart") {
    const { products } = dbContext;
    // Determine whether to compare profit or stock
    const isProfit = q.includes("profit") || q.includes("margin") || q.includes("revenue") || q.includes("financial") || q.includes("earn");
    
    let dataset = [];
    let title = "Product Stock Levels";
    
    if (isProfit) {
      title = "Product Realized Profits (INR)";
      dataset = products.slice(0, 6).map((p: any) => ({
        label: p.name,
        value: dbContext.analytics.productPL[p.id]?.profit || 0
      }));
    } else {
      dataset = products.slice(0, 6).map((p: any) => ({
        label: p.name,
        value: Database.getStock(p.id)
      }));
    }

    response = `Here is a visualization of the requested metrics across key products:\n\n` +
      `<DIRECTIVE>${JSON.stringify({
        action: "render_chart",
        chart: {
          type: isProfit ? "bar" : "pie",
          title,
          dataset
        }
      })}</DIRECTIVE>`;
  }

  else if (intent === "inventory") {
    const { products } = dbContext;
    if (entities.productName) {
      const stock = Database.getStock(entities.productId, entities.godown);
      const locStr = entities.godown ? `in Godown ${entities.godown}` : "across all godowns";
      response = `Currently, you have **${stock} ${products.find((p: any) => p.id === entities.productId)?.unit || "units"}** of **${entities.productName}** in stock ${locStr}.\n\n`;
      
      // Add info about godowns stored
      if (!entities.godown) {
        response += `Breakdown:\n` +
          `• Godown A: ${Database.getStock(entities.productId, "A")} units\n` +
          `• Godown B: ${Database.getStock(entities.productId, "B")} units\n` +
          `• Godown C: ${Database.getStock(entities.productId, "C")} units\n\n`;
      }
      
      const kb = retrievedDocs[0]?.article;
      if (kb) {
        response += `*Storage Note (from RAG Docs):* ${kb.content}`;
      }
    } else if (entities.godown) {
      const stats = dbContext.analytics.godownStats.find((g: any) => g.godown === entities.godown);
      response = `**Godown ${entities.godown} Status:**\n` +
        `• Current Total Stock: ${stats ? stats.current : 0} units\n` +
        `• Unique Products: ${stats ? stats.uniqueProducts : 0} units\n\n` +
        `Products stored here include: ` + 
        products.map((p: any) => {
          const s = Database.getStock(p.id, entities.godown);
          return s > 0 ? `\n  - ${p.name}: ${s} ${p.unit}` : null;
        }).filter(Boolean).join("") + "\n\n";

      const kb = retrievedDocs.find(d => d.article.tags.includes("godown"))?.article;
      if (kb) {
        response += `*Warehouse Guidelines:* ${kb.content}`;
      }
    } else {
      const totalStock = products.reduce((s: number, p: any) => s + Database.getStock(p.id), 0);
      response = `**Inventory Summary:**\n` +
        `You have a total of **${totalStock} items** in stock across all godowns. Here is a breakdown by category:\n` +
        `• Spices: ${products.filter((p: any) => p.category === "Spices").reduce((s: number, p: any) => s + Database.getStock(p.id), 0)} units\n` +
        `• Dry Fruits: ${products.filter((p: any) => p.category === "Dry Fruits").reduce((s: number, p: any) => s + Database.getStock(p.id), 0)} units\n` +
        `• Fruits: ${products.filter((p: any) => p.category === "Fruits").reduce((s: number, p: any) => s + Database.getStock(p.id), 0)} units\n` +
        `• Vegetables: ${products.filter((p: any) => p.category === "Vegetables").reduce((s: number, p: any) => s + Database.getStock(p.id), 0)} units\n\n` +
        `For specific item stock levels, ask about that product directly (e.g., "Saffron stock" or "Mangoes in godown C").`;
    }
  }

  else if (intent === "financials") {
    const { analytics } = dbContext;
    if (entities.productName) {
      const itemPL = analytics.productPL[entities.productId];
      const margin = itemPL && itemPL.revenue > 0 ? ((itemPL.profit / itemPL.revenue) * 100).toFixed(1) : "0.0";
      response = `**Financial Analytics for ${entities.productName}:**\n` +
        `• Realized Revenue: **${fmtMoney(itemPL ? itemPL.revenue : 0)}**\n` +
        `• Cost of Goods Placed: **${fmtMoney(itemPL ? itemPL.cost : 0)}**\n` +
        `• Net Profit/Loss: **${fmtMoney(itemPL ? itemPL.profit : 0)}** (${itemPL && itemPL.profit >= 0 ? "Profit" : "Loss"})\n` +
        `• Profit Margin: **${margin}%**\n` +
        `• Total Units Sold: ${itemPL ? itemPL.sold : 0} units\n\n`;
      
      const kb = retrievedDocs.find(d => d.article.tags.includes("quality") || d.article.tags.includes("price") || d.article.tags.includes("export"))?.article;
      if (kb) {
        response += `*Market Insight:* ${kb.content}`;
      }
    } else {
      const margin = analytics.revenue > 0 ? ((analytics.profit / analytics.revenue) * 100).toFixed(1) : "0.0";
      response = `**Overall Trading Financial Report:**\n` +
        `• Total Revenue: **${fmtMoney(analytics.revenue)}**\n` +
        `• Total Operational Cost: **${fmtMoney(analytics.cost)}**\n` +
        `• Consolidated Net Profit: **${fmtMoney(analytics.profit)}**\n` +
        `• Net Margin: **${margin}%**\n\n` +
        `**Top Profit Generators:**\n`;
        
      // Rank products by profit
      const ranked = Object.entries(analytics.productPL)
        .map(([id, info]: any) => ({ name: Database.getProducts().find(p => p.id === id)?.name || id, ...info }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 3);
        
      ranked.forEach((item, idx) => {
        response += `${idx + 1}. **${item.name}**: Profit of ${fmtMoney(item.profit)} (Margin: ${item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(0) : 0}%)\n`;
      });
    }
  }

  else if (intent === "perishables") {
    const { products, entries } = dbContext;
    response = `**Perishables Freshness Monitor Alert (Godown C):**\n\n`;
    
    // Find active perishable batches
    const activePerishables: any[] = [];
    entries.forEach((e: any) => {
      if (e.type === "in" && e.expiryDate) {
        const prod = products.find((p: any) => p.id === e.productId);
        const currentInStock = Database.getStock(e.productId);
        
        if (currentInStock > 0) {
          const daysLeft = Math.ceil((new Date(e.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          activePerishables.push({
            name: prod?.name,
            qty: currentInStock,
            unit: prod?.unit,
            expiryDate: e.expiryDate,
            daysLeft,
            note: e.note,
          });
        }
      }
    });

    if (activePerishables.length === 0) {
      response += `There are currently no active fresh batches stored in Godown C. Standard cold chain parameters are maintained at 4°C.`;
    } else {
      response += `Here are the active perishable lots and their remaining days to spoil:\n`;
      activePerishables.forEach(lot => {
        let status = "🟢 Fresh";
        if (lot.daysLeft <= 0) status = "🔴 EXPIRED / Spoilage Alert";
        else if (lot.daysLeft <= 3) status = "🟡 Warning: Spoiling soon";

        response += `• **${lot.name}** batch (${lot.qty} ${lot.unit}): Expiry ${lot.expiryDate} (**${lot.daysLeft} days remaining** - ${status}). *Note:* ${lot.note}\n`;
      });
    }

    const kb = retrievedDocs.find(d => d.article.tags.includes("perishable") || d.article.tags.includes("ethylene"))?.article;
    if (kb) {
      response += `\n*Ethylene Storage Notice:* ${kb.content}`;
    }
  }

  else if (intent === "logistics") {
    const { entries, products } = dbContext;
    const shipments = entries.slice().sort((a: any, b: any) => b.date.localeCompare(a.date)).slice(0, 5);
    
    response = `**Recent Logistics Activity (Imports & Exports):**\n\n`;
    shipments.forEach((s: any) => {
      const prod = products.find((p: any) => p.id === s.productId);
      const action = s.type === "in" ? "Imported from" : "Exported to";
      response += `• **${s.date}**: ${s.type === "in" ? "📥 Import" : "📤 Export"} — ${s.quantity} ${prod?.unit} of **${prod?.name}** at ${fmtMoney(s.pricePerUnit)}/unit. ${action} *${s.partner}* (Godown ${s.godown}).\n`;
    });

    const kb = retrievedDocs.find(d => d.article.tags.includes("logistics") || d.article.tags.includes("customs") || d.article.tags.includes("shipping"))?.article;
    if (kb) {
      response += `\n*Customs & Logistics Guideline:* ${kb.content}`;
    }
  }

  else {
    if (retrievedDocs.length > 0) {
      response = `Based on our company's operations manual:\n\n`;
      retrievedDocs.forEach(doc => {
        response += `### ${doc.article.title}\n${doc.article.content}\n\n`;
      });
    } else {
      response = `Hello! I have full visibility into your inventory, P&L sheet, and warehousing specs. I couldn't find a direct match in our database documents for your query. 

Try asking:
- "How much saffron is left in godown A?"
- "Show a chart comparing the stock of all products"
- "Sell 50 units of Saffron from Godown A to Taj Spices at 9000 per unit"
- "Show me expired or perishable goods."`;
    }
  }

  return response;
}

// Compile and run the query
export async function queryAI(userQuestion: string): Promise<AIResponseTelemetry> {
  const startTime = Date.now();
  
  // 1. NLP parsing
  const nlp = parseNLP(userQuestion);
  const { intent, entities } = nlp;
  entities.queryText = userQuestion;

  // 2. Database context fetch
  const products = Database.getProducts();
  const entries = Database.getEntries();
  const analytics = Database.getAnalytics();
  
  const dbContext = {
    products: products.map(p => ({ id: p.id, name: p.name, category: p.category, unit: p.unit, isPerishable: p.isPerishable })),
    analytics: {
      revenue: analytics.revenue,
      cost: analytics.cost,
      profit: analytics.profit,
      godownStats: analytics.godownStats,
      productPL: analytics.productPL,
    },
    entries: entries.slice(-10), // Send last 10 entries to LLM context
  };

  // 3. RAG Retrieval
  const searchResults = retrieveKB(userQuestion, 2);
  const retrievedDocs = searchResults.map(r => r.article);

  // 4. Construct System Prompt
  const knowledgeStr = retrievedDocs.map((d, i) => `[Doc ${i+1}: ${d.title}]\n${d.content}`).join("\n\n");
  
  const promptSent = `You are the AI Operations Coordinator for Spice Route Trading Co. 
You have access to a RAG database (Knowledge Base) and real-time transaction figures.

--- RETRIEVED KNOWLEDGE ---
${knowledgeStr || "No direct knowledge base articles matched. Use general industry standards."}

--- DATABASE CONTEXT ---
Intent Parsed: ${intent}
Entity Extracted: ${JSON.stringify(entities)}
Total Revenue: INR ${analytics.revenue}
Total Cost: INR ${analytics.cost}
Net Profit/Loss: INR ${analytics.profit}
Godowns:
${analytics.godownStats.map((g: any) => `- Godown ${g.godown}: Current stock = ${g.current} units, Unique products = ${g.uniqueProducts}`).join("\n")}

Product Status Summary:
${products.map(p => {
  const stock = Database.getStock(p.id);
  const pl = analytics.productPL[p.id];
  return `- ${p.name} (${p.category}): Stock = ${stock} ${p.unit}, Realized Profit = INR ${pl.profit}, Sold = ${pl.sold} ${p.unit}, ID = ${p.id}`;
}).join("\n")}

Recent Stock Movement Ledger:
${entries.slice(-6).map(e => `- Date: ${e.date}, Product: ${products.find(p => p.id === e.productId)?.name}, Godown: ${e.godown}, Type: ${e.type.toUpperCase()}, Qty: ${e.quantity}, Partner: ${e.partner}`).join("\n")}

--- INSTRUCTIONS ---
- Answer the user's question accurately using both the database numbers and retrieved articles.
- Keep the tone professional, neat, and highly helpful.
- Present data lists, breakdowns, or tables in clear, readable markdown.
- Do not mention that you received "context" or "prompt instructions". Talk naturally as a system assistant.
- IF the user wants to CREATE or POST a transaction (sell, buy, invoice), you MUST append a JSON block at the very end of your response inside a <DIRECTIVE> tag like:
  <DIRECTIVE>{"action": "draft_invoice", "invoice": {"type": "in" | "out", "productId": "prod_id_from_context", "productName": "Product Name", "quantity": 10, "pricePerUnit": 100, "partner": "Partner Name", "godown": "A"}}</DIRECTIVE>
- IF the user requests a CHART, graph, or visualization comparing items, you MUST append a JSON block at the very end of your response inside a <DIRECTIVE> tag like:
  <DIRECTIVE>{"action": "render_chart", "chart": {"type": "bar" | "pie", "title": "Chart Title", "dataset": [{"label": "Product A", "value": 100}, {"label": "Product B", "value": 200}]}}</DIRECTIVE>
- DO NOT invent product IDs. Only use existing products and their IDs from the Product Status Summary.

User Question: "${userQuestion}"
Answer:`;

  let responseText = "";
  let modelUsed = "Mock / NLP Templates";

  if (ai) {
    try {
      modelUsed = "Google Gemini 1.5 Flash";
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const response = await model.generateContent(promptSent);
      const result = await response.response;
      responseText = result.text() || "";
    } catch (e) {
      console.error("Gemini API generation failed. Falling back to local templates.", e);
      responseText = generateLocalFallback(intent, entities, { products, entries, analytics }, searchResults);
      modelUsed = "Mock / NLP Templates (Fallback due to error)";
    }
  } else {
    responseText = generateLocalFallback(intent, entities, { products, entries, analytics }, searchResults);
  }

  const processingTimeMs = Date.now() - startTime;

  return {
    intent,
    entities,
    retrievedDocs,
    databaseContext: dbContext,
    promptSent,
    responseText,
    modelUsed,
    processingTimeMs,
  };
}

export async function queryAIStream(
  userQuestion: string,
  onChunk: (chunk: string) => void,
  onTelemetry: (telemetry: any) => void
): Promise<void> {
  const startTime = Date.now();
  
  // 1. NLP parsing
  const nlp = parseNLP(userQuestion);
  const { intent, entities } = nlp;
  entities.queryText = userQuestion;

  // 2. Database context fetch
  const products = Database.getProducts();
  const entries = Database.getEntries();
  const analytics = Database.getAnalytics();
  
  const dbContext = {
    products: products.map(p => ({ id: p.id, name: p.name, category: p.category, unit: p.unit, isPerishable: p.isPerishable })),
    analytics: {
      revenue: analytics.revenue,
      cost: analytics.cost,
      profit: analytics.profit,
      godownStats: analytics.godownStats,
      productPL: analytics.productPL,
    },
    entries: entries.slice(-10),
  };

  // 3. RAG Retrieval
  const searchResults = retrieveKB(userQuestion, 2);
  const retrievedDocs = searchResults.map(r => r.article);

  // 4. Construct System Prompt
  const knowledgeStr = retrievedDocs.map((d, i) => `[Doc ${i+1}: ${d.title}]\n${d.content}`).join("\n\n");
  
  const promptSent = `You are the AI Operations Coordinator for Spice Route Trading Co. 
You have access to a RAG database (Knowledge Base) and real-time transaction figures.

--- RETRIEVED KNOWLEDGE ---
${knowledgeStr || "No direct knowledge base articles matched. Use general industry standards."}

--- DATABASE CONTEXT ---
Intent Parsed: ${intent}
Entity Extracted: ${JSON.stringify(entities)}
Total Revenue: INR ${analytics.revenue}
Total Cost: INR ${analytics.cost}
Net Profit/Loss: INR ${analytics.profit}
Godowns:
${analytics.godownStats.map((g: any) => `- Godown ${g.godown}: Current stock = ${g.current} units, Unique products = ${g.uniqueProducts}`).join("\n")}

Product Status Summary:
${products.map(p => {
  const stock = Database.getStock(p.id);
  const pl = analytics.productPL[p.id];
  return `- ${p.name} (${p.category}): Stock = ${stock} ${p.unit}, Realized Profit = INR ${pl.profit}, Sold = ${pl.sold} ${p.unit}, ID = ${p.id}`;
}).join("\n")}

Recent Stock Movement Ledger:
${entries.slice(-6).map(e => `- Date: ${e.date}, Product: ${products.find(p => p.id === e.productId)?.name}, Godown: ${e.godown}, Type: ${e.type.toUpperCase()}, Qty: ${e.quantity}, Partner: ${e.partner}`).join("\n")}

--- INSTRUCTIONS ---
- Answer the user's question accurately using both the database numbers and retrieved articles.
- Keep the tone professional, neat, and highly helpful.
- Present data lists, breakdowns, or tables in clear, readable markdown.
- Do not mention that you received "context" or "prompt instructions". Talk naturally as a system assistant.
- IF the user wants to CREATE or POST a transaction (sell, buy, invoice), you MUST append a JSON block at the very end of your response inside a <DIRECTIVE> tag like:
  <DIRECTIVE>{"action": "draft_invoice", "invoice": {"type": "in" | "out", "productId": "prod_id_from_context", "productName": "Product Name", "quantity": 10, "pricePerUnit": 100, "partner": "Partner Name", "godown": "A"}}</DIRECTIVE>
- IF the user requests a CHART, graph, or visualization comparing items, you MUST append a JSON block at the very end of your response inside a <DIRECTIVE> tag like:
  <DIRECTIVE>{"action": "render_chart", "chart": {"type": "bar" | "pie", "title": "Chart Title", "dataset": [{"label": "Product A", "value": 100}, {"label": "Product B", "value": 200}]}}</DIRECTIVE>
- DO NOT invent product IDs. Only use existing products and their IDs from the Product Status Summary.

User Question: "${userQuestion}"
Answer:`;

  let responseText = "";
  let modelUsed = "Mock / NLP Templates";

  const sendTelemetry = (finalText: string) => {
    const processingTimeMs = Date.now() - startTime;
    onTelemetry({
      intent,
      entities,
      retrievedDocs,
      databaseContext: dbContext,
      promptSent,
      modelUsed,
      processingTimeMs,
      responseText: finalText,
    });
  };

  if (ai) {
    try {
      modelUsed = "Google Gemini 1.5 Flash";
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContentStream(promptSent);
      
      let fullResponseText = "";
      for await (const chunk of result.stream) {
        const text = chunk.text();
        fullResponseText += text;
        onChunk(text);
      }
      sendTelemetry(fullResponseText);
    } catch (e) {
      console.error("Gemini API stream generation failed. Falling back to local templates.", e);
      responseText = generateLocalFallback(intent, entities, { products, entries, analytics }, searchResults);
      modelUsed = "Mock / NLP Templates (Fallback due to error)";
      sendTelemetry(responseText);
      await streamFallbackText(responseText, onChunk);
    }
  } else {
    responseText = generateLocalFallback(intent, entities, { products, entries, analytics }, searchResults);
    sendTelemetry(responseText);
    await streamFallbackText(responseText, onChunk);
  }
}

async function streamFallbackText(text: string, onChunk: (chunk: string) => void): Promise<void> {
  const words = text.split(" ");
  for (let i = 0; i < words.length; i += 3) {
    const chunk = words.slice(i, i + 3).join(" ") + " ";
    onChunk(chunk);
    await new Promise(resolve => setTimeout(resolve, 40));
  }
}
