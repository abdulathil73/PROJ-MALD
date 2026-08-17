import { useState, useEffect, useMemo } from "react";
import { Sparkles, AlertTriangle, Eye, Edit, Trash2, Plus, Lock, User, Globe, ShieldCheck, Heart, DollarSign, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  packingType?: string;
  packingTypes?: string[];
  buyPrice: number;
  sellPrice: number;
  godownStocks?: Record<string, number>;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNo?: string;
  creditLimitDays?: number;
  creditLimitAmount?: number;
}

interface GroupItem { id: string; code: string; name: string; type: "Asset" | "Liability" | "Income" | "Expense" | "Equity"; description: string; }
interface LedgerItem { id: string; code: string; name: string; group: string; openingBalance: number; description: string; }
interface CategoryItem { id: string; name: string; hsnCode: string; gstRate: number; description: string; }
interface UnitItem { id: string; shortName: string; fullName: string; decimalPlaces: number; }
interface PackingItem { id: string; name: string; capacityKg: number; capacityUnit?: string; material: string; notes: string; }
interface GodownMasterItem {
  id: string;
  code: string;
  name: string;
  location: string;
  temperature: string;
  capacityKg: number;
  managerName: string;
  status: "Active" | "Maintenance" | "Full";
  notes?: string;
}

interface UserItem {
  id: string;
  employeeId: string;
  employeeName: string;
  passportNumber: string;
  passportIssue: string;
  passportExpiry: string;
  workPermitNumber: string;
  workPermitIssue: string;
  workPermitExpiry: string;
  visaNumber: string;
  visaIssue: string;
  visaExpiry: string;
  insuranceNumber: string;
  insuranceIssue: string;
  insuranceExpiry: string;
  healthMedicalNumber: string;
  healthMedicalIssue: string;
  healthMedicalExpiry: string;
  dateOfBirth: string;
  dateOfJoin: string;
  dateOfRejoin: string;
  basicSalary: number;
  allowances: number;
  overtime: number;
  totalSalary: number;
  role: string;
  responsibility: string;
  username: string;
  password?: string;
  allowedFeatures?: string[];
}

export interface FeaturePermissionOption {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
}

export const ALL_WEBSITE_FEATURES: FeaturePermissionOption[] = [
  // ── 📊 DASHBOARD & GENERAL ────────────────
  { id: "dashboard", name: "Dashboard & Executive Analytics", category: "Dashboard", icon: "📊", description: "Multi-company metrics, live revenue & stock KPIs" },
  
  // ── 🧾 SALES & BILLING SUB-MODULES ────────
  { id: "sales-billing", name: "Sales Billing / Tax Invoice", category: "Sales & Billing", icon: "🧾", description: "Create tax invoices & print sales bills" },
  { id: "sales-quotation", name: "Sales Quotation Console", category: "Sales & Billing", icon: "📝", description: "Create price estimates & client quotations" },
  { id: "sales-proforma", name: "Proforma Invoice", category: "Sales & Billing", icon: "📄", description: "Generate proforma billing bills" },
  { id: "sales-delivery", name: "Delivery Note / Chalan", category: "Sales & Billing", icon: "🚚", description: "Issue stock dispatch delivery notes" },
  { id: "sales-credit-note", name: "Credit Note", category: "Sales & Billing", icon: "🔴", description: "Issue sales return credit notes" },
  { id: "sales-debit-note", name: "Debit Note", category: "Sales & Billing", icon: "🟢", description: "Issue supplier return debit notes" },
  { id: "sales-pos", name: "Quick POS Billing", category: "Sales & Billing", icon: "⚡", description: "Rapid point-of-sale cash checkout" },

  // ── 🛒 PURCHASE & SUPPLIERS ───────────────
  { id: "purchase-order", name: "Purchase Order (PO)", category: "Purchase", icon: "🛍️", description: "Create supplier procurement POs" },
  { id: "purchase-bill", name: "Purchase Invoices / Bills", category: "Purchase", icon: "📦", description: "Record inward supplier purchase invoices" },

  // ── 📦 INVENTORY & WAREHOUSING ─────────────
  { id: "inventory-items", name: "Inventory Catalog & Prices", category: "Inventory", icon: "📋", description: "Item rates, buying/selling price lists" },
  { id: "inventory-godowns", name: "Godown & Warehouse Tracker", category: "Inventory", icon: "🏬", description: "Track stocks across Godowns A through R" },
  { id: "inventory-spoilage", name: "Spoilage & Wastage Entry", category: "Inventory", icon: "⚠️", description: "Log damaged goods & inventory adjustments" },

  // ── 🧮 COSTING, CURRENCY, EXPIRY & OFFERS ─
  { id: "costing", name: "Costing & Margins Analysis", category: "Inventory & Trading", icon: "🧮", description: "Landed cost breakdown, freight allocation & margin calculator" },
  { id: "currency-convert", name: "Multi-Currency Converter", category: "Inventory & Trading", icon: "💱", description: "Live conversion table (MVR, INR, USD, AED, EUR) & trade pricer" },
  { id: "expiry", name: "Expiry & Shelf Life Tracker", category: "Inventory & Trading", icon: "⏳", description: "Batch expiry dates, near-expiry alerts & spoilage prevention" },
  { id: "offers", name: "Offers & Promotional Schemes", category: "Sales & Marketing", icon: "🏷️", description: "BOGO offers, volume discounts & festive spice deals" },

  // ── 💳 VOUCHERS & CREDIT RECOVERY ─────────
  { id: "vouchers-receipt", name: "Receipt Vouchers", category: "Vouchers & Cash", icon: "💰", description: "Log customer cash/bank payment receipts" },
  { id: "vouchers-payment", name: "Payment Vouchers", category: "Vouchers & Cash", icon: "💸", description: "Log supplier & expense payments" },
  { id: "vouchers-journal", name: "Journal Vouchers", category: "Vouchers & Cash", icon: "📘", description: "Post adjustment & transfer journals" },
  { id: "vouchers-contra", name: "Contra Vouchers", category: "Vouchers & Cash", icon: "🏦", description: "Bank deposit & cash withdrawal vouchers" },
  { id: "credit-recovery", name: "Credit Recovery & Reminders", category: "Vouchers & Cash", icon: "🔔", description: "Debtors ledger & 1-click WhatsApp/Email reminders" },

  // ── 📈 FINANCIAL REPORTS ──────────────────
  { id: "reports-pnl", name: "Profit & Loss Account", category: "Reports & Financials", icon: "📈", description: "Income, Cost of Sales & Net Margin Report" },
  { id: "reports-bs", name: "Balance Sheet", category: "Reports & Financials", icon: "⚖️", description: "Assets, Liabilities & Capital Statement" },
  { id: "reports-trial", name: "Trial Balance", category: "Reports & Financials", icon: "📊", description: "Debit & Credit ledger balances verification" },
  { id: "reports-ledger", name: "Ledger Books & Statements", category: "Reports & Financials", icon: "📖", description: "Detailed customer/supplier ledger accounts" },
  { id: "reports-daybook", name: "Daybook & Cash Flow", category: "Reports & Financials", icon: "📅", description: "Daily transactional cash/bank activity" },

  // ── 🏛️ MASTER CONSOLE ─────────────────────
  { id: "master-accounts-groups", name: "Accounting Groups Master", category: "Master Console", icon: "📁", description: "Define parent asset, liability & income groups" },
  { id: "master-accounts-ledger", name: "Accounting Ledgers Master", category: "Master Console", icon: "📒", description: "Create financial ledger chart of accounts" },
  { id: "master-accounts-customer", name: "Customer Master", category: "Master Console", icon: "👤", description: "Client contact, GST, address & credit limits" },
  { id: "master-accounts-supplier", name: "Supplier Master", category: "Master Console", icon: "🏭", description: "Vendor catalog, payment terms & address" },
  { id: "master-inventory-categories", name: "Categories & HSN Master", category: "Master Console", icon: "🏷️", description: "Spice categories, HSN & GST tax rates" },
  { id: "master-inventory-unit", name: "Units of Measure Master", category: "Master Console", icon: "📏", description: "Measurement units (kg, g, ton, bag)" },
  { id: "master-inventory-packing", name: "Packing Types Master", category: "Master Console", icon: "🎒", description: "Bag sizes, jute, carton & tin packings" },
  { id: "master-godowns", name: "Godown Creation Master", category: "Master Console", icon: "🏬", description: "Create, edit & manage Godowns A to R" },
  { id: "master-users", name: "Employee Creation & User Master", category: "Master Console", icon: "👥", description: "HR payroll, user ID/password & feature permissions" },
];

const initialGroups: GroupItem[] = [];
const initialLedgers: LedgerItem[] = [];
const initialCategories: CategoryItem[] = [];
const initialUnits: UnitItem[] = [
  { id: "u1", shortName: "kg", fullName: "Kilogram", decimalPlaces: 2 },
  { id: "u2", shortName: "g", fullName: "Gram", decimalPlaces: 0 }
];
const initialPackings: PackingItem[] = [];
const initialGodowns: GodownMasterItem[] = "ABCDEFGHIJKLMNOPQR".split("").map(g => ({
  id: `gdn-${g}`,
  code: g,
  name: `Godown ${g}`,
  location: ["A", "B", "C", "D", "E", "F"].includes(g)
    ? "Spices Harbor Yard Sector 1"
    : ["G", "H", "I", "J", "K", "L"].includes(g)
    ? "Temperate Cargo Terminal Area 2"
    : "Cold Chain Refrigerated Vault Area 3",
  temperature: ["A", "B", "C", "D", "E", "F"].includes(g)
    ? "22°C Spices Ambient"
    : ["G", "H", "I", "J", "K", "L"].includes(g)
    ? "12°C Controlled"
    : "4°C Cold Storage",
  capacityKg: ["A", "F", "K", "P"].includes(g) ? 75000 : ["B", "G", "L", "Q"].includes(g) ? 60000 : 50000,
  managerName: `Supervisor ${g}`,
  status: ["C", "M"].includes(g) ? "Maintenance" : g === "R" ? "Full" : "Active",
  notes: `Godown ${g} Storage Facility`
}));

const initialUsers: UserItem[] = [
  {
    id: "usr-admin",
    employeeId: "EMP-001",
    employeeName: "System Administrator / Owner",
    passportNumber: "P-998877",
    passportIssue: "2022-01-01",
    passportExpiry: "2032-01-01",
    workPermitNumber: "WP-001",
    workPermitIssue: "2022-01-01",
    workPermitExpiry: "2030-01-01",
    visaNumber: "V-001",
    visaIssue: "2022-01-01",
    visaExpiry: "2030-01-01",
    insuranceNumber: "INS-001",
    insuranceIssue: "2022-01-01",
    insuranceExpiry: "2030-01-01",
    healthMedicalNumber: "MED-001",
    healthMedicalIssue: "2022-01-01",
    healthMedicalExpiry: "2030-01-01",
    dateOfBirth: "1988-05-15",
    dateOfJoin: "2020-01-01",
    dateOfRejoin: "2020-01-01",
    basicSalary: 75000,
    allowances: 15000,
    overtime: 0,
    totalSalary: 90000,
    role: "Admin",
    responsibility: "Full System Super Admin Access & Control",
    username: "admin",
    password: "123",
    allowedFeatures: ALL_WEBSITE_FEATURES.map(f => f.id)
  },
  {
    id: "usr-cashier",
    employeeId: "EMP-002",
    employeeName: "Ibrahim Cashier",
    passportNumber: "P-112233",
    passportIssue: "2023-01-01",
    passportExpiry: "2033-01-01",
    workPermitNumber: "WP-002",
    workPermitIssue: "2023-01-01",
    workPermitExpiry: "2028-01-01",
    visaNumber: "V-002",
    visaIssue: "2023-01-01",
    visaExpiry: "2028-01-01",
    insuranceNumber: "INS-002",
    insuranceIssue: "2023-01-01",
    insuranceExpiry: "2028-01-01",
    healthMedicalNumber: "MED-002",
    healthMedicalIssue: "2023-01-01",
    healthMedicalExpiry: "2028-01-01",
    dateOfBirth: "1994-08-20",
    dateOfJoin: "2022-03-15",
    dateOfRejoin: "",
    basicSalary: 25000,
    allowances: 5000,
    overtime: 2000,
    totalSalary: 32000,
    role: "Cashier",
    responsibility: "Sales Billing, Invoices & POS Cashier Duties",
    username: "cashier",
    password: "123",
    allowedFeatures: ["sales-billing", "sales-pos", "inventory-items", "vouchers-receipt"]
  }
];

const getStored = (key: string, initial: any): any => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : initial;
};

const setStored = (key: string, val: any) => {
  localStorage.setItem(key, JSON.stringify(val));
};

export default function MasterConsoleView({
  page,
  products,
  customers,
  suppliers = [],
  onAddProduct,
  onAddCustomer,
  onAddSupplier,
  onDeleteProduct,
  onDeleteCustomer,
  onDeleteSupplier,
  onUpdateCustomer,
  onUpdateSupplier
}: {
  page: string;
  products: Product[];
  customers: Customer[];
  suppliers?: Supplier[];
  onAddProduct: (p: Omit<Product, "id" | "godownStocks">) => Promise<boolean>;
  onAddCustomer: (c: Omit<Customer, "id">) => Promise<boolean>;
  onAddSupplier?: (s: Omit<Supplier, "id">) => Promise<any>;
  onDeleteProduct?: (id: string) => Promise<boolean>;
  onDeleteCustomer?: (id: string) => Promise<boolean>;
  onDeleteSupplier?: (id: string) => Promise<boolean>;
  onUpdateCustomer?: (id: string, c: Partial<Customer>) => Promise<boolean>;
  onUpdateSupplier?: (id: string, s: Partial<Supplier>) => Promise<boolean>;
}) {
  const [groups, setGroups] = useState<GroupItem[]>(() => getStored("master_groups", initialGroups));
  const [ledgers, setLedgers] = useState<LedgerItem[]>(() => getStored("master_ledgers", initialLedgers));
  const [categories, setCategories] = useState<CategoryItem[]>(() => getStored("master_categories", initialCategories));
  const [units, setUnits] = useState<UnitItem[]>(() => getStored("master_units", initialUnits));
  const [packings, setPackings] = useState<PackingItem[]>(() => getStored("master_packings", initialPackings));
  const [godowns, setGodowns] = useState<GodownMasterItem[]>(() => {
    const stored = getStored("master_godowns", initialGodowns);
    if (Array.isArray(stored) && stored.length < 18) {
      const existingCodes = new Set(stored.map((x: any) => x.code));
      const missing = initialGodowns.filter(ig => !existingCodes.has(ig.code));
      return [...stored, ...missing].sort((a, b) => a.code.localeCompare(b.code));
    }
    return stored;
  });
  const [users, setUsers] = useState<UserItem[]>(() => {
    const stored = getStored("master_users", initialUsers);
    if (!stored || !Array.isArray(stored) || stored.length === 0) return initialUsers;
    const hasAdmin = stored.some((u: any) => u.username === "admin" || u.employeeId === "EMP-001");
    if (!hasAdmin) return [initialUsers[0], ...stored];
    return stored;
  });
  const [isEmployeeCreationOpen, setIsEmployeeCreationOpen] = useState(false);

  useEffect(() => { setStored("master_groups", groups); }, [groups]);
  useEffect(() => { setStored("master_ledgers", ledgers); }, [ledgers]);
  useEffect(() => { setStored("master_categories", categories); }, [categories]);
  useEffect(() => { setStored("master_units", units); }, [units]);
  useEffect(() => { setStored("master_packings", packings); }, [packings]);
  useEffect(() => { setStored("master_godowns", godowns); }, [godowns]);
  useEffect(() => { setStored("master_users", users); }, [users]);

  // Tab controller state inside parent pages
  const [activeSubTab, setActiveSubTab] = useState("");

  useEffect(() => {
    if (page === "master-accounts") {
      setActiveSubTab("groups");
    } else if (page.startsWith("master-accounts-")) {
      setActiveSubTab(page.replace("master-accounts-", ""));
    } else if (page === "master-inventory") {
      setActiveSubTab("items");
    } else if (page.startsWith("master-inventory-")) {
      setActiveSubTab(page.replace("master-inventory-", ""));
    } else if (page === "master-users") {
      setActiveSubTab("status");
    } else if (page.startsWith("master-users-")) {
      setActiveSubTab(page.replace("master-users-", ""));
    } else if (page === "master-godowns" || page.startsWith("master-godowns-")) {
      setActiveSubTab("godowns");
    }
  }, [page]);

  const effectiveSubPage = useMemo(() => {
    if (page === "master-accounts") return `master-accounts-${activeSubTab || "groups"}`;
    if (page === "master-inventory") return `master-inventory-${activeSubTab || "items"}`;
    if (page === "master-users") return `master-users-${activeSubTab || "status"}`;
    if (page === "master-godowns") return `master-inventory-godowns`;
    return page;
  }, [page, activeSubTab]);

  const [activeAction, setActiveAction] = useState<"create" | "edit" | "delete" | "display">("create");
  const [selectedId, setSelectedId] = useState("");

  // Dynamic list of employee roles with LocalStorage persistence
  const [availableRoles, setAvailableRoles] = useState<string[]>(() => {
    const saved = localStorage.getItem("master_employee_roles");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return ["Data entry", "Cashier", "Accountant", "Manager", "General Manager", "Owner", "Worker", "Staff", "Admin", "Salesman", "Driver", "Supervisor", "Warehouse Staff", "Security"];
  });

  useEffect(() => {
    localStorage.setItem("master_employee_roles", JSON.stringify(availableRoles));
  }, [availableRoles]);

  const [newCustomRole, setNewCustomRole] = useState("");
  const [isAddingRole, setIsAddingRole] = useState(false);

  // CRUD Form states
  const [groupForm, setGroupForm] = useState<Omit<GroupItem, "id">>({ code: "", name: "", type: "Asset", description: "" });
  const [ledgerForm, setLedgerForm] = useState<Omit<LedgerItem, "id">>({ code: "", name: "", group: "Current Assets", openingBalance: 0, description: "" });
  const [categoryForm, setCategoryForm] = useState<Omit<CategoryItem, "id">>({ name: "", hsnCode: "", gstRate: 12, description: "" });
  const [unitForm, setUnitForm] = useState<Omit<UnitItem, "id">>({ shortName: "", fullName: "", decimalPlaces: 2 });
  const [packingForm, setPackingForm] = useState<Omit<PackingItem, "id">>({ name: "", capacityKg: 50, capacityUnit: "kg", material: "", notes: "" });
  const [godownForm, setGodownForm] = useState<Omit<GodownMasterItem, "id">>({
    code: "",
    name: "",
    location: "",
    temperature: "22°C Spices Ambient",
    capacityKg: 50000,
    managerName: "",
    status: "Active",
    notes: ""
  });
  const [userForm, setUserForm] = useState<Omit<UserItem, "id">>({
    employeeId: "",
    employeeName: "",
    passportNumber: "",
    passportIssue: "",
    passportExpiry: "",
    workPermitNumber: "",
    workPermitIssue: "",
    workPermitExpiry: "",
    visaNumber: "",
    visaIssue: "",
    visaExpiry: "",
    insuranceNumber: "",
    insuranceIssue: "",
    insuranceExpiry: "",
    healthMedicalNumber: "",
    healthMedicalIssue: "",
    healthMedicalExpiry: "",
    dateOfBirth: "",
    dateOfJoin: "",
    dateOfRejoin: "",
    basicSalary: 0,
    allowances: 0,
    overtime: 0,
    totalSalary: 0,
    role: "Staff",
    responsibility: "",
    username: "",
    password: "",
    allowedFeatures: ALL_WEBSITE_FEATURES.map(f => f.id)
  });

  // Custom customer add states
  const [customerForm, setCustomerForm] = useState<Omit<Customer, "id">>({ name: "", email: "", phone: "", address: "", gstNo: "", creditLimitDays: 0, creditLimitAmount: 0 });
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressLine3, setAddressLine3] = useState("");
  const [addressLine4, setAddressLine4] = useState("");

  // Custom supplier add states
  const [supplierForm, setSupplierForm] = useState<Omit<Supplier, "id">>({ name: "", email: "", phone: "", address: "", gstNo: "" });
  const [supAddressLine1, setSupAddressLine1] = useState("");
  const [supAddressLine2, setSupAddressLine2] = useState("");
  const [supAddressLine3, setSupAddressLine3] = useState("");
  const [supAddressLine4, setSupAddressLine4] = useState("");
  // Custom item add states
  const [itemForm, setItemForm] = useState<{
    name: string;
    category: string;
    unit: string;
    packingType?: string;
    packingTypes?: string[];
    packingPrices?: Record<string, number>;
    buyPrice: number;
    sellPrice: number;
    packing1: string;
    price1: string | number;
    packing2: string;
    price2: string | number;
    packing3: string;
    price3: string | number;
  }>({
    name: "",
    category: "Spices",
    unit: "kg",
    packingType: "",
    packingTypes: [],
    buyPrice: 100,
    sellPrice: 150,
    packing1: "",
    price1: "",
    packing2: "",
    price2: "",
    packing3: "",
    price3: ""
  });
  const [isCreatingNewPacking, setIsCreatingNewPacking] = useState(false);
  const [isPackingDropdownOpen, setIsPackingDropdownOpen] = useState(false);
  const [newPackingName, setNewPackingName] = useState("");

  const filteredPackings = useMemo(() => {
    const selectedUnitRaw = itemForm.unit || "kg";
    const selectedUnitLower = selectedUnitRaw.trim().toLowerCase();

    return packings.filter(p => {
      const capUnitRaw = p.capacityUnit || "kg";
      const capUnitLower = capUnitRaw.trim().toLowerCase();

      // Direct match between item billing unit & packing capacity limit unit
      if (capUnitLower === selectedUnitLower) return true;

      // Handle kg / kilogram equivalence
      const isKgSelected = selectedUnitLower === "kg" || selectedUnitLower.includes("kilo");
      const isKgPacking = capUnitLower === "kg" || capUnitLower.includes("kilo") || p.name.toLowerCase().includes("kg");

      if (isKgSelected && isKgPacking) return true;

      // Handle g / gram equivalence
      const isGramSelected = selectedUnitLower === "g" || selectedUnitLower === "gram";
      const isGramPacking = capUnitLower === "g" || capUnitLower === "gram" || p.name.toLowerCase().includes("gram");

      if (isGramSelected && (isGramPacking || isKgPacking)) return true;

      return false;
    });
  }, [packings, itemForm.unit]);

  const availableCategoryNames = useMemo(() => {
    const defaultCategories = ["Spices", "Dry Fruits", "Fruits", "Vegetables", "Other"];
    const masterCategories = categories.map(c => c.name.trim()).filter(Boolean);
    
    let storedCategories: string[] = [];
    try {
      const saved = localStorage.getItem("master_categories");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          storedCategories = parsed.map((c: any) => typeof c === "string" ? c.trim() : (c.name ? c.name.trim() : "")).filter(Boolean);
        }
      }
    } catch (e) {}

    const combinedSet = new Set([...masterCategories, ...storedCategories, ...defaultCategories]);
    if (itemForm.category && !combinedSet.has(itemForm.category)) {
      combinedSet.add(itemForm.category);
    }
    return Array.from(combinedSet);
  }, [categories, itemForm.category]);

  // Reset selected ID when sub-page changes
  useEffect(() => {
    setSelectedId("");
    setActiveAction("create");
  }, [effectiveSubPage]);

  // Load details into forms when selected ID changes in Edit mode
  useEffect(() => {
    if (!selectedId) return;
    if (effectiveSubPage === "master-accounts-groups") {
      const found = groups.find(x => x.id === selectedId);
      if (found) setGroupForm({ code: found.code, name: found.name, type: found.type, description: found.description });
    } else if (effectiveSubPage === "master-accounts-ledger") {
      const found = ledgers.find(x => x.id === selectedId);
      if (found) setLedgerForm({ code: found.code, name: found.name, group: found.group, openingBalance: found.openingBalance, description: found.description });
    } else if (effectiveSubPage === "master-accounts-customer") {
      const found = customers.find(x => x.id === selectedId);
      if (found) {
        setCustomerForm({ name: found.name, email: found.email || "", phone: found.phone || "", address: found.address || "", gstNo: found.gstNo || "", creditLimitDays: found.creditLimitDays || 0, creditLimitAmount: found.creditLimitAmount || 0 });
        const parts = (found.address || "").split(",").map(s => s.trim());
        setAddressLine1(parts[0] || "");
        setAddressLine2(parts[1] || "");
        setAddressLine3(parts[2] || "");
        setAddressLine4(parts[3] || "");
      }
    } else if (effectiveSubPage === "master-accounts-supplier") {
      const found = suppliers.find(x => x.id === selectedId);
      if (found) {
        setSupplierForm({ name: found.name, email: (found as any).email || "", phone: found.phone || "", address: found.address || "", gstNo: found.gstNo || "" });
        const parts = (found.address || "").split(",").map(s => s.trim());
        setSupAddressLine1(parts[0] || "");
        setSupAddressLine2(parts[1] || "");
        setSupAddressLine3(parts[2] || "");
        setSupAddressLine4(parts[3] || "");
      }
    } else if (effectiveSubPage === "master-inventory-items") {
      const found = products.find(x => x.id === selectedId);
      if (found) {
        const types = found.packingTypes || (found.packingType ? found.packingType.split(",").map(s => s.trim()) : []);
        const prices = (found as any).packingPrices || {};
        const p1 = (found as any).packing1 || types[0] || "";
        const p2 = (found as any).packing2 || types[1] || "";
        const p3 = (found as any).packing3 || types[2] || "";
        const pr1 = (found as any).price1 || prices[p1] || found.sellPrice || "";
        const pr2 = (found as any).price2 || prices[p2] || found.sellPrice || "";
        const pr3 = (found as any).price3 || prices[p3] || found.sellPrice || "";
        setItemForm({
          name: found.name,
          category: found.category,
          unit: found.unit,
          packingType: found.packingType || "",
          packingTypes: types,
          buyPrice: found.buyPrice,
          sellPrice: found.sellPrice,
          packing1: p1,
          price1: pr1,
          packing2: p2,
          price2: pr2,
          packing3: p3,
          price3: pr3,
        });
      }
    } else if (effectiveSubPage === "master-inventory-categories") {
      const found = categories.find(x => x.id === selectedId);
      if (found) setCategoryForm({ name: found.name, hsnCode: found.hsnCode, gstRate: found.gstRate, description: found.description });
    } else if (effectiveSubPage === "master-inventory-unit") {
      const found = units.find(x => x.id === selectedId);
      if (found) setUnitForm({ shortName: found.shortName, fullName: found.fullName, decimalPlaces: found.decimalPlaces });
    } else if (effectiveSubPage === "master-inventory-packing") {
      const found = packings.find(x => x.id === selectedId);
      if (found) setPackingForm({ name: found.name, capacityKg: found.capacityKg, capacityUnit: found.capacityUnit || "kg", material: found.material, notes: found.notes });
    } else if (effectiveSubPage === "master-inventory-godowns" || effectiveSubPage === "master-godowns") {
      const found = godowns.find(x => x.id === selectedId);
      if (found) setGodownForm({ code: found.code, name: found.name, location: found.location, temperature: found.temperature, capacityKg: found.capacityKg, managerName: found.managerName, status: found.status, notes: found.notes || "" });
    } else if (effectiveSubPage === "master-users") {
      const found = users.find(x => x.id === selectedId);
      if (found) {
        setUserForm({
          employeeId: found.employeeId,
          employeeName: found.employeeName,
          passportNumber: found.passportNumber,
          passportIssue: found.passportIssue,
          passportExpiry: found.passportExpiry,
          workPermitNumber: found.workPermitNumber,
          workPermitIssue: found.workPermitIssue,
          workPermitExpiry: found.workPermitExpiry,
          visaNumber: found.visaNumber,
          visaIssue: found.visaIssue,
          visaExpiry: found.visaExpiry,
          insuranceNumber: found.insuranceNumber,
          insuranceIssue: found.insuranceIssue,
          insuranceExpiry: found.insuranceExpiry,
          healthMedicalNumber: found.healthMedicalNumber,
          healthMedicalIssue: found.healthMedicalIssue,
          healthMedicalExpiry: found.healthMedicalExpiry,
          dateOfBirth: found.dateOfBirth,
          dateOfJoin: found.dateOfJoin,
          dateOfRejoin: found.dateOfRejoin,
          basicSalary: found.basicSalary,
          allowances: found.allowances,
          overtime: found.overtime,
          totalSalary: found.totalSalary,
          role: found.role,
          responsibility: found.responsibility,
          username: found.username,
          password: found.password || "",
          allowedFeatures: found.allowedFeatures && found.allowedFeatures.length > 0 ? found.allowedFeatures : ALL_WEBSITE_FEATURES.map(f => f.id)
        });
      }
    }
  }, [selectedId, effectiveSubPage]);

  // Metadata mappings
  let title = "";
  let subtitle = "";
  let currentRole = "";

  if (effectiveSubPage === "master-accounts-groups") {
    title = "Accounting Groups Console";
    subtitle = "Configure structural headers for account balances";
  } else if (effectiveSubPage === "master-accounts-ledger") {
    title = "General Ledger Master";
    subtitle = "Configure transactional ledger accounts and opening books";
  } else if (effectiveSubPage === "master-accounts-customer") {
    title = "Customer Accounts Master";
    subtitle = "Modify profiles and ledger configurations for buyers";
  } else if (effectiveSubPage === "master-accounts-supplier") {
    title = "Supplier Accounts Master";
    subtitle = "Register and manage vendor/supplier profiles and tax details";
  } else if (effectiveSubPage === "master-inventory-items") {
    title = "Inventory Catalog Master";
    subtitle = "Create and modify spice route products database";
  } else if (effectiveSubPage === "master-inventory-categories") {
    title = "Product Categories Console";
    subtitle = "Configure categorizations and standard GST percentages";
  } else if (effectiveSubPage === "master-inventory-unit") {
    title = "Measurement Units Master";
    subtitle = "Define unit labels, shortnames, and decimal structures";
  } else if (effectiveSubPage === "master-inventory-packing") {
    title = "Packing Type Definitions";
    subtitle = "Register standard bag weights and wrapping capacities";
  } else if (effectiveSubPage === "master-users-status") {
    title = "Employee Status Dashboard";
    subtitle = "Monitor active employees, pay scales, credentials, and passport/visa validity";
  } else if (effectiveSubPage === "master-users-creation") {
    title = "Employee Creation Master";
    subtitle = "Register a new employee with comprehensive biographical, document, and payroll specifications";
  } else if (effectiveSubPage === "master-inventory-godowns" || effectiveSubPage === "master-godowns") {
    title = "Godown & Warehouse Creation Master";
    subtitle = "Register, configure, and manage Godowns A-R and custom warehouse storage facilities";
  }

  // Active role users
  const filteredUsers = users;

  const getRolePrivileges = (role: string) => {
    switch (role) {
      case "data-entry": return "Stock receipts, dispatch logs, read catalogs, godown assignments.";
      case "cashier": return "Voucher invoicing, cash checkout counters, printing slips, POS access.";
      case "accountant": return "General ledger audits, trial balance checks, tax reports, P&L views.";
      case "manager": return "Inventory resets, category parameters, warehouse allocation rules.";
      case "general-manager": return "Full dashboard metrics, price catalog resets, override restrictions.";
      case "owner": return "Total administration, delete records, clear analytics logs, system resets.";
      case "worker": return "Godown stock inspections, shelf packing logs, dispatch checklist ticks.";
      case "staff": return "Basic inquiries, customer support log writes, draft voucher sheets.";
      default: return "No privileges assigned.";
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeAction === "create") {
      if (effectiveSubPage === "master-accounts-groups") {
        const newGroup = { ...groupForm, id: "g_" + Date.now() };
        setGroups(prev => [...prev, newGroup]);
        toast.success(`Group "${groupForm.name}" created!`);
        setGroupForm({ code: "", name: "", type: "Asset", description: "" });
      } else if (effectiveSubPage === "master-accounts-ledger") {
        const newLedger = { ...ledgerForm, id: "l_" + Date.now() };
        setLedgers(prev => [...prev, newLedger]);
        toast.success(`Ledger "${ledgerForm.name}" registered!`);
        setLedgerForm({ code: "", name: "", group: "Current Assets", openingBalance: 0, description: "" });
      } else if (effectiveSubPage === "master-accounts-customer") {
        const ok = await onAddCustomer(customerForm);
        if (ok) {
          toast.success(`Customer "${customerForm.name}" added to backend!`);
          setCustomerForm({ name: "", email: "", phone: "", address: "", gstNo: "", creditLimitDays: 0, creditLimitAmount: 0 });
          setAddressLine1("");
          setAddressLine2("");
          setAddressLine3("");
          setAddressLine4("");
        }
      } else if (effectiveSubPage === "master-accounts-supplier") {
        if (onAddSupplier) {
          const ok = await onAddSupplier(supplierForm);
          if (ok) {
            toast.success(`Supplier "${supplierForm.name}" registered in database!`);
            setSupplierForm({ name: "", email: "", phone: "", address: "", gstNo: "" });
            setSupAddressLine1("");
            setSupAddressLine2("");
            setSupAddressLine3("");
            setSupAddressLine4("");
          }
        }
      } else if (effectiveSubPage === "master-inventory-items") {
        const packingsList = [
          { type: itemForm.packing1?.trim(), price: parseFloat(String(itemForm.price1)) },
          { type: itemForm.packing2?.trim(), price: parseFloat(String(itemForm.price2)) },
          { type: itemForm.packing3?.trim(), price: parseFloat(String(itemForm.price3)) },
        ].filter(p => p.type);

        const validTypes = packingsList.map(p => p.type as string);
        const packingPricesMap: Record<string, number> = {};
        packingsList.forEach(p => {
          if (p.type && !isNaN(p.price) && p.price > 0) {
            packingPricesMap[p.type] = p.price;
          }
        });

        const defaultSellPrice = packingsList[0]?.price && !isNaN(packingsList[0].price) && packingsList[0].price > 0
          ? packingsList[0].price
          : (itemForm.sellPrice || 150);

        if (packingsList.length > 0) {
          let count = 0;
          for (const packObj of packingsList) {
            const variantSell = (!isNaN(packObj.price) && packObj.price > 0) ? packObj.price : defaultSellPrice;
            const variantName = packingsList.length > 1 ? `${itemForm.name} (${packObj.type})` : itemForm.name;

            const payload = {
              name: variantName,
              category: itemForm.category,
              unit: itemForm.unit,
              packingType: packObj.type,
              packingTypes: validTypes,
              packingPrices: packingPricesMap,
              packing1: itemForm.packing1,
              price1: itemForm.price1,
              packing2: itemForm.packing2,
              price2: itemForm.price2,
              packing3: itemForm.packing3,
              price3: itemForm.price3,
              buyPrice: itemForm.buyPrice || 0,
              sellPrice: variantSell
            };
            const ok = await onAddProduct(payload as any);
            if (ok) count++;
          }
          if (count > 0) {
            toast.success(`Registered ${count} packing variants for "${itemForm.name}" with individual selling prices!`);
            setItemForm({
              name: "", category: "Spices", unit: "kg", packingType: "", packingTypes: [], buyPrice: 100, sellPrice: 150,
              packing1: "", price1: "", packing2: "", price2: "", packing3: "", price3: ""
            });
          }
        } else {
          const payload = {
            name: itemForm.name,
            category: itemForm.category,
            unit: itemForm.unit,
            packingType: "Standard",
            packingTypes: ["Standard"],
            buyPrice: itemForm.buyPrice || 0,
            sellPrice: itemForm.sellPrice || 150
          };
          const ok = await onAddProduct(payload as any);
          if (ok) {
            toast.success(`Product "${itemForm.name}" registered in catalog!`);
            setItemForm({
              name: "", category: "Spices", unit: "kg", packingType: "", packingTypes: [], buyPrice: 100, sellPrice: 150,
              packing1: "", price1: "", packing2: "", price2: "", packing3: "", price3: ""
            });
          }
        }
      } else if (effectiveSubPage === "master-inventory-categories") {
        const newCat = { ...categoryForm, id: "cat_" + Date.now() };
        setCategories(prev => [...prev, newCat]);
        toast.success(`Category "${categoryForm.name}" saved!`);
        setCategoryForm({ name: "", hsnCode: "", gstRate: 12, description: "" });
      } else if (effectiveSubPage === "master-inventory-unit") {
        const newUnit = { ...unitForm, id: "unit_" + Date.now() };
        setUnits(prev => [...prev, newUnit]);
        toast.success(`Unit "${unitForm.fullName}" saved!`);
        setUnitForm({ shortName: "", fullName: "", decimalPlaces: 2 });
      } else if (effectiveSubPage === "master-inventory-packing") {
        const newPack = { ...packingForm, id: "pack_" + Date.now() };
        setPackings(prev => [...prev, newPack]);
        toast.success(`Packing "${packingForm.name}" registered!`);
        setPackingForm({ name: "", capacityKg: 50, capacityUnit: "kg", material: "", notes: "" });
      } else if (effectiveSubPage === "master-inventory-godowns" || effectiveSubPage === "master-godowns") {
        const newGdn = { ...godownForm, id: "gdn_" + Date.now() };
        setGodowns(prev => [...prev, newGdn]);
        toast.success(`Warehouse Godown "${godownForm.name} (${godownForm.code})" registered in Masters!`);
      } else if (effectiveSubPage.startsWith("master-users")) {
        const name = userForm.employeeName.trim();
        if (!name) {
          toast.error("Please enter Employee Name.");
          return;
        }

        const autoEmpId = userForm.employeeId.trim() || `EMP-${String(users.length + 1).padStart(3, '0')}`;
        const autoUsername = userForm.username.trim().toLowerCase() || name.toLowerCase().replace(/\s+/g, "");
        const autoPassword = userForm.password ? userForm.password.trim() : "123";

        const newUser = {
          ...userForm,
          id: "usr_" + Date.now(),
          employeeId: autoEmpId,
          employeeName: name,
          username: autoUsername,
          password: autoPassword,
          role: userForm.role || "Staff",
          totalSalary: (userForm.basicSalary || 0) + (userForm.allowances || 0) + (userForm.overtime || 0),
          allowedFeatures: userForm.allowedFeatures && userForm.allowedFeatures.length > 0 ? userForm.allowedFeatures : ALL_WEBSITE_FEATURES.map(f => f.id)
        };
        setUsers(prev => [...prev, newUser]);
        toast.success(`Employee "${name}" registered! User ID: "${autoUsername}" | Password: "${autoPassword}"`);
        setUserForm({
          employeeId: "", employeeName: "", passportNumber: "", passportIssue: "", passportExpiry: "", workPermitNumber: "",
          workPermitIssue: "", workPermitExpiry: "", visaNumber: "", visaIssue: "", visaExpiry: "", insuranceNumber: "",
          insuranceIssue: "", insuranceExpiry: "", healthMedicalNumber: "", healthMedicalIssue: "", healthMedicalExpiry: "",
          dateOfBirth: "", dateOfJoin: "", dateOfRejoin: "", basicSalary: 0, allowances: 0, overtime: 0, totalSalary: 0,
          role: "Staff", responsibility: "", username: "", password: "", allowedFeatures: ALL_WEBSITE_FEATURES.map(f => f.id)
        });
      }
    } else if (activeAction === "edit") {
      if (!selectedId) {
        toast.error("Please select a record to update.");
        return;
      }
      if (effectiveSubPage === "master-accounts-groups") {
        setGroups(prev => prev.map(x => x.id === selectedId ? { ...x, ...groupForm } : x));
        toast.success("Group details updated.");
      } else if (effectiveSubPage === "master-accounts-ledger") {
        setLedgers(prev => prev.map(x => x.id === selectedId ? { ...x, ...ledgerForm } : x));
        toast.success("Ledger details updated.");
      } else if (effectiveSubPage === "master-inventory-items") {
        const packingsList = [
          { type: itemForm.packing1?.trim(), price: parseFloat(String(itemForm.price1)) },
          { type: itemForm.packing2?.trim(), price: parseFloat(String(itemForm.price2)) },
          { type: itemForm.packing3?.trim(), price: parseFloat(String(itemForm.price3)) },
        ].filter(p => p.type);

        const validTypes = packingsList.map(p => p.type as string);
        const packingPricesMap: Record<string, number> = {};
        packingsList.forEach(p => {
          if (p.type && !isNaN(p.price) && p.price > 0) {
            packingPricesMap[p.type] = p.price;
          }
        });

        const defaultSellPrice = packingsList[0]?.price && !isNaN(packingsList[0].price) && packingsList[0].price > 0
          ? packingsList[0].price
          : itemForm.sellPrice;

        const payload = {
          id: selectedId,
          name: itemForm.name,
          category: itemForm.category,
          unit: itemForm.unit,
          packingType: validTypes.join(", "),
          packingTypes: validTypes,
          packingPrices: packingPricesMap,
          packing1: itemForm.packing1,
          price1: itemForm.price1,
          packing2: itemForm.packing2,
          price2: itemForm.price2,
          packing3: itemForm.packing3,
          price3: itemForm.price3,
          buyPrice: itemForm.buyPrice,
          sellPrice: defaultSellPrice,
        };
        const ok = await onAddProduct(payload as any);
        if (ok) {
          toast.success(`Product "${itemForm.name}" updated with 3 packing types & selling prices!`);
        }
      } else if (effectiveSubPage === "master-accounts-customer") {
        if (onUpdateCustomer) {
          const ok = await onUpdateCustomer(selectedId, customerForm);
          if (ok) {
            toast.success(`Customer "${customerForm.name}" updated successfully!`);
          }
        } else {
          toast.success("Customer details updated.");
        }
      } else if (effectiveSubPage === "master-accounts-supplier") {
        if (onUpdateSupplier) {
          const ok = await onUpdateSupplier(selectedId, supplierForm);
          if (ok) {
            toast.success(`Supplier "${supplierForm.name}" updated successfully!`);
          }
        } else {
          toast.success("Supplier details updated.");
        }
      } else if (effectiveSubPage === "master-inventory-categories") {
        setCategories(prev => prev.map(x => x.id === selectedId ? { ...x, ...categoryForm } : x));
        toast.success("Category details updated.");
      } else if (effectiveSubPage === "master-inventory-unit") {
        setUnits(prev => prev.map(x => x.id === selectedId ? { ...x, ...unitForm } : x));
        toast.success("Measurement unit details updated.");
      } else if (effectiveSubPage === "master-inventory-packing") {
        setPackings(prev => prev.map(x => x.id === selectedId ? { ...x, ...packingForm } : x));
        toast.success("Packing profile updated.");
      } else if (effectiveSubPage === "master-inventory-godowns" || effectiveSubPage === "master-godowns") {
        setGodowns(prev => prev.map(x => x.id === selectedId ? { ...x, ...godownForm } : x));
        toast.success(`Godown "${godownForm.name}" details updated.`);
      } else if (effectiveSubPage.startsWith("master-users")) {
        setUsers(prev => prev.map(x => x.id === selectedId ? {
          ...x,
          ...userForm,
          username: userForm.username ? userForm.username.trim().toLowerCase() : x.username,
          password: userForm.password ? userForm.password.trim() : (x.password || "123"),
          totalSalary: (userForm.basicSalary || 0) + (userForm.allowances || 0) + (userForm.overtime || 0),
          allowedFeatures: userForm.allowedFeatures && userForm.allowedFeatures.length > 0 ? userForm.allowedFeatures : x.allowedFeatures
        } : x));
      } else {
        toast.success("Record updated successfully.");
      }
    }
  };

  const handleDeleteRecord = async () => {
    if (!selectedId) {
      toast.error("Please select a record to remove.");
      return;
    }
    if (effectiveSubPage === "master-accounts-groups") {
      setGroups(prev => prev.filter(x => x.id !== selectedId));
      toast.success("Group removed from Master registry.");
    } else if (effectiveSubPage === "master-accounts-ledger") {
      setLedgers(prev => prev.filter(x => x.id !== selectedId));
      toast.success("Ledger account erased.");
    } else if (effectiveSubPage === "master-accounts-customer") {
      if (onDeleteCustomer) {
        await onDeleteCustomer(selectedId);
      } else {
        toast.success("Customer account removed.");
      }
    } else if (effectiveSubPage === "master-accounts-supplier") {
      if (onDeleteSupplier) {
        await onDeleteSupplier(selectedId);
      } else {
        toast.success("Supplier account removed.");
      }
    } else if (effectiveSubPage === "master-inventory-items") {
      if (onDeleteProduct) {
        await onDeleteProduct(selectedId);
      } else {
        toast.success("Item removed from inventory catalog.");
      }
    } else if (effectiveSubPage === "master-inventory-categories") {
      setCategories(prev => prev.filter(x => x.id !== selectedId));
      toast.success("Category details removed.");
    } else if (effectiveSubPage === "master-inventory-unit") {
      setUnits(prev => prev.filter(x => x.id !== selectedId));
      toast.success("Unit details removed.");
    } else if (effectiveSubPage === "master-inventory-packing") {
      setPackings(prev => prev.filter(x => x.id !== selectedId));
      toast.success("Packing profile removed.");
    } else if (effectiveSubPage === "master-inventory-godowns" || effectiveSubPage === "master-godowns") {
      setGodowns(prev => prev.filter(x => x.id !== selectedId));
      toast.success("Godown removed from Masters registry.");
    } else if (effectiveSubPage.startsWith("master-users")) {
      setUsers(prev => prev.filter(x => x.id !== selectedId));
      toast.success("Employee record deleted.");
    } else {
      toast.success("Record deleted successfully.");
    }
    setSelectedId("");
  };

  return (
    <div className="space-y-4 px-2">
      {/* Page Header */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <h2 className="text-base font-bold text-foreground font-serif flex items-center gap-2">
          <Sparkles className="text-primary animate-pulse" size={16} />
          {title}
        </h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      {/* Internal Tabs Nav Bar */}
      {page.startsWith("master-accounts") && (
        <div className="flex gap-2 bg-card border border-border rounded-xl p-2 shadow-sm overflow-x-auto">
          {[
            { id: "groups", label: "Groups" },
            { id: "ledger", label: "Ledger" },
            { id: "customer", label: "Customer" },
            { id: "supplier", label: "Supplier" }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                activeSubTab === tab.id
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {(page.startsWith("master-inventory") || page.startsWith("master-godowns")) && (
        <div className="flex gap-2 bg-card border border-border rounded-xl p-2 shadow-sm overflow-x-auto">
          {[
            { id: "items", label: "Items Catalog" },
            { id: "categories", label: "Categories" },
            { id: "unit", label: "Unit" },
            { id: "packing", label: "Packing Type" },
            { id: "godowns", label: "Godown / Warehouse Creation Master" }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                activeSubTab === tab.id
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {page.startsWith("master-users") && (
        <div className="flex gap-2 bg-card border border-border rounded-xl p-2 shadow-sm overflow-x-auto">
          {[
            { id: "status", label: "Employee Status" },
            { id: "creation", label: "Employee Creation" }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveSubTab(tab.id);
                if (tab.id === "creation") {
                  setActiveAction("create");
                } else {
                  setActiveAction("display");
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                activeSubTab === tab.id
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {effectiveSubPage === "master-users-creation" && (
        <div className="bg-card border border-border rounded-xl shadow-sm p-4 space-y-3">
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-foreground uppercase tracking-widest">
                Create Employee Registration Sheet (No Scroll Layout)
              </span>
            </div>
            <span className="text-[9px] font-mono font-bold bg-secondary/50 px-2 py-0.5 rounded border border-border text-muted-foreground">
              28 SPECIFICATIONS
            </span>
          </div>

          <form onSubmit={handleActionSubmit} className="space-y-3 text-left">
            {/* The Compact Grid Sheet */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-3 gap-y-2">
              
              {/* Row 1: Bio & Credentials */}
              <div className="border-l-2 border-l-blue-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Employee ID</label>
                <input
                  type="text"
                  placeholder="e.g. EMP-001 (Auto)"
                  value={userForm.employeeId}
                  onChange={e => setUserForm(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono font-semibold"
                />
              </div>

              <div className="border-l-2 border-l-blue-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Employee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={userForm.employeeName}
                  onChange={e => setUserForm(prev => ({ ...prev, employeeName: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                />
              </div>

              <div className="border-l-2 border-l-blue-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Date of Birth</label>
                <input
                  type="date"
                  value={userForm.dateOfBirth}
                  onChange={e => setUserForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="border-l-2 border-l-blue-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Username</label>
                <input
                  type="text"
                  placeholder="Username (Auto)"
                  value={userForm.username}
                  onChange={e => setUserForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, "") }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono font-semibold"
                />
              </div>

              <div className="border-l-2 border-l-blue-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Password</label>
                <input
                  type="password"
                  placeholder="Password (Default 123)"
                  value={userForm.password}
                  onChange={e => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono font-semibold"
                />
              </div>

              <div className="border-l-2 border-l-blue-500 pl-2 space-y-0.5 relative">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Role Assignment</label>
                <div className="flex gap-1">
                  <select
                    value={userForm.role}
                    onChange={e => {
                      if (e.target.value === "ADD_NEW") {
                        setIsAddingRole(true);
                      } else {
                        setUserForm(prev => ({ ...prev, role: e.target.value }));
                        setIsAddingRole(false);
                      }
                    }}
                    className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  >
                    <option value="">-- Select Role --</option>
                    {availableRoles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                    <option value="ADD_NEW" className="text-blue-500 font-bold">+ Create Custom Role...</option>
                  </select>
                </div>
                {isAddingRole && (
                  <div className="absolute left-2 top-[32px] right-2 bg-popover border border-border rounded p-1.5 shadow-lg z-50 space-y-1">
                    <div className="text-[8px] font-bold text-muted-foreground uppercase font-mono">Create New Role</div>
                    <input
                      type="text"
                      placeholder="e.g. Sales Executive"
                      value={newCustomRole}
                      onChange={e => setNewCustomRole(e.target.value)}
                      className="w-full px-1.5 py-0.5 border border-border rounded bg-input-background text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                    />
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = newCustomRole.trim();
                          if (trimmed && !availableRoles.includes(trimmed)) {
                            setAvailableRoles(prev => [...prev, trimmed]);
                            setUserForm(prev => ({ ...prev, role: trimmed }));
                            setNewCustomRole("");
                            setIsAddingRole(false);
                          } else {
                            alert("Invalid or duplicate role name.");
                          }
                        }}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold rounded"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingRole(false);
                          setNewCustomRole("");
                        }}
                        className="px-1.5 py-0.5 bg-secondary hover:bg-secondary/80 text-foreground text-[9px] font-semibold rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 2: Timeline & Compensation */}
              <div className="border-l-2 border-l-emerald-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Date of Join</label>
                <input
                  type="date"
                  value={userForm.dateOfJoin}
                  onChange={e => setUserForm(prev => ({ ...prev, dateOfJoin: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div className="border-l-2 border-l-emerald-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Date of Rejoin</label>
                <input
                  type="date"
                  value={userForm.dateOfRejoin}
                  onChange={e => setUserForm(prev => ({ ...prev, dateOfRejoin: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div className="border-l-2 border-l-emerald-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Basic Salary</label>
                <input
                  type="number"
                  placeholder="Basic Pay"
                  value={userForm.basicSalary || ""}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    setUserForm(prev => ({ ...prev, basicSalary: val, totalSalary: val + prev.allowances + prev.overtime }));
                  }}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-semibold"
                />
              </div>

              <div className="border-l-2 border-l-emerald-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Allowances</label>
                <input
                  type="number"
                  placeholder="Allowances"
                  value={userForm.allowances || ""}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    setUserForm(prev => ({ ...prev, allowances: val, totalSalary: prev.basicSalary + val + prev.overtime }));
                  }}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-semibold"
                />
              </div>

              <div className="border-l-2 border-l-emerald-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Overtime Pay</label>
                <input
                  type="number"
                  placeholder="Overtime"
                  value={userForm.overtime || ""}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    setUserForm(prev => ({ ...prev, overtime: val, totalSalary: prev.basicSalary + prev.allowances + val }));
                  }}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-semibold"
                />
              </div>

              <div className="border-l-2 border-l-emerald-500 pl-2 space-y-0.5 bg-emerald-500/5 rounded px-1.5 py-0.5 border border-emerald-500/20">
                <label className="block text-[7px] font-mono text-emerald-600 uppercase font-bold tracking-wider">Gross Calculated</label>
                <div className="text-xs font-mono font-bold text-emerald-500 pt-0.5">
                  ₹{(userForm.basicSalary + userForm.allowances + userForm.overtime).toLocaleString("en-IN")}
                </div>
              </div>

              {/* Row 3: Passport & Work Permit */}
              <div className="border-l-2 border-l-indigo-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Passport Number</label>
                <input
                  type="text"
                  placeholder="Passport No."
                  value={userForm.passportNumber}
                  onChange={e => setUserForm(prev => ({ ...prev, passportNumber: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono font-semibold"
                />
              </div>

              <div className="border-l-2 border-l-indigo-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Passport Issue</label>
                <input
                  type="date"
                  value={userForm.passportIssue}
                  onChange={e => setUserForm(prev => ({ ...prev, passportIssue: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="border-l-2 border-l-indigo-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Passport Expiry</label>
                <input
                  type="date"
                  value={userForm.passportExpiry}
                  onChange={e => setUserForm(prev => ({ ...prev, passportExpiry: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                />
              </div>

              <div className="border-l-2 border-l-indigo-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Work Permit Number</label>
                <input
                  type="text"
                  placeholder="WP-XXXXXXXX"
                  value={userForm.workPermitNumber}
                  onChange={e => setUserForm(prev => ({ ...prev, workPermitNumber: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono font-semibold"
                />
              </div>

              <div className="border-l-2 border-l-indigo-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Work Permit Issue</label>
                <input
                  type="date"
                  value={userForm.workPermitIssue}
                  onChange={e => setUserForm(prev => ({ ...prev, workPermitIssue: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="border-l-2 border-l-indigo-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Work Permit Expiry</label>
                <input
                  type="date"
                  value={userForm.workPermitExpiry}
                  onChange={e => setUserForm(prev => ({ ...prev, workPermitExpiry: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                />
              </div>

              {/* Row 4: Visa & Insurance */}
              <div className="border-l-2 border-l-amber-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Visa Number</label>
                <input
                  type="text"
                  placeholder="Visa No."
                  value={userForm.visaNumber}
                  onChange={e => setUserForm(prev => ({ ...prev, visaNumber: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono font-semibold"
                />
              </div>

              <div className="border-l-2 border-l-amber-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Visa Issue</label>
                <input
                  type="date"
                  value={userForm.visaIssue}
                  onChange={e => setUserForm(prev => ({ ...prev, visaIssue: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>

              <div className="border-l-2 border-l-amber-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Visa Expiry</label>
                <input
                  type="date"
                  value={userForm.visaExpiry}
                  onChange={e => setUserForm(prev => ({ ...prev, visaExpiry: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-semibold"
                />
              </div>

              <div className="border-l-2 border-l-amber-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Insurance Number</label>
                <input
                  type="text"
                  placeholder="Policy No."
                  value={userForm.insuranceNumber}
                  onChange={e => setUserForm(prev => ({ ...prev, insuranceNumber: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono font-semibold"
                />
              </div>

              <div className="border-l-2 border-l-amber-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Insurance Issue</label>
                <input
                  type="date"
                  value={userForm.insuranceIssue}
                  onChange={e => setUserForm(prev => ({ ...prev, insuranceIssue: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>

              <div className="border-l-2 border-l-amber-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Insurance Expiry</label>
                <input
                  type="date"
                  value={userForm.insuranceExpiry}
                  onChange={e => setUserForm(prev => ({ ...prev, insuranceExpiry: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-semibold"
                />
              </div>

              {/* Row 5: Health & Scope */}
              <div className="border-l-2 border-l-rose-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Health Card Number</label>
                <input
                  type="text"
                  placeholder="Medical ID No."
                  value={userForm.healthMedicalNumber}
                  onChange={e => setUserForm(prev => ({ ...prev, healthMedicalNumber: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all font-mono font-semibold"
                />
              </div>

              <div className="border-l-2 border-l-rose-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Health Card Issue</label>
                <input
                  type="date"
                  value={userForm.healthMedicalIssue}
                  onChange={e => setUserForm(prev => ({ ...prev, healthMedicalIssue: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all"
                />
              </div>

              <div className="border-l-2 border-l-rose-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Health Card Expiry</label>
                <input
                  type="date"
                  value={userForm.healthMedicalExpiry}
                  onChange={e => setUserForm(prev => ({ ...prev, healthMedicalExpiry: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all font-semibold"
                />
              </div>

              <div className="lg:col-span-3 border-l-2 border-l-rose-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Job Responsibilities & Scope</label>
                <input
                  type="text"
                  placeholder="Describe duties, departments, and specific permissions..."
                  value={userForm.responsibility}
                  onChange={e => setUserForm(prev => ({ ...prev, responsibility: e.target.value }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all font-semibold"
                />
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
              <button
                type="submit"
                className="px-6 py-1.5 bg-primary hover:bg-primary/95 text-white rounded text-xs font-mono font-bold transition-all shadow hover:scale-[1.01] active:scale-95 duration-200"
              >
                Create Employee
              </button>
            </div>
          </form>
        </div>
      )}

      {effectiveSubPage === "master-users-status" && (
        <div className="bg-card border border-border rounded-xl shadow-sm p-4 space-y-3">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold border-b border-border pb-1.5">
            Employee Actions & Inspections
          </div>
          
          {/* Options selectors */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "edit", label: "EDIT PROFILE", color: "text-amber-500 bg-amber-500/5 hover:bg-amber-500/10" },
              { id: "delete", label: "DELETE PROFILE", color: "text-red-500 bg-red-500/5 hover:bg-red-500/10" },
              { id: "display", label: "DISPLAY PROFILE", color: "text-green-500 bg-green-500/5 hover:bg-green-500/10" }
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setActiveAction(opt.id as any);
                  setSelectedId("");
                }}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all border border-border/60 ${opt.color} ${activeAction === opt.id ? "ring-2 ring-primary border-primary" : ""}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Dynamic Action Forms Panel */}
          <div className="bg-secondary/10 border border-border/40 p-4 rounded-xl space-y-4">
            {/* Action Header Banner */}
            <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Active Option: {activeAction.toUpperCase()}
            </div>

            {/* DISPLAY MODE PANEL */}
            {activeAction === "display" && (
              <div className="space-y-3 text-left">
                <label className="block text-[10px] font-mono text-muted-foreground uppercase">Select Employee to View</label>
                <select
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                >
                  <option value="">-- Choose Employee to Inspect --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.employeeId} - {u.employeeName}</option>)}
                </select>

                {selectedId ? (
                  (() => {
                    const item = users.find(x => x.id === selectedId);
                    return item ? (
                      <div className="space-y-4 border border-border bg-card/60 p-4 rounded-xl relative overflow-hidden text-xs">
                        <div className="flex justify-between items-center border-b border-border pb-2">
                          <div>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">Employee ID:</span>
                            <div className="text-sm font-bold text-primary font-mono">{item.employeeId}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">System Role:</span>
                            <div className="font-bold text-foreground font-mono">{item.role}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Personal & Info */}
                          <div className="space-y-1 bg-secondary/10 p-2.5 rounded-lg">
                            <div className="font-bold text-primary mb-1 uppercase text-[9px] font-mono tracking-wider border-b border-border/40">General Info</div>
                            <div><span className="text-muted-foreground">NAME:</span> <span className="font-bold text-foreground">{item.employeeName}</span></div>
                            <div><span className="text-muted-foreground">DATE OF BIRTH:</span> <span className="text-foreground">{item.dateOfBirth || "N/A"}</span></div>
                            <div><span className="text-muted-foreground">DATE OF JOIN:</span> <span className="text-foreground">{item.dateOfJoin || "N/A"}</span></div>
                            <div><span className="text-muted-foreground">DATE OF REJOIN:</span> <span className="text-foreground">{item.dateOfRejoin || "N/A"}</span></div>
                          </div>

                          {/* Credentials */}
                          <div className="space-y-1 bg-secondary/10 p-2.5 rounded-lg">
                            <div className="font-bold text-primary mb-1 uppercase text-[9px] font-mono tracking-wider border-b border-border/40">System Credentials</div>
                            <div><span className="text-muted-foreground">USER NAME:</span> <span className="font-mono text-foreground">@{item.username}</span></div>
                            <div><span className="text-muted-foreground">PASSWORD:</span> <span className="font-mono text-foreground">{item.password || "••••••••"}</span></div>
                            <div><span className="text-muted-foreground">RESPONSIBILITIES:</span> <span className="text-foreground block mt-0.5 max-h-[40px] overflow-y-auto">{item.responsibility || "None defined"}</span></div>
                          </div>

                          {/* Passport & Visa */}
                          <div className="space-y-1 bg-secondary/10 p-2.5 rounded-lg md:col-span-2">
                            <div className="font-bold text-primary mb-1 uppercase text-[9px] font-mono tracking-wider border-b border-border/40">Document Status</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                              <div>
                                <div className="text-muted-foreground font-bold uppercase text-[9px]">Passport Details</div>
                                <div>No: <span className="font-mono font-bold text-foreground">{item.passportNumber || "N/A"}</span></div>
                                <div>Issue: <span className="text-foreground">{item.passportIssue || "N/A"}</span></div>
                                <div>Expiry: <span className="text-red-400 font-bold">{item.passportExpiry || "N/A"}</span></div>
                              </div>
                              <div>
                                <div className="text-muted-foreground font-bold uppercase text-[9px]">Work Permit Details</div>
                                <div>No: <span className="font-mono font-bold text-foreground">{item.workPermitNumber || "N/A"}</span></div>
                                <div>Issue: <span className="text-foreground">{item.workPermitIssue || "N/A"}</span></div>
                                <div>Expiry: <span className="text-red-400 font-bold">{item.workPermitExpiry || "N/A"}</span></div>
                              </div>
                              <div>
                                <div className="text-muted-foreground font-bold uppercase text-[9px]">Visa Details</div>
                                <div>No: <span className="font-mono font-bold text-foreground">{item.visaNumber || "N/A"}</span></div>
                                <div>Issue: <span className="text-foreground">{item.visaIssue || "N/A"}</span></div>
                                <div>Expiry: <span className="text-red-400 font-bold">{item.visaExpiry || "N/A"}</span></div>
                              </div>
                            </div>
                          </div>

                          {/* Insurance & Medical */}
                          <div className="space-y-1 bg-secondary/10 p-2.5 rounded-lg md:col-span-2">
                            <div className="font-bold text-primary mb-1 uppercase text-[9px] font-mono tracking-wider border-b border-border/40">Health & Insurance</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <div className="text-muted-foreground font-bold uppercase text-[9px]">Insurance Details</div>
                                <div>No: <span className="font-mono font-bold text-foreground">{item.insuranceNumber || "N/A"}</span></div>
                                <div>Issue: <span className="text-foreground">{item.insuranceIssue || "N/A"}</span></div>
                                <div>Expiry: <span className="text-red-400 font-bold">{item.insuranceExpiry || "N/A"}</span></div>
                              </div>
                              <div>
                                <div className="text-muted-foreground font-bold uppercase text-[9px]">Health Medical Details</div>
                                <div>No: <span className="font-mono font-bold text-foreground">{item.healthMedicalNumber || "N/A"}</span></div>
                                <div>Issue: <span className="text-foreground">{item.healthMedicalIssue || "N/A"}</span></div>
                                <div>Expiry: <span className="text-red-400 font-bold">{item.healthMedicalExpiry || "N/A"}</span></div>
                              </div>
                            </div>
                          </div>

                          {/* Salary Info */}
                          <div className="space-y-1 bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-lg md:col-span-2">
                            <div className="font-bold text-emerald-500 mb-1 uppercase text-[9px] font-mono tracking-wider border-b border-emerald-500/20">Compensation Details</div>
                            <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono font-semibold">
                              <div className="bg-secondary/20 p-1.5 rounded">
                                <div className="text-[8px] text-muted-foreground uppercase">Basic</div>
                                <div className="text-foreground">₹{item.basicSalary ? item.basicSalary.toLocaleString("en-IN") : "0"}</div>
                              </div>
                              <div className="bg-secondary/20 p-1.5 rounded">
                                <div className="text-[8px] text-muted-foreground uppercase">Allowances</div>
                                <div className="text-foreground">₹{item.allowances ? item.allowances.toLocaleString("en-IN") : "0"}</div>
                              </div>
                              <div className="bg-secondary/20 p-1.5 rounded">
                                <div className="text-[8px] text-muted-foreground uppercase">Overtime</div>
                                <div className="text-foreground">₹{item.overtime ? item.overtime.toLocaleString("en-IN") : "0"}</div>
                              </div>
                              <div className="bg-emerald-500/20 p-1.5 rounded border border-emerald-500/30">
                                <div className="text-[8px] text-emerald-600 uppercase font-bold">Total Gross</div>
                                <div className="text-emerald-500 font-bold">₹{item.totalSalary ? item.totalSalary.toLocaleString("en-IN") : "0"}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()
                ) : (
                  <div className="text-center py-6 text-muted-foreground italic font-mono text-xs bg-card border border-border rounded-lg">
                    Select an employee above to display specifications.
                  </div>
                )}
              </div>
            )}

            {/* DELETE MODE PANEL */}
            {activeAction === "delete" && (
              <div className="space-y-3 text-left font-mono text-xs">
                <label className="block text-[10px] font-mono text-muted-foreground uppercase">Select Employee to Delete</label>
                <select
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                >
                  <option value="">-- Choose Employee to Destroy --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.employeeId} - {u.employeeName}</option>)}
                </select>

                {selectedId ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg space-y-3 text-xs text-center font-mono">
                    <AlertTriangle className="text-red-500 mx-auto" size={32} />
                    <p className="font-bold text-red-600">WARNING: THIS IS AN IRREVERSIBLE OPERATION!</p>
                    <p className="text-muted-foreground">Deleting this employee profile will permanently erase their personal, payroll, and visa records.</p>
                    <button
                      type="button"
                      onClick={handleDeleteRecord}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-all"
                    >
                      Confirm Permanent Deletion
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground italic font-mono text-xs bg-card border border-border rounded-lg">
                    Select an employee above to prepare for deletion.
                  </div>
                )}
              </div>
            )}

            {/* CREATE & EDIT MODE PANEL FOR USERS */}
            {(activeAction === "create" || activeAction === "edit") && (
              <form onSubmit={handleActionSubmit} className="space-y-4 text-left">
                {activeAction === "edit" && (
                  <div className="space-y-1 mb-3">
                    <label className="block text-[10px] font-mono text-muted-foreground uppercase">Select Employee to Edit</label>
                    <select
                      value={selectedId}
                      onChange={e => setSelectedId(e.target.value)}
                      className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                    >
                      <option value="">-- Choose Employee to Load --</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.employeeId} - {u.employeeName}</option>)}
                    </select>
                  </div>
                )}

                {(activeAction === "create" || selectedId) && (
                  <>
                    {/* The Compact Grid Sheet */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-3 gap-y-2 text-left mt-3">
                      
                      {/* Row 1: Bio & Credentials */}
                      <div className="border-l-2 border-l-blue-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Employee ID</label>
                        <input
                          type="text"
                          placeholder="e.g. EMP-001 (Auto)"
                          value={userForm.employeeId}
                          onChange={e => setUserForm(prev => ({ ...prev, employeeId: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono font-semibold"
                        />
                      </div>

                      <div className="border-l-2 border-l-blue-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Employee Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="Full Name"
                          value={userForm.employeeName}
                          onChange={e => setUserForm(prev => ({ ...prev, employeeName: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                        />
                      </div>

                      <div className="border-l-2 border-l-blue-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Date of Birth</label>
                        <input
                          type="date"
                          value={userForm.dateOfBirth}
                          onChange={e => setUserForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                      </div>

                      <div className="border-l-2 border-l-blue-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Username</label>
                        <input
                          type="text"
                          placeholder="Username (Auto)"
                          value={userForm.username}
                          onChange={e => setUserForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, "") }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono font-semibold"
                        />
                      </div>

                      <div className="border-l-2 border-l-blue-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Password</label>
                        <input
                          type="password"
                          placeholder="Password (Default 123)"
                          value={userForm.password}
                          onChange={e => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono font-semibold"
                        />
                      </div>

                      <div className="border-l-2 border-l-blue-500 pl-2 space-y-0.5 relative">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Role Assignment</label>
                        <div className="flex gap-1">
                          <select
                            value={userForm.role}
                            onChange={e => {
                              if (e.target.value === "ADD_NEW") {
                                setIsAddingRole(true);
                              } else {
                                setUserForm(prev => ({ ...prev, role: e.target.value }));
                                setIsAddingRole(false);
                              }
                            }}
                            className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                          >
                            <option value="">-- Select Role --</option>
                            {availableRoles.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                            <option value="ADD_NEW" className="text-blue-500 font-bold">+ Create Custom Role...</option>
                          </select>
                        </div>
                        {isAddingRole && (
                          <div className="absolute left-2 top-[32px] right-2 bg-popover border border-border rounded p-1.5 shadow-lg z-50 space-y-1">
                            <div className="text-[8px] font-bold text-muted-foreground uppercase font-mono">Create New Role</div>
                            <input
                              type="text"
                              placeholder="e.g. Sales Executive"
                              value={newCustomRole}
                              onChange={e => setNewCustomRole(e.target.value)}
                              className="w-full px-1.5 py-0.5 border border-border rounded bg-input-background text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                            />
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const trimmed = newCustomRole.trim();
                                  if (trimmed && !availableRoles.includes(trimmed)) {
                                    setAvailableRoles(prev => [...prev, trimmed]);
                                    setUserForm(prev => ({ ...prev, role: trimmed }));
                                    setNewCustomRole("");
                                    setIsAddingRole(false);
                                  } else {
                                    alert("Invalid or duplicate role name.");
                                  }
                                }}
                                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold rounded"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingRole(false);
                                  setNewCustomRole("");
                                }}
                                className="px-1.5 py-0.5 bg-secondary hover:bg-secondary/80 text-foreground text-[9px] font-semibold rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Row 2: Timeline & Compensation */}
                      <div className="border-l-2 border-l-emerald-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Date of Join</label>
                        <input
                          type="date"
                          value={userForm.dateOfJoin}
                          onChange={e => setUserForm(prev => ({ ...prev, dateOfJoin: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                        />
                      </div>

                      <div className="border-l-2 border-l-emerald-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Date of Rejoin</label>
                        <input
                          type="date"
                          value={userForm.dateOfRejoin}
                          onChange={e => setUserForm(prev => ({ ...prev, dateOfRejoin: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                        />
                      </div>

                      <div className="border-l-2 border-l-emerald-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Basic Salary</label>
                        <input
                          type="number"
                          placeholder="Basic Pay"
                          value={userForm.basicSalary || ""}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setUserForm(prev => ({ ...prev, basicSalary: val, totalSalary: val + prev.allowances + prev.overtime }));
                          }}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-semibold"
                        />
                      </div>

                      <div className="border-l-2 border-l-emerald-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Allowances</label>
                        <input
                          type="number"
                          placeholder="Allowances"
                          value={userForm.allowances || ""}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setUserForm(prev => ({ ...prev, allowances: val, totalSalary: prev.basicSalary + val + prev.overtime }));
                          }}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-semibold"
                        />
                      </div>

                      <div className="border-l-2 border-l-emerald-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Overtime Pay</label>
                        <input
                          type="number"
                          placeholder="Overtime"
                          value={userForm.overtime || ""}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setUserForm(prev => ({ ...prev, overtime: val, totalSalary: prev.basicSalary + prev.allowances + val }));
                          }}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-semibold"
                        />
                      </div>

                      <div className="border-l-2 border-l-emerald-500 pl-2 space-y-0.5 bg-emerald-500/5 rounded px-1.5 py-0.5 border border-emerald-500/20">
                        <label className="block text-[7px] font-mono text-emerald-600 uppercase font-bold tracking-wider">Gross Calculated</label>
                        <div className="text-xs font-mono font-bold text-emerald-500 pt-0.5">
                          ₹{(userForm.basicSalary + userForm.allowances + userForm.overtime).toLocaleString("en-IN")}
                        </div>
                      </div>

                      {/* Row 3: Passport & Work Permit */}
                      <div className="border-l-2 border-l-indigo-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Passport Number</label>
                        <input
                          type="text"
                          placeholder="Passport No."
                          value={userForm.passportNumber}
                          onChange={e => setUserForm(prev => ({ ...prev, passportNumber: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono font-semibold"
                        />
                      </div>

                      <div className="border-l-2 border-l-indigo-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Passport Issue</label>
                        <input
                          type="date"
                          value={userForm.passportIssue}
                          onChange={e => setUserForm(prev => ({ ...prev, passportIssue: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                      </div>

                      <div className="border-l-2 border-l-indigo-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Passport Expiry</label>
                        <input
                          type="date"
                          value={userForm.passportExpiry}
                          onChange={e => setUserForm(prev => ({ ...prev, passportExpiry: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                        />
                      </div>

                      <div className="border-l-2 border-l-indigo-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Work Permit Number</label>
                        <input
                          type="text"
                          placeholder="WP-XXXXXXXX"
                          value={userForm.workPermitNumber}
                          onChange={e => setUserForm(prev => ({ ...prev, workPermitNumber: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono font-semibold"
                        />
                      </div>

                      <div className="border-l-2 border-l-indigo-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Work Permit Issue</label>
                        <input
                          type="date"
                          value={userForm.workPermitIssue}
                          onChange={e => setUserForm(prev => ({ ...prev, workPermitIssue: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                      </div>

                      <div className="border-l-2 border-l-indigo-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Work Permit Expiry</label>
                        <input
                          type="date"
                          value={userForm.workPermitExpiry}
                          onChange={e => setUserForm(prev => ({ ...prev, workPermitExpiry: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                        />
                      </div>

                      {/* Row 4: Visa & Insurance */}
                      <div className="border-l-2 border-l-amber-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Visa Number</label>
                        <input
                          type="text"
                          placeholder="Visa No."
                          value={userForm.visaNumber}
                          onChange={e => setUserForm(prev => ({ ...prev, visaNumber: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono font-semibold"
                        />
                      </div>

                      <div className="border-l-2 border-l-amber-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Visa Issue</label>
                        <input
                          type="date"
                          value={userForm.visaIssue}
                          onChange={e => setUserForm(prev => ({ ...prev, visaIssue: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                        />
                      </div>

                      <div className="border-l-2 border-l-amber-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Visa Expiry</label>
                        <input
                          type="date"
                          value={userForm.visaExpiry}
                          onChange={e => setUserForm(prev => ({ ...prev, visaExpiry: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-semibold"
                        />
                      </div>

                      <div className="border-l-2 border-l-amber-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Insurance Number</label>
                        <input
                          type="text"
                          placeholder="Policy No."
                          value={userForm.insuranceNumber}
                          onChange={e => setUserForm(prev => ({ ...prev, insuranceNumber: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono font-semibold"
                        />
                      </div>

                      <div className="border-l-2 border-l-amber-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Insurance Issue</label>
                        <input
                          type="date"
                          value={userForm.insuranceIssue}
                          onChange={e => setUserForm(prev => ({ ...prev, insuranceIssue: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                        />
                      </div>

                      <div className="border-l-2 border-l-amber-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Insurance Expiry</label>
                        <input
                          type="date"
                          value={userForm.insuranceExpiry}
                          onChange={e => setUserForm(prev => ({ ...prev, insuranceExpiry: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-semibold"
                        />
                      </div>

                      {/* Row 5: Health & Scope */}
                      <div className="border-l-2 border-l-rose-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Health Card Number</label>
                        <input
                          type="text"
                          placeholder="Medical ID No."
                          value={userForm.healthMedicalNumber}
                          onChange={e => setUserForm(prev => ({ ...prev, healthMedicalNumber: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all font-mono font-semibold"
                        />
                      </div>

                      <div className="border-l-2 border-l-rose-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Health Card Issue</label>
                        <input
                          type="date"
                          value={userForm.healthMedicalIssue}
                          onChange={e => setUserForm(prev => ({ ...prev, healthMedicalIssue: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all"
                        />
                      </div>

                      <div className="border-l-2 border-l-rose-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Health Card Expiry</label>
                        <input
                          type="date"
                          value={userForm.healthMedicalExpiry}
                          onChange={e => setUserForm(prev => ({ ...prev, healthMedicalExpiry: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all font-semibold"
                        />
                      </div>

                      <div className="lg:col-span-3 border-l-2 border-l-rose-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Job Responsibilities Title / Summary</label>
                        <input
                          type="text"
                          placeholder="e.g. Sales Invoicing & Cashier Responsibilities"
                          value={userForm.responsibility}
                          onChange={e => setUserForm(prev => ({ ...prev, responsibility: e.target.value }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all font-semibold"
                        />
                      </div>

                      {/* FEATURE RESPONSIBILITIES CHECKBOX PERMISSIONS MATRIX */}
                      <div className="lg:col-span-3 space-y-2 border-t border-border/40 pt-3 mt-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <label className="block text-[11px] font-mono font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <ShieldCheck className="text-primary" size={16} />
                              System Responsibilities & Enabled Website Features *
                            </label>
                            <p className="text-[10px] text-muted-foreground">
                              Check the website features to enable for this employee. Unchecked features will be disabled/hidden for their profile.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setUserForm(prev => ({
                                ...prev,
                                allowedFeatures: ALL_WEBSITE_FEATURES.map(f => f.id)
                              }))}
                              className="px-2 py-1 text-[10px] font-mono font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded border border-primary/30 transition-all"
                            >
                              Select All ({ALL_WEBSITE_FEATURES.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setUserForm(prev => ({ ...prev, allowedFeatures: [] }))}
                              className="px-2 py-1 text-[10px] font-mono font-bold bg-secondary hover:bg-secondary/80 text-muted-foreground rounded border border-border transition-all"
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>

                        {/* Categorized Checkboxes Matrix */}
                        <div className="space-y-3 bg-card p-3 rounded-xl border border-border/80 shadow-inner max-h-[420px] overflow-y-auto">
                          {Array.from(new Set(ALL_WEBSITE_FEATURES.map(f => f.category))).map(cat => {
                            const catFeatures = ALL_WEBSITE_FEATURES.filter(f => f.category === cat);
                            const allCatChecked = catFeatures.every(f => (userForm.allowedFeatures || []).includes(f.id));
                            return (
                              <div key={cat} className="space-y-1.5 border-b border-border/40 pb-2.5 last:border-b-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                                    <span>📁</span> {cat} ({catFeatures.filter(f => (userForm.allowedFeatures || []).includes(f.id)).length}/{catFeatures.length})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = userForm.allowedFeatures || [];
                                      const catIds = catFeatures.map(f => f.id);
                                      if (allCatChecked) {
                                        setUserForm(prev => ({
                                          ...prev,
                                          allowedFeatures: current.filter(id => !catIds.includes(id))
                                        }));
                                      } else {
                                        const merged = Array.from(new Set([...current, ...catIds]));
                                        setUserForm(prev => ({ ...prev, allowedFeatures: merged }));
                                      }
                                    }}
                                    className="text-[9px] font-mono text-muted-foreground hover:text-foreground font-semibold underline"
                                  >
                                    {allCatChecked ? "Deselect Section" : "Select Section"}
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {catFeatures.map(feat => {
                                    const isChecked = (userForm.allowedFeatures || []).includes(feat.id);
                                    return (
                                      <label
                                        key={feat.id}
                                        className={`flex items-start gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                                          isChecked
                                            ? "bg-primary/10 border-primary/50 text-foreground shadow-sm"
                                            : "bg-secondary/20 border-border/50 text-muted-foreground opacity-60 hover:opacity-100"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={e => {
                                            const current = userForm.allowedFeatures || [];
                                            if (e.target.checked) {
                                              setUserForm(prev => ({
                                                ...prev,
                                                allowedFeatures: [...current, feat.id]
                                              }));
                                            } else {
                                              setUserForm(prev => ({
                                                ...prev,
                                                allowedFeatures: current.filter(id => id !== feat.id)
                                              }));
                                            }
                                          }}
                                          className="mt-0.5 rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                                        />
                                        <div className="space-y-0.5 select-none">
                                          <div className="flex items-center gap-1 text-[11px] font-mono font-bold">
                                            <span>{feat.icon}</span>
                                            <span className={isChecked ? "text-primary font-bold" : ""}>{feat.name}</span>
                                          </div>
                                          <p className="text-[9px] text-muted-foreground leading-tight">{feat.description}</p>
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-border/30 mt-3">
                      <button
                        type="submit"
                        className={`px-6 py-1.5 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-sm ${
                          activeAction === "edit" ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {activeAction === "edit" ? "Save Employee Changes" : "Create & Register Employee"}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {effectiveSubPage !== "master-users-status" && effectiveSubPage !== "master-users-creation" && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold border-b border-border pb-1.5">
            Master Data Interactive Controls
          </div>
          
          {/* CREATE-EDIT-DELETE-DISPLAY Options selectors */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "create", label: "CREATE", color: "text-blue-500 bg-blue-500/5 hover:bg-blue-500/10" },
              { id: "edit", label: "EDIT", color: "text-amber-500 bg-amber-500/5 hover:bg-amber-500/10" },
              { id: "delete", label: "DELETE", color: "text-red-500 bg-red-500/5 hover:bg-red-500/10" },
              { id: "display", label: "DISPLAY", color: "text-green-500 bg-green-500/5 hover:bg-green-500/10" }
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setActiveAction(opt.id as any)}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all border border-border/60 ${opt.color} ${activeAction === opt.id ? "ring-2 ring-primary border-primary" : ""}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Dynamic Action Forms Panel */}
          <div className="bg-secondary/10 border border-border/40 p-4 rounded-xl space-y-4">
            
            {/* Action Header Banner */}
            <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Active Option: {activeAction.toUpperCase()}
            </div>

            {/* DISPLAY MODE PANEL */}
            {activeAction === "display" && (
              <div className="space-y-3 text-left">
                <label className="block text-[10px] font-mono text-muted-foreground uppercase">Select Record to View</label>
                <select
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                >
                  <option value="">-- Choose Item to Inspect --</option>
                  {effectiveSubPage === "master-accounts-groups" && groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  {effectiveSubPage === "master-accounts-ledger" && ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  {effectiveSubPage === "master-accounts-customer" && customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  {effectiveSubPage === "master-accounts-supplier" && suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  {effectiveSubPage === "master-inventory-items" && products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
                  {effectiveSubPage === "master-inventory-categories" && categories.map(c => <option key={c.id} value={c.id}>{c.name} (HSN {c.hsnCode})</option>)}
                  {effectiveSubPage === "master-inventory-unit" && units.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.shortName})</option>)}
                  {effectiveSubPage === "master-inventory-packing" && packings.map(pk => <option key={pk.id} value={pk.id}>{pk.name}</option>)}
                  {(effectiveSubPage === "master-inventory-godowns" || effectiveSubPage === "master-godowns") && godowns.map(g => <option key={g.id} value={g.id}>Godown {g.code}: {g.name}</option>)}
                </select>

                {selectedId ? (
                  <div className="bg-card border border-border/80 p-4 rounded-lg space-y-3 font-mono text-xs shadow-inner">
                    {effectiveSubPage === "master-accounts-groups" && (() => {
                      const item = groups.find(x => x.id === selectedId);
                      return item ? (
                        <>
                          <div><span className="text-muted-foreground">GROUP ID:</span> <span className="font-bold">{item.id}</span></div>
                          <div><span className="text-muted-foreground">GROUP NAME:</span> <span className="text-foreground font-bold">{item.name}</span></div>
                          <div><span className="text-muted-foreground">FINANCIAL TYPE:</span> <span className="text-green-500 font-bold">{item.type}</span></div>
                          <div><span className="text-muted-foreground">DESCRIPTION:</span> <span className="text-foreground">{item.description}</span></div>
                        </>
                      ) : null;
                    })()}

                    {effectiveSubPage === "master-accounts-ledger" && (() => {
                      const item = ledgers.find(x => x.id === selectedId);
                      return item ? (
                        <>
                          <div><span className="text-muted-foreground">LEDGER ID:</span> <span className="font-bold">{item.id}</span></div>
                          <div><span className="text-muted-foreground">LEDGER NAME:</span> <span className="text-foreground font-bold">{item.name}</span></div>
                          <div><span className="text-muted-foreground">PARENT GROUP:</span> <span className="text-foreground font-bold">{item.group}</span></div>
                          <div><span className="text-muted-foreground">OPENING BALANCE:</span> <span className="text-green-500 font-bold">₹{item.openingBalance}</span></div>
                          <div><span className="text-muted-foreground">DESCRIPTION:</span> <span className="text-foreground">{item.description}</span></div>
                        </>
                      ) : null;
                    })()}

                    {effectiveSubPage === "master-accounts-customer" && (() => {
                      const item = customers.find(x => x.id === selectedId);
                      return item ? (
                        <>
                          <div><span className="text-muted-foreground">CUSTOMER ID:</span> <span className="font-bold">{item.id}</span></div>
                          <div><span className="text-muted-foreground">FULL NAME:</span> <span className="text-foreground font-bold">{item.name}</span></div>
                          <div><span className="text-muted-foreground">EMAIL ADDRESS:</span> <span className="text-foreground">{item.email || "N/A"}</span></div>
                          <div><span className="text-muted-foreground">MOBILE PHONE:</span> <span className="text-foreground">{item.phone || "N/A"}</span></div>
                          <div><span className="text-muted-foreground">GST NO:</span> <span className="text-primary font-bold">{item.gstNo || "N/A"}</span></div>
                          <div><span className="text-muted-foreground">CREDIT LIMIT (DAYS):</span> <span className="text-amber-500 font-bold">{item.creditLimitDays ? `${item.creditLimitDays} Days` : "No limit"}</span></div>
                          <div><span className="text-muted-foreground">CREDIT LIMIT (AMOUNT):</span> <span className="text-emerald-500 font-bold">{item.creditLimitAmount ? `₹${new Intl.NumberFormat("en-IN").format(item.creditLimitAmount)}` : "No limit"}</span></div>
                          <div><span className="text-muted-foreground">BILLING ADDRESS:</span> <span className="text-foreground">{item.address || "N/A"}</span></div>
                        </>
                      ) : null;
                    })()}

                    {effectiveSubPage === "master-accounts-supplier" && (() => {
                      const item = suppliers.find(x => x.id === selectedId);
                      return item ? (
                        <>
                          <div><span className="text-muted-foreground">SUPPLIER ID:</span> <span className="font-bold">{item.id}</span></div>
                          <div><span className="text-muted-foreground">SUPPLIER NAME:</span> <span className="text-foreground font-bold">{item.name}</span></div>
                          <div><span className="text-muted-foreground">EMAIL ADDRESS:</span> <span className="text-foreground">{(item as any).email || "N/A"}</span></div>
                          <div><span className="text-muted-foreground">MOBILE PHONE:</span> <span className="text-foreground">{item.phone || "N/A"}</span></div>
                          <div><span className="text-muted-foreground">GST NO:</span> <span className="text-primary font-bold">{item.gstNo || "N/A"}</span></div>
                          <div><span className="text-muted-foreground">PHYSICAL ADDRESS:</span> <span className="text-foreground">{item.address || "N/A"}</span></div>
                        </>
                      ) : null;
                    })()}

                    {effectiveSubPage === "master-inventory-items" && (() => {
                      const item = products.find(x => x.id === selectedId);
                      return item ? (
                        <>
                          <div><span className="text-muted-foreground">PRODUCT ID:</span> <span className="font-bold">{item.id}</span></div>
                          <div><span className="text-muted-foreground">PRODUCT NAME:</span> <span className="text-foreground font-bold">{item.name}</span></div>
                          <div><span className="text-primary font-bold">{item.category}</span></div>
                          <div><span className="text-muted-foreground">UNIT MEASURE:</span> <span className="text-foreground">{item.unit}</span></div>
                          <div><span className="text-muted-foreground">STANDARD BUY RATE:</span> <span className="text-foreground">₹{item.buyPrice}</span></div>
                          <div><span className="text-muted-foreground">STANDARD SELL RATE:</span> <span className="text-foreground">₹{item.sellPrice}</span></div>
                        </>
                      ) : null;
                    })()}

                    {effectiveSubPage === "master-inventory-categories" && (() => {
                      const item = categories.find(x => x.id === selectedId);
                      return item ? (
                        <>
                          <div><span className="text-muted-foreground">CATEGORY ID:</span> <span className="font-bold">{item.id}</span></div>
                          <div><span className="text-muted-foreground">CATEGORY NAME:</span> <span className="text-foreground font-bold">{item.name}</span></div>
                          <div><span className="text-muted-foreground">TAX HSN PREFIX:</span> <span className="text-primary font-bold">{item.hsnCode}</span></div>
                          <div><span className="text-muted-foreground">GST PERCENTAGE:</span> <span className="text-foreground">{item.gstRate}% standard GST</span></div>
                          <div><span className="text-muted-foreground">SCOPE OF CATEGORY:</span> <span className="text-foreground">{item.description}</span></div>
                        </>
                      ) : null;
                    })()}

                    {effectiveSubPage === "master-inventory-unit" && (() => {
                      const item = units.find(x => x.id === selectedId);
                      return item ? (
                        <>
                          <div><span className="text-muted-foreground">UNIT ID:</span> <span className="font-bold">{item.id}</span></div>
                          <div><span className="text-muted-foreground">SHORT LABEL:</span> <span className="text-primary font-bold">{item.shortName}</span></div>
                          <div><span className="text-muted-foreground">FULL LABEL NAME:</span> <span className="text-foreground font-bold">{item.fullName}</span></div>
                          <div><span className="text-muted-foreground">DECIMAL PLACES:</span> <span className="text-foreground font-bold">{item.decimalPlaces} places</span></div>
                        </>
                      ) : null;
                    })()}

                    {effectiveSubPage === "master-inventory-packing" && (() => {
                      const item = packings.find(x => x.id === selectedId);
                      return item ? (
                        <>
                          <div><span className="text-muted-foreground">PACKING ID:</span> <span className="font-bold">{item.id}</span></div>
                          <div><span className="text-muted-foreground">CONFIG NAME:</span> <span className="text-foreground font-bold">{item.name}</span></div>
                          <div><span className="text-muted-foreground">CAPACITY LIMIT:</span> <span className="text-primary font-bold">{item.capacityKg} {item.capacityUnit || "kg"}</span></div>
                          <div><span className="text-muted-foreground">MATERIAL CLASS:</span> <span className="text-foreground">{item.material}</span></div>
                          <div><span className="text-muted-foreground">USAGE NOTES:</span> <span className="text-foreground">{item.notes}</span></div>
                        </>
                      ) : null;
                    })()}

                    {(effectiveSubPage === "master-inventory-godowns" || effectiveSubPage === "master-godowns") && (() => {
                      const item = godowns.find(x => x.id === selectedId);
                      return item ? (
                        <>
                          <div><span className="text-muted-foreground">GODOWN ID:</span> <span className="font-bold">{item.id}</span></div>
                          <div><span className="text-muted-foreground">CODE:</span> <span className="text-primary font-bold">{item.code}</span></div>
                          <div><span className="text-muted-foreground">GODOWN NAME:</span> <span className="text-foreground font-bold">{item.name}</span></div>
                          <div><span className="text-muted-foreground">LOCATION ADDRESS:</span> <span className="text-foreground">{item.location}</span></div>
                          <div><span className="text-muted-foreground">CLIMATE ZONE:</span> <span className="text-emerald-500 font-bold">{item.temperature}</span></div>
                          <div><span className="text-muted-foreground">MAX CAPACITY:</span> <span className="text-blue-500 font-bold">{item.capacityKg.toLocaleString()} kg</span></div>
                          <div><span className="text-muted-foreground">SUPERVISOR:</span> <span className="text-foreground font-semibold">{item.managerName}</span></div>
                          <div><span className="text-muted-foreground">STATUS:</span> <span className="text-foreground font-bold uppercase">{item.status}</span></div>
                          <div><span className="text-muted-foreground">REMARKS:</span> <span className="text-foreground">{item.notes || "N/A"}</span></div>
                        </>
                      ) : null;
                    })()}

                    {(effectiveSubPage.startsWith("master-users")) && (() => {
                      const item = users.find(x => x.id === selectedId);
                      return item ? (
                        <>
                          <div><span className="text-muted-foreground">EMPLOYEE ID:</span> <span className="font-bold text-primary">{item.employeeId}</span></div>
                          <div><span className="text-muted-foreground">FULL NAME:</span> <span className="text-foreground font-bold">{item.employeeName}</span></div>
                          <div><span className="text-muted-foreground">SYSTEM ROLE:</span> <span className="text-emerald-500 font-bold">{item.role}</span></div>
                          <div><span className="text-muted-foreground">RESPONSIBILITIES SCOPE:</span> <span className="text-foreground font-semibold">{item.responsibility || "General Responsibilities"}</span></div>
                          <div><span className="text-muted-foreground">BASIC SALARY:</span> <span className="text-foreground font-mono">₹{(item.basicSalary || 0).toLocaleString("en-IN")}</span></div>
                          <div><span className="text-muted-foreground">GROSS SALARY:</span> <span className="text-emerald-500 font-bold font-mono">₹{(item.totalSalary || 0).toLocaleString("en-IN")}</span></div>
                          <div><span className="text-muted-foreground">VISA EXPIRY:</span> <span className="text-foreground font-mono">{item.visaExpiry || "N/A"}</span></div>
                          <div><span className="text-muted-foreground">PASSPORT EXPIRY:</span> <span className="text-foreground font-mono">{item.passportExpiry || "N/A"}</span></div>
                          <div className="pt-2 border-t border-border">
                            <span className="text-muted-foreground block mb-1">ENABLED FEATURE PERMISSIONS ({item.allowedFeatures ? item.allowedFeatures.length : ALL_WEBSITE_FEATURES.length} / {ALL_WEBSITE_FEATURES.length}):</span>
                            <div className="flex flex-wrap gap-1">
                              {ALL_WEBSITE_FEATURES.filter(f => (item.allowedFeatures || ALL_WEBSITE_FEATURES.map(x => x.id)).includes(f.id)).map(f => (
                                <span key={f.id} className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold">
                                  {f.icon} {f.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : null;
                    })()}

                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground italic font-mono text-xs bg-card border border-border rounded-lg">
                    Select a record above to display its specifications.
                  </div>
                )}
              </div>
            )}

            {/* DELETE MODE PANEL */}
            {activeAction === "delete" && (
              <div className="space-y-3 text-left">
                <label className="block text-[10px] font-mono text-muted-foreground uppercase">Select Record to Delete</label>
                <select
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                >
                  <option value="">-- Choose Item to Destroy --</option>
                  {effectiveSubPage === "master-accounts-groups" && groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  {effectiveSubPage === "master-accounts-ledger" && ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  {effectiveSubPage === "master-accounts-customer" && customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  {effectiveSubPage === "master-accounts-supplier" && suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  {effectiveSubPage === "master-inventory-items" && products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
                  {effectiveSubPage === "master-inventory-categories" && categories.map(c => <option key={c.id} value={c.id}>{c.name} (HSN {c.hsnCode})</option>)}
                  {effectiveSubPage === "master-inventory-unit" && units.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.shortName})</option>)}
                  {effectiveSubPage === "master-inventory-packing" && packings.map(pk => <option key={pk.id} value={pk.id}>{pk.name}</option>)}
                  {(effectiveSubPage === "master-inventory-godowns" || effectiveSubPage === "master-godowns") && godowns.map(g => <option key={g.id} value={g.id}>Godown {g.code}: {g.name}</option>)}
                </select>

                {selectedId ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg space-y-3 text-xs text-center font-mono">
                    <AlertTriangle className="text-red-500 mx-auto" size={32} />
                    <p className="font-bold text-red-600">WARNING: THIS IS AN IRREVERSIBLE OPERATION!</p>
                    <p className="text-muted-foreground">Deleting this master record will affect accounting ledger hierarchies and transactional references.</p>
                    <button
                      type="button"
                      onClick={handleDeleteRecord}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-all"
                    >
                      Confirm Permanent Deletion
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground italic font-mono text-xs bg-card border border-border rounded-lg">
                    Select a record above to prepare for deletion.
                  </div>
                )}
              </div>
            )}

            {/* CREATE & EDIT FORM MODES */}
            {(activeAction === "create" || activeAction === "edit") && (
              <form onSubmit={handleActionSubmit} className="space-y-4 text-left">
                
                {activeAction === "edit" && (
                  <div className="space-y-1 mb-3">
                    <label className="block text-[10px] font-mono text-muted-foreground uppercase">Select Record to Edit</label>
                    <select
                      value={selectedId}
                      onChange={e => setSelectedId(e.target.value)}
                      className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                    >
                      <option value="">-- Choose Item to Load --</option>
                      {effectiveSubPage === "master-accounts-groups" && groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      {effectiveSubPage === "master-accounts-ledger" && ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      {effectiveSubPage === "master-accounts-customer" && customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      {effectiveSubPage === "master-accounts-supplier" && suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      {effectiveSubPage === "master-inventory-items" && products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
                      {effectiveSubPage === "master-inventory-categories" && categories.map(c => <option key={c.id} value={c.id}>{c.name} (HSN {c.hsnCode})</option>)}
                      {effectiveSubPage === "master-inventory-unit" && units.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.shortName})</option>)}
                      {effectiveSubPage === "master-inventory-packing" && packings.map(pk => <option key={pk.id} value={pk.id}>{pk.name}</option>)}
                      {(effectiveSubPage === "master-inventory-godowns" || effectiveSubPage === "master-godowns") && godowns.map(g => <option key={g.id} value={g.id}>Godown {g.code}: {g.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Form Input fields dynamically loaded by page */}
                {effectiveSubPage === "master-accounts-groups" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Group Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Fixed Assets"
                        value={groupForm.name}
                        onChange={e => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Financial Classification</label>
                      <select
                        value={groupForm.type}
                        onChange={e => setGroupForm(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      >
                        <option value="Asset">Asset</option>
                        <option value="Liability">Liability</option>
                        <option value="Income">Income</option>
                        <option value="Expense">Expense</option>
                        <option value="Equity">Equity</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Group Description</label>
                      <input
                        type="text"
                        placeholder="Description details..."
                        value={groupForm.description}
                        onChange={e => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      />
                    </div>
                  </div>
                )}

                {effectiveSubPage === "master-accounts-ledger" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Ledger Account Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Office Equipment"
                        value={ledgerForm.name}
                        onChange={e => setLedgerForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Parent Accounting Group</label>
                      <select
                        value={ledgerForm.group}
                        onChange={e => setLedgerForm(prev => ({ ...prev, group: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      >
                        {groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Opening Balance (INR)</label>
                      <input
                        type="number"
                        required
                        value={ledgerForm.openingBalance ?? ""}
                        onChange={e => setLedgerForm(prev => ({ ...prev, openingBalance: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">General Description</label>
                      <input
                        type="text"
                        placeholder="Enter ledger description..."
                        value={ledgerForm.description}
                        onChange={e => setLedgerForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      />
                    </div>
                  </div>
                )}

                {effectiveSubPage === "master-accounts-customer" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Customer Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Name..."
                        value={customerForm.name}
                        onChange={e => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Customer Email</label>
                      <input
                        type="email"
                        placeholder="email@address.com"
                        value={customerForm.email}
                        onChange={e => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Customer Contact Phone</label>
                      <input
                        type="text"
                        placeholder="+91-XXXXX-XXXXX"
                        value={customerForm.phone}
                        onChange={e => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Tax GST Identification (GSTIN)</label>
                      <input
                        type="text"
                        placeholder="15-digit GSTIN"
                        value={customerForm.gstNo}
                        onChange={e => setCustomerForm(prev => ({ ...prev, gstNo: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Credit Limit (Days)</label>
                      <input
                        type="number"
                        placeholder="e.g. 30"
                        value={customerForm.creditLimitDays ?? ""}
                        onChange={e => setCustomerForm(prev => ({ ...prev, creditLimitDays: e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0 }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Credit Limit (Amount)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 100000"
                        value={customerForm.creditLimitAmount ?? ""}
                        onChange={e => setCustomerForm(prev => ({ ...prev, creditLimitAmount: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-semibold text-emerald-600"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2 border border-border/70 bg-secondary/10 p-3 rounded-xl">
                      <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
                          <Sparkles size={12} className="text-primary" />
                          Billing Physical Address (4 Input Lines)
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground">4 Distinct Address Line Inputs</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[9px] font-mono text-muted-foreground uppercase mb-0.5 font-bold">Address Line 1 (Street / Building / House No.)</label>
                          <input
                            type="text"
                            placeholder="e.g. Rising Sun, Ground Floor"
                            value={addressLine1}
                            onChange={e => {
                              const val = e.target.value;
                              setAddressLine1(val);
                              const combined = [val, addressLine2, addressLine3, addressLine4].filter(Boolean).join(", ");
                              setCustomerForm(prev => ({ ...prev, address: combined }));
                            }}
                            className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-muted-foreground uppercase mb-0.5 font-bold">Address Line 2 (Area / Locality / Road Name)</label>
                          <input
                            type="text"
                            placeholder="e.g. Finifenmaa Goalhi"
                            value={addressLine2}
                            onChange={e => {
                              const val = e.target.value;
                              setAddressLine2(val);
                              const combined = [addressLine1, val, addressLine3, addressLine4].filter(Boolean).join(", ");
                              setCustomerForm(prev => ({ ...prev, address: combined }));
                            }}
                            className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-muted-foreground uppercase mb-0.5 font-bold">Address Line 3 (City / District / Region)</label>
                          <input
                            type="text"
                            placeholder="e.g. Malé"
                            value={addressLine3}
                            onChange={e => {
                              const val = e.target.value;
                              setAddressLine3(val);
                              const combined = [addressLine1, addressLine2, val, addressLine4].filter(Boolean).join(", ");
                              setCustomerForm(prev => ({ ...prev, address: combined }));
                            }}
                            className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-muted-foreground uppercase mb-0.5 font-bold">Address Line 4 (State / Postal Code / Country)</label>
                          <input
                            type="text"
                            placeholder="e.g. Maldives 20014"
                            value={addressLine4}
                            onChange={e => {
                              const val = e.target.value;
                              setAddressLine4(val);
                              const combined = [addressLine1, addressLine2, addressLine3, val].filter(Boolean).join(", ");
                              setCustomerForm(prev => ({ ...prev, address: combined }));
                            }}
                            className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {effectiveSubPage === "master-accounts-supplier" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Supplier Company Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Supplier name..."
                        value={supplierForm.name}
                        onChange={e => setSupplierForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Supplier Email</label>
                      <input
                        type="email"
                        placeholder="supplier@company.com"
                        value={supplierForm.email}
                        onChange={e => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Supplier Contact Phone</label>
                      <input
                        type="text"
                        placeholder="+91-XXXXX-XXXXX"
                        value={supplierForm.phone}
                        onChange={e => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">GST / Tax Registration (GSTIN)</label>
                      <input
                        type="text"
                        placeholder="15-digit GSTIN"
                        value={supplierForm.gstNo}
                        onChange={e => setSupplierForm(prev => ({ ...prev, gstNo: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-semibold"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2 border border-border/70 bg-secondary/10 p-3 rounded-xl">
                      <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
                          <Sparkles size={12} className="text-primary" />
                          Supplier Physical Address (4 Input Lines)
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground">4 Distinct Address Line Inputs</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[9px] font-mono text-muted-foreground uppercase mb-0.5 font-bold">Address Line 1 (Building / Warehouse No.)</label>
                          <input
                            type="text"
                            placeholder="e.g. Warehouse 14, Industrial Area"
                            value={supAddressLine1}
                            onChange={e => {
                              const val = e.target.value;
                              setSupAddressLine1(val);
                              const combined = [val, supAddressLine2, supAddressLine3, supAddressLine4].filter(Boolean).join(", ");
                              setSupplierForm(prev => ({ ...prev, address: combined }));
                            }}
                            className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-muted-foreground uppercase mb-0.5 font-bold">Address Line 2 (Street / Locality / Road)</label>
                          <input
                            type="text"
                            placeholder="e.g. Spice Market Road"
                            value={supAddressLine2}
                            onChange={e => {
                              const val = e.target.value;
                              setSupAddressLine2(val);
                              const combined = [supAddressLine1, val, supAddressLine3, supAddressLine4].filter(Boolean).join(", ");
                              setSupplierForm(prev => ({ ...prev, address: combined }));
                            }}
                            className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-muted-foreground uppercase mb-0.5 font-bold">Address Line 3 (City / District / Region)</label>
                          <input
                            type="text"
                            placeholder="e.g. Kochi"
                            value={supAddressLine3}
                            onChange={e => {
                              const val = e.target.value;
                              setSupAddressLine3(val);
                              const combined = [supAddressLine1, supAddressLine2, val, supAddressLine4].filter(Boolean).join(", ");
                              setSupplierForm(prev => ({ ...prev, address: combined }));
                            }}
                            className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-muted-foreground uppercase mb-0.5 font-bold">Address Line 4 (State / Postal Code / Country)</label>
                          <input
                            type="text"
                            placeholder="e.g. Kerala 682001, India"
                            value={supAddressLine4}
                            onChange={e => {
                              const val = e.target.value;
                              setSupAddressLine4(val);
                              const combined = [supAddressLine1, supAddressLine2, supAddressLine3, val].filter(Boolean).join(", ");
                              setSupplierForm(prev => ({ ...prev, address: combined }));
                            }}
                            className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {effectiveSubPage === "master-inventory-items" && (
                  <div className="space-y-4 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Product Catalog Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Cardamom Bold"
                          value={itemForm.name}
                          onChange={e => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Product Category Group</label>
                        <select
                          value={itemForm.category}
                          onChange={e => setItemForm(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                        >
                          {availableCategoryNames.map(catName => (
                            <option key={catName} value={catName}>{catName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Standard Billing Unit</label>
                        <select
                          value={itemForm.unit}
                          onChange={e => setItemForm(prev => ({ ...prev, unit: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                        >
                          {units.map(u => (
                            <option key={u.id} value={u.shortName}>{u.shortName} ({u.fullName})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Standard Purchase Cost (INR)</label>
                        <input
                          type="number"
                          required
                          value={itemForm.buyPrice || ""}
                          onChange={e => setItemForm(prev => ({ ...prev, buyPrice: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-semibold"
                        />
                      </div>
                    </div>

                    {/* 3 Packing Type Input Boxes & 3 Selling Price Input Boxes */}
                    <div className="border border-border bg-card/60 p-3.5 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                          <Sparkles size={14} className="text-primary animate-pulse" />
                          3 Packing Types & 3 Individual Selling Prices
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          3 Packing Types • 3 Selling Prices
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Packing 1 & Selling Price 1 */}
                        <div className="bg-secondary/20 border border-border p-3 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-primary uppercase">Packing Option 1</span>
                            <span className="text-[9px] font-mono text-muted-foreground font-bold">Pack 1</span>
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-muted-foreground uppercase font-bold mb-1">Packing Type 1</label>
                            <input
                              type="text"
                              placeholder="e.g. 50kg Sack"
                              value={itemForm.packing1 || ""}
                              onChange={e => setItemForm(prev => ({ ...prev, packing1: e.target.value }))}
                              className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-muted-foreground uppercase font-bold mb-1">Selling Price 1 (INR)</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Selling price for Pack 1"
                              value={itemForm.price1 || ""}
                              onChange={e => setItemForm(prev => ({ ...prev, price1: e.target.value }))}
                              className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs font-mono font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        </div>

                        {/* Packing 2 & Selling Price 2 */}
                        <div className="bg-secondary/20 border border-border p-3 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-indigo-500 uppercase">Packing Option 2</span>
                            <span className="text-[9px] font-mono text-muted-foreground font-bold">Pack 2</span>
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-muted-foreground uppercase font-bold mb-1">Packing Type 2</label>
                            <input
                              type="text"
                              placeholder="e.g. 25kg Bag"
                              value={itemForm.packing2 || ""}
                              onChange={e => setItemForm(prev => ({ ...prev, packing2: e.target.value }))}
                              className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-muted-foreground uppercase font-bold mb-1">Selling Price 2 (INR)</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Selling price for Pack 2"
                              value={itemForm.price2 || ""}
                              onChange={e => setItemForm(prev => ({ ...prev, price2: e.target.value }))}
                              className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs font-mono font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        </div>

                        {/* Packing 3 & Selling Price 3 */}
                        <div className="bg-secondary/20 border border-border p-3 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-purple-500 uppercase">Packing Option 3</span>
                            <span className="text-[9px] font-mono text-muted-foreground font-bold">Pack 3</span>
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-muted-foreground uppercase font-bold mb-1">Packing Type 3</label>
                            <input
                              type="text"
                              placeholder="e.g. 10kg Carton"
                              value={itemForm.packing3 || ""}
                              onChange={e => setItemForm(prev => ({ ...prev, packing3: e.target.value }))}
                              className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-muted-foreground uppercase font-bold mb-1">Selling Price 3 (INR)</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Selling price for Pack 3"
                              value={itemForm.price3 || ""}
                              onChange={e => setItemForm(prev => ({ ...prev, price3: e.target.value }))}
                              className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs font-mono font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {effectiveSubPage === "master-inventory-categories" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Category Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Fresh Produce"
                        value={categoryForm.name}
                        onChange={e => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">HSN Code Prefix</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 0904"
                        value={categoryForm.hsnCode}
                        onChange={e => setCategoryForm(prev => ({ ...prev, hsnCode: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">GST Tax Rate %</label>
                      <input
                        type="number"
                        required
                        value={categoryForm.gstRate ?? ""}
                        onChange={e => setCategoryForm(prev => ({ ...prev, gstRate: e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0 }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Category Description</label>
                      <input
                        type="text"
                        placeholder="Scope details..."
                        value={categoryForm.description}
                        onChange={e => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      />
                    </div>
                  </div>
                )}

                {effectiveSubPage === "master-inventory-unit" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Short Name Label</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. kg, box"
                        value={unitForm.shortName}
                        onChange={e => setUnitForm(prev => ({ ...prev, shortName: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Full Name Label</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kilograms"
                        value={unitForm.fullName}
                        onChange={e => setUnitForm(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Fraction Decimal Places</label>
                      <input
                        type="number"
                        required
                        value={unitForm.decimalPlaces || ""}
                        onChange={e => setUnitForm(prev => ({ ...prev, decimalPlaces: parseInt(e.target.value, 10) || 0 }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-semibold"
                      />
                    </div>
                  </div>
                )}

                {effectiveSubPage === "master-inventory-packing" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Config Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vacuum Pack 2kg"
                        value={packingForm.name}
                        onChange={e => setPackingForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Capacity Limit Multiplier</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          required
                          value={packingForm.capacityKg || ""}
                          onChange={e => setPackingForm(prev => ({ ...prev, capacityKg: parseFloat(e.target.value) || 0 }))}
                          className="w-2/3 px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-semibold"
                        />
                        <select
                          value={packingForm.capacityUnit || "kg"}
                          onChange={e => setPackingForm(prev => ({ ...prev, capacityUnit: e.target.value }))}
                          className="w-1/3 px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                        >
                          {units.map(u => (
                            <option key={u.id} value={u.shortName}>{u.shortName} ({u.fullName})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Wrapping Material</label>
                      <input
                        type="text"
                        placeholder="e.g. Polyethylene foil"
                        value={packingForm.material}
                        onChange={e => setPackingForm(prev => ({ ...prev, material: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Usage Notes</label>
                      <input
                        type="text"
                        placeholder="Notes..."
                        value={packingForm.notes}
                        onChange={e => setPackingForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      />
                    </div>

                    {/* Live Multiplier Preview Box for Packing Type Creation */}
                    <div className="md:col-span-2 p-3 bg-secondary/30 rounded-xl border border-border space-y-1.5 font-mono text-xs">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                        <span>💡 Live Capacity Multiplier & Cost Difference Preview</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{packingForm.capacityKg || 0} {packingForm.capacityUnit || "kg"} Capacity</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
                        <div className="bg-card p-2 rounded-lg border border-border">
                          <span className="text-[9px] text-muted-foreground uppercase block font-bold">Standard Purchase Cost</span>
                          <span className="text-xs font-bold text-foreground">₹{((packingForm.capacityKg || 1) * 100).toLocaleString("en-IN")}</span>
                          <span className="text-[9px] text-muted-foreground block">(At ₹100 base buy)</span>
                        </div>
                        <div className="bg-card p-2 rounded-lg border border-border">
                          <span className="text-[9px] text-emerald-600 uppercase block font-bold">Standard Sales Price</span>
                          <span className="text-xs font-bold text-emerald-600">₹{((packingForm.capacityKg || 1) * 150).toLocaleString("en-IN")}</span>
                          <span className="text-[9px] text-emerald-600 block">(At ₹150 base sell)</span>
                        </div>
                        <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/30">
                          <span className="text-[9px] text-emerald-700 dark:text-emerald-300 uppercase block font-bold">Sales Cost Difference</span>
                          <span className="text-xs font-extrabold text-emerald-600">+₹{((packingForm.capacityKg || 1) * 50).toLocaleString("en-IN")}</span>
                          <span className="text-[9px] text-emerald-600 block">(Higher Sales Price)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(effectiveSubPage === "master-inventory-godowns" || effectiveSubPage === "master-godowns") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Godown Code / Short ID *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. S, T, G1, GDN-19"
                        value={godownForm.code}
                        onChange={e => setGodownForm(prev => ({ ...prev, code: e.target.value.toUpperCase().trim() }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Godown / Warehouse Facility Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Godown S - Spices Extension"
                        value={godownForm.name}
                        onChange={e => setGodownForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Physical Location Address</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Hulhumale Port Sector 4, Yard Area A"
                        value={godownForm.location}
                        onChange={e => setGodownForm(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Climate & Temperature Control Zone</label>
                      <select
                        value={godownForm.temperature}
                        onChange={e => setGodownForm(prev => ({ ...prev, temperature: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      >
                        <option value="22°C Spices Ambient">🌿 22°C Spices Ambient</option>
                        <option value="4°C Cold Storage">❄️ 4°C Refrigerated Cold Vault</option>
                        <option value="12°C Controlled">🌡️ 12°C Controlled Temperate</option>
                        <option value="25°C Ambient Dry Storage">☀️ 25°C Ambient Dry Storage</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Storage Capacity Limit (kg)</label>
                      <input
                        type="number"
                        required
                        placeholder="50000"
                        value={godownForm.capacityKg || ""}
                        onChange={e => setGodownForm(prev => ({ ...prev, capacityKg: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Warehouse Manager / Supervisor</label>
                      <input
                        type="text"
                        placeholder="e.g. Supervisor Ibrahim"
                        value={godownForm.managerName}
                        onChange={e => setGodownForm(prev => ({ ...prev, managerName: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Warehouse Operational Status</label>
                      <select
                        value={godownForm.status}
                        onChange={e => setGodownForm(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-bold"
                      >
                        <option value="Active">🟢 Active (Receiving & Dispatching)</option>
                        <option value="Maintenance">🟡 Maintenance (Audit in Progress)</option>
                        <option value="Full">🔴 Full (Maximum Capacity Reached)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Warehouse Notes & Remarks</label>
                      <input
                        type="text"
                        placeholder="e.g. Equipped with ethylene monitors"
                        value={godownForm.notes}
                        onChange={e => setGodownForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
                  {activeAction === "edit" ? (
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-sm"
                    >
                      Save Changes
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-sm"
                    >
                      Create Record
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Main Grid display table (Created Content below Create/Edit/Delete/Display controls) */}
      {effectiveSubPage !== "master-users-creation" && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm overflow-hidden">
          <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest font-bold mb-2.5">
            Active Registry Records
          </div>
          <div className="overflow-x-auto">
          {effectiveSubPage === "master-accounts-groups" && (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] text-muted-foreground">
                  <th className="py-2">Group Name</th>
                  <th className="py-2">Financial Type</th>
                  <th className="py-2">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {groups.map(g => (
                  <tr key={g.id} className="hover:bg-secondary/20">
                    <td className="py-2 font-bold">{g.name}</td>
                    <td className="py-2"><span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">{g.type}</span></td>
                    <td className="py-2 text-muted-foreground text-[11px] truncate max-w-[200px]">{g.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {effectiveSubPage === "master-accounts-ledger" && (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] text-muted-foreground">
                  <th className="py-2">Ledger Account</th>
                  <th className="py-2">Parent Group</th>
                  <th className="py-2 text-right">Opening Bal (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {ledgers.map(l => (
                  <tr key={l.id} className="hover:bg-secondary/20">
                    <td className="py-2 font-bold">{l.name}</td>
                    <td className="py-2 text-muted-foreground">{l.group}</td>
                    <td className="py-2 text-right font-semibold">{new Intl.NumberFormat("en-IN").format(l.openingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {effectiveSubPage === "master-accounts-customer" && (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider bg-secondary/20">
                  <th className="py-2.5 px-4 text-left font-bold">Customer Account</th>
                  <th className="py-2.5 px-4 text-left font-bold">Phone</th>
                  <th className="py-2.5 px-4 text-left font-bold">GST Registration</th>
                  <th className="py-2.5 px-4 text-left font-bold">Credit Limit (Days)</th>
                  <th className="py-2.5 px-4 text-left font-bold">Credit Limit (INR)</th>
                  <th className="py-2.5 px-4 text-left font-bold">Billing Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground">{c.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{c.phone || "N/A"}</td>
                    <td className="py-3 px-4 font-semibold text-muted-foreground">{c.gstNo || "N/A"}</td>
                    <td className="py-3 px-4 text-left font-bold text-amber-500 font-mono">
                      {c.creditLimitDays !== undefined && c.creditLimitDays !== null ? `${c.creditLimitDays} Days` : "0 Days"}
                    </td>
                    <td className="py-3 px-4 text-left font-bold text-emerald-500 font-mono">
                      {c.creditLimitAmount !== undefined && c.creditLimitAmount !== null ? `₹${new Intl.NumberFormat("en-IN").format(c.creditLimitAmount)}` : "₹0"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground truncate max-w-[250px]">{c.address || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {effectiveSubPage === "master-accounts-supplier" && (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider bg-secondary/20">
                  <th className="py-2.5 px-4 text-left font-bold">Supplier Account</th>
                  <th className="py-2.5 px-4 text-left font-bold">Phone</th>
                  <th className="py-2.5 px-4 text-left font-bold">Email</th>
                  <th className="py-2.5 px-4 text-left font-bold">GST Registration</th>
                  <th className="py-2.5 px-4 text-left font-bold">Physical Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground">{s.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{s.phone || "N/A"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{(s as any).email || "N/A"}</td>
                    <td className="py-3 px-4 font-semibold text-muted-foreground">{s.gstNo || "N/A"}</td>
                    <td className="py-3 px-4 text-muted-foreground truncate max-w-[280px]">{s.address || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {effectiveSubPage === "master-inventory-items" && (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] text-muted-foreground">
                  <th className="py-2">Item Name</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Billing Unit</th>
                  <th className="py-2">Packing Type</th>
                  <th className="py-2 text-right">Acquisition standard Price</th>
                  <th className="py-2 text-right">Standard sales Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {products.slice().sort((a, b) => (a.godownStocks ? Object.values(a.godownStocks).reduce((s, v) => s + v, 0) : 0) - (b.godownStocks ? Object.values(b.godownStocks).reduce((s, v) => s + v, 0) : 0)).map(p => (
                  <tr key={p.id} className="hover:bg-secondary/20">
                    <td className="py-2 font-bold">{p.name}</td>
                    <td className="py-2 text-primary">{p.category}</td>
                    <td className="py-2 text-muted-foreground">{p.unit}</td>
                    <td className="py-2 font-semibold">
                      {p.packingTypes && p.packingTypes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.packingTypes.map((pt, idx) => {
                            const priceVal = (p as any).packingPrices?.[pt];
                            return (
                              <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 border border-blue-500/30 shadow-sm">
                                {pt} {priceVal ? `(₹${priceVal})` : ""}
                              </span>
                            );
                          })}
                        </div>
                      ) : p.packingType ? (
                        <div className="flex flex-wrap gap-1">
                          {p.packingType.split(",").map((pt, idx) => {
                            const trimmed = pt.trim();
                            const priceVal = (p as any).packingPrices?.[trimmed];
                            return (
                              <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 border border-blue-500/30 shadow-sm">
                                {trimmed} {priceVal ? `(₹${priceVal})` : ""}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-[10px]">Standard ({p.unit})</span>
                      )}
                    </td>
                    <td className="py-2 text-right">₹{p.buyPrice}</td>
                    <td className="py-2 text-right font-semibold text-green-500">₹{p.sellPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {effectiveSubPage === "master-inventory-categories" && (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] text-muted-foreground">
                  <th className="py-2">Category Name</th>
                  <th className="py-2">HSN Code prefix</th>
                  <th className="py-2">Standard GST %</th>
                  <th className="py-2">Group Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {categories.map(c => (
                  <tr key={c.id} className="hover:bg-secondary/20">
                    <td className="py-2 font-bold">{c.name}</td>
                    <td className="py-2">{c.hsnCode}</td>
                    <td className="py-2 text-primary font-bold">{c.gstRate}%</td>
                    <td className="py-2 text-muted-foreground truncate max-w-[250px]">{c.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {effectiveSubPage === "master-inventory-unit" && (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] text-muted-foreground">
                  <th className="py-2">Short Label</th>
                  <th className="py-2">Full Unit Label</th>
                  <th className="py-2">Fraction Decimals Allowed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {units.map(u => (
                  <tr key={u.id} className="hover:bg-secondary/20">
                    <td className="py-2 font-bold text-primary">{u.shortName}</td>
                    <td className="py-2">{u.fullName}</td>
                    <td className="py-2 text-muted-foreground">{u.decimalPlaces} places</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {effectiveSubPage === "master-inventory-packing" && (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] text-muted-foreground">
                  <th className="py-2">Packing Config Name</th>
                  <th className="py-2">Gross Capacity</th>
                  <th className="py-2">Material Compound</th>
                  <th className="py-2">General Usage Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {packings.map(pk => (
                  <tr key={pk.id} className="hover:bg-secondary/20">
                    <td className="py-2 font-bold">{pk.name}</td>
                    <td className="py-2 font-semibold text-primary">{pk.capacityKg} {pk.capacityUnit || "kg"}</td>
                    <td className="py-2">{pk.material}</td>
                    <td className="py-2 text-muted-foreground truncate max-w-[200px]">{pk.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {(effectiveSubPage === "master-inventory-godowns" || effectiveSubPage === "master-godowns") && (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider bg-secondary/20">
                  <th className="py-2.5 px-3 text-left font-bold">Godown Code</th>
                  <th className="py-2.5 px-3 text-left font-bold">Facility Name</th>
                  <th className="py-2.5 px-3 text-left font-bold">Location Address</th>
                  <th className="py-2.5 px-3 text-left font-bold">Climate & Temp Zone</th>
                  <th className="py-2.5 px-3 text-right font-bold">Max Capacity</th>
                  <th className="py-2.5 px-3 text-left font-bold">Supervisor</th>
                  <th className="py-2.5 px-3 text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {godowns.map(g => (
                  <tr key={g.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-primary font-mono">Godown {g.code}</td>
                    <td className="py-2.5 px-3 font-bold text-foreground">{g.name}</td>
                    <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[200px]">{g.location}</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">{g.temperature}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-foreground font-mono">{g.capacityKg.toLocaleString()} kg</td>
                    <td className="py-2.5 px-3 text-muted-foreground font-semibold">{g.managerName || "N/A"}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                        g.status === "Active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" :
                        g.status === "Maintenance" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" :
                        "bg-red-500/10 text-red-600 border-red-500/30"
                      }`}>
                        {g.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {effectiveSubPage === "master-users-status" && (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider bg-secondary/20">
                  <th className="py-2.5 px-3">Emp ID</th>
                  <th className="py-2.5 px-3">Employee Name</th>
                  <th className="py-2.5 px-3">System Role</th>
                  <th className="py-2.5 px-3">Responsibilities Scope</th>
                  <th className="py-2.5 px-3">Allowed Features</th>
                  <th className="py-2.5 px-3 text-right">Total Salary</th>
                  <th className="py-2.5 px-3 text-center">Visa Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-muted-foreground italic">No employees registered yet. Please create one below!</td>
                  </tr>
                ) : (
                  users.map(u => {
                    const count = u.allowedFeatures ? u.allowedFeatures.length : ALL_WEBSITE_FEATURES.length;
                    return (
                      <tr key={u.id} className="hover:bg-secondary/20">
                        <td className="py-2.5 px-3 font-bold text-primary font-mono">{u.employeeId}</td>
                        <td className="py-2.5 px-3 font-semibold text-foreground">{u.employeeName}</td>
                        <td className="py-2.5 px-3 text-muted-foreground"><span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">{u.role}</span></td>
                        <td className="py-2.5 px-3 text-foreground text-[11px] truncate max-w-[180px]">{u.responsibility || "General Responsibilities"}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                            count === ALL_WEBSITE_FEATURES.length
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                              : count > 0
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                              : "bg-red-500/10 text-red-600 border-red-500/30"
                          }`}>
                            {count} / {ALL_WEBSITE_FEATURES.length} Features Enabled
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-500 font-mono">₹{u.totalSalary ? u.totalSalary.toLocaleString("en-IN") : "0"}</td>
                        <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">{u.visaExpiry || "N/A"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
