import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Define __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type Godown = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R";
export type Category = "Spices" | "Dry Fruits" | "Fruits" | "Vegetables" | "Other";

export interface Product {
  id: string;
  name: string;
  category: Category;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  isPerishable: boolean;
  expiryDays: number;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  gstNo: string;
}

export interface Supplier {
  id: string;
  name: string;
  address: string;
  phone: string;
  gstNo: string;
}

export interface InvoiceItem {
  productId: string;
  godown: Godown;
  quantity: number;
  pricePerUnit: number; // rate
  gstPercent: number;
  subTotal: number;
  grandTotal: number;
  expiryDate?: string; // Calculated for perishable imports
}

export interface StockEntry {
  id: string;
  productId: string; // fallback
  godown: Godown;    // fallback
  type: "in" | "out";
  quantity: number;   // fallback
  pricePerUnit: number; // fallback
  date: string; // YYYY-MM-DD
  dueDate?: string; // Credit payment due date
  expiryDate?: string; // Calculated for perishable imports
  partner: string; // Supplier (in) or Customer (out)
  note: string;
  subType?: string; // quotation | billing | delivery_note | credit_note | purchase_order | grn | debit_note
  
  // Invoice details
  paymentType?: "cash" | "credit";
  partnerAddress?: string;
  partnerPhone?: string;
  partnerGST?: string;
  gstPercent?: number; // fallback
  subTotal?: number;
  grandTotal?: number;
  invoiceNo?: string;
  
  items?: InvoiceItem[];
  payments?: { method: "cash" | "card" | "transfer" | "credit"; amount: number }[];
}

export type VoucherType = "payment" | "receipt" | "contra" | "journal";

export interface Voucher {
  id: string;
  voucherNo: string;
  type: VoucherType;
  date: string; // YYYY-MM-DD
  debitAccount: string;
  creditAccount: string;
  amount: number;
  mode: "cash" | "bank" | "online" | "cheque" | "journal";
  referenceNo?: string;
  narration: string;
}

interface DatabaseSchema {
  products: Product[];
  entries: StockEntry[];
  customers: Customer[];
  suppliers: Supplier[];
  vouchers: Voucher[];
}

const DB_FILE = path.join(__dirname, "data.json");

export const ALL_GODOWNS: Godown[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"];

export function getGodownClimate(g: Godown): string {
  if (["A", "B", "C", "D", "E", "F"].includes(g)) return "Spices (22°C)";
  if (["G", "H", "I", "J", "K", "L"].includes(g)) return "Temperate (12°C)";
  return "Refrigerated (4°C)";
}

const INITIAL_PRODUCTS: Product[] = [
  { id: "p1", name: "Cardamom", category: "Spices", unit: "kg", buyPrice: 1200, sellPrice: 1550, isPerishable: false, expiryDays: 365 },
  { id: "p2", name: "Turmeric", category: "Spices", unit: "kg", buyPrice: 80, sellPrice: 130, isPerishable: false, expiryDays: 365 },
  { id: "p3", name: "Black Pepper", category: "Spices", unit: "kg", buyPrice: 450, sellPrice: 620, isPerishable: false, expiryDays: 365 },
  { id: "p4", name: "Saffron", category: "Spices", unit: "g", buyPrice: 350, sellPrice: 480, isPerishable: false, expiryDays: 365 },
  { id: "p5", name: "Almonds", category: "Dry Fruits", unit: "kg", buyPrice: 680, sellPrice: 890, isPerishable: false, expiryDays: 270 },
  { id: "p6", name: "Pistachios", category: "Dry Fruits", unit: "kg", buyPrice: 920, sellPrice: 1200, isPerishable: false, expiryDays: 270 },
  { id: "p7", name: "Cashews", category: "Dry Fruits", unit: "kg", buyPrice: 780, sellPrice: 1050, isPerishable: false, expiryDays: 270 },
  { id: "p8", name: "Walnuts", category: "Dry Fruits", unit: "kg", buyPrice: 560, sellPrice: 750, isPerishable: false, expiryDays: 270 },
  { id: "p9", name: "Mangoes", category: "Fruits", unit: "kg", buyPrice: 55, sellPrice: 90, isPerishable: true, expiryDays: 10 },
  { id: "p10", name: "Pomegranates", category: "Fruits", unit: "kg", buyPrice: 70, sellPrice: 110, isPerishable: true, expiryDays: 20 },
  { id: "p11", name: "Tomatoes", category: "Vegetables", unit: "kg", buyPrice: 18, sellPrice: 32, isPerishable: true, expiryDays: 7 },
  { id: "p12", name: "Onions", category: "Vegetables", unit: "kg", buyPrice: 22, sellPrice: 38, isPerishable: true, expiryDays: 30 },
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: "c1", name: "Gulf Spice General Trading", address: "Wholesale Hub, Sector 4, Dubai, UAE", phone: "+971-50-1234567", gstNo: "DXB99283A" },
  { id: "c2", name: "EuroFoods GmbH", address: "Speicherstadt Building 12, Hamburg, Germany", phone: "+49-40-987654", gstNo: "EU882341A" },
  { id: "c3", name: "FreshMart Supermarkets", address: "Linking Road, Bandra West, Mumbai, India", phone: "+91-22-22334455", gstNo: "27AAAAA1111A1Z1" },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: "s1", name: "Kerala Spice Growers", address: "Spices Board Road, Cochin, Kerala, India", phone: "+91-484-2345678", gstNo: "32AAAAA2222B1Z2" },
  { id: "s2", name: "Sangli Turmeric Coop", address: "APMC Market Yard, Sangli, Maharashtra, India", phone: "+91-233-3456789", gstNo: "27BBBBB3333C1Z3" },
  { id: "s3", name: "Kabul Exporters Ltd", address: "Fruit Market Road, Kabul, Afghanistan", phone: "+93-20-456789", gstNo: "AFG8877A" },
];

const INITIAL_ENTRIES: StockEntry[] = [
  { id: "e1", productId: "p1", godown: "A", type: "in", quantity: 200, pricePerUnit: 1200, date: "2026-06-01", partner: "Kerala Spice Growers", note: "Premium Malabar Cardamom batch", paymentType: "credit", partnerAddress: "Spices Board Road, Cochin, Kerala, India", partnerPhone: "+91-484-2345678", partnerGST: "32AAAAA2222B1Z2", gstPercent: 5, subTotal: 240000, grandTotal: 252000, invoiceNo: "PUR-260601-0001", items: [{ productId: "p1", godown: "A", quantity: 200, pricePerUnit: 1200, gstPercent: 5, subTotal: 240000, grandTotal: 252000 }] },
  { id: "e2", productId: "p2", godown: "B", type: "in", quantity: 500, pricePerUnit: 80, date: "2026-06-02", partner: "Sangli Turmeric Coop", note: "High curcumin value batch", paymentType: "cash", partnerAddress: "APMC Market Yard, Sangli, Maharashtra, India", partnerPhone: "+91-233-3456789", partnerGST: "27BBBBB3333C1Z3", gstPercent: 5, subTotal: 40000, grandTotal: 42000, invoiceNo: "PUR-260602-0002", items: [{ productId: "p2", godown: "B", quantity: 500, pricePerUnit: 80, gstPercent: 5, subTotal: 40000, grandTotal: 42000 }] },
  { id: "e3", productId: "p5", godown: "G", type: "in", quantity: 300, pricePerUnit: 680, date: "2026-06-03", partner: "Kabul Exporters Ltd", note: "Premium Mamra Almonds", paymentType: "credit", partnerAddress: "Fruit Market Road, Kabul, Afghanistan", partnerPhone: "+93-20-456789", partnerGST: "AFG8877A", gstPercent: 12, subTotal: 204000, grandTotal: 228480, invoiceNo: "PUR-260603-0003", items: [{ productId: "p5", godown: "G", quantity: 300, pricePerUnit: 680, gstPercent: 12, subTotal: 204000, grandTotal: 228480 }] },
  { id: "e4", productId: "p6", godown: "H", type: "in", quantity: 150, pricePerUnit: 920, date: "2026-06-04", partner: "Kabul Exporters Ltd", note: "Jumbo Akbari Pistachios", paymentType: "cash", partnerAddress: "Fruit Market Road, Kabul, Afghanistan", partnerPhone: "+93-20-456789", partnerGST: "AFG8877A", gstPercent: 12, subTotal: 138000, grandTotal: 154560, invoiceNo: "PUR-260604-0004", items: [{ productId: "p6", godown: "H", quantity: 150, pricePerUnit: 920, gstPercent: 12, subTotal: 138000, grandTotal: 154560 }] },
  { id: "e5", productId: "p7", godown: "I", type: "in", quantity: 250, pricePerUnit: 780, date: "2026-06-05", partner: "Kerala Spice Growers", note: "Vietnam cashews", paymentType: "credit", partnerAddress: "Spices Board Road, Cochin, Kerala, India", partnerPhone: "+91-484-2345678", partnerGST: "32AAAAA2222B1Z2", gstPercent: 12, subTotal: 195000, grandTotal: 218400, invoiceNo: "PUR-260605-0005", items: [{ productId: "p7", godown: "I", quantity: 250, pricePerUnit: 780, gstPercent: 12, subTotal: 195000, grandTotal: 218400 }] },
  { id: "e6", productId: "p9", godown: "M", type: "in", quantity: 800, pricePerUnit: 55, date: "2026-06-06", expiryDate: "2026-06-16", partner: "Ratnagiri Farms", note: "Alphonso Mango harvest", paymentType: "cash", partnerAddress: "Ratnagiri, Maharashtra, India", partnerPhone: "+91-235-987654", partnerGST: "27RG99827A", gstPercent: 5, subTotal: 44000, grandTotal: 46200, invoiceNo: "PUR-260606-0006", items: [{ productId: "p9", godown: "M", quantity: 800, pricePerUnit: 55, gstPercent: 5, subTotal: 44000, grandTotal: 46200, expiryDate: "2026-06-16" }] },
  { id: "e7", productId: "p1", godown: "A", type: "out", quantity: 80, pricePerUnit: 1550, date: "2026-06-08", partner: "Gulf Spice General Trading", note: "Export to Dubai", paymentType: "credit", partnerAddress: "Wholesale Hub, Sector 4, Dubai, UAE", partnerPhone: "+971-50-1234567", partnerGST: "DXB99283A", gstPercent: 5, subTotal: 124000, grandTotal: 130200, invoiceNo: "INV-260608-0001", items: [{ productId: "p1", godown: "A", quantity: 80, pricePerUnit: 1550, gstPercent: 5, subTotal: 124000, grandTotal: 130200 }] },
  { id: "e8", productId: "p5", godown: "G", type: "out", quantity: 120, pricePerUnit: 890, date: "2026-06-09", partner: "EuroFoods GmbH", note: "Air cargo shipment to Hamburg", paymentType: "credit", partnerAddress: "Speicherstadt Building 12, Hamburg, Germany", partnerPhone: "+49-40-987654", partnerGST: "EU882341A", gstPercent: 12, subTotal: 106800, grandTotal: 119616, invoiceNo: "INV-260609-0002", items: [{ productId: "p5", godown: "G", quantity: 120, pricePerUnit: 890, gstPercent: 12, subTotal: 106800, grandTotal: 119616 }] },
  { id: "e9", productId: "p9", godown: "M", type: "out", quantity: 400, pricePerUnit: 90, date: "2026-06-10", partner: "FreshMart Supermarkets", note: "Local supply chain", paymentType: "cash", partnerAddress: "Linking Road, Bandra West, Mumbai, India", partnerPhone: "+91-22-22334455", partnerGST: "27AAAAA1111A1Z1", gstPercent: 5, subTotal: 36000, grandTotal: 37800, invoiceNo: "INV-260610-0003", items: [{ productId: "p9", godown: "M", quantity: 400, pricePerUnit: 90, gstPercent: 5, subTotal: 36000, grandTotal: 37800 }] },
  { id: "e10", productId: "p6", godown: "H", type: "out", quantity: 60, pricePerUnit: 1200, date: "2026-06-12", partner: "Gulf Spice General Trading", note: "Riyadh shipment", paymentType: "credit", partnerAddress: "Wholesale Hub, Sector 4, Dubai, UAE", partnerPhone: "+971-50-1234567", partnerGST: "DXB99283A", gstPercent: 12, subTotal: 72000, grandTotal: 80640, invoiceNo: "INV-260612-0004", items: [{ productId: "p6", godown: "H", quantity: 60, pricePerUnit: 1200, gstPercent: 12, subTotal: 72000, grandTotal: 80640 }] },
  { id: "e11", productId: "p11", godown: "N", type: "in", quantity: 1000, pricePerUnit: 18, date: "2026-06-13", expiryDate: "2026-06-20", partner: "Sangli Turmeric Coop", note: "Fresh Hybrid Tomatoes", paymentType: "cash", partnerAddress: "APMC Market Yard, Sangli, Maharashtra, India", partnerPhone: "+91-233-3456789", partnerGST: "27BBBBB3333C1Z3", gstPercent: 5, subTotal: 18000, grandTotal: 18900, invoiceNo: "PUR-260613-0007", items: [{ productId: "p11", godown: "N", quantity: 1000, pricePerUnit: 18, gstPercent: 5, subTotal: 18000, grandTotal: 18900, expiryDate: "2026-06-20" }] },
  { id: "e12", productId: "p11", godown: "N", type: "out", quantity: 600, pricePerUnit: 32, date: "2026-06-15", partner: "FreshMart Supermarkets", note: "Distribution to outlets", paymentType: "cash", partnerAddress: "Linking Road, Bandra West, Mumbai, India", partnerPhone: "+91-22-22334455", partnerGST: "27AAAAA1111A1Z1", gstPercent: 5, subTotal: 19200, grandTotal: 20160, invoiceNo: "INV-260615-0005", items: [{ productId: "p11", godown: "N", quantity: 600, pricePerUnit: 32, gstPercent: 5, subTotal: 19200, grandTotal: 20160 }] },
];

const INITIAL_VOUCHERS: Voucher[] = [
  { id: "v1", voucherNo: "PAY-260605-0001", type: "payment", date: "2026-06-05", debitAccount: "Kerala Spice Growers", creditAccount: "HDFC Bank A/C 50200088991122", amount: 150000, mode: "bank", referenceNo: "NEFT-9928172", narration: "Part payment for Cardamom purchase PUR-260601-0001" },
  { id: "v2", voucherNo: "REC-260610-0001", type: "receipt", date: "2026-06-10", debitAccount: "Petty Cash Account", creditAccount: "Gulf Spice General Trading", amount: 80000, mode: "cash", referenceNo: "CASH-REC-01", narration: "Cash advance received against invoice INV-260608-0001" },
  { id: "v3", voucherNo: "CNT-260612-0001", type: "contra", date: "2026-06-12", debitAccount: "HDFC Bank A/C 50200088991122", creditAccount: "Petty Cash Account", amount: 25000, mode: "cash", referenceNo: "CHQ-100293", narration: "Cash withdrawal from bank for office expenses" },
  { id: "v4", voucherNo: "JRN-260615-0001", type: "journal", date: "2026-06-15", debitAccount: "Warehouse Rent Expense", creditAccount: "Port Authority Lessor", amount: 45000, mode: "journal", referenceNo: "JV-RENT-06", narration: "Monthly warehouse lease accrual for Godowns A-R" }
];

export class Database {
  private static read(): DatabaseSchema {
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = {
        products: INITIAL_PRODUCTS,
        entries: INITIAL_ENTRIES,
        customers: INITIAL_CUSTOMERS,
        suppliers: INITIAL_SUPPLIERS,
        vouchers: INITIAL_VOUCHERS,
      };
      this.write(initial);
      return initial;
    }
    try {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (!parsed.customers) parsed.customers = INITIAL_CUSTOMERS;
      if (!parsed.suppliers) parsed.suppliers = INITIAL_SUPPLIERS;
      if (!parsed.vouchers) parsed.vouchers = INITIAL_VOUCHERS;
      return parsed as DatabaseSchema;
    } catch (e) {
      console.error("Error reading database file, using fallback initial data.", e);
      return {
        products: INITIAL_PRODUCTS,
        entries: INITIAL_ENTRIES,
        customers: INITIAL_CUSTOMERS,
        suppliers: INITIAL_SUPPLIERS,
        vouchers: INITIAL_VOUCHERS,
      };
    }
  }

  private static write(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing database file", e);
    }
  }

  // PRODUCTS
  static getProducts(): Product[] {
    return this.read().products;
  }

  static addProduct(productData: Omit<Product, "id">): Product {
    const db = this.read();
    
    // Check if name already exists
    const exists = db.products.some(p => p.name.toLowerCase() === productData.name.toLowerCase());
    if (exists) {
      throw new Error(`Product "${productData.name}" already exists in inventory catalog.`);
    }

    const newProduct: Product = {
      id: "p" + (db.products.length + 1) + "_" + Math.random().toString(36).substring(2, 5),
      ...productData,
    };

    db.products.push(newProduct);
    this.write(db);
    return newProduct;
  }

  // CUSTOMERS
  static getCustomers(): Customer[] {
    return this.read().customers;
  }

  static addCustomer(customerData: Omit<Customer, "id">): Customer {
    const db = this.read();
    
    const exists = db.customers.some(c => c.name.toLowerCase() === customerData.name.toLowerCase());
    if (exists) {
      throw new Error(`Customer "${customerData.name}" is already registered.`);
    }

    const newCustomer: Customer = {
      id: "c_" + Math.random().toString(36).substring(2, 9),
      ...customerData,
    };

    db.customers.push(newCustomer);
    this.write(db);
    return newCustomer;
  }

  // SUPPLIERS
  static getSuppliers(): Supplier[] {
    return this.read().suppliers;
  }

  static addSupplier(supplierData: Omit<Supplier, "id">): Supplier {
    const db = this.read();
    
    const exists = db.suppliers.some(s => s.name.toLowerCase() === supplierData.name.toLowerCase());
    if (exists) {
      throw new Error(`Supplier "${supplierData.name}" is already registered.`);
    }

    const newSupplier: Supplier = {
      id: "s_" + Math.random().toString(36).substring(2, 9),
      ...supplierData,
    };

    db.suppliers.push(newSupplier);
    this.write(db);
    return newSupplier;
  }

  // ENTRIES / LEDGER
  static getEntries(): StockEntry[] {
    return this.read().entries;
  }

  static addEntry(entryData: Omit<StockEntry, "id" | "invoiceNo" | "productId" | "godown" | "quantity" | "pricePerUnit"> & { productId?: string; godown?: Godown; quantity?: number; pricePerUnit?: number; items?: InvoiceItem[] }): StockEntry {
    const db = this.read();
    
    const items = entryData.items || [];
    if (items.length === 0) {
      if (!entryData.productId || !entryData.godown || !entryData.quantity || !entryData.pricePerUnit) {
        throw new Error("Missing transaction items or product details.");
      }
      items.push({
        productId: entryData.productId,
        godown: entryData.godown,
        quantity: entryData.quantity,
        pricePerUnit: entryData.pricePerUnit,
        gstPercent: entryData.gstPercent || 0,
        subTotal: entryData.subTotal || (entryData.quantity * entryData.pricePerUnit),
        grandTotal: entryData.grandTotal || (entryData.quantity * entryData.pricePerUnit),
      });
    }

    // Process and validate each item in the cart
    items.forEach(item => {
      const product = db.products.find(p => p.id === item.productId);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      // Check stock availability on OUT
      if (entryData.type === "out") {
        const currentStock = this.getStock(item.productId, item.godown);
        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name} in Godown ${item.godown}. Available: ${currentStock} ${product.unit}, Requested: ${item.quantity} ${product.unit}`);
        }
      }

      // Expiry calculation for perishable IN
      if (entryData.type === "in" && product.isPerishable) {
        const baseDate = new Date(entryData.date);
        baseDate.setDate(baseDate.getDate() + product.expiryDays);
        item.expiryDate = baseDate.toISOString().split("T")[0];
      }
    });

    // Generate Invoice Number depending on subType/type
    let prefix = entryData.type === "in" ? "PUR" : "INV";
    if (entryData.subType === "quotation") prefix = "QTN";
    else if (entryData.subType === "delivery_note") prefix = "DLN";
    else if (entryData.subType === "credit_note") prefix = "CRN";
    else if (entryData.subType === "purchase_order") prefix = "PO";
    else if (entryData.subType === "grn") prefix = "GRN";
    else if (entryData.subType === "debit_note") prefix = "DBN";

    const dateStr = entryData.date.replace(/-/g, "").substring(2, 8); // YYMMDD
    const count = db.entries.filter(e => e.subType === entryData.subType || (e.type === entryData.type && !e.subType)).length + 1;
    const invoiceNo = `${prefix}-${dateStr}-${String(count).padStart(4, "0")}`;

    // Calculate overall invoice sums
    const totalSub = items.reduce((sum, i) => sum + i.subTotal, 0);
    const totalGrand = items.reduce((sum, i) => sum + i.grandTotal, 0);

    const firstItem = items[0];

    const newEntry: StockEntry = {
      id: "e_" + Math.random().toString(36).substring(2, 9),
      productId: firstItem.productId,
      godown: firstItem.godown,
      type: entryData.type,
      quantity: firstItem.quantity,
      pricePerUnit: firstItem.pricePerUnit,
      expiryDate: firstItem.expiryDate,
      date: entryData.date,
      dueDate: entryData.dueDate,
      partner: entryData.partner,
      note: entryData.note || "",
      subType: entryData.subType,
      paymentType: entryData.paymentType || "cash",
      partnerAddress: entryData.partnerAddress || "",
      partnerPhone: entryData.partnerPhone || "",
      partnerGST: entryData.partnerGST || "",
      gstPercent: firstItem.gstPercent,
      subTotal: totalSub,
      grandTotal: totalGrand,
      invoiceNo,
      items,
      payments: (entryData as any).payments,
    };

    db.entries.push(newEntry);
    this.write(db);
    return newEntry;
  }

  static getStock(productId: string, godown?: Godown): number {
    const db = this.read();
    let total = 0;
    
    db.entries.forEach(e => {
      // Ignore quotations and purchase orders (drafts) as they do not affect inventory stock
      if (e.subType === "quotation" || e.subType === "purchase_order") return;

      const coeff = e.type === "in" ? 1 : -1;
      
      if (e.items && e.items.length > 0) {
        e.items.forEach(item => {
          if (item.productId === productId && (!godown || item.godown === godown)) {
            total += item.quantity * coeff;
          }
        });
      } else if (e.productId === productId && (!godown || e.godown === godown)) {
        total += (e.quantity || 0) * coeff;
      }
    });
    
    return total;
  }

  static getAnalytics() {
    const db = this.read();
    let totalRevenue = 0;
    let totalCost = 0;

    const productPL: Record<string, { revenue: number; cost: number; profit: number; sold: number; stock: number }> = {};
    
    db.products.forEach(p => {
      productPL[p.id] = { revenue: 0, cost: 0, profit: 0, sold: 0, stock: 0 };
    });

    db.entries.forEach(e => {
      // Ignore quotations and purchase orders (drafts) as they do not affect accounts or analytics
      if (e.subType === "quotation" || e.subType === "purchase_order") return;

      const processItem = (prodId: string, qty: number, rate: number) => {
        const item = productPL[prodId];
        if (!item) return;
        
        const val = qty * rate;
        if (e.type === "in") {
          item.cost += val;
          totalCost += val;
        } else {
          item.revenue += val;
          totalRevenue += val;
          item.sold += qty;
        }
      };

      if (e.items && e.items.length > 0) {
        e.items.forEach(item => {
          processItem(item.productId, item.quantity, item.pricePerUnit);
        });
      } else if (e.productId) {
        processItem(e.productId, e.quantity || 0, e.pricePerUnit || 0);
      }
    });

    db.products.forEach(p => {
      const item = productPL[p.id];
      if (item) {
        item.stock = this.getStock(p.id);
        item.profit = item.revenue - item.cost;
      }
    });

    const netProfit = totalRevenue - totalCost;

    // Per Godown analytics across 18 godowns (A to R)
    const godowns = ALL_GODOWNS;
    const godownStats = godowns.map(g => {
      let totalIn = 0;
      let totalOut = 0;
      const uniqueProductIds = new Set<string>();

      db.entries.forEach(e => {
        if (e.items && e.items.length > 0) {
          e.items.forEach(item => {
            if (item.godown === g) {
              uniqueProductIds.add(item.productId);
              if (e.type === "in") totalIn += item.quantity;
              else totalOut += item.quantity;
            }
          });
        } else if (e.godown === g) {
          if (e.productId) uniqueProductIds.add(e.productId);
          if (e.type === "in") totalIn += e.quantity || 0;
          else totalOut += e.quantity || 0;
        }
      });

      return {
        godown: g,
        totalIn,
        totalOut,
        current: totalIn - totalOut,
        uniqueProducts: uniqueProductIds.size,
      };
    });

    return {
      revenue: totalRevenue,
      cost: totalCost,
      profit: netProfit,
      productPL,
      godownStats,
    };
  }

  // VOUCHERS
  static getVouchers(): Voucher[] {
    return this.read().vouchers || [];
  }

  static addVoucher(voucherData: Omit<Voucher, "id" | "voucherNo"> & { voucherNo?: string }): Voucher {
    const db = this.read();
    if (!db.vouchers) db.vouchers = [];

    const prefixMap: Record<VoucherType, string> = {
      payment: "PAY",
      receipt: "REC",
      contra: "CNT",
      journal: "JRN",
    };

    const dateStr = (voucherData.date || new Date().toISOString().split("T")[0]).replace(/-/g, "").slice(2, 8);
    const count = db.vouchers.filter(v => v.type === voucherData.type).length + 1;
    const generatedNo = `${prefixMap[voucherData.type]}-${dateStr}-${String(count).padStart(4, "0")}`;

    const newVoucher: Voucher = {
      id: "v_" + Math.random().toString(36).substring(2, 9),
      voucherNo: voucherData.voucherNo || generatedNo,
      ...voucherData,
    };

    db.vouchers.push(newVoucher);
    this.write(db);
    return newVoucher;
  }
}
