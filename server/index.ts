import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Database, ALL_GODOWNS } from "./db.js";
import { queryAI, queryAIStream, parseInvoiceAI } from "./ai.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// PRODUCTS
app.get("/api/products", (req, res) => {
  try {
    const products = Database.getProducts();
    // Inject dynamic stock for all 18 godowns (A to R)
    const productsWithStock = products.map(p => {
      const godownStocks: Record<string, number> = {};
      ALL_GODOWNS.forEach(g => {
        godownStocks[g] = Database.getStock(p.id, g);
      });
      return {
        ...p,
        stock: Database.getStock(p.id),
        godownStocks,
      };
    });
    res.json(productsWithStock);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/products", (req, res) => {
  try {
    const { id, name, category, unit, packingType, packingTypes, buyPrice, sellPrice, isPerishable, expiryDays } = req.body;
    if (!name || !category || !unit || buyPrice === undefined || sellPrice === undefined) {
      return res.status(400).json({ error: "Missing required product fields" });
    }

    const newProduct = Database.addProduct({
      ...(id ? { id } : {}),
      name,
      category,
      unit,
      packingType: packingType || (Array.isArray(packingTypes) ? packingTypes.join(", ") : ""),
      packingTypes: Array.isArray(packingTypes) ? packingTypes : packingType ? [packingType] : [],
      buyPrice: Number(buyPrice),
      sellPrice: Number(sellPrice),
      isPerishable: Boolean(isPerishable),
      expiryDays: Number(expiryDays || 0),
    });

    res.status(201).json(newProduct);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/products/:id", (req, res) => {
  try {
    Database.deleteProduct(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CUSTOMERS
app.get("/api/customers", (req, res) => {
  try {
    const customers = Database.getCustomers();
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/customers", (req, res) => {
  try {
    const { name, address, phone, gstNo, email, creditLimitDays, creditLimitAmount } = req.body;
    if (!name || !address || !phone || !gstNo) {
      return res.status(400).json({ error: "Missing customer fields. Address, Phone, and GST are required." });
    }

    const newCustomer = Database.addCustomer({
      name,
      address,
      phone,
      gstNo,
      email: email || "",
      creditLimitDays: Number(creditLimitDays || 0),
      creditLimitAmount: Number(creditLimitAmount || 0),
    });
    res.status(201).json(newCustomer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/customers/:id", (req, res) => {
  try {
    Database.deleteCustomer(req.params.id);
    res.json({ message: "Customer deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/customers/:id", (req, res) => {
  try {
    const updated = Database.updateCustomer(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// SUPPLIERS
app.get("/api/suppliers", (req, res) => {
  try {
    const suppliers = Database.getSuppliers();
    res.json(suppliers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/suppliers", (req, res) => {
  try {
    const { name, address, phone, gstNo, email } = req.body;
    if (!name || !address || !phone || !gstNo) {
      return res.status(400).json({ error: "Missing supplier fields. Address, Phone, and GST are required." });
    }

    const newSupplier = Database.addSupplier({ name, address, phone, gstNo, email: email || "" });
    res.status(201).json(newSupplier);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/suppliers/:id", (req, res) => {
  try {
    Database.deleteSupplier(req.params.id);
    res.json({ message: "Supplier deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/suppliers/:id", (req, res) => {
  try {
    const updated = Database.updateSupplier(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ENTRIES / LEDGER
app.get("/api/entries", (req, res) => {
  try {
    const entries = Database.getEntries();
    res.json(entries);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/entries", (req, res) => {
  try {
    const { 
      productId, godown, type, quantity, pricePerUnit, date, partner, note,
      paymentType, partnerAddress, partnerPhone, partnerGST, gstPercent, subTotal, grandTotal, items,
      subType, payments, quotationNo, deliveryNoteNo, dueDate, expiryDate
    } = req.body;
    
    if (!date || !partner || !type) {
      return res.status(400).json({ error: "Missing required fields: date, partner, type" });
    }

    const newEntry = Database.addEntry({
      productId,
      godown,
      type,
      quantity: quantity !== undefined ? Number(quantity) : undefined,
      pricePerUnit: pricePerUnit !== undefined ? Number(pricePerUnit) : undefined,
      date,
      dueDate,
      expiryDate,
      partner,
      note: note || "",
      subType,
      paymentType,
      partnerAddress,
      partnerPhone,
      partnerGST,
      gstPercent: gstPercent !== undefined ? Number(gstPercent) : undefined,
      subTotal: subTotal !== undefined ? Number(subTotal) : undefined,
      grandTotal: grandTotal !== undefined ? Number(grandTotal) : undefined,
      items,
      payments,
      quotationNo,
      deliveryNoteNo,
    } as any);

    res.status(201).json(newEntry);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ANALYTICS
app.get("/api/analytics", (req, res) => {
  try {
    const analytics = Database.getAnalytics();
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// VOUCHERS
app.get("/api/vouchers", (req, res) => {
  try {
    const vouchers = Database.getVouchers();
    res.json(vouchers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/vouchers", (req, res) => {
  try {
    const { type, date, debitAccount, creditAccount, amount, mode, referenceNo, narration } = req.body;
    if (!type || !debitAccount || !creditAccount || !amount || amount <= 0) {
      return res.status(400).json({ error: "Missing required voucher fields (Type, Debit Account, Credit Account, Amount)." });
    }

    const newVoucher = Database.addVoucher({
      type,
      date: date || new Date().toISOString().split("T")[0],
      debitAccount,
      creditAccount,
      amount: Number(amount),
      mode: mode || "cash",
      referenceNo: referenceNo || "",
      narration: narration || `Voucher ${type} entry`,
    });

    res.status(201).json(newVoucher);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// AI & RAG
app.post("/api/ai/query", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question parameter is required" });
    }
    const aiResponse = await queryAI(question);
    res.json(aiResponse);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ai/query/stream", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question parameter is required" });
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    await queryAIStream(
      question,
      (chunk) => {
        res.write(`data: ${JSON.stringify({ type: "chunk", data: chunk })}\n\n`);
      },
      (telemetry) => {
        res.write(`data: ${JSON.stringify({ type: "telemetry", data: telemetry })}\n\n`);
      }
    );

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch (error: any) {
    res.write(`data: ${JSON.stringify({ type: "error", data: error.message })}\n\n`);
    res.end();
  }
});

// SPOILAGE RECORDS
app.get("/api/spoilages", (req, res) => {
  try {
    const spoilages = Database.getSpoilages();
    res.json(spoilages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/spoilages", (req, res) => {
  try {
    const { productId, productName, godown, quantity, unit, unitCost, totalLoss, date, reason, loggedBy, notes } = req.body;
    if (!productName || !godown || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "Missing required spoilage fields (productName, godown, quantity)" });
    }

    const newRecord = Database.addSpoilage({
      productId: productId || "",
      productName,
      godown,
      quantity: Number(quantity),
      unit: unit || "kg",
      unitCost: Number(unitCost || 0),
      totalLoss: Number(totalLoss || (Number(quantity) * Number(unitCost || 0))),
      date: date || new Date().toISOString().split("T")[0],
      reason: reason || "General Damage",
      loggedBy: loggedBy || "Warehouse Staff",
      notes: notes || ""
    });

    res.status(201).json(newRecord);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// CLEAR ALL REPORT & TRANSACTION HISTORY
app.post("/api/clear-history", (req, res) => {
  try {
    Database.clearHistory();
    res.json({ message: "All report and transaction history cleared successfully!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI INVOICE & DOCUMENT PARSER ENDPOINT
app.post("/api/ai/parse-invoice", async (req, res) => {
  try {
    const { text, fileName } = req.body;
    if (!text && !fileName) {
      return res.status(400).json({ error: "Missing invoice text or fileName" });
    }

    const result = await parseInvoiceAI(text || "", fileName || "");
    res.json(result);
  } catch (error: any) {
    console.error("AI Invoice endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
