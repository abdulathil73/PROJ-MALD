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
  packingType?: string;
  packingTypes?: string[];
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

export interface SpoilageRecord {
  id: string;
  spoilageNo: string;
  productId: string;
  productName: string;
  godown: Godown;
  quantity: number;
  unit: string;
  unitCost: number;
  totalLoss: number;
  date: string;
  reason: string;
  loggedBy?: string;
  notes?: string;
}

interface DatabaseSchema {
  products: Product[];
  entries: StockEntry[];
  customers: Customer[];
  suppliers: Supplier[];
  vouchers: Voucher[];
  spoilages?: SpoilageRecord[];
}

const DB_FILE = path.join(__dirname, "data.json");

export const ALL_GODOWNS: Godown[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"];

export function getGodownClimate(g: Godown): string {
  if (["A", "B", "C", "D", "E", "F"].includes(g)) return "Spices (22°C)";
  if (["G", "H", "I", "J", "K", "L"].includes(g)) return "Temperate (12°C)";
  return "Refrigerated (4°C)";
}

const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_CUSTOMERS: Customer[] = [];
const INITIAL_SUPPLIERS: Supplier[] = [];
const INITIAL_ENTRIES: StockEntry[] = [];
const INITIAL_VOUCHERS: Voucher[] = [];

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

  static addProduct(productData: Partial<Product> & { name: string; category: Category; unit: string }): Product {
    const db = this.read();
    
    // Check if product with same ID exists
    const existingIndex = productData.id ? db.products.findIndex(p => p.id === productData.id) : db.products.findIndex(p => p.name.toLowerCase() === productData.name.toLowerCase());
    
    if (existingIndex >= 0) {
      db.products[existingIndex] = {
        ...db.products[existingIndex],
        ...productData,
      };
      this.write(db);
      return db.products[existingIndex];
    }

    const newProduct: Product = {
      id: "p" + (db.products.length + 1) + "_" + Math.random().toString(36).substring(2, 5),
      isPerishable: false,
      expiryDays: 0,
      buyPrice: 0,
      sellPrice: 0,
      ...productData,
    };

    db.products.push(newProduct);
    this.write(db);
    return newProduct;
  }

  static deleteProduct(id: string): boolean {
    const db = this.read();
    db.products = db.products.filter(p => p.id !== id);
    this.write(db);
    return true;
  }

  // CUSTOMERS
  static getCustomers(): Customer[] {
    return this.read().customers;
  }

  static deleteCustomer(id: string): boolean {
    const db = this.read();
    db.customers = db.customers.filter(c => c.id !== id);
    this.write(db);
    return true;
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

  static updateCustomer(id: string, customerData: Partial<Customer>): Customer {
    const db = this.read();
    const index = db.customers.findIndex(c => c.id === id);
    if (index >= 0) {
      db.customers[index] = {
        ...db.customers[index],
        ...customerData,
      };
      this.write(db);
      return db.customers[index];
    } else {
      const nameIndex = db.customers.findIndex(c => c.name.toLowerCase() === customerData.name?.toLowerCase());
      if (nameIndex >= 0) {
        db.customers[nameIndex] = {
          ...db.customers[nameIndex],
          ...customerData,
        };
        this.write(db);
        return db.customers[nameIndex];
      }
      throw new Error(`Customer not found.`);
    }
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

  static deleteSupplier(id: string): boolean {
    const db = this.read();
    db.suppliers = db.suppliers.filter(s => s.id !== id);
    this.write(db);
    return true;
  }

  static updateSupplier(id: string, supplierData: Partial<Supplier>): Supplier {
    const db = this.read();
    const index = db.suppliers.findIndex(s => s.id === id);
    if (index >= 0) {
      db.suppliers[index] = {
        ...db.suppliers[index],
        ...supplierData,
      };
      this.write(db);
      return db.suppliers[index];
    } else {
      const nameIndex = db.suppliers.findIndex(s => s.name.toLowerCase() === supplierData.name?.toLowerCase());
      if (nameIndex >= 0) {
        db.suppliers[nameIndex] = {
          ...db.suppliers[nameIndex],
          ...supplierData,
        };
        this.write(db);
        return db.suppliers[nameIndex];
      }
      throw new Error(`Supplier not found.`);
    }
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

  // SPOILAGE RECORDS
  static getSpoilages(): SpoilageRecord[] {
    const db = this.read();
    return db.spoilages || [];
  }

  static addSpoilage(spoilageData: Omit<SpoilageRecord, "id" | "spoilageNo"> & { spoilageNo?: string }): SpoilageRecord {
    const db = this.read();
    if (!db.spoilages) db.spoilages = [];

    const count = db.spoilages.length + 1;
    const dateStr = (spoilageData.date || new Date().toISOString().split("T")[0]).replace(/-/g, "").slice(2, 8);
    const generatedNo = `SPL-${dateStr}-${String(count).padStart(4, "0")}`;

    const newRecord: SpoilageRecord = {
      id: "spl_" + Math.random().toString(36).substring(2, 9),
      spoilageNo: spoilageData.spoilageNo || generatedNo,
      ...spoilageData,
    };

    db.spoilages.push(newRecord);

    // Also deduct stock from product godown stock
    const prod = db.products.find(p => p.id === spoilageData.productId || p.name.toLowerCase().trim() === spoilageData.productName.toLowerCase().trim());
    if (prod) {
      if (!prod.godownStocks) prod.godownStocks = {} as any;
      const currentGdnStock = prod.godownStocks[spoilageData.godown] || 0;
      prod.godownStocks[spoilageData.godown] = Math.max(0, currentGdnStock - spoilageData.quantity);
      prod.stock = Object.values(prod.godownStocks).reduce((s, v) => s + v, 0);
    }

    this.write(db);
    return newRecord;
  }

  static clearHistory(): void {
    const db = this.read();
    db.entries = [];
    db.vouchers = [];
    db.spoilages = [];
    this.write(db);
  }
}
