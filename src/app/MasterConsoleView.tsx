import { useState, useEffect, useMemo } from "react";
import { Sparkles, AlertTriangle, Eye, Edit, Trash2, Plus, Lock, User, Globe, ShieldCheck, Heart, DollarSign, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  category: "Spices" | "Dry Fruits" | "Fruits" | "Vegetables" | "Other";
  unit: string;
  packingType?: string;
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
}

interface GroupItem { id: string; code: string; name: string; type: "Asset" | "Liability" | "Income" | "Expense" | "Equity"; description: string; }
interface LedgerItem { id: string; code: string; name: string; group: string; openingBalance: number; description: string; }
interface CategoryItem { id: string; name: string; hsnCode: string; gstRate: number; description: string; }
interface UnitItem { id: string; shortName: string; fullName: string; decimalPlaces: number; }
interface PackingItem { id: string; name: string; capacityKg: number; capacityUnit?: string; material: string; notes: string; }
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
}

const initialGroups: GroupItem[] = [
  { id: "g1", code: "CA01", name: "Current Assets", type: "Asset", description: "Short-term economic resources" },
  { id: "g2", code: "CL01", name: "Current Liabilities", type: "Liability", description: "Short-term financial obligations" },
  { id: "g3", code: "DI01", name: "Direct Income", type: "Income", description: "Core revenue streams (Wholesale, Exports)" },
  { id: "g4", code: "DE01", name: "Direct Expenses", type: "Expense", description: "Cost of materials & transport" },
  { id: "g5", code: "EQ01", name: "Equity / Capital", type: "Equity", description: "Owner's share value" }
];

const initialLedgers: LedgerItem[] = [
  { id: "l1", code: "LED01", name: "Cash Account", group: "Current Assets", openingBalance: 150000, description: "Office petty cash reserves" },
  { id: "l2", code: "LED02", name: "HDFC Primary A/c", group: "Current Assets", openingBalance: 2450000, description: "Core corporate banking ledger" },
  { id: "l3", code: "LED03", name: "GST Input Ledger", group: "Current Assets", openingBalance: 32000, description: "Taxes receivable on purchases" },
  { id: "l4", code: "LED04", name: "Sales Account", group: "Direct Income", openingBalance: 0, description: "Aggregated sales ledger" },
  { id: "l5", code: "LED05", name: "Transport Expenses A/c", group: "Direct Expenses", openingBalance: 0, description: "Cargo dispatch transport costs" }
];

const initialCategories: CategoryItem[] = [
  { id: "c1", name: "Spices", hsnCode: "0908", gstRate: 5, description: "Whole spices, ground powder spices" },
  { id: "c2", name: "Dry Fruits", hsnCode: "0801", gstRate: 12, description: "Premium nuts and raisins" },
  { id: "c3", name: "Produce", hsnCode: "0701", gstRate: 0, description: "Fresh farm produce (Zero GST)" }
];

const initialUnits: UnitItem[] = [
  { id: "u1", shortName: "kg", fullName: "Kilogram", decimalPlaces: 2 },
  { id: "u2", shortName: "g", fullName: "Gram", decimalPlaces: 0 },
  { id: "u3", shortName: "box", fullName: "Carton Box", decimalPlaces: 0 },
  { id: "u4", shortName: "bag", fullName: "Burlap Sack", decimalPlaces: 0 }
];

const initialPackings: PackingItem[] = [
  { id: "p1", name: "Standard Jute Sack (50kg)", capacityKg: 50, capacityUnit: "kg", material: "Organic Fiber", notes: "Best for whole dry spices" },
  { id: "p2", name: "25kg Commercial Bag", capacityKg: 25, capacityUnit: "kg", material: "Woven PP Bag", notes: "Bulk commercial packing" },
  { id: "p3", name: "Cardboard Carton Box (10kg)", capacityKg: 10, capacityUnit: "kg", material: "Corrugated Paper", notes: "Used for retail packaging sets" },
  { id: "p4", name: "5kg Sack", capacityKg: 5, capacityUnit: "kg", material: "Jute Bag", notes: "Medium retail bag" },
  { id: "p5", name: "Vacuum Foil Pouch (1kg)", capacityKg: 1, capacityUnit: "kg", material: "Multi-layer laminate", notes: "Air-tight seal for spice powders" },
  { id: "p6", name: "500g Retail Pouch (0.5kg)", capacityKg: 0.5, capacityUnit: "kg", material: "Plastic Pouch", notes: "Small retail pouch" },
  { id: "p7", name: "250g Retail Pack (0.25kg)", capacityKg: 0.25, capacityUnit: "kg", material: "Plastic Pouch", notes: "Consumer pack" },
  { id: "p8", name: "100g Sample Pouch (0.1kg)", capacityKg: 0.1, capacityUnit: "kg", material: "Foil Pouch", notes: "Sample pack" }
];

const initialUsers: UserItem[] = [
  {
    id: "emp1",
    employeeId: "EMP-001",
    employeeName: "Anil Kumar",
    passportNumber: "L8823471",
    passportIssue: "2024-05-12",
    passportExpiry: "2034-05-11",
    workPermitNumber: "WP-8872A",
    workPermitIssue: "2024-06-01",
    workPermitExpiry: "2027-05-31",
    visaNumber: "V-99238",
    visaIssue: "2024-06-01",
    visaExpiry: "2027-05-31",
    insuranceNumber: "INS-992384",
    insuranceIssue: "2025-01-01",
    insuranceExpiry: "2026-12-31",
    healthMedicalNumber: "MED-8872",
    healthMedicalIssue: "2025-01-01",
    healthMedicalExpiry: "2026-12-31",
    dateOfBirth: "1990-08-15",
    dateOfJoin: "2024-06-01",
    dateOfRejoin: "",
    basicSalary: 35000,
    allowances: 5000,
    overtime: 2500,
    totalSalary: 42500,
    role: "Data entry",
    responsibility: "Manage inventory stock ledger and daily dispatches",
    username: "anil_de",
    password: "Password123"
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
  onAddProduct,
  onAddCustomer
}: {
  page: string;
  products: Product[];
  customers: Customer[];
  onAddProduct: (p: Omit<Product, "id" | "godownStocks">) => Promise<boolean>;
  onAddCustomer: (c: Omit<Customer, "id">) => Promise<boolean>;
}) {
  const [groups, setGroups] = useState<GroupItem[]>(() => getStored("master_groups", initialGroups));
  const [ledgers, setLedgers] = useState<LedgerItem[]>(() => getStored("master_ledgers", initialLedgers));
  const [categories, setCategories] = useState<CategoryItem[]>(() => getStored("master_categories", initialCategories));
  const [units, setUnits] = useState<UnitItem[]>(() => getStored("master_units", initialUnits));
  const [packings, setPackings] = useState<PackingItem[]>(() => getStored("master_packings", initialPackings));
  const [users, setUsers] = useState<UserItem[]>(() => getStored("master_users", initialUsers));
  const [isEmployeeCreationOpen, setIsEmployeeCreationOpen] = useState(false);

  useEffect(() => { setStored("master_groups", groups); }, [groups]);
  useEffect(() => { setStored("master_ledgers", ledgers); }, [ledgers]);
  useEffect(() => { setStored("master_categories", categories); }, [categories]);
  useEffect(() => { setStored("master_units", units); }, [units]);
  useEffect(() => { setStored("master_packings", packings); }, [packings]);
  useEffect(() => { setStored("master_users", users); }, [users]);

  // Tab controller state inside parent pages
  const [activeSubTab, setActiveSubTab] = useState("");

  useEffect(() => {
    if (page === "master-accounts") {
      setActiveSubTab("groups");
    } else if (page === "master-inventory") {
      setActiveSubTab("items");
    } else if (page === "master-users") {
      setActiveSubTab("status");
    }
  }, [page]);

  const effectiveSubPage = useMemo(() => {
    if (page === "master-accounts") return `master-accounts-${activeSubTab || "groups"}`;
    if (page === "master-inventory") return `master-inventory-${activeSubTab || "items"}`;
    if (page === "master-users") return `master-users-${activeSubTab || "status"}`;
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
    password: ""
  });

  // Custom customer add states
  const [customerForm, setCustomerForm] = useState<Omit<Customer, "id">>({ name: "", email: "", phone: "", address: "", gstNo: "" });
  // Custom item add states
  const [itemForm, setItemForm] = useState<Omit<Product, "id" | "godownStocks">>({ name: "", category: "Spices", unit: "kg", packingType: "", buyPrice: 100, sellPrice: 150 });
  const [isCreatingNewPacking, setIsCreatingNewPacking] = useState(false);
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
      if (found) setCustomerForm({ name: found.name, email: found.email || "", phone: found.phone || "", address: found.address || "", gstNo: found.gstNo || "" });
    } else if (effectiveSubPage === "master-inventory-items") {
      const found = products.find(x => x.id === selectedId);
      if (found) setItemForm({ name: found.name, category: found.category, unit: found.unit, packingType: found.packingType || "", buyPrice: found.buyPrice, sellPrice: found.sellPrice });
    } else if (effectiveSubPage === "master-inventory-categories") {
      const found = categories.find(x => x.id === selectedId);
      if (found) setCategoryForm({ name: found.name, hsnCode: found.hsnCode, gstRate: found.gstRate, description: found.description });
    } else if (effectiveSubPage === "master-inventory-unit") {
      const found = units.find(x => x.id === selectedId);
      if (found) setUnitForm({ shortName: found.shortName, fullName: found.fullName, decimalPlaces: found.decimalPlaces });
    } else if (effectiveSubPage === "master-inventory-packing") {
      const found = packings.find(x => x.id === selectedId);
      if (found) setPackingForm({ name: found.name, capacityKg: found.capacityKg, capacityUnit: found.capacityUnit || "kg", material: found.material, notes: found.notes });
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
          password: found.password || ""
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
          setCustomerForm({ name: "", email: "", phone: "", address: "", gstNo: "" });
        }
      } else if (effectiveSubPage === "master-inventory-items") {
        const ok = await onAddProduct(itemForm);
        if (ok) {
          toast.success(`Product "${itemForm.name}" registered in global catalog!`);
          setItemForm({ name: "", category: "Spices", unit: "kg", packingType: "", buyPrice: 100, sellPrice: 150 });
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
      } else if (effectiveSubPage === "master-users-creation") {
        const newUser = { ...userForm, id: "usr_" + Date.now(), totalSalary: userForm.basicSalary + userForm.allowances + userForm.overtime };
        setUsers(prev => [...prev, newUser]);
        toast.success(`Employee "${userForm.employeeName}" registered!`);
        setUserForm({
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
          password: ""
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
      } else if (effectiveSubPage === "master-inventory-categories") {
        setCategories(prev => prev.map(x => x.id === selectedId ? { ...x, ...categoryForm } : x));
        toast.success("Category details updated.");
      } else if (effectiveSubPage === "master-inventory-unit") {
        setUnits(prev => prev.map(x => x.id === selectedId ? { ...x, ...unitForm } : x));
        toast.success("Measurement unit details updated.");
      } else if (effectiveSubPage === "master-inventory-packing") {
        setPackings(prev => prev.map(x => x.id === selectedId ? { ...x, ...packingForm } : x));
        toast.success("Packing profile updated.");
      } else if (effectiveSubPage === "master-users-status") {
        setUsers(prev => prev.map(x => x.id === selectedId ? { ...x, ...userForm, totalSalary: userForm.basicSalary + userForm.allowances + userForm.overtime } : x));
        toast.success("Employee profile updated.");
      } else {
        toast.info("Database-backed items must be managed via their global forms.");
      }
    }
  };

  const handleDeleteRecord = () => {
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
    } else if (effectiveSubPage === "master-inventory-categories") {
      setCategories(prev => prev.filter(x => x.id !== selectedId));
      toast.success("Category details removed.");
    } else if (effectiveSubPage === "master-inventory-unit") {
      setUnits(prev => prev.filter(x => x.id !== selectedId));
      toast.success("Unit details removed.");
    } else if (effectiveSubPage === "master-inventory-packing") {
      setPackings(prev => prev.filter(x => x.id !== selectedId));
      toast.success("Packing profile removed.");
    } else if (effectiveSubPage === "master-users-status") {
      setUsers(prev => prev.filter(x => x.id !== selectedId));
      toast.success("Employee record deleted.");
    } else {
      toast.error("Deletion of core transactional objects requires admin credentials override.");
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
      {page === "master-accounts" && (
        <div className="flex gap-2 bg-card border border-border rounded-xl p-2 shadow-sm overflow-x-auto">
          {[
            { id: "groups", label: "Groups" },
            { id: "ledger", label: "Ledger" },
            { id: "customer", label: "Customer" }
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

      {page === "master-inventory" && (
        <div className="flex gap-2 bg-card border border-border rounded-xl p-2 shadow-sm overflow-x-auto">
          {[
            { id: "items", label: "Items" },
            { id: "categories", label: "Categories" },
            { id: "unit", label: "Unit" },
            { id: "packing", label: "Packing Type" }
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

      {page === "master-users" && (
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

      {/* Main Grid display table */}
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
                <tr className="border-b border-border text-[10px] text-muted-foreground">
                  <th className="py-2">Customer Account</th>
                  <th className="py-2">Phone</th>
                  <th className="py-2">GST Registration</th>
                  <th className="py-2">Billing Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-secondary/20">
                    <td className="py-2 font-bold">{c.name}</td>
                    <td className="py-2">{c.phone || "N/A"}</td>
                    <td className="py-2 font-semibold text-muted-foreground">{c.gstNo || "N/A"}</td>
                    <td className="py-2 text-muted-foreground truncate max-w-[200px]">{c.address || "N/A"}</td>
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
                      {p.packingType ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 border border-blue-500/30">
                          {p.packingType}
                        </span>
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

          {effectiveSubPage === "master-users-status" && (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] text-muted-foreground">
                  <th className="py-2">Emp ID</th>
                  <th className="py-2">Employee Name</th>
                  <th className="py-2">System Role</th>
                  <th className="py-2 text-right">Basic Salary</th>
                  <th className="py-2 text-right">Total Salary</th>
                  <th className="py-2 text-center">Visa Expiry</th>
                  <th className="py-2 text-center">Passport Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-muted-foreground italic">No employees registered yet. Please create one below!</td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-secondary/20">
                      <td className="py-2 font-bold text-primary font-mono">{u.employeeId}</td>
                      <td className="py-2 font-semibold">{u.employeeName}</td>
                      <td className="py-2 text-muted-foreground">{u.role}</td>
                      <td className="py-2 text-right font-mono">₹{u.basicSalary ? u.basicSalary.toLocaleString("en-IN") : "0"}</td>
                      <td className="py-2 text-right font-bold text-emerald-500 font-mono">₹{u.totalSalary ? u.totalSalary.toLocaleString("en-IN") : "0"}</td>
                      <td className="py-2 text-center text-muted-foreground font-mono">{u.visaExpiry || "N/A"}</td>
                      <td className="py-2 text-center text-muted-foreground font-mono">{u.passportExpiry || "N/A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
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
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Employee ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP-001"
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
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="Username"
                  value={userForm.username}
                  onChange={e => setUserForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, "") }))}
                  className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono font-semibold"
                />
              </div>

              <div className="border-l-2 border-l-blue-500 pl-2 space-y-0.5">
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Password"
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
                <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Basic Salary *</label>
                <input
                  type="number"
                  required
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

            {/* EDIT MODE PANEL */}
            {activeAction === "edit" && (
              <form onSubmit={handleActionSubmit} className="space-y-4 text-left">
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

                {selectedId && (
                  <>
                    {/* The Compact Grid Sheet */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-3 gap-y-2 text-left mt-3">
                      
                      {/* Row 1: Bio & Credentials */}
                      <div className="border-l-2 border-l-blue-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Employee ID *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. EMP-001"
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
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Username *</label>
                        <input
                          type="text"
                          required
                          placeholder="Username"
                          value={userForm.username}
                          onChange={e => setUserForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, "") }))}
                          className="w-full px-2 py-0.5 border border-border rounded bg-input-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono font-semibold"
                        />
                      </div>

                      <div className="border-l-2 border-l-blue-500 pl-2 space-y-0.5">
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Password *</label>
                        <input
                          type="password"
                          required
                          placeholder="Password"
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
                        <label className="block text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Basic Salary *</label>
                        <input
                          type="number"
                          required
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
                    <div className="flex justify-end gap-2 pt-2 border-t border-border/30 mt-3">
                      <button
                        type="submit"
                        className="px-6 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-mono font-bold transition-all shadow-sm"
                      >
                        Save Changes
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
                  {effectiveSubPage === "master-inventory-items" && products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
                  {effectiveSubPage === "master-inventory-categories" && categories.map(c => <option key={c.id} value={c.id}>{c.name} (HSN {c.hsnCode})</option>)}
                  {effectiveSubPage === "master-inventory-unit" && units.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.shortName})</option>)}
                  {effectiveSubPage === "master-inventory-packing" && packings.map(pk => <option key={pk.id} value={pk.id}>{pk.name}</option>)}
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
                          <div><span className="text-muted-foreground">BILLING ADDRESS:</span> <span className="text-foreground">{item.address || "N/A"}</span></div>
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
                  {effectiveSubPage === "master-inventory-items" && products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
                  {effectiveSubPage === "master-inventory-categories" && categories.map(c => <option key={c.id} value={c.id}>{c.name} (HSN {c.hsnCode})</option>)}
                  {effectiveSubPage === "master-inventory-unit" && units.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.shortName})</option>)}
                  {effectiveSubPage === "master-inventory-packing" && packings.map(pk => <option key={pk.id} value={pk.id}>{pk.name}</option>)}
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
                      {effectiveSubPage === "master-inventory-items" && products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
                      {effectiveSubPage === "master-inventory-categories" && categories.map(c => <option key={c.id} value={c.id}>{c.name} (HSN {c.hsnCode})</option>)}
                      {effectiveSubPage === "master-inventory-unit" && units.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.shortName})</option>)}
                      {effectiveSubPage === "master-inventory-packing" && packings.map(pk => <option key={pk.id} value={pk.id}>{pk.name}</option>)}
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
                        value={ledgerForm.openingBalance || ""}
                        onChange={e => setLedgerForm(prev => ({ ...prev, openingBalance: parseFloat(e.target.value) || 0 }))}
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
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Customer Name</label>
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
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Billing Physical Address</label>
                      <input
                        type="text"
                        placeholder="Billing address info..."
                        value={customerForm.address}
                        onChange={e => setCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                )}

                {effectiveSubPage === "master-inventory-items" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Product Catalog Name</label>
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
                        onChange={e => setItemForm(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      >
                        <option value="Spices">Spices</option>
                        <option value="Dry Fruits">Dry Fruits</option>
                        <option value="Produce">Produce</option>
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
                    <div className="relative">
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1 flex items-center justify-between">
                        <span>Packing Type</span>
                        <span className="text-[9px] text-blue-500 font-bold uppercase">
                          ({filteredPackings.length} {itemForm.unit} packings)
                        </span>
                      </label>
                      <div className="flex gap-1">
                        <select
                          value={itemForm.packingType}
                          onChange={e => {
                            if (e.target.value === "ADD_NEW_PACKING") {
                              setIsCreatingNewPacking(true);
                            } else {
                              setItemForm(prev => ({ ...prev, packingType: e.target.value }));
                              setIsCreatingNewPacking(false);
                            }
                          }}
                          className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                        >
                          <option value="">-- Select Packing Type --</option>
                          {filteredPackings.map(pk => (
                            <option key={pk.id} value={pk.name}>{pk.name}</option>
                          ))}
                          <option value="ADD_NEW_PACKING" className="text-blue-500 font-bold">+ Create Custom Packing Type...</option>
                        </select>
                      </div>

                      {/* Inline Custom Packing Creator */}
                      {isCreatingNewPacking && (
                        <div className="absolute left-0 top-[60px] right-0 bg-popover border border-border rounded-xl p-3 shadow-xl z-50 space-y-2">
                          <div className="text-[10px] font-bold text-foreground font-mono uppercase">
                            Register New Packing Type ({itemForm.unit})
                          </div>
                          <input
                            type="text"
                            placeholder={`e.g. 15kg Steel Drum or 2.5kg Pouch`}
                            value={newPackingName}
                            onChange={e => setNewPackingName(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-input-background text-xs font-mono font-semibold"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const trimmed = newPackingName.trim();
                                if (trimmed) {
                                  const newPk: PackingItem = {
                                    id: "pack_" + Date.now(),
                                    name: trimmed,
                                    capacityKg: 10,
                                    capacityUnit: itemForm.unit,
                                    material: "Custom Container",
                                    notes: "Custom registered packing type"
                                  };
                                  setPackings(prev => [...prev, newPk]);
                                  setItemForm(prev => ({ ...prev, packingType: trimmed }));
                                  setNewPackingName("");
                                  setIsCreatingNewPacking(false);
                                  toast.success(`Packing "${trimmed}" registered for future item creations!`);
                                }
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-mono rounded-lg"
                            >
                              Save & Assign
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingNewPacking(false);
                                setNewPackingName("");
                              }}
                              className="px-2.5 py-1 bg-secondary text-foreground text-xs font-semibold rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
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
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Standard Sales Price (INR)</label>
                      <input
                        type="number"
                        required
                        value={itemForm.sellPrice || ""}
                        onChange={e => setItemForm(prev => ({ ...prev, sellPrice: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-semibold"
                      />
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
                        value={categoryForm.gstRate || ""}
                        onChange={e => setCategoryForm(prev => ({ ...prev, gstRate: parseInt(e.target.value, 10) || 0 }))}
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
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Capacity Limit</label>
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
    </div>
  );
}
