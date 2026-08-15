import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import cron from "node-cron";
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

// ─── Nodemailer Transporter ────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || "adhilabdul49@gmail.com",
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify SMTP connection at startup
transporter.verify((error) => {
  if (error) {
    console.error("[MAIL] SMTP transporter error:", error.message);
  } else {
    console.log("[MAIL] Gmail SMTP transporter is ready to send emails.");
  }
});

// ─── Credit Recovery Email Helpers ────────────────────────────────────────

const formatDDMMYYYY = (dStr: string) => {
  if (!dStr) return "N/A";
  const parts = dStr.split("-");
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dStr;
};

const fmtINR = (val: number) =>
  `₹${(val || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/** Build a beautiful HTML email for credit recovery */
function buildCreditEmailHTML(opts: {
  customerName: string;
  entries: {
    invoiceNo?: string;
    id: string;
    date: string;
    due: string;
    overdueDays: number;
    isOverdue: boolean;
    grandTotal: number;
  }[];
  totalOutstanding: number;
  overdueOutstanding: number;
  isMonthly: boolean;
}) {
  const { customerName, entries, totalOutstanding, overdueOutstanding, isMonthly } = opts;

  const rows = entries
    .map(
      (e, i) => `
      <tr style="background:${i % 2 === 0 ? "#f8fafc" : "#ffffff"}">
        <td style="padding:10px 14px;font-family:monospace;font-size:13px;color:#1e293b;border-bottom:1px solid #e2e8f0">${e.invoiceNo || e.id.slice(0, 8)}</td>
        <td style="padding:10px 14px;font-size:12px;color:#64748b;border-bottom:1px solid #e2e8f0">${formatDDMMYYYY(e.date)}</td>
        <td style="padding:10px 14px;font-size:12px;color:#1e293b;font-weight:600;border-bottom:1px solid #e2e8f0">${formatDDMMYYYY(e.due)}</td>
        <td style="padding:10px 14px;text-align:center;border-bottom:1px solid #e2e8f0">
          ${
            e.overdueDays > 0
              ? `<span style="background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700">${e.overdueDays} Days Past Due</span>`
              : `<span style="color:#16a34a;font-size:11px;font-weight:600">On Schedule</span>`
          }
        </td>
        <td style="padding:10px 14px;text-align:right;font-weight:700;font-family:monospace;font-size:13px;color:#1e293b;border-bottom:1px solid #e2e8f0">${fmtINR(e.grandTotal)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Credit Recovery Notice</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10)">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#b91c1c 0%,#7f1d1d 100%);padding:28px 32px">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px">Spice Route Trading Co.</h1>
            <p style="margin:4px 0 0;color:#fca5a5;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600">
              ${isMonthly ? "Monthly Credit Statement — Automated Notice" : "Overdue Payment Recovery Notice"}
            </p>
            <p style="margin:6px 0 0;color:#fecaca;font-size:11px">Date: ${formatDDMMYYYY(new Date().toISOString().split("T")[0])}</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:28px 32px 0">
            <p style="margin:0;font-size:15px;color:#1e293b">Dear <strong>${customerName}</strong>,</p>
            <p style="margin:12px 0 0;font-size:13px;color:#475569;line-height:1.6">
              ${
                isMonthly
                  ? `This is your <strong>automated monthly credit statement</strong> from <strong>Spice Route Trading Co.</strong> as of <strong>${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</strong>. Please review your outstanding and overdue balances listed below.`
                  : `This is a <strong>payment recovery notice</strong> from <strong>Spice Route Trading Co.</strong> Our records indicate the following overdue invoices on your account. We kindly request prompt settlement to maintain your credit standing.`
              }
            </p>
          </td>
        </tr>

        <!-- Summary KPIs -->
        <tr>
          <td style="padding:20px 32px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="48%" style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:16px;text-align:center">
                  <div style="font-size:11px;color:#dc2626;text-transform:uppercase;letter-spacing:1px;font-weight:700">Overdue Amount</div>
                  <div style="font-size:22px;font-weight:800;color:#b91c1c;font-family:monospace;margin-top:4px">${fmtINR(overdueOutstanding)}</div>
                </td>
                <td width="4%"></td>
                <td width="48%" style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:16px;text-align:center">
                  <div style="font-size:11px;color:#ea580c;text-transform:uppercase;letter-spacing:1px;font-weight:700">Total Outstanding</div>
                  <div style="font-size:22px;font-weight:800;color:#c2410c;font-family:monospace;margin-top:4px">${fmtINR(totalOutstanding)}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Invoice Table -->
        <tr>
          <td style="padding:0 32px">
            <h3 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:700">Invoice Details</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
              <thead>
                <tr style="background:#1e293b">
                  <th style="padding:11px 14px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700">Invoice No</th>
                  <th style="padding:11px 14px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700">Bill Date</th>
                  <th style="padding:11px 14px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700">Due Date</th>
                  <th style="padding:11px 14px;text-align:center;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700">Status</th>
                  <th style="padding:11px 14px;text-align:right;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700">Amount</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </td>
        </tr>

        <!-- Bank Details -->
        <tr>
          <td style="padding:24px 32px">
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:18px">
              <h4 style="margin:0 0 10px;color:#166534;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700">Remittance Bank Details</h4>
              <table cellpadding="0" cellspacing="0">
                <tr><td style="font-size:12px;color:#15803d;padding:2px 0;width:150px">Bank Name:</td><td style="font-size:12px;color:#166534;font-weight:600">HDFC Bank — Fort Branch, Mumbai</td></tr>
                <tr><td style="font-size:12px;color:#15803d;padding:2px 0">Account Name:</td><td style="font-size:12px;color:#166534;font-weight:600">Spice Route Trading Co.</td></tr>
                <tr><td style="font-size:12px;color:#15803d;padding:2px 0">Account No:</td><td style="font-size:12px;color:#166534;font-weight:700;font-family:monospace">50200088991122</td></tr>
                <tr><td style="font-size:12px;color:#15803d;padding:2px 0">IFSC Code:</td><td style="font-size:12px;color:#166534;font-weight:700;font-family:monospace">HDFC0000240</td></tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px 28px;border-top:1px solid #f1f5f9">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">
              Kindly process payment at your earliest convenience and reply to this email with your payment reference.<br/>
              <strong style="color:#64748b">Spice Route Trading Co.</strong> | accounts@spiceroute.in | This is an automated notice.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Compute credit data from entries + customers (same logic as frontend) */
function computeCreditData() {
  const entries = Database.getEntries();
  const customers = Database.getCustomers();
  const today = new Date().toISOString().split("T")[0];

  const creditEntries = entries
    .filter((e) => e.type === "out" && e.paymentType === "credit")
    .map((e) => {
      const grandTotal =
        e.grandTotal ||
        (e.subTotal || (e.quantity || 0) * (e.pricePerUnit || 0)) * 1.12;
      const due = e.dueDate || e.date;
      const diffMs =
        new Date(today).getTime() - new Date(due).getTime();
      const overdueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const isOverdue = overdueDays > 0;
      return { ...e, grandTotal, due, overdueDays: Math.max(0, overdueDays), isOverdue };
    });

  const map: Record<
    string,
    {
      partner: string;
      customer?: (typeof customers)[0];
      totalOutstanding: number;
      overdueOutstanding: number;
      invoicesCount: number;
      entries: typeof creditEntries;
    }
  > = {};

  creditEntries.forEach((e) => {
    const pName = e.partner;
    if (!map[pName]) {
      const custObj = customers.find(
        (c) => c.name.toLowerCase() === pName.toLowerCase()
      );
      map[pName] = {
        partner: pName,
        customer: custObj,
        totalOutstanding: 0,
        overdueOutstanding: 0,
        invoicesCount: 0,
        entries: [],
      };
    }
    map[pName].totalOutstanding += e.grandTotal;
    if (e.isOverdue) map[pName].overdueOutstanding += e.grandTotal;
    map[pName].invoicesCount += 1;
    map[pName].entries.push(e);
  });

  return Object.values(map);
}

/** Send overdue-only email to one customer (1-Click button) */
async function sendOverdueMailToCustomer(
  customerId: string
): Promise<{ success: boolean; message: string; email?: string }> {
  const customers = Database.getCustomers();
  const customer = customers.find((c) => c.id === customerId);

  if (!customer) return { success: false, message: "Customer not found." };

  const email = (customer as any).email?.trim();
  if (!email) {
    return {
      success: false,
      message: `No email address on file for "${customer.name}". Please update the customer profile.`,
    };
  }

  const creditData = computeCreditData();
  const partnerData = creditData.find(
    (p) => p.partner.toLowerCase() === customer.name.toLowerCase()
  );

  if (!partnerData || partnerData.entries.length === 0) {
    return {
      success: false,
      message: `No credit entries found for "${customer.name}".`,
    };
  }

  // Only overdue entries for 1-click button
  const overdueEntries = partnerData.entries.filter((e) => e.isOverdue);
  if (overdueEntries.length === 0) {
    return {
      success: false,
      message: `No overdue invoices found for "${customer.name}". All payments are on schedule.`,
    };
  }

  const html = buildCreditEmailHTML({
    customerName: customer.name,
    entries: overdueEntries,
    totalOutstanding: partnerData.totalOutstanding,
    overdueOutstanding: partnerData.overdueOutstanding,
    isMonthly: false,
  });

  await transporter.sendMail({
    from: `"Spice Route Trading Co." <${process.env.GMAIL_USER || "adhilabdul49@gmail.com"}>`,
    to: email,
    subject: `⚠️ Overdue Payment Notice — ${customer.name} | Spice Route Trading Co.`,
    html,
  });

  console.log(`[MAIL] Overdue notice sent to ${customer.name} <${email}>`);
  return { success: true, message: `Overdue notice sent to ${email}`, email };
}

/** Monthly auto-send: send due + overdue list to ALL customers with email */
async function sendMonthlyStatementToAll(): Promise<{
  sent: number;
  skipped: number;
  errors: string[];
}> {
  console.log("[CRON] Starting monthly credit statement email broadcast...");
  const creditData = computeCreditData();
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const partnerData of creditData) {
    const email = partnerData.customer
      ? (partnerData.customer as any).email?.trim()
      : "";

    if (!email) {
      console.log(`[CRON] Skipping "${partnerData.partner}" — no email on file.`);
      skipped++;
      continue;
    }

    if (partnerData.entries.length === 0) {
      skipped++;
      continue;
    }

    try {
      const html = buildCreditEmailHTML({
        customerName: partnerData.partner,
        entries: partnerData.entries, // All (due + overdue) for monthly
        totalOutstanding: partnerData.totalOutstanding,
        overdueOutstanding: partnerData.overdueOutstanding,
        isMonthly: true,
      });

      await transporter.sendMail({
        from: `"Spice Route Trading Co." <${process.env.GMAIL_USER || "adhilabdul49@gmail.com"}>`,
        to: email,
        subject: `📋 Monthly Credit Statement — ${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })} | Spice Route Trading Co.`,
        html,
      });

      console.log(`[CRON] Monthly statement sent to "${partnerData.partner}" <${email}>`);
      sent++;
    } catch (err: any) {
      console.error(`[CRON] Failed to send to "${partnerData.partner}": ${err.message}`);
      errors.push(`${partnerData.partner}: ${err.message}`);
    }
  }

  console.log(`[CRON] Monthly broadcast complete. Sent: ${sent}, Skipped: ${skipped}, Errors: ${errors.length}`);
  return { sent, skipped, errors };
}

// ─── Monthly Cron Scheduler ──────────────────────────────────────────────────
// Fires at 09:00 AM on the 1st day of every month
cron.schedule("0 9 1 * *", async () => {
  console.log(`[CRON] Monthly credit email trigger fired at ${new Date().toISOString()}`);
  await sendMonthlyStatementToAll();
});
console.log("[CRON] Monthly credit email scheduler started — will fire on 1st of every month at 09:00 AM.");

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

// ─── CREDIT RECOVERY EMAIL ENDPOINTS ─────────────────────────────────────────

/**
 * POST /api/credit-recovery/send-mail/:customerId
 * 1-Click: Immediately sends overdue-only email to one specific customer.
 * Called from the frontend 1-Click Send Mail button.
 */
app.post("/api/credit-recovery/send-mail/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const result = await sendOverdueMailToCustomer(customerId);
    if (result.success) {
      res.json({ success: true, message: result.message, email: result.email });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error: any) {
    console.error("[MAIL] Error sending overdue mail:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/credit-recovery/send-monthly-all
 * Manually trigger the monthly broadcast (useful for testing / admin use).
 * Same logic as the cron job.
 */
app.post("/api/credit-recovery/send-monthly-all", async (req, res) => {
  try {
    const result = await sendMonthlyStatementToAll();
    res.json({
      success: true,
      message: `Monthly broadcast complete. Sent: ${result.sent}, Skipped: ${result.skipped}, Errors: ${result.errors.length}`,
      ...result,
    });
  } catch (error: any) {
    console.error("[MAIL] Monthly broadcast error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
