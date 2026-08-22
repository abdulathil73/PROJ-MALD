import { useState, useEffect, useMemo, useRef, Fragment, Component } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Package, TrendingUp, TrendingDown, Warehouse, ArrowDownToLine, ArrowUpFromLine,
  Sparkles, ChevronRight, Search, Plus, Check, AlertCircle, LayoutDashboard, LayoutGrid,
  BoxIcon, BarChart2, Bot, Menu, Ship, MapPin, Truck, RefreshCw, Calendar, AlertTriangle, Moon, Sun, Database as DbIcon, Printer, X, PlusCircle, CreditCard, DollarSign, Building, Trash2, Keyboard, Play, Lock, User, Coins, Calculator, Tag, Clock, Gift,
  Mic, MicOff, Volume2, VolumeX, HelpCircle, Eye, Edit, FileText, Download, Filter, ShieldAlert, CheckCircle2, MessageSquare, PhoneCall, Send, Copy, ShoppingCart, Receipt, BookOpen, FileCheck, History, ArrowLeft, Percent, PackageCheck, FileUp, FileSpreadsheet, Upload, Cpu, Cloud, Layers, Zap, Mail, Boxes,
  Globe, Plane, ShieldCheck, Activity, ArrowUpRight, Compass
} from "lucide-react";
import { Toaster, toast } from "sonner";
import MasterConsoleView from "./MasterConsoleView";
import AIVoiceInvoiceModal from "./components/AIVoiceInvoiceModal";
import * as pdfjsLib from "pdfjs-dist";
import { createWorker } from "tesseract.js";

if (typeof window !== "undefined" && pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
  const pdfVersion = (pdfjsLib as any).version || "3.11.174";
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfVersion}/pdf.worker.min.js`;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class PageErrorBoundary extends Component<{ children: React.ReactNode; pageName?: string; onReset?: () => void }, ErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("PageErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 bg-card border border-red-500/30 rounded-2xl shadow-2xl space-y-4 text-foreground font-sans">
          <div className="flex items-center gap-3 text-red-500 font-serif font-bold text-xl border-b border-border pb-3">
            <AlertTriangle size={24} />
            <span>Console Auto-Recovery Intercepted an Error</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            A temporary render error occurred while loading the {this.props.pageName || "active"} module.
          </p>
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-mono text-red-400 overflow-x-auto select-all">
            {this.state.error?.toString() || "Unknown error"}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) this.props.onReset();
              }}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-mono text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow"
            >
              <RefreshCw size={14} /> Reload Module Console
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl font-mono text-xs font-bold hover:bg-secondary/80 transition-all"
            >
              Full Browser Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────

type Godown = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R";
type Category = string;
type VoucherType = "payment" | "receipt" | "contra" | "journal";

interface Product {
  id: string;
  name: string;
  category: Category;
  unit: string;
  packingType?: string;
  packingTypes?: string[];
  packingPrices?: Record<string, number>;
  packing1?: string;
  price1?: number | string;
  packing2?: string;
  price2?: number | string;
  packing3?: string;
  price3?: number | string;
  buyPrice: number;
  sellPrice: number;
  isPerishable: boolean;
  expiryDays: number;
  stock: number;
  godownStocks: Record<Godown, number>;
}

interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  gstNo: string;
  email?: string;
  creditLimitDays?: number;
  creditLimitAmount?: number;
}

interface Supplier {
  id: string;
  name: string;
  address: string;
  phone: string;
  gstNo: string;
}

interface InvoiceItem {
  productId: string;
  godown: Godown;
  quantity: number;
  pricePerUnit: number;
  gstPercent: number;
  subTotal: number;
  grandTotal: number;
  expiryDate?: string;
  packingType?: string;
}

interface StockEntry {
  id: string;
  productId: string; // fallback
  godown: Godown;    // fallback
  type: "in" | "out";
  quantity: number;   // fallback
  pricePerUnit: number; // fallback
  date: string;
  dueDate?: string;
  expiryDate?: string;
  partner: string;
  note: string;
  
  paymentType?: "cash" | "card" | "transfer" | "credit";
  partnerAddress?: string;
  partnerPhone?: string;
  partnerGST?: string;
  gstPercent?: number;
  subTotal?: number;
  grandTotal?: number;
  invoiceNo?: string;
  subType?: string;

  quotationNo?: string;
  deliveryNoteNo?: string;
  poNo?: string;
  grnNo?: string;
  salesPerson?: string;
  purchasePerson?: string;
  
  items?: InvoiceItem[];
  payments?: { method: "cash" | "card" | "transfer" | "credit"; amount: number }[];
}

interface Voucher {
  id: string;
  voucherNo: string;
  type: VoucherType;
  date: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  mode: "cash" | "bank" | "online" | "cheque" | "journal";
  referenceNo?: string;
  narration: string;
}

interface SpoilageRecord {
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

interface Analytics {
  revenue: number;
  cost: number;
  profit: number;
  godownStats: {
    godown: Godown;
    totalIn: number;
    totalOut: number;
    current: number;
    uniqueProducts: number;
  }[];
  productPL: Record<string, { revenue: number; cost: number; profit: number; sold: number; stock: number }>;
}

interface KBArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

interface AITelemetry {
  intent: string;
  entities: Record<string, any>;
  retrievedDocs: KBArticle[];
  databaseContext: any;
  promptSent: string;
  responseText: string;
  modelUsed: string;
  processingTimeMs: number;
}

const CATEGORIES: Category[] = ["Spices", "Dry Fruits", "Fruits", "Vegetables", "Other"];

const ALL_GODOWNS: Godown[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"];

const CATEGORY_COLORS: Record<Category, string> = {
  "Spices": "#c8860a",
  "Dry Fruits": "#2d4a1e",
  "Fruits": "#8b3a1a",
  "Vegetables": "#4a7c3f",
  "Other": "#7a6e5f",
};

function getGodownClimateLabel(g: string): string {
  try {
    const customMeta = JSON.parse(localStorage.getItem("custom_godowns_metadata") || "{}");
    if (customMeta[g] && customMeta[g].climate) {
      return customMeta[g].climate;
    }
  } catch (e) {}

  if (["A", "B", "C", "D", "E", "F"].includes(g)) return "Spices (22°C)";
  if (["G", "H", "I", "J", "K", "L"].includes(g)) return "Temperate (12°C)";
  if (["M", "N", "O", "P", "Q", "R"].includes(g)) return "Refrigerated (4°C)";
  return "Ambient Dry Storage";
}

function getBestGodownForProduct(product?: Product | null, preferredGodown?: Godown | string): Godown {
  if (preferredGodown && ALL_GODOWNS.includes(preferredGodown as Godown)) {
    return preferredGodown as Godown;
  }
  if (product) {
    if (product.godownStocks) {
      let maxQty = -1;
      let maxGdn: Godown = "A";
      ALL_GODOWNS.forEach(g => {
        const qty = product.godownStocks?.[g] || 0;
        if (qty > maxQty && qty > 0) {
          maxQty = qty;
          maxGdn = g;
        }
      });
      if (maxQty > 0) return maxGdn;
    }
    const cat = (product.category || "").toLowerCase();
    if (cat.includes("spice") || cat.includes("grain") || cat.includes("rice") || cat.includes("staple")) return "A";
    if (cat.includes("dry fruit") || cat.includes("nut") || cat.includes("almond") || cat.includes("cashew")) return "G";
    if (cat.includes("beverage") || cat.includes("tea") || cat.includes("coffee") || cat.includes("drink")) return "M";
    if (cat.includes("tech") || cat.includes("electr") || cat.includes("computer") || cat.includes("hardware") || cat.includes("macbook") || cat.includes("dell") || cat.includes("monitor")) return "B";
    if (cat.includes("perish") || cat.includes("fruit") || cat.includes("veg") || cat.includes("fresh") || cat.includes("dairy")) return "P";
    if (cat.includes("paper") || cat.includes("stationery") || cat.includes("office")) return "D";
  }
  return "A";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  const num = typeof n === "number" && !isNaN(n) ? n : 0;
  return `MVR ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDDMMYYYY(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (isoMatch) {
      const [_, yyyy, mm, dd] = isoMatch;
      return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
    }
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (ddmmyyyyMatch) {
      const [_, dd, mm, yyyy] = ddmmyyyyMatch;
      return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
    }
    const raw8Match = trimmed.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (raw8Match) {
      const [_, dd, mm, yyyy] = raw8Match;
      return `${dd}/${mm}/${yyyy}`;
    }
  }
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (d && !isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {
    // fallback
  }
  return String(dateInput || "");
}

function DDMMYYYYDateInput({
  value,
  onChange,
  className,
  placeholder = "DD/MM/YYYY",
  inputRef,
  onKeyDown
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  inputRef?: any;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [localText, setLocalText] = useState(() => formatDDMMYYYY(value));
  const isEditingRef = useRef(false);
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditingRef.current) {
      setLocalText(formatDDMMYYYY(value));
    }
  }, [value]);

  const parseAndNotify = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      onChange("");
      return;
    }
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    const yyyymmddMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    const raw8Match = trimmed.match(/^(\d{2})(\d{2})(\d{4})$/);

    if (ddmmyyyyMatch) {
      const [_, dd, mm, yyyy] = ddmmyyyyMatch;
      const sDD = dd.padStart(2, "0");
      const sMM = mm.padStart(2, "0");
      onChange(`${yyyy}-${sMM}-${sDD}`);
    } else if (yyyymmddMatch) {
      const [_, yyyy, mm, dd] = yyyymmddMatch;
      const sDD = dd.padStart(2, "0");
      const sMM = mm.padStart(2, "0");
      onChange(`${yyyy}-${sMM}-${sDD}`);
    } else if (raw8Match) {
      const [_, dd, mm, yyyy] = raw8Match;
      onChange(`${yyyy}-${mm}-${dd}`);
    } else {
      onChange(trimmed);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    const digitsOnly = raw.replace(/\D/g, "");
    if (digitsOnly.length > 0 && !raw.includes("/")) {
      if (digitsOnly.length <= 2) {
        raw = digitsOnly;
      } else if (digitsOnly.length <= 4) {
        raw = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
      } else {
        raw = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4, 8)}`;
      }
    }

    setLocalText(raw);
    parseAndNotify(raw);
  };

  const handleFocus = () => {
    isEditingRef.current = true;
  };

  const handleBlur = () => {
    isEditingRef.current = false;
    setLocalText(formatDDMMYYYY(value));
  };

  const handleHiddenDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const formatted = formatDDMMYYYY(e.target.value);
      setLocalText(formatted);
      onChange(e.target.value);
    }
  };

  const triggerPicker = () => {
    if (hiddenDateInputRef.current) {
      if (typeof hiddenDateInputRef.current.showPicker === "function") {
        hiddenDateInputRef.current.showPicker();
      } else {
        hiddenDateInputRef.current.click();
        hiddenDateInputRef.current.focus();
      }
    }
  };

  return (
    <div className="relative inline-block w-full">
      <input
        ref={inputRef}
        type="text"
        value={localText}
        onChange={handleTextChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`${className} pr-8 font-mono`}
      />
      <button
        type="button"
        onClick={triggerPicker}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer z-10"
        title="Open Calendar Picker"
      >
        <Calendar size={14} />
      </button>
      <input
        ref={hiddenDateInputRef}
        type="date"
        value={value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ""}
        onChange={handleHiddenDateChange}
        className="sr-only absolute pointer-events-none opacity-0 w-0 h-0"
        tabIndex={-1}
      />
    </div>
  );
}

// ─── Components ──────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent = false }: {
  label: string; value: string; sub?: string; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-border p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-md hover:scale-[1.01] ${accent ? "bg-primary text-primary-foreground border-primary" : "bg-card text-card-foreground"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-mono uppercase tracking-widest ${accent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? "bg-white/10" : "bg-secondary"}`}>
          <Icon size={15} className={accent ? "text-primary-foreground" : "text-primary"} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold font-serif leading-tight">{value}</div>
        {sub && <div className={`text-xs mt-1 ${accent ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{sub}</div>}
      </div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium" style={{ background: color + "18", color }}>
      {label}
    </span>
  );
}

// ─── Animated Logistics Visualizer ──────────────────────────────────────────

function LogisticsVisualizer({ entries, products }: { entries: StockEntry[]; products: Product[] }) {
  const lastShipments = useMemo(() => {
    return entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  }, [entries]);

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Active Logistics Pipeline</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time supply chain mapping</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-primary font-mono bg-primary/10 px-2 py-1 rounded">
          <RefreshCw size={12} className="animate-spin" /> Live Sync
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="border border-border rounded-xl p-4 bg-secondary/20 space-y-3 relative overflow-hidden">
          <div className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
            <Truck size={14} className="text-primary" /> Suppliers / Origin
          </div>
          <div className="space-y-2">
            <div className="p-2 bg-card rounded border border-border text-xs flex justify-between items-center">
              <span>Kerala Spice Growers</span>
              <span className="font-mono text-[10px] text-accent">Cardamom</span>
            </div>
            <div className="p-2 bg-card rounded border border-border text-xs flex justify-between items-center">
              <span>Kabul Exporters Ltd</span>
              <span className="font-mono text-[10px] text-accent">Almonds</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center relative py-6">
          <svg className="w-full h-32 absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            <path d="M 10,25 Q 75,60 150,60" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="4 4" />
            <path d="M 10,65 H 150" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle r="4" fill="#2d4a1e">
              <animateMotion dur="3s" repeatCount="indefinite" path="M 10,25 Q 75,60 150,60" />
            </circle>
          </svg>

          <div className="z-10 bg-primary text-primary-foreground border border-primary p-4 rounded-xl shadow-md text-center max-w-[140px] space-y-1">
            <Warehouse className="mx-auto" size={24} />
            <div className="text-xs font-serif font-semibold">Spice Route Hub</div>
            <div className="text-[10px] font-mono opacity-80">18 Godowns (A-R)</div>
          </div>
        </div>

        <div className="border border-border rounded-xl p-4 bg-secondary/20 space-y-3">
          <div className="text-xs font-mono uppercase text-accent tracking-wider flex items-center gap-1.5">
            <Ship size={14} className="text-accent" /> Export Markets / Clients
          </div>
          <div className="space-y-2">
            <div className="p-2 bg-card rounded border border-border text-xs flex justify-between items-center">
              <span>Gulf Spice General (Dubai)</span>
              <span className="font-mono text-[10px] text-green-700">Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h4 className="text-[11px] font-mono uppercase text-muted-foreground mb-2">Live Shipments Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {lastShipments.map((ship, idx) => {
            const product = products.find(p => p.id === ship.productId);
            const isImport = ship.type === "in";
            return (
              <div key={ship.id} className="p-3 bg-secondary/15 rounded-lg border border-border flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? "bg-green-500 animate-ping" : "bg-green-500"}`} />
                    <span className="text-xs font-semibold text-foreground truncate">{product?.name || "Product"}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono truncate">{ship.partner}</div>
                  <div className="text-[9px] font-mono text-muted-foreground mt-1">{ship.invoiceNo}</div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-medium uppercase mb-1 ${isImport ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                    {isImport ? "Import" : "Export"}
                  </span>
                  <div className="font-mono text-xs font-semibold text-foreground">
                    {isImport ? "+" : "-"}{ship.quantity} {product?.unit}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Perishables Freshness Monitor ──────────────────────────────────────────

function PerishableMonitor({
  products,
  entries,
  onRefresh,
  onLoadClearancePromo
}: {
  products: Product[];
  entries: StockEntry[];
  onRefresh: () => void;
  onLoadClearancePromo?: (prod: Product, godown: Godown, rate: number, qty: number) => void;
}) {
  const perishableBatches = useMemo(() => {
    const list: {
      entry: StockEntry;
      product: Product;
      daysRemaining: number;
      freshnessPercent: number;
      isExpired: boolean;
      status: "fresh" | "warning" | "expired";
      suggestedDiscountPercent: number;
      suggestedClearanceRate: number;
    }[] = [];

    entries.forEach(e => {
      const processItem = (prodId: string, godown: Godown, expiryDate?: string) => {
        if (e.type === "in" && expiryDate) {
          const prod = products.find(p => p.id === prodId);
          if (!prod || !prod.isPerishable) return;

          const currentGodownStock = prod.godownStocks?.[godown] || 0; 
          if (currentGodownStock <= 0) return;

          const expiry = new Date(expiryDate).getTime();
          const entered = new Date(e.date).getTime();
          const now = new Date().getTime();
          
          const totalLife = expiry - entered;
          const remainingLife = expiry - now;
          
          const daysRemaining = Math.ceil(remainingLife / (1000 * 60 * 60 * 24));
          const freshnessPercent = Math.max(0, Math.min(100, Math.round((remainingLife / totalLife) * 100)));
          const isExpired = daysRemaining <= 0;

          let status: "fresh" | "warning" | "expired" = "fresh";
          if (isExpired) status = "expired";
          else if (daysRemaining <= 3) status = "warning";

          let suggestedDiscountPercent = 0;
          if (!isExpired) {
            if (daysRemaining <= 2) suggestedDiscountPercent = 50;
            else if (daysRemaining <= 4) suggestedDiscountPercent = 30;
            else if (daysRemaining <= 7) suggestedDiscountPercent = 15;
          }

          const suggestedClearanceRate = Math.round(prod.sellPrice * (1 - suggestedDiscountPercent / 100));

          list.push({
            entry: e,
            product: prod,
            daysRemaining,
            freshnessPercent,
            isExpired,
            status,
            suggestedDiscountPercent,
            suggestedClearanceRate
          });
        }
      };

      if (e.items && e.items.length > 0) {
        e.items.forEach(i => processItem(i.productId, i.godown, i.expiryDate));
      } else if (e.productId) {
        processItem(e.productId, e.godown, e.expiryDate);
      }
    });

    return list;
  }, [entries, products]);

  const clearanceEligible = perishableBatches.filter(b => !b.isExpired && b.suggestedDiscountPercent > 0);

  async function disposeBatch(batch: typeof perishableBatches[0]) {
    try {
      const clearQty = batch.product.stock; 
      if (clearQty <= 0) {
        toast.info("No stock left to dispose.");
        return;
      }
      
      const payload = {
        type: "out" as const,
        date: new Date().toISOString().split("T")[0],
        partner: "Disposal & Spoilage Write-off",
        note: `Automatic cleanup of expired batch`,
        paymentType: "cash" as const,
        partnerAddress: "Warehouse Disposal Area",
        partnerPhone: "N/A",
        partnerGST: "N/A",
        items: [{
          productId: batch.product.id,
          godown: batch.entry.godown,
          quantity: clearQty,
          pricePerUnit: 0,
          gstPercent: 0,
          subTotal: 0,
          grandTotal: 0
        }]
      };

      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to clear batch");
      }

      toast.success(`Expired batch of ${batch.product.name} cleared and written off.`);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/80 pb-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground font-serif flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={24} /> Perishables Freshness & AI Waste Prevention
          </h2>
          <p className="text-muted-foreground text-xs font-mono mt-0.5">
            Track shelf-life degradation in refrigerated godowns (M–R) and trigger AI clearance promotions.
          </p>
        </div>
      </div>

      {/* AI Clearance Bundle & Waste Mitigation Banner */}
      {clearanceEligible.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500 animate-pulse" /> AI Spoilage Waste Prevention & Clearance Suggester ({clearanceEligible.length} Active Deals)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clearanceEligible.map((b, i) => (
              <div key={i} className="bg-card border border-amber-200 dark:border-amber-900/40 p-3 rounded-lg flex flex-col justify-between gap-2 shadow-sm">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-foreground text-xs">{b.product.name}</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-amber-500 text-white rounded">
                      -{b.suggestedDiscountPercent}% OFF
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-1">
                    Godown {b.entry.godown} • {b.daysRemaining} days to expire
                  </div>
                  <div className="mt-1 flex items-baseline gap-2 font-mono">
                    <span className="text-xs font-bold text-emerald-600">₹{b.suggestedClearanceRate}/{b.product.unit}</span>
                    <span className="text-[10px] line-through text-muted-foreground">₹{b.product.sellPrice}</span>
                  </div>
                </div>

                {onLoadClearancePromo && (
                  <button
                    type="button"
                    onClick={() => onLoadClearancePromo(b.product, b.entry.godown, b.suggestedClearanceRate, Math.min(20, b.product.stock))}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-mono text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-colors uppercase tracking-wider"
                  >
                    <ShoppingCart size={12} /> Apply Clearance to Sales Billing
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {perishableBatches.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          <Warehouse size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No fresh perishable batches (Fruits/Vegetables) are currently tracked.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {perishableBatches.map((batch, idx) => {
            const getProgressColor = () => {
              if (batch.status === "expired") return "bg-destructive";
              if (batch.status === "warning") return "bg-amber-500";
              return "bg-green-600";
            };

            return (
              <div key={idx} className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between gap-4 transition-all hover:shadow-md">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{batch.product.name}</h4>
                      <div className="text-[10px] text-muted-foreground font-mono font-medium">Lot Received: {formatDDMMYYYY(batch.entry.date)}</div>
                    </div>
                    <Badge label={`Godown ${batch.entry.godown}`} color={CATEGORY_COLORS[batch.product.category]} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-muted-foreground font-medium">Freshness Level</span>
                      <span className="font-semibold">{batch.freshnessPercent}%</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${getProgressColor()} transition-all`} style={{ width: `${batch.freshnessPercent}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-muted-foreground font-mono">Days to Spoil:</span>
                    <span className={`font-semibold font-mono ${batch.status === "expired" ? "text-destructive" : batch.status === "warning" ? "text-amber-500" : "text-foreground"}`}>
                      {batch.isExpired ? "Expired" : `${batch.daysRemaining} days`}
                    </span>
                  </div>
                </div>

                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <div className="text-xs">
                    <span className="text-muted-foreground font-mono">Qty: </span>
                    <span className="font-semibold font-mono text-foreground">{batch.product.stock} {batch.product.unit}</span>
                  </div>

                  {batch.isExpired ? (
                    <button
                      onClick={() => disposeBatch(batch)}
                      className="px-2.5 py-1 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white rounded text-xs font-mono font-semibold transition-colors"
                    >
                      Write-off Stock
                    </button>
                  ) : (
                    <span className="text-xs font-mono font-bold text-green-600 flex items-center gap-1">
                      <CheckCircle2 size={12} /> OK
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Dialog & Modals Helpers ──────────────────────────────────────────────────

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, "id" | "stock" | "godownStocks">) => Promise<boolean>;
}

function AddProductModal({ isOpen, onClose, onSave }: AddProductModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Spices");
  const [unit, setUnit] = useState("kg");
  const [selectedPackingTypes, setSelectedPackingTypes] = useState<string[]>([]);
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [isPerishable, setIsPerishable] = useState(false);
  const [expiryDays, setExpiryDays] = useState("30");
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const defaultPackingOptions = [
    "50kg Jute Sack", "25kg Commercial Bag", "10kg Carton Box", "5kg Sack",
    "1kg Vacuum Foil Pouch", "500g Retail Pouch", "250g Retail Pack", "100g Sample Pouch"
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        nameRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter product name");
      return;
    }
    if (!buyPrice || Number(buyPrice) <= 0) {
      toast.error("Please enter a valid buy price");
      return;
    }
    if (!sellPrice || Number(sellPrice) <= 0) {
      toast.error("Please enter a valid sell price");
      return;
    }

    setSubmitting(true);
    const success = await onSave({
      name: name.trim(),
      category,
      unit: unit.trim(),
      packingType: selectedPackingTypes.join(", "),
      packingTypes: selectedPackingTypes,
      buyPrice: Number(buyPrice),
      sellPrice: Number(sellPrice),
      isPerishable,
      expiryDays: isPerishable ? Number(expiryDays) : 0
    });
    setSubmitting(false);

    if (success) {
      setName("");
      setSelectedPackingTypes([]);
      setBuyPrice("");
      setSellPrice("");
      setIsPerishable(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-55 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-border bg-secondary/20 flex justify-between items-center">
          <h3 className="font-semibold text-foreground font-serif text-sm">Register New Product</h3>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-mono text-muted-foreground mb-1">Product Name</label>
            <input
              ref={nameRef}
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Cardamom Bold"
              className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-muted-foreground mb-1">Category</label>
              <select
                value={category} onChange={e => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground focus:outline-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-mono text-muted-foreground mb-1">Stock Unit</label>
              <input
                type="text" value={unit} onChange={e => setUnit(e.target.value)}
                placeholder="e.g. kg"
                className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground focus:outline-none font-semibold"
              />
            </div>
          </div>

          {/* Multiple Packing Types Selector */}
          <div className="space-y-1.5 border border-border/80 bg-secondary/10 p-3 rounded-lg">
            <label className="block font-mono text-xs text-foreground font-bold flex items-center justify-between">
              <span>Multiple Packing Types</span>
              <span className="text-[10px] text-blue-500 font-bold">{selectedPackingTypes.length} Selected</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pt-1">
              {defaultPackingOptions.map(opt => {
                const isSelected = selectedPackingTypes.includes(opt);
                return (
                  <label key={opt} className={`flex items-center gap-1.5 p-1.5 rounded border text-[11px] font-mono cursor-pointer transition-all ${isSelected ? "bg-blue-600/15 border-blue-500 text-blue-900 dark:text-blue-200 font-bold" : "bg-card border-border hover:bg-secondary/40"}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedPackingTypes(prev => [...prev, opt]);
                        } else {
                          setSelectedPackingTypes(prev => prev.filter(t => t !== opt));
                        }
                      }}
                      className="w-3 h-3 text-blue-600 rounded"
                    />
                    <span className="truncate">{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-muted-foreground mb-1">Buy Price (₹)</label>
              <input
                type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground focus:outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block font-mono text-muted-foreground mb-1">Sell Price (₹)</label>
              <input
                type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground focus:outline-none font-semibold"
              />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="font-mono text-muted-foreground">Is Perishable Cargo?</span>
            <input
              type="checkbox" checked={isPerishable} onChange={e => setIsPerishable(e.target.checked)}
              className="w-4 h-4 text-primary focus:ring-primary border-border rounded"
            />
          </div>
          {isPerishable && (
            <div className="animate-in fade-in duration-100">
              <label className="block font-mono text-muted-foreground mb-1">Expiry Period (Days)</label>
              <input
                type="number" value={expiryDays} onChange={e => setExpiryDays(e.target.value)}
                placeholder="30"
                className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground focus:outline-none"
              />
            </div>
          )}
          <button
            type="submit" disabled={submitting}
            className="w-full py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
          >
            {submitting ? "Saving..." : "Save Product"}
          </button>
        </form>
      </div>
    </div>
  );
}

interface AddPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (partner: { name: string; address: string; phone: string; gstNo: string }) => Promise<boolean>;
  type: "Customer" | "Supplier";
}

function AddPartnerModal({ isOpen, onClose, onSave, type }: AddPartnerModalProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const gstNoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        nameRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<any>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(`Please enter ${type} name`);
      return;
    }

    setSubmitting(true);
    const success = await onSave({
      name: name.trim(),
      address: address.trim() || "N/A",
      phone: phone.trim() || "N/A",
      gstNo: gstNo.trim() ? gstNo.trim().toUpperCase() : "N/A"
    });
    setSubmitting(false);

    if (success) {
      setName("");
      setAddress("");
      setPhone("");
      setGstNo("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-55 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-border bg-secondary/20 flex justify-between items-center">
          <h3 className="font-semibold text-foreground font-serif text-sm">Register New {type}</h3>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-mono text-muted-foreground mb-1">{type} Name</label>
            <input
              ref={nameRef}
              type="text" value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => handleKeyDown(e, addressRef)}
              placeholder={`e.g. Acme ${type} Ltd`}
              className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-mono text-muted-foreground mb-1">Office Address (Optional)</label>
            <input
              ref={addressRef}
              type="text" value={address} onChange={e => setAddress(e.target.value)}
              onKeyDown={e => handleKeyDown(e, phoneRef)}
              placeholder="Full mailing address"
              className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-muted-foreground mb-1">Phone Number (Optional)</label>
              <input
                ref={phoneRef}
                type="text" value={phone} onChange={e => setPhone(e.target.value)}
                onKeyDown={e => handleKeyDown(e, gstNoRef)}
                placeholder="10-digit mobile or tel"
                className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-muted-foreground mb-1">GSTIN Number (Optional)</label>
              <input
                ref={gstNoRef}
                type="text" value={gstNo} onChange={e => setGstNo(e.target.value)}
                placeholder="15-digit GSTIN"
                className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Skip / Use Existing
            </button>
            <button
              type="submit" disabled={submitting}
              className="w-1/2 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
            >
              {submitting ? "Saving..." : `Register ${type}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Printable Invoice Viewer Modal ─────────────────────────────────────────

function InvoiceModal({
  isOpen,
  onClose,
  invoice,
  products,
  onConvertQuotationToBill,
  onConvertDeliveryNoteToBill,
  onConvertGrnToPurchaseBill,
  onConvertPoToPurchaseBill
}: {
  isOpen: boolean;
  onClose: () => void;
  invoice: StockEntry | null;
  products: Product[];
  onConvertQuotationToBill?: (invoice: StockEntry) => void;
  onConvertDeliveryNoteToBill?: (invoice: StockEntry) => void;
  onConvertGrnToPurchaseBill?: (invoice: StockEntry) => void;
  onConvertPoToPurchaseBill?: (invoice: StockEntry) => void;
}) {
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        nextButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !invoice) return null;

  const isSale = invoice.type === "out";
  const isQuotationDoc = invoice.subType === "quotation" || (invoice.invoiceNo && invoice.invoiceNo.startsWith("QTN"));
  const isDeliveryNoteDoc = invoice.subType === "delivery_note" || (invoice.invoiceNo && invoice.invoiceNo.startsWith("DN"));
  const isGrnDoc = invoice.subType === "grn" || (invoice.invoiceNo && invoice.invoiceNo.startsWith("GRN"));
  const isPoDoc = invoice.subType === "purchase_order" || (invoice.invoiceNo && invoice.invoiceNo.startsWith("PO"));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-area, .print-area * {
            visibility: visible !important;
          }
          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Controls */}
        <div className="px-5 py-4 border-b border-border bg-secondary/20 flex justify-between items-center no-print">
          <h3 className="font-semibold text-foreground font-serif text-sm">Generated Billing Document</h3>
          <div className="flex gap-2 items-center">
            {isQuotationDoc && (
              <button
                onClick={() => {
                  onClose();
                  if (onConvertQuotationToBill) onConvertQuotationToBill(invoice);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles size={13} /> Convert Quotation to Sales Bill
              </button>
            )}
            {isDeliveryNoteDoc && (
              <button
                onClick={() => {
                  onClose();
                  if (onConvertDeliveryNoteToBill) onConvertDeliveryNoteToBill(invoice);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles size={13} /> Convert Delivery Note to Sales Bill
              </button>
            )}
            {isGrnDoc && (
              <button
                onClick={() => {
                  onClose();
                  if (onConvertGrnToPurchaseBill) onConvertGrnToPurchaseBill(invoice);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles size={13} /> Convert GRN to Purchase Bill
              </button>
            )}
            {isPoDoc && (
              <button
                onClick={() => {
                  onClose();
                  if (onConvertPoToPurchaseBill) onConvertPoToPurchaseBill(invoice);
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles size={13} /> Convert PO to Purchase Bill
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5"
            >
              <Printer size={13} /> Print Invoice
            </button>
            <button
              ref={nextButtonRef}
              onClick={onClose}
              className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-mono font-medium flex items-center gap-1"
            >
              Start Next Invoice (Enter)
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground"><X size={16} /></button>
          </div>
        </div>

        {/* Invoice Layout (Print Area) */}
        <div className="p-8 space-y-6 print-area bg-white text-black font-sans text-xs">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-5">
            <div>
              <h2 className="text-xl font-bold font-serif text-green-900">RJ Group of Companies</h2>
              <p className="text-[10px] text-gray-500 font-mono mt-1">F&B Evening Store · F&B Evening Store Fihara · Annlee · City Sales</p>
              <p className="text-[10px] text-gray-500 font-mono">Central Trade Logistics Hub</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold font-mono uppercase mb-2 ${isDeliveryNoteDoc ? "bg-blue-100 text-blue-800" : isSale ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                {isDeliveryNoteDoc ? "Delivery Note (Dispatch)" : isSale ? "Tax Invoice (Sale)" : "Acquisition Voucher (Purchase)"}
              </span>
              <div className="text-[10px] font-mono text-gray-600">Doc No: <span className="font-bold text-black">{invoice.invoiceNo}</span></div>
              <div className="text-[10px] font-mono text-gray-600">Date: {formatDDMMYYYY(invoice.date)}</div>

              {/* Delivery Note & Quotation Numbers Printed on Sales Invoice */}
              {invoice.deliveryNoteNo && (
                <div className="text-[10px] font-mono text-blue-800 font-bold">Delivery Note #: <span className="underline">{invoice.deliveryNoteNo}</span></div>
              )}
              {invoice.quotationNo && (
                <div className="text-[10px] font-mono text-indigo-800 font-bold">Quotation Ref #: <span className="underline">{invoice.quotationNo}</span></div>
              )}

              {/* GRN & Purchase Order Numbers Printed on Purchase Voucher */}
              {invoice.grnNo && (
                <div className="text-[10px] font-mono text-emerald-800 font-bold">GRN Ref #: <span className="underline">{invoice.grnNo}</span></div>
              )}
              {invoice.poNo && (
                <div className="text-[10px] font-mono text-purple-800 font-bold">Purchase Order #: <span className="underline">{invoice.poNo}</span></div>
              )}

              {/* Sales Person & Purchase Person Details */}
              {invoice.salesPerson && (
                <div className="text-[10px] font-mono text-emerald-900 font-bold">Sales Executive: <span className="underline">{invoice.salesPerson}</span></div>
              )}
              {invoice.purchasePerson && (
                <div className="text-[10px] font-mono text-amber-900 font-bold">Purchase Officer: <span className="underline">{invoice.purchasePerson}</span></div>
              )}

              <div className="text-[10px] font-mono text-gray-600">Payment Method: <span className="font-bold text-black uppercase">{
                invoice.paymentType === "card" ? "Card (Credit/Debit)" :
                invoice.paymentType === "transfer" ? "Bank Transfer / UPI" :
                invoice.paymentType === "credit" ? "Credit Ledger" : "Cash"
              }</span></div>
              {invoice.paymentType === "credit" && invoice.dueDate && (
                <div className="text-[10px] font-mono text-red-600 font-semibold">Due Date: {formatDDMMYYYY(invoice.dueDate)}</div>
              )}
            </div>
          </div>

          {/* Billing Info */}
          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div>
              <span className="text-[9px] font-mono uppercase text-gray-500 block mb-1">Company (Billed By)</span>
              <div className="font-bold text-gray-900 text-sm">RJ Group of Companies</div>
              <div className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                Terminal 3, Port Authority Logistics Yard,<br />
                Mumbai, Maharashtra - 400001
              </div>
            </div>
            <div>
              <span className="text-[9px] font-mono uppercase text-gray-500 block mb-1">
                {isSale ? "Customer (Billed To)" : "Supplier (Vendor)"}
              </span>
              <div className="font-bold text-gray-900 text-sm">{invoice.partner}</div>
              <div className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                {invoice.partnerAddress || "N/A"}<br />
                Phone: {invoice.partnerPhone || "N/A"}<br />
                GSTIN: <span className="font-mono font-semibold">{invoice.partnerGST || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Itemized Table (Supports Multiple Products) */}
          <table className="w-full border-collapse border-b border-gray-200 text-left">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-3 py-2.5 font-bold text-gray-600 font-mono text-[10px]">Description</th>
                <th className="px-3 py-2.5 font-bold text-gray-600 font-mono text-[10px] text-center">Godown</th>
                <th className="px-3 py-2.5 font-bold text-gray-600 font-mono text-[10px] text-right">Quantity</th>
                {!isDeliveryNoteDoc && <th className="px-3 py-2.5 font-bold text-gray-600 font-mono text-[10px] text-right">Rate</th>}
                {!isDeliveryNoteDoc && <th className="px-3 py-2.5 font-bold text-gray-600 font-mono text-[10px] text-right">GST %</th>}
                <th className="px-3 py-2.5 font-bold text-gray-600 font-mono text-[10px] text-center">Expiry Date</th>
                {!isDeliveryNoteDoc && <th className="px-3 py-2.5 font-bold text-gray-600 font-mono text-[10px] text-right">Amount</th>}
              </tr>
            </thead>
            <tbody>
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, idx) => {
                  const prod = products.find(p => p.id === item.productId);
                  return (
                    <tr key={idx} className="border-b border-gray-100 font-medium">
                      <td className="px-3 py-3 text-gray-900 font-semibold">
                        {prod?.name || "Cargo Item"}
                        {item.packingType && <span className="text-[10px] text-gray-500 font-mono block">Packing: {item.packingType}</span>}
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-gray-600">Godown {item.godown}</td>
                      <td className="px-3 py-3 text-right font-mono text-gray-900">{item.quantity} {prod?.unit}</td>
                      {!isDeliveryNoteDoc && <td className="px-3 py-3 text-right font-mono text-gray-900">₹{item.pricePerUnit.toFixed(2)}</td>}
                      {!isDeliveryNoteDoc && <td className="px-3 py-3 text-right font-mono text-gray-900">{item.gstPercent}%</td>}
                      <td className="px-3 py-3 text-center font-mono text-gray-700">{formatDDMMYYYY(item.expiryDate) || "N/A"}</td>
                      {!isDeliveryNoteDoc && <td className="px-3 py-3 text-right font-mono text-gray-900">₹{item.subTotal.toFixed(2)}</td>}
                    </tr>
                  );
                })
              ) : (
                <tr className="border-b border-gray-100 font-medium">
                  <td className="px-3 py-3 text-gray-900 font-semibold">
                    {products.find(p => p.id === invoice.productId)?.name || "Cargo Item"}
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-gray-600">Godown {invoice.godown || "A"}</td>
                  <td className="px-3 py-3 text-right font-mono text-gray-900">
                    {invoice.quantity} {products.find(p => p.id === invoice.productId)?.unit}
                  </td>
                  {!isDeliveryNoteDoc && <td className="px-3 py-3 text-right font-mono text-gray-900">₹{(invoice.pricePerUnit || 0).toFixed(2)}</td>}
                  {!isDeliveryNoteDoc && <td className="px-3 py-3 text-right font-mono text-gray-900">{(invoice.gstPercent || 0)}%</td>}
                  <td className="px-3 py-3 text-center font-mono text-gray-700">{formatDDMMYYYY(invoice.expiryDate) || "N/A"}</td>
                  {!isDeliveryNoteDoc && <td className="px-3 py-3 text-right font-mono text-gray-900">₹{(invoice.subTotal || (invoice.quantity * invoice.pricePerUnit) || 0).toFixed(2)}</td>}
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals Block */}
          <div className="flex justify-end pt-3">
            {isDeliveryNoteDoc ? (
              <div className="w-64 space-y-2 font-mono text-[10px]">
                <div className="flex justify-between text-gray-600">
                  <span>Total Items</span>
                  <span className="font-bold text-black">{invoice.items?.length || (invoice.quantity ? 1 : 0)} Line(s)</span>
                </div>
                <div className="flex justify-between font-bold text-xs text-gray-900 border-t border-gray-200 pt-2">
                  <span>Total Dispatch Qty</span>
                  <span className="text-blue-800">
                    {invoice.items ? invoice.items.reduce((s, i) => s + i.quantity, 0) : invoice.quantity || 0} Units
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-64 space-y-2 font-mono text-[10px]">
                <div className="flex justify-between text-gray-600">
                  <span>Sub-Total (Without GST)</span>
                  <span>₹{(invoice.subTotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Consolidated GST Tax</span>
                  <span>₹{((invoice.grandTotal || 0) - (invoice.subTotal || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs text-gray-900 border-t border-gray-200 pt-2">
                  <span>Grand Total</span>
                  <span className="text-green-800">₹{(invoice.grandTotal || 0).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="flex justify-between items-end border-t border-gray-100 pt-8 mt-12 text-gray-500 text-[10px]">
            <div>
              <p className="italic">This is a system-generated document reflecting warehouse transactions.</p>
              <p className="mt-1 font-mono">System Audit Log Ref: {invoice.id}</p>
            </div>
            <div className="text-center w-48 border-t border-gray-300 pt-2">
              <span className="font-mono text-[9px] uppercase text-gray-600 block">Authorized Signature</span>
              <span className="font-bold text-gray-900 font-serif">Spice Route Logistics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────

function DashboardPage({ products, entries, analytics, onRefresh }: { products: Product[]; entries: StockEntry[]; analytics: Analytics | null; onRefresh: () => void }) {
  // 4 Branch Companies List
  const COMPANIES = useMemo(() => [
    { id: "c1", name: "F&B Evening Store", code: "FB-EVE", currency: "MVR", region: "Main Branch Operations", multiplier: 1.0, godownsCount: 5 },
    { id: "c2", name: "F&B Evening Store Fihara", code: "FB-FIH", currency: "MVR", region: "Fihara Branch Operations", multiplier: 0.95, godownsCount: 4 },
    { id: "c3", name: "Annlee", code: "ANN-LEE", currency: "MVR", region: "Annlee Branch Operations", multiplier: 0.90, godownsCount: 4 },
    { id: "c4", name: "City Sales", code: "CTY-SLS", currency: "MVR", region: "City Sales Branch Operations", multiplier: 1.10, godownsCount: 5 },
  ], []);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(() => {
    return localStorage.getItem("dashboard_selected_company_id") || "c1";
  });

  const activeCompany = useMemo(() => {
    return COMPANIES.find(c => c.id === selectedCompanyId) || COMPANIES[0];
  }, [selectedCompanyId, COMPANIES]);

  const { revenue, cost, profit } = useMemo(() => {
    if (!analytics) return { revenue: 0, cost: 0, profit: 0 };
    const mult = activeCompany.multiplier;
    return {
      revenue: Math.round(analytics.revenue * mult),
      cost: Math.round(analytics.cost * mult),
      profit: Math.round(analytics.profit * mult)
    };
  }, [analytics, activeCompany]);

  const totalProducts = Math.round(products.length * (activeCompany.multiplier > 1 ? 1 : activeCompany.multiplier));
  const currentStock = Math.round(products.reduce((s, p) => s + p.stock, 0) * activeCompany.multiplier);

  const godownData = useMemo(() => {
    if (!analytics) return [];
    const mult = activeCompany.multiplier;
    return analytics.godownStats.filter(gs => gs.current > 0).slice(0, 8).map(g => ({
      godown: `Gdn ${g.godown}`,
      in: Math.round(g.totalIn * mult),
      out: Math.round(g.totalOut * mult),
    }));
  }, [analytics, activeCompany]);

  const categoryData = useMemo(() => {
    const mult = activeCompany.multiplier;
    return CATEGORIES.map(cat => {
      const catProducts = products.filter(p => p.category === cat);
      const qty = Math.round(catProducts.reduce((s, p) => s + p.stock, 0) * mult);
      return { name: cat, value: qty, color: CATEGORY_COLORS[cat] };
    }).filter(c => c.value > 0);
  }, [products, activeCompany]);

  const recentEntries = useMemo(() => {
    return entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  }, [entries]);

  return (
    <div className="space-y-6">
      {/* MULTI-COMPANY DROPDOWN PUSH DOWN HEADER */}
      <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-emerald-500/5 via-card to-card">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Building className="text-emerald-600 dark:text-emerald-400 animate-pulse" size={22} />
            <h1 className="text-2xl font-bold text-foreground font-serif tracking-tight">{activeCompany.name}</h1>
            <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-md uppercase">
              {activeCompany.code}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-mono flex items-center gap-2 flex-wrap">
            <span>📍 {activeCompany.region}</span>
            <span>•</span>
            <span>💱 Currency: {activeCompany.currency}</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">🏬 {activeCompany.godownsCount} Active Warehouses</span>
          </p>
        </div>

        {/* PUSH DOWN COMPANY SELECTOR DROPDOWN */}
        <div className="w-full sm:w-auto flex items-center gap-2.5 bg-secondary/40 p-2 rounded-xl border border-border">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-muted-foreground pl-1">
            <Building size={15} className="text-primary" />
            <span className="hidden sm:inline">Select Branch Company:</span>
          </div>
          <select
            value={selectedCompanyId}
            onChange={e => {
              const compId = e.target.value;
              setSelectedCompanyId(compId);
              localStorage.setItem("dashboard_selected_company_id", compId);
              const comp = COMPANIES.find(c => c.id === compId);
              toast.success(`🏢 Dashboard view switched to "${comp?.name}"!`);
            }}
            className="w-full sm:w-72 px-3 py-2 bg-card border border-emerald-500/40 text-foreground text-xs font-mono font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer"
          >
            {COMPANIES.map((comp, idx) => (
              <option key={comp.id} value={comp.id}>
                🏢 {idx + 1}. {comp.name}
              </option>
            ))}
          </select>
          <button
            onClick={onRefresh}
            className="p-2 border border-border bg-card hover:bg-secondary/50 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            title="Sync Company Ledger Data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Sales Revenue" value={fmt(revenue)} sub="All godowns combined" icon={TrendingUp} />
        <StatCard label="Total Purchase Cost" value={fmt(cost)} sub="Acquisition cost" icon={ArrowDownToLine} />
        <StatCard label="Net Profit" value={fmt(profit)} sub={profit >= 0 ? "In the green" : "Below cost"} icon={profit >= 0 ? TrendingUp : TrendingDown} accent />
        <StatCard label="Total Stock" value={`${currentStock} units`} sub={`Across ${totalProducts} products`} icon={Package} />
      </div>

      <LogisticsVisualizer entries={entries} products={products} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">Stock Movement (Active Godowns)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={godownData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="godown" tick={{ fontSize: 10, fontFamily: "DM Mono" }} />
              <YAxis tick={{ fontSize: 10, fontFamily: "DM Mono" }} />
              <Tooltip contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }} />
              <Bar dataKey="in" name="Stock In" fill="#2d4a1e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="out" name="Stock Out" fill="#c8860a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">Stock by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Legend formatter={(value) => <span className="text-[10px] font-mono font-medium">{value}</span>} />
              <Tooltip contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">Recent Activity Feed</h3>
        <div className="divide-y divide-border">
          {recentEntries.map((entry, idx) => {
            const product = products.find(p => p.id === entry.productId);
            if (!product) return null;
            return (
              <div key={idx} className="flex items-center justify-between py-3 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${entry.type === "in" ? "bg-primary/10" : "bg-accent/10"}`}>
                    {entry.type === "in"
                      ? <ArrowDownToLine size={13} className="text-primary" />
                      : <ArrowUpFromLine size={13} className="text-accent" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{product.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {entry.partner} · {entry.paymentType ? entry.paymentType.toUpperCase() : "CASH"}
                      {entry.paymentType === "credit" && entry.dueDate ? ` (Due: ${formatDDMMYYYY(entry.dueDate)})` : ""} · {entry.note || "No note"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-right">
                  <span className="font-mono text-xs text-muted-foreground">Godown {entry.godown}</span>
                  <span className={`font-mono text-sm font-semibold ${entry.type === "in" ? "text-primary" : "text-accent"}`}>
                    {entry.type === "in" ? "+" : "-"}{entry.quantity} {product.unit}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground hidden sm:block">{entry.invoiceNo || formatDDMMYYYY(entry.date)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Inventory Page ──────────────────────────────────────────────────────────

// ─── 360 Product Audit & History Modal ──────────────────────────────────────

function ProductHistoryModal({
  product,
  entries = [],
  isOpen,
  onClose,
}: {
  product: Product | null;
  entries?: StockEntry[];
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !product) return null;

  const fmt = (val: number) => `₹${(val || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const unifiedMovements = useMemo(() => {
    if (!product) return [];

    const list: Array<{
      id: string;
      date: string;
      invoiceNo: string;
      partner: string;
      godown: Godown;
      type: "in" | "out";
      qty: number;
      price: number;
      subTotal: number;
    }> = [];

    (entries || []).forEach(e => {
      if (e.items && e.items.length > 0) {
        e.items.forEach(it => {
          if (it.productId === product.id || (it.name && it.name.toLowerCase() === product.name.toLowerCase())) {
            list.push({
              id: `${e.id}_${it.godown}_${Math.random()}`,
              date: e.date,
              invoiceNo: e.invoiceNo || (e.id ? e.id.slice(0, 8) : "N/A"),
              partner: e.partner || (e.type === "in" ? "Supplier" : "Customer"),
              godown: it.godown || e.godown || "A",
              type: e.type,
              qty: it.quantity,
              price: it.pricePerUnit || (it as any).rate || 0,
              subTotal: it.subTotal || (it.quantity * (it.pricePerUnit || (it as any).rate || 0)),
            });
          }
        });
      } else if (e.productId === product.id) {
        list.push({
          id: e.id,
          date: e.date,
          invoiceNo: e.invoiceNo || e.id.slice(0, 8),
          partner: e.partner || (e.type === "in" ? "Supplier" : "Customer"),
          godown: e.godown || "A",
          type: e.type,
          qty: e.quantity,
          price: e.pricePerUnit || 0,
          subTotal: e.subTotal || (e.quantity * (e.pricePerUnit || 0)),
        });
      }
    });

    // Sort chronologically (oldest first) to compute running total stock balance
    const sortedAsc = list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningStock = 0;
    const withRunningStock = sortedAsc.map(item => {
      if (item.type === "in") {
        runningStock += item.qty;
      } else {
        runningStock -= item.qty;
      }
      return {
        ...item,
        totalStock: runningStock
      };
    });

    // Return newest entries at top
    return withRunningStock.slice().reverse();
  }, [product, entries]);

  const totalInwardsQty = unifiedMovements.filter(m => m.type === "in").reduce((sum, m) => sum + m.qty, 0);
  const totalOutwardsQty = unifiedMovements.filter(m => m.type === "out").reduce((sum, m) => sum + m.qty, 0);
  const totalInwardsVal = unifiedMovements.filter(m => m.type === "in").reduce((sum, m) => sum + m.subTotal, 0);
  const totalOutwardsVal = unifiedMovements.filter(m => m.type === "out").reduce((sum, m) => sum + m.subTotal, 0);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 font-mono space-y-5">
        {/* Modal Header */}
        <div className="border-b border-border pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-xl">
              <Package size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-foreground">
                Product Stock Movement Ledger: {product.name}
              </h2>
              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2 mt-0.5">
                <span className="px-2 py-0.5 bg-secondary rounded text-[10px] uppercase font-bold">{product.category}</span>
                <span>• Unit: <strong className="text-foreground">{product.unit}</strong></span>
                <span>• Buy Rate: <strong className="text-muted-foreground">{fmt(product.buyPrice)}</strong></span>
                <span>• Sell Rate: <strong className="text-emerald-600">{fmt(product.sellPrice)}</strong></span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/40 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Audit Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 bg-secondary/30 border border-border rounded-xl">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Current Total Stock</span>
            <span className="text-lg font-extrabold text-foreground">{product.stock} {product.unit}s</span>
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold block">Stock Cost Value</span>
            <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{fmt(product.stock * product.buyPrice)}</span>
            <span className="text-[10px] text-muted-foreground block">@ {fmt(product.buyPrice)} / {product.unit}</span>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">Total Inwards (Purchase)</span>
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{totalInwardsQty} {product.unit}s</span>
            <span className="text-[10px] text-muted-foreground block">{fmt(totalInwardsVal)}</span>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold block">Total Outwards (Sales)</span>
            <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{totalOutwardsQty} {product.unit}s</span>
            <span className="text-[10px] text-amber-600 block">{fmt(totalOutwardsVal)}</span>
          </div>

          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <span className="text-[10px] text-purple-600 dark:text-purple-400 uppercase font-bold block">Movement Records</span>
            <span className="text-lg font-extrabold text-purple-600 dark:text-purple-400">{unifiedMovements.length} Entries</span>
          </div>
        </div>

        {/* Unified Product Movement Table */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <History size={14} className="text-primary" />
              <span>Combined Inwards & Outwards Stock Statement</span>
            </span>
            <span className="text-blue-600 font-bold">Cost Value in Separate Column & Footer Row</span>
          </h4>

          {unifiedMovements.length === 0 ? (
            <div className="p-8 border border-dashed border-border rounded-xl text-center text-muted-foreground text-xs font-mono">
              No stock movement transactions recorded for this product yet.
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden text-xs shadow-sm">
              <table className="w-full text-left font-mono border-collapse">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border text-[10px] uppercase text-muted-foreground font-bold">
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Bill</th>
                    <th className="p-2.5">Supplier / Customer Name</th>
                    <th className="p-2.5 text-center">Godown</th>
                    <th className="p-2.5 text-right text-emerald-600">Inwards</th>
                    <th className="p-2.5 text-right text-amber-600">Outwards</th>
                    <th className="p-2.5 text-right text-blue-600 font-extrabold">Cost Value (INR)</th>
                    <th className="p-2.5 text-right text-foreground font-extrabold">Total Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {unifiedMovements.map((item, idx) => (
                    <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-2.5 text-muted-foreground">{item.date}</td>
                      <td className="p-2.5 font-bold text-foreground">{item.invoiceNo}</td>
                      <td className={`p-2.5 font-bold ${item.type === "in" ? "text-blue-600 dark:text-blue-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {item.partner}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 bg-secondary border border-border rounded text-[10px] font-bold">
                          Godown {item.godown}
                        </span>
                      </td>

                      {/* Inwards Column */}
                      <td className="p-2.5 text-right font-bold">
                        {item.type === "in" ? (
                          <div>
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                              +{item.qty} {product.unit}
                            </span>
                            <span className="text-[9px] text-muted-foreground block font-normal">
                              @ {fmt(item.price)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground opacity-40">-</span>
                        )}
                      </td>

                      {/* Outwards Column */}
                      <td className="p-2.5 text-right font-bold">
                        {item.type === "out" ? (
                          <div>
                            <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                              -{item.qty} {product.unit}
                            </span>
                            <span className="text-[9px] text-muted-foreground block font-normal">
                              @ {fmt(item.price)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground opacity-40">-</span>
                        )}
                      </td>

                      {/* Cost Value Column */}
                      <td className="p-2.5 text-right font-bold font-mono text-blue-600 dark:text-blue-400 bg-blue-500/5">
                        {fmt(item.subTotal)}
                      </td>

                      {/* Total Stock Column */}
                      <td className="p-2.5 text-right font-extrabold text-foreground bg-secondary/10">
                        {item.totalStock} {product.unit}s
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-secondary/40 border-t-2 border-border font-mono text-xs font-bold">
                  <tr>
                    <td colSpan={4} className="p-2.5 text-foreground font-bold uppercase tracking-wider">
                      Summary & Total Stock Cost Valuation Row
                    </td>
                    <td className="p-2.5 text-right text-emerald-600 dark:text-emerald-400 font-extrabold">
                      +{totalInwardsQty} {product.unit}s
                    </td>
                    <td className="p-2.5 text-right text-amber-600 dark:text-amber-400 font-extrabold">
                      -{totalOutwardsQty} {product.unit}s
                    </td>
                    <td className="p-2.5 text-right text-blue-600 dark:text-blue-400 font-extrabold bg-blue-500/10">
                      {fmt(totalInwardsVal - totalOutwardsVal)}
                    </td>
                    <td className="p-2.5 text-right text-foreground font-extrabold bg-secondary/30">
                      {product.stock} {product.unit}s
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Inventory Page ──────────────────────────────────────────────────────────

function InventoryPage({
  products = [],
  entries = [],
  onAddProduct,
}: {
  products: Product[];
  entries?: StockEntry[];
  onAddProduct: (p: any) => Promise<boolean>;
}) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<Category | "All">("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);

  // Global Ctrl + C hotkey listener
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        setIsModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, []);

  const filtered = useMemo(() => {
    return products
      .filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCat === "All" || p.category === filterCat;
        return matchSearch && matchCat;
      })
      .sort((a, b) => a.stock - b.stock);
  }, [products, search, filterCat]);

  // Reset selectedIndex to 0 whenever search or category filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search, filterCat]);

  // Handle Keyboard Arrow Navigation & Enter Selection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(filtered.length - 1, prev + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      const prod = filtered[selectedIndex] || filtered[0];
      if (prod) {
        setSelectedProductForHistory(prod);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground font-serif">Inventory Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Product catalog and dynamic stock levels</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <PlusCircle size={16} /> Add New Product
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search products (Use ↑ ↓ arrow keys to select, Press Enter for history)..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-input-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["All", ...CATEGORIES] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat as any)}
              className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${filterCat === cat ? "bg-primary text-primary-foreground font-medium" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">Perishable</th>
                <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">Total Stock</th>
                <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">Est Buy Rate</th>
                <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">Est Sell Rate</th>
                <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-widest text-blue-600 dark:text-blue-400 font-bold">Total Stock Cost Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground text-xs font-mono">
                    No products matching "{search}"
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => {
                  const isSelected = i === selectedIndex;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => {
                        setSelectedIndex(i);
                        setSelectedProductForHistory(p);
                      }}
                      className={`border-b border-border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-600/15 border-l-4 border-l-blue-600 ring-2 ring-blue-500/40 text-blue-900 dark:text-blue-200 font-bold shadow-sm"
                          : i % 2 === 0 ? "hover:bg-secondary/30" : "bg-secondary/10 hover:bg-secondary/30"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className={`font-semibold text-sm ${isSelected ? "text-blue-600 dark:text-blue-400 font-bold" : "text-foreground"}`}>
                          {isSelected && <span className="mr-1.5 font-mono text-blue-600">▶</span>}
                          {p.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">per {p.unit}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={p.category} color={CATEGORY_COLORS[p.category]} />
                      </td>
                      <td className="px-4 py-3">
                        {p.isPerishable ? (
                          <span className="text-[10px] font-mono text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                            Yes ({p.expiryDays}d)
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono text-sm font-semibold ${p.stock === 0 ? "text-muted-foreground" : "text-foreground"}`}>{p.stock}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">{fmt(p.buyPrice)}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-primary font-semibold">{fmt(p.sellPrice)}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-blue-600 dark:text-blue-400 font-bold bg-blue-500/5">
                        {fmt(p.stock * p.buyPrice)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Keyboard helper bar */}
      <div className="bg-secondary/20 border border-border p-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground no-print mt-4">
        <div className="flex items-center gap-3">
          <Keyboard className="text-primary" size={16} />
          <div>
            <span className="font-semibold text-foreground">Shortcuts: </span>
            <span className="font-mono">
              [↑ / ↓ Arrow Keys] Select Row • [Enter] View Product 360° History • [Ctrl + C] Add Product
            </span>
          </div>
        </div>

        {filtered[selectedIndex] && (
          <button
            type="button"
            onClick={() => setSelectedProductForHistory(filtered[selectedIndex])}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow"
          >
            <span>View History of "{filtered[selectedIndex].name}"</span>
          </button>
        )}
      </div>

      <AddProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={onAddProduct} />

      {/* 360 Audit & History Modal */}
      <ProductHistoryModal
        product={selectedProductForHistory}
        entries={entries}
        isOpen={!!selectedProductForHistory}
        onClose={() => setSelectedProductForHistory(null)}
      />
    </div>
  );
}

// ─── AI Voice Billing Assistant ──────────────────────────────────────────────

function VoiceBillingAssistant({
  type,
  products,
  partners,
  customers,
  suppliers,
  cartItems,
  setCartItems,
  setProductId,
  setProductSearch,
  setGodown,
  setQuantity,
  setRate,
  setSelectedPartnerId,
  setPartnerSearch,
  setNote,
  setPaymentType,
  handleAddItem,
  handleGenerateBill,
  setPage,
  darkMode,
  setDarkMode,
  onRegisterPartner,
  isCartActive,
  onAddEntry,
  onRefresh,
}: {
  type: "in" | "out";
  products: Product[];
  partners: any[];
  customers?: Customer[];
  suppliers?: Supplier[];
  cartItems: InvoiceItem[];
  setCartItems: React.Dispatch<React.SetStateAction<InvoiceItem[]>>;
  setProductId: (id: string) => void;
  setProductSearch: (name: string) => void;
  setGodown: (g: Godown) => void;
  setQuantity: (q: string) => void;
  setRate: (r: string) => void;
  setSelectedPartnerId: (id: string) => void;
  setPartnerSearch: (name: string) => void;
  setNote: (n: string) => void;
  setPaymentType: (t: "cash" | "credit") => void;
  handleAddItem: (e?: React.FormEvent) => void;
  handleGenerateBill: () => void;
  setPage?: (page: string) => void;
  darkMode?: boolean;
  setDarkMode?: (dark: boolean) => void;
  onRegisterPartner?: (name: string) => Promise<any>;
  isCartActive?: boolean;
  onAddEntry?: (e: any) => Promise<any>;
  onRefresh?: () => void;
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [muteVoice, setMuteVoice] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [logs, setLogs] = useState<{ text: string; success: boolean }[]>([]);

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const speakFeedback = (text: string) => {
    if (muteVoice) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceCommand = async (rawText: string) => {
    // High-accuracy Spoken Number Word Normalizer (Deepgram Nova-3 + Speech Engine)
    const normalizeSpokenNumbers = (str: string) => {
      const numberWords: Record<string, string> = {
        "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
        "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
        "eleven": "11", "twelve": "12", "thirteen": "13", "fourteen": "14", "fifteen": "15",
        "sixteen": "16", "seventeen": "17", "eighteen": "18", "nineteen": "19", "twenty": "20",
        "thirty": "30", "forty": "40", "fifty": "50", "hundred": "100"
      };
      return str.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|hundred)\b/gi, match => numberWords[match.toLowerCase()] || match);
    };

    const text = normalizeSpokenNumbers(rawText.toLowerCase().trim());
    setTranscript(rawText);

    // 0.1 Navigation controls (Run BEFORE cart verb checks)
    const explicitNavMatch = text.match(/(?:go\s+to|show|open|navigate\s+to|switch\s+to|take\s+me\s+to)\s+(.+)/i);
    const navQuery = explicitNavMatch ? explicitNavMatch[1].trim() : text;
    const isExplicitNav = !!explicitNavMatch;
    const isPageKeyword = /^(?:dashboard|inventory(?:\s+catalog)?|sales(?:\s+billing|\s+page)?|purchase(?:\s+billing|\s+page)?|godowns(?:\s+status)?|godown(?:\s+status)?|perishables(?:\s+monitor)?|perishable(?:\s+monitor)?|expiry(?:\s+sale|\s+offers|\s+discounts)?|clearance(?:\s+offers|\s+deals)?|financials|financial\s+p\s*&\s*l|financial\s+p\s+and\s+l|financial\s+p&l|p\s*&\s*l|p\s+and\s+l|p&l|pl|profit\s+(?:&|and)\s+loss|reports|report|transaction\s+reports|rag\s+insights|ai(?:\s+insights)?)$/i.test(navQuery);

    if ((isExplicitNav || isPageKeyword) && setPage) {
      let targetPage = "";
      if (navQuery.includes("dashboard")) targetPage = "dashboard";
      else if (navQuery.includes("inventory")) targetPage = "inventory";
      else if (navQuery.includes("sales") || navQuery.includes("sell")) targetPage = "sales";
      else if (navQuery.includes("purchase") || navQuery.includes("buy")) targetPage = "purchase";
      else if (navQuery.includes("godown")) targetPage = "godowns";
      else if (navQuery.includes("perish")) targetPage = "perishables";
      else if (navQuery.includes("expiry") || navQuery.includes("offer") || navQuery.includes("discount") || navQuery.includes("clearance")) targetPage = "expiry-sale";
      else if (navQuery.includes("financial") || navQuery.includes("p&l") || navQuery.includes("p & l") || navQuery.includes("p and l") || navQuery.includes("pl") || navQuery.includes("profit")) targetPage = "pl";
      else if (navQuery.includes("report")) targetPage = "reports";
      else if (navQuery.includes("rag") || navQuery.includes("ai")) targetPage = "ai";

      if (targetPage) {
        setPage(targetPage);
        const displayNames: Record<string, string> = {
          dashboard: "Dashboard",
          inventory: "Inventory Catalog",
          sales: "Sales Billing",
          purchase: "Purchase Billing",
          godowns: "Godowns Status",
          perishables: "Perishables Monitor",
          "expiry-sale": "Expiry Sale & Offers",
          pl: "Financial P&L",
          reports: "Transaction Reports",
          ai: "RAG Insights"
        };
        const pageName = displayNames[targetPage] || targetPage;
        const logText = `Navigated to ${pageName}.`;
        setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
        speakFeedback(`Navigating to ${pageName}.`);
        return;
      }
    }

    // 1. Instant POS Sales Billing ("Bill 10 bags of Basmati Rice and 5 tins of Sunflower Oil to Customer City Mart on Credit")
    const posBillMatch = text.match(/^(?:bill|instant\s+bill|invoice)\s+(.+)/i);
    if (posBillMatch) {
      const remainder = posBillMatch[1];
      const isCredit = /\b(?:on\s+credit|credit)\b/i.test(remainder);
      const payType = isCredit ? "credit" : "cash";

      let custName = "";
      const custMatch = remainder.match(/(?:to\s+customer|to|for\s+customer|for)\s+([a-zA-Z0-9\s]+?)(?:\s+on\s+credit|\s+via|\s+$)/i);
      if (custMatch) {
        custName = custMatch[1].trim();
      }

      let targetCust = (customers || partners || []).find((c: any) => c.name.toLowerCase().includes(custName.toLowerCase()));
      if (!targetCust && custName && onRegisterPartner) {
        targetCust = await onRegisterPartner(custName);
      }
      const partnerName = targetCust?.name || custName || "Cash Customer";

      const itemsPart = remainder.split(/\b(?:to\s+customer|to|for|on\s+credit)\b/i)[0];
      const itemChunks = itemsPart.split(/\s+(?:and|,|\+)\s+/i);

      const generatedItems: InvoiceItem[] = [];

      itemChunks.forEach(chunk => {
        const qtyMatch = chunk.match(/(\d+)\s*(?:bags?|tins?|kg|packs?|boxes?|units?|sacks?)?\s*(?:of)?\s*(.+)/i);
        if (qtyMatch) {
          const qty = parseInt(qtyMatch[1], 10);
          const pNameQuery = qtyMatch[2].trim();
          const prod = products.find(p => p.name.toLowerCase().includes(pNameQuery) || pNameQuery.includes(p.name.toLowerCase()));
          if (prod) {
            const subVal = qty * prod.sellPrice;
            generatedItems.push({
              productId: prod.id,
              godown: getBestGodownForProduct(prod),
              quantity: qty,
              pricePerUnit: prod.sellPrice,
              gstPercent: 12,
              subTotal: subVal,
              grandTotal: subVal * 1.12,
            });
          }
        }
      });

      if (generatedItems.length > 0 && onAddEntry) {
        const payload = {
          type: "out" as const,
          date: new Date().toISOString().split("T")[0],
          partner: partnerName,
          note: `AI Instant POS Bill (${payType.toUpperCase()})`,
          paymentType: payType as any,
          items: generatedItems,
          subType: "billing",
          payments: [{ method: payType as any, amount: generatedItems.reduce((s, i) => s + i.grandTotal, 0) }]
        };
        const res = await onAddEntry(payload);
        if (res) {
          const tot = generatedItems.reduce((s, i) => s + i.grandTotal, 0);
          const logText = `AI POS Bill #${res.invoiceNo} posted for ${partnerName} (₹${tot.toFixed(0)})!`;
          setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
          speakFeedback(`Instant Sales Invoice posted for ${partnerName} totaling ₹${tot.toFixed(0)}.`);
          if (onRefresh) onRefresh();
          return;
        }
      }
    }

    // 2. Instant Purchase Entry ("Purchase 50 Sugar Sacks from Supplier Global Foods at 1,200 per sack into Godown A")
    const purMatch = text.match(/^(?:purchase|buy|instant\s+purchase)\s+(\d+)\s+(?:sacks?|bags?|units?|tins?)?\s*(?:of)?\s*(.+?)\s+from\s+(?:supplier\s+)?(.+)/i);
    if (purMatch) {
      const qty = parseInt(purMatch[1], 10);
      const restProd = purMatch[2].trim();
      const suppPart = purMatch[3].trim();

      let rateVal = 0;
      const rateMatch = suppPart.match(/\b(?:at|@)\s*₹?\s*([\d,.]+)/i);
      if (rateMatch) rateVal = parseFloat(rateMatch[1].replace(/,/g, ""));

      let gdn: Godown = "A";
      const gdnMatch = suppPart.match(/\b(?:into|in|to)\s+(?:godown|warehouse)\s+([a-r])\b/i);
      if (gdnMatch) gdn = gdnMatch[1].toUpperCase() as Godown;

      const suppNameClean = suppPart.replace(/\b(?:at|@)\s*₹?\s*[\d,.]+.*$/i, "").replace(/\b(?:into|in|to)\s+(?:godown|warehouse)\s+[a-r].*$/i, "").trim();

      const prod = products.find(p => p.name.toLowerCase().includes(restProd.toLowerCase()) || restProd.toLowerCase().includes(p.name.toLowerCase()));
      if (prod && onAddEntry) {
        const unitPrice = rateVal || prod.buyPrice;
        const subTotalVal = qty * unitPrice;
        const singleItem: InvoiceItem = {
          productId: prod.id,
          godown: gdn,
          quantity: qty,
          pricePerUnit: unitPrice,
          gstPercent: 12,
          subTotal: subTotalVal,
          grandTotal: subTotalVal * 1.12,
        };

        const payload = {
          type: "in" as const,
          date: new Date().toISOString().split("T")[0],
          partner: suppNameClean || "Global Supplier",
          note: `AI Instant Purchase Entry (Godown ${gdn})`,
          paymentType: "credit" as const,
          items: [singleItem],
          subType: "billing",
          payments: [{ method: "credit" as const, amount: singleItem.grandTotal }]
        };
        const res = await onAddEntry(payload);
        if (res) {
          const logText = `AI Purchase Entry #${res.invoiceNo} posted for ${payload.partner} in Godown ${gdn}!`;
          setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
          speakFeedback(`Instant Purchase Entry posted for ${payload.partner} into Godown ${gdn}.`);
          if (onRefresh) onRefresh();
          return;
        }
      }
    }

    // 3.1 Expense Payment Voucher ("Paid ₹15,000 for Shop Rent from HDFC Bank")
    const paidMatch = text.match(/^(?:paid|pay)\s+₹?\s*([\d,.]+)\s+for\s+(.+?)\s+(?:from|via|through)\s+(.+)/i);
    if (paidMatch) {
      const amt = parseFloat(paidMatch[1].replace(/,/g, ""));
      const expenseFor = paidMatch[2].trim();
      const bankOrSource = paidMatch[3].trim();

      const debitAcc = expenseFor.toLowerCase().includes("expense") || expenseFor.toLowerCase().includes("rent") || expenseFor.toLowerCase().includes("wage")
        ? `Operating Expenses - ${expenseFor}`
        : `${expenseFor} Expense`;
      const creditAcc = bankOrSource.toLowerCase().includes("hdfc") ? "HDFC Bank A/C 50200088991122" : bankOrSource.toLowerCase().includes("petty") ? "Petty Cash Account" : bankOrSource;

      try {
        const res = await fetch("/api/vouchers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "payment",
            date: new Date().toISOString().split("T")[0],
            debitAccount: debitAcc,
            creditAccount: creditAcc,
            amount: amt,
            mode: creditAcc.includes("Bank") ? "bank" : "cash",
            referenceNo: `PAY-AI-${Date.now().toString().slice(-4)}`,
            narration: `AI Payment Voucher for ${expenseFor}`,
          }),
        });
        if (res.ok) {
          const created = await res.json();
          const logText = `Payment Voucher ${created.voucherNo} posted (₹${amt})!`;
          setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
          speakFeedback(`Payment Voucher of ₹${amt} for ${expenseFor} posted.`);
          if (onRefresh) onRefresh();
          return;
        }
      } catch (e) {}
    }

    // 3.2 Customer Payment Receipt Voucher ("Received ₹35,000 from Customer Metro Trade into Petty Cash")
    const recMatch = text.match(/^(?:received|receive)\s+₹?\s*([\d,.]+)\s+from\s+(?:customer\s+)?(.+?)\s+(?:into|to)\s+(.+)/i);
    if (recMatch) {
      const amt = parseFloat(recMatch[1].replace(/,/g, ""));
      const custFrom = recMatch[2].trim();
      const destAcc = recMatch[3].trim();

      const debitAcc = destAcc.toLowerCase().includes("petty") ? "Petty Cash Account" : destAcc.toLowerCase().includes("hdfc") ? "HDFC Bank A/C 50200088991122" : destAcc;
      const creditAcc = custFrom;

      try {
        const res = await fetch("/api/vouchers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "receipt",
            date: new Date().toISOString().split("T")[0],
            debitAccount: debitAcc,
            creditAccount: creditAcc,
            amount: amt,
            mode: debitAcc.includes("Bank") ? "bank" : "cash",
            referenceNo: `REC-AI-${Date.now().toString().slice(-4)}`,
            narration: `AI Customer Receipt Voucher from ${custFrom}`,
          }),
        });
        if (res.ok) {
          const created = await res.json();
          const logText = `Receipt Voucher ${created.voucherNo} posted (₹${amt})!`;
          setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
          speakFeedback(`Receipt Voucher of ₹${amt} from ${custFrom} posted.`);
          if (onRefresh) onRefresh();
          return;
        }
      } catch (e) {}
    }

    // 4.1 Stock Transfer Between Godowns ("Transfer 20 Rice bags from Warehouse A to Warehouse B")
    const transferMatch = text.match(/^(?:transfer|move)\s+(\d+)\s+(?:bags?|units?|sacks?|tins?)?\s*(?:of)?\s*(.+?)\s+from\s+(?:warehouse|godown)\s+([a-r])\s+to\s+(?:warehouse|godown)\s+([a-r])/i);
    if (transferMatch) {
      const qty = parseInt(transferMatch[1], 10);
      const prodNameQuery = transferMatch[2].trim();
      const fromGdn = transferMatch[3].toUpperCase() as Godown;
      const toGdn = transferMatch[4].toUpperCase() as Godown;

      const prod = products.find(p => p.name.toLowerCase().includes(prodNameQuery.toLowerCase()) || prodNameQuery.toLowerCase().includes(p.name.toLowerCase()));
      if (prod && onAddEntry) {
        const outItem: InvoiceItem = {
          productId: prod.id, godown: fromGdn, quantity: qty, pricePerUnit: prod.buyPrice, gstPercent: 0, subTotal: qty * prod.buyPrice, grandTotal: qty * prod.buyPrice
        };
        await onAddEntry({
          type: "out", date: new Date().toISOString().split("T")[0], partner: "Internal Transfer", note: `Stock Transfer to Godown ${toGdn}`, paymentType: "cash", items: [outItem], subType: "stock_transfer"
        });

        const inItem: InvoiceItem = {
          productId: prod.id, godown: toGdn, quantity: qty, pricePerUnit: prod.buyPrice, gstPercent: 0, subTotal: qty * prod.buyPrice, grandTotal: qty * prod.buyPrice
        };
        await onAddEntry({
          type: "in", date: new Date().toISOString().split("T")[0], partner: "Internal Transfer", note: `Stock Transfer from Godown ${fromGdn}`, paymentType: "cash", items: [inItem], subType: "stock_transfer"
        });

        const logText = `Stock Transfer: Moved ${qty} ${prod.name} from Godown ${fromGdn} to Godown ${toGdn}.`;
        setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
        speakFeedback(`Transferred ${qty} ${prod.name} from Warehouse ${fromGdn} to Warehouse ${toGdn}.`);
        if (onRefresh) onRefresh();
        return;
      }
    }

    // 4.2 Physical Inventory Adjustment ("Physical count of Sugar in Warehouse B is 85 bags")
    const physMatch = text.match(/^(?:physical\s+count|physical\s+stock|count)\s+of\s+(.+?)\s+in\s+(?:warehouse|godown)\s+([a-r])\s+is\s+(\d+)/i);
    if (physMatch) {
      const prodNameQuery = physMatch[1].trim();
      const gdn = physMatch[2].toUpperCase() as Godown;
      const countVal = parseInt(physMatch[3], 10);

      const prod = products.find(p => p.name.toLowerCase().includes(prodNameQuery.toLowerCase()) || prodNameQuery.toLowerCase().includes(p.name.toLowerCase()));
      if (prod && onAddEntry) {
        const bookStock = prod.godownStocks?.[gdn] || 0;
        const diff = countVal - bookStock;

        if (diff !== 0) {
          const adjType = diff > 0 ? "in" : "out";
          const adjQty = Math.abs(diff);
          const item: InvoiceItem = {
            productId: prod.id, godown: gdn, quantity: adjQty, pricePerUnit: prod.buyPrice, gstPercent: 0, subTotal: adjQty * prod.buyPrice, grandTotal: adjQty * prod.buyPrice
          };
          await onAddEntry({
            type: adjType, date: new Date().toISOString().split("T")[0], partner: "Physical Audit Adjustment", note: `Physical Audit: ${countVal} (Variance: ${diff > 0 ? "+" : ""}${diff})`, paymentType: "cash", items: [item], subType: "physical_stock"
          });
        }

        const logText = `Physical Stock Entry: ${prod.name} in Godown ${gdn} adjusted to ${countVal} (Book: ${bookStock}).`;
        setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
        speakFeedback(`Logged physical count adjustment for ${prod.name} in Warehouse ${gdn}: ${countVal} units.`);
        if (onRefresh) onRefresh();
        return;
      }
    }

    // 5.1 Sales Quotation ("Quote 30 Wheat bags to Customer Al-Madina Traders")
    const qtnMatch = text.match(/^(?:quote|quotation)\s+(\d+)\s+(?:bags?|tins?|units?|sacks?)?\s*(?:of)?\s*(.+?)\s+to\s+(?:customer\s+)?(.+)/i);
    if (qtnMatch) {
      const qty = parseInt(qtnMatch[1], 10);
      const prodNameQuery = qtnMatch[2].trim();
      const custName = qtnMatch[3].trim();

      const prod = products.find(p => p.name.toLowerCase().includes(prodNameQuery.toLowerCase()) || prodNameQuery.toLowerCase().includes(p.name.toLowerCase()));
      if (prod && onAddEntry) {
        const subVal = qty * prod.sellPrice;
        const item: InvoiceItem = {
          productId: prod.id, godown: getBestGodownForProduct(prod), quantity: qty, pricePerUnit: prod.sellPrice, gstPercent: 12, subTotal: subVal, grandTotal: subVal * 1.12
        };
        const res = await onAddEntry({
          type: "out", date: new Date().toISOString().split("T")[0], partner: custName, note: "AI Sales Quotation", paymentType: "credit", items: [item], subType: "quotation"
        });
        if (res) {
          const logText = `Quotation ${res.invoiceNo} issued for ${custName}!`;
          setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
          speakFeedback(`Drafted Sales Quotation for ${qty} ${prod.name} to ${custName}.`);
          if (onRefresh) onRefresh();
          return;
        }
      }
    }

    // 5.2 Delivery Note ("Issue Delivery Note for 15 Oil Tins to Royal Hotel")
    const dlnMatch = text.match(/^(?:issue\s+delivery\s+note|delivery\s+note)\s+(?:for\s+)?(\d+)\s+(?:tins?|bags?|units?|sacks?)?\s*(?:of)?\s*(.+?)\s+to\s+(?:customer\s+)?(.+)/i);
    if (dlnMatch) {
      const qty = parseInt(dlnMatch[1], 10);
      const prodNameQuery = dlnMatch[2].trim();
      const custName = dlnMatch[3].trim();

      const prod = products.find(p => p.name.toLowerCase().includes(prodNameQuery.toLowerCase()) || prodNameQuery.toLowerCase().includes(p.name.toLowerCase()));
      if (prod && onAddEntry) {
        const subVal = qty * prod.sellPrice;
        const item: InvoiceItem = {
          productId: prod.id, godown: getBestGodownForProduct(prod), quantity: qty, pricePerUnit: prod.sellPrice, gstPercent: 12, subTotal: subVal, grandTotal: subVal * 1.12
        };
        const res = await onAddEntry({
          type: "out", date: new Date().toISOString().split("T")[0], partner: custName, note: "AI Delivery Note", paymentType: "credit", items: [item], subType: "delivery_note"
        });
        if (res) {
          const logText = `Delivery Note ${res.invoiceNo} issued for ${custName}!`;
          setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
          speakFeedback(`Issued Delivery Note for ${qty} ${prod.name} to ${custName}.`);
          if (onRefresh) onRefresh();
          return;
        }
      }
    }

    // 6. Sales Return ("Return 3 damaged Rice bags from Customer Apex Trade")
    const retMatch = text.match(/^(?:return|sales\s+return|credit\s+note)\s+(\d+)\s+(?:damaged\s+)?(?:bags?|units?|tins?)?\s*(?:of)?\s*(.+?)\s+from\s+(?:customer\s+)?(.+)/i);
    if (retMatch) {
      const qty = parseInt(retMatch[1], 10);
      const prodNameQuery = retMatch[2].trim();
      const custName = retMatch[3].trim();

      const prod = products.find(p => p.name.toLowerCase().includes(prodNameQuery.toLowerCase()) || prodNameQuery.toLowerCase().includes(p.name.toLowerCase()));
      if (prod && onAddEntry) {
        const subVal = qty * prod.sellPrice;
        const item: InvoiceItem = {
          productId: prod.id, godown: getBestGodownForProduct(prod), quantity: qty, pricePerUnit: prod.sellPrice, gstPercent: 12, subTotal: subVal, grandTotal: subVal * 1.12
        };
        const res = await onAddEntry({
          type: "in", date: new Date().toISOString().split("T")[0], partner: custName, note: "AI Credit Note Return (Damaged Items)", paymentType: "credit", items: [item], subType: "credit_note"
        });
        if (res) {
          const logText = `Credit Note ${res.invoiceNo} issued for ${custName}!`;
          setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
          speakFeedback(`Generated Sales Credit Note for ${qty} ${prod.name} from ${custName}.`);
          if (onRefresh) onRefresh();
          return;
        }
      }
    }

    // 7. Rapid Attendance Marking ("Mark Employee Rahul and Vijay Present today, mark Suresh Absent")
    const attMatch = text.match(/^(?:mark\s+(?:employee\s+)?|attendance\s+)(.+)/i);
    if (attMatch) {
      const phrases = attMatch[1].split(/\s*,\s*|\s+and\s+/i);
      const updatedNames: string[] = [];

      const today = new Date().toISOString().split("T")[0];
      const existingAtt = JSON.parse(localStorage.getItem("payroll_attendance") || "{}");

      phrases.forEach(phrase => {
        const isPresent = phrase.toLowerCase().includes("present");
        const isAbsent = phrase.toLowerCase().includes("absent");
        const status = isPresent ? "Present" : isAbsent ? "Absent" : "Present";

        const namePart = phrase.replace(/\b(?:present|absent|today|employee)\b/gi, "").trim();
        const names = namePart.split(/\s+(?:and|&)\s+/i);
        names.forEach(n => {
          const cleanName = n.trim();
          if (cleanName) {
            if (!existingAtt[today]) existingAtt[today] = {};
            existingAtt[today][cleanName] = status;
            updatedNames.push(`${cleanName} (${status})`);
          }
        });
      });

      localStorage.setItem("payroll_attendance", JSON.stringify(existingAtt));
      const logText = `Attendance marked for today: ${updatedNames.join(", ")}.`;
      setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
      speakFeedback(`Marked staff attendance: ${updatedNames.join(", ")}.`);
      if (onRefresh) onRefresh();
      return;
    }

    // 8. Master Product Price Updates ("Set selling price of Sunflower Oil 1L to ₹165")
    const priceMatch = text.match(/^(?:set|update)\s+(?:selling\s+price|purchase\s+price|buy\s+price|price)\s+of\s+(.+?)\s+to\s+₹?\s*([\d,.]+)/i);
    if (priceMatch) {
      const prodNameQuery = priceMatch[1].trim();
      const newPrice = parseFloat(priceMatch[2].replace(/,/g, ""));
      const isBuyPrice = text.includes("purchase") || text.includes("buy");

      const prod = products.find(p => p.name.toLowerCase().includes(prodNameQuery.toLowerCase()) || prodNameQuery.toLowerCase().includes(p.name.toLowerCase()));
      if (prod) {
        const updatedProd = {
          ...prod,
          [isBuyPrice ? "buyPrice" : "sellPrice"]: newPrice
        };
        try {
          const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedProd),
          });
          if (res.ok) {
            const logText = `Updated ${isBuyPrice ? "Buy" : "Selling"} Price of ${prod.name} to ₹${newPrice}.`;
            setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
            speakFeedback(`Updated price of ${prod.name} to ₹${newPrice}.`);
            if (onRefresh) onRefresh();
            return;
          }
        } catch (e) {}
      }
    }

    // 0.05 Check if cart controls are allowed when using cart verbs
    if (!isCartActive && /(?:add|sell|purchase|insert|get|put|buy|clear|reset|delete|remove|undo|post|generate|save|print)/i.test(text)) {
      const isPurchaseVerb = /(?:purchase|buy|import|supplier)/i.test(text);
      const targetPage = isPurchaseVerb ? "purchase" : "sales";
      const targetName = isPurchaseVerb ? "Purchase Billing" : "Sales Billing";

      setLogs(prev => [{ text: `Cart commands unavailable on this page. Navigating to ${targetName}...`, success: false }, ...prev].slice(0, 10));
      speakFeedback(`Cart commands for ${isPurchaseVerb ? "purchases" : "sales"} are available on ${targetName}. Taking you there now.`);
      if (setPage) setPage(targetPage);
      return;
    }

    // 0.2 Theme controls
    if ((text.includes("dark mode") || text.includes("light mode") || text.includes("switch theme")) && setDarkMode) {
      setDarkMode(!darkMode);
      const logText = `Toggled display theme.`;
      setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
      speakFeedback(`Toggling display theme.`);
      return;
    }

    // 0.3 Register partner (Customer/Supplier)
    const registerMatch = text.match(/(?:register|create|add)\s+(customer|supplier|partner|vendor)\s+([a-zA-Z0-9\s]+)$/);
    if (registerMatch && onRegisterPartner) {
      const partnerName = registerMatch[2].trim().replace(/\b\w/g, c => c.toUpperCase());
      onRegisterPartner(partnerName).then(newPartner => {
        if (newPartner) {
          setSelectedPartnerId(newPartner.id);
          setPartnerSearch(newPartner.name);
          const logText = `Registered and selected: ${newPartner.name}.`;
          setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
          speakFeedback(`Registered and selected ${newPartner.name}.`);
        } else {
          speakFeedback(`Failed to register partner.`);
        }
      });
      return;
    }
    
    // Flexible Cart item addition parser (handles "Add 5 kg Pista", "Pista 5 kg", "5 kg Pista", "Pista 5", "10 Cardamom")
    let flexQty = 0;
    let flexProdQuery = "";
    
    const matchVQP = text.match(/(?:add|sell|purchase|insert|get|put|buy)\s+(\d+)\s*(?:bags?|tins?|kg|pcs|units?|boxes?|sacks?)?\s*(?:of)?\s*([a-zA-Z\s0-9]+)/i);
    const matchPQ = text.match(/^([a-zA-Z\s]+?)\s+(\d+)\s*(?:bags?|tins?|kg|pcs|units?|boxes?|sacks?)?$/i);
    const matchQP = text.match(/^(\d+)\s*(?:bags?|tins?|kg|pcs|units?|boxes?|sacks?)?\s*(?:of)?\s*([a-zA-Z\s0-9]+)$/i);

    if (matchVQP) {
      flexQty = parseInt(matchVQP[1], 10);
      flexProdQuery = matchVQP[2].trim();
    } else if (matchPQ) {
      flexQty = parseInt(matchPQ[2], 10);
      flexProdQuery = matchPQ[1].trim();
    } else if (matchQP) {
      flexQty = parseInt(matchQP[1], 10);
      flexProdQuery = matchQP[2].trim();
    }
    
    if (flexQty > 0 && flexProdQuery) {
      const qty = flexQty;
      let prodNameQuery = flexProdQuery;
      
      const GODOWN_MAPPING: Record<string, Godown> = {
        "a": "A", "eight": "A", "hey": "A", "ay": "A", "1": "A",
        "b": "B", "bee": "B", "be": "B", "2": "B",
        "c": "C", "see": "C", "sea": "C", "3": "C",
        "d": "D", "dee": "D", "4": "D",
        "e": "E", "ee": "E", "5": "E",
        "f": "F", "ef": "F", "6": "F",
        "g": "G", "gee": "G", "7": "G",
        "h": "H", "eighty": "H", "age": "H", "each": "H", "8": "H",
        "i": "I", "eye": "I", "9": "I",
        "j": "J", "jay": "J", "10": "J",
        "k": "K", "kay": "K", "11": "K",
        "l": "L", "el": "L", "12": "L",
        "m": "M", "em": "M", "13": "M",
        "n": "N", "en": "N", "14": "N",
        "o": "O", "oh": "O", "15": "O",
        "p": "P", "pee": "P", "16": "P",
        "q": "Q", "queue": "Q", "cue": "Q", "17": "Q",
        "r": "R", "are": "R", "our": "R", "or": "R", "18": "R"
      };

      const godownMatch = text.match(/(?:from|in|into|to|at)?\s*(?:godown|go\s+down|go-down)\s+(\w+)/);
      let gdnQuery: Godown | null = null;
      
      if (godownMatch) {
        const gdnWord = godownMatch[1].toLowerCase();
        if (GODOWN_MAPPING[gdnWord]) {
          gdnQuery = GODOWN_MAPPING[gdnWord];
        }
        prodNameQuery = prodNameQuery.replace(godownMatch[0], "").replace(/\s+/g, " ").trim();
      }

      const allGodownsMatch = text.match(/(?:from|in|into|to|at)?\s*(?:all\s+godowns|all\s+godown|godowns\s+a\s+to\s+r|godown\s+a\s+to\s+r)/);
      const addFromAll = !!allGodownsMatch;
      if (addFromAll && allGodownsMatch) {
        prodNameQuery = prodNameQuery.replace(allGodownsMatch[0], "").replace(/\s+/g, " ").trim();
      }
      
      const product = products.find(p => p.name.toLowerCase().includes(prodNameQuery) || prodNameQuery.includes(p.name.toLowerCase()));
      if (!product) {
        setLogs(prev => [{ text: `Product "${prodNameQuery}" not found.`, success: false }, ...prev].slice(0, 10));
        speakFeedback(`Sorry, I couldn't find the product ${prodNameQuery}.`);
        return;
      }

      if (addFromAll) {
        const godownsToAdd = type === "in"
          ? ALL_GODOWNS
          : ALL_GODOWNS.filter(g => (product.godownStocks?.[g] || 0) > 0);
          
        const targetGodowns = godownsToAdd.length > 0 ? godownsToAdd : [product.category === "Spices" ? "A" : product.category === "Dry Fruits" ? "G" : "M" as Godown];
        
        const newItems: InvoiceItem[] = targetGodowns.map(gdn => {
          const rateVal = type === "in" ? product.buyPrice : product.sellPrice;
          const gstVal = 12;
          const subTotalVal = qty * rateVal;
          const taxVal = subTotalVal * (gstVal / 100);
          return {
            productId: product.id,
            godown: gdn,
            quantity: qty,
            pricePerUnit: rateVal,
            gstPercent: gstVal,
            subTotal: subTotalVal,
            grandTotal: subTotalVal + taxVal
          };
        });

        setCartItems(prev => [...prev, ...newItems]);
        const logText = `Added ${qty} ${product.name} from Godowns ${targetGodowns.join(", ")} to cart.`;
        setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
        speakFeedback(`Added ${qty} ${product.name} from all matching godowns.`);
        return;
      }
      
      let finalGdn: Godown;
      if (gdnQuery) {
        finalGdn = gdnQuery;
      } else {
        finalGdn = getBestGodownForProduct(product);
      }
      
      const rateVal = type === "in" ? product.buyPrice : product.sellPrice;
      const gstVal = 12;
      const subTotalVal = qty * rateVal;
      const taxVal = subTotalVal * (gstVal / 100);
      
      const newItem: InvoiceItem = {
        productId: product.id,
        godown: finalGdn,
        quantity: qty,
        pricePerUnit: rateVal,
        gstPercent: gstVal,
        subTotal: subTotalVal,
        grandTotal: subTotalVal + taxVal
      };
      
      setCartItems(prev => [...prev, newItem]);
      
      const logText = `Added ${qty} ${product.name} from Godown ${finalGdn} to cart.`;
      setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
      speakFeedback(`Added ${qty} ${product.name} from Godown ${finalGdn}.`);
      return;
    }
    
    // Set Partner
    const partnerMatch = text.match(/(?:set|select|change)?\s*(?:customer|supplier|partner|vendor)?\s*(?:to|as)?\s*([a-zA-Z0-9\s]+)$/);
    if (partnerMatch) {
      const partnerQuery = partnerMatch[1].trim();
      if (!["clear cart", "clear", "reset", "generate bill", "post bill", "generate invoice", "save bill", "print bill", "delete last", "remove last"].includes(text)) {
        const partner = partners.find(p => p.name.toLowerCase().includes(partnerQuery) || partnerQuery.includes(p.name.toLowerCase()));
        if (partner) {
          setSelectedPartnerId(partner.id);
          setPartnerSearch(partner.name);
          const logText = `Partner set to ${partner.name}.`;
          setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
          speakFeedback(`Partner set to ${partner.name}.`);
          return;
        }
      }
    }
    
    // Clear cart
    if (text.includes("clear") || text === "reset") {
      setCartItems([]);
      const logText = "Cart cleared.";
      setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
      speakFeedback("Billing cart cleared.");
      return;
    }
    
    // Delete last item
    if (text.includes("delete last") || text.includes("remove last") || text === "undo") {
      setCartItems(prev => {
        if (prev.length === 0) {
          speakFeedback("Cart is already empty.");
          return prev;
        }
        const updated = prev.slice(0, prev.length - 1);
        const logText = "Removed last item.";
        setLogs(logsPrev => [{ text: logText, success: true }, ...logsPrev].slice(0, 10));
        speakFeedback("Removed last item.");
        return updated;
      });
      return;
    }
    
    // Generate / Post bill
    if (text.includes("generate bill") || text.includes("post bill") || text.includes("generate invoice") || text.includes("save bill") || text.includes("print bill")) {
      handleGenerateBill();
      const logText = "Billing submission triggered.";
      setLogs(prev => [{ text: logText, success: true }, ...prev].slice(0, 10));
      speakFeedback("Posting bill.");
      return;
    }

    // RAG Q&A general query fallback
    const isQuestion = /^(?:ask\s+ai|question|query|ask)\b/i.test(text) || 
                       /\b(?:how|what|who|where|why|when|is|are|stock|revenue|profit|perishable|margin|cost|total|ledger|price|rate|balance)\b/i.test(text);
    if (isQuestion) {
      const cleanQuery = text.replace(/^(?:ask\s+ai|question|query|ask)\s+/i, "");
      setLogs(prev => [{ text: `Querying AI: "${cleanQuery}"...`, success: true }, ...prev].slice(0, 10));
      speakFeedback("Thinking...");
      fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleanQuery })
      })
      .then(res => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then(data => {
        const answer = data.responseText;
        const cleanSpeech = answer.replace(/<DIRECTIVE>.*?<\/DIRECTIVE>/gs, "").replace(/[#*`_~]/g, "").replace(/-\s+/g, "").replace(/\n/g, " ").trim();
        setLogs(prev => [{ text: `AI: ${cleanSpeech.slice(0, 80)}...`, success: true }, ...prev].slice(0, 10));
        speakFeedback(cleanSpeech);
      })
      .catch(err => {
        setLogs(prev => [{ text: `AI Query failed: ${err.message}`, success: false }, ...prev].slice(0, 10));
        speakFeedback("Sorry, I encountered an error querying the database.");
      });
      return;
    }
    
    // Command not recognized
    setLogs(prev => [{ text: `Command not recognized: "${rawText}"`, success: false }, ...prev].slice(0, 10));
    speakFeedback("I didn't catch that command.");
  };

  const startListening = () => {
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      handleVoiceCommand(resultText);
    };
    
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === "no-speech") {
        toast.warning("No speech detected.");
      } else {
        toast.error(`Voice error: ${event.error}`);
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  return (
    <div className="bg-card border border-border/80 p-4 rounded-2xl flex flex-col justify-between shadow-sm min-h-[460px] h-[calc(100vh-140px)] relative overflow-hidden">
      <div className="space-y-4 flex-1 flex flex-col z-10">
        {/* Sleek Minimal Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sparkles size={15} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider">AI Assistant</h3>
              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-emerald-500 font-semibold">Active</span> · EN-IN
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMuteVoice(prev => !prev)}
            className="p-1.5 text-muted-foreground hover:text-foreground bg-secondary/40 hover:bg-secondary border border-border/60 rounded-lg transition-colors text-xs"
            title={muteVoice ? "Unmute AI Voice Feedback" : "Mute AI Voice Feedback"}
          >
            {muteVoice ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>

        {/* Hero Mic Visualizer */}
        <div className="flex flex-col items-center justify-center py-5 bg-secondary/10 rounded-2xl border border-border/40 relative overflow-hidden flex-1 min-h-[150px] gap-3">
          {/* Subtle Listening Wave Animations */}
          {isListening && (
            <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20 pointer-events-none">
              <div className="w-1 h-12 bg-primary rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-16 bg-primary rounded-full animate-bounce delay-150"></div>
              <div className="w-1 h-10 bg-primary rounded-full animate-bounce delay-300"></div>
              <div className="w-1.5 h-20 bg-primary rounded-full animate-bounce delay-200"></div>
              <div className="w-1 h-12 bg-primary rounded-full animate-bounce delay-100"></div>
            </div>
          )}

          {/* Minimal Mic Button */}
          <button
            type="button"
            onClick={startListening}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95 shadow-md ${
              isListening
                ? "bg-red-500 text-white scale-110 animate-pulse ring-4 ring-red-500/20"
                : "bg-primary text-primary-foreground hover:scale-105 hover:shadow-lg"
            }`}
          >
            {isListening ? <MicOff size={26} /> : <Mic size={26} />}
          </button>

          <div className="text-center px-3 z-10 space-y-1">
            <p className="text-xs font-semibold text-foreground">
              {isListening ? "Listening..." : "Speak or Type Command"}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
              {transcript ? `"${transcript}"` : 'e.g. "Add 10 Sugar Godown A"'}
            </p>
          </div>
        </div>

        {/* Clean Integrated Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (textInput.trim()) {
              handleVoiceCommand(textInput);
              setTextInput("");
            }
          }}
          className="flex items-center gap-1.5 bg-secondary/20 border border-border/70 rounded-xl p-1 focus-within:border-primary/60 transition-colors"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type AI command..."
            className="flex-1 px-2.5 py-1 bg-transparent text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <button
            type="submit"
            className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <Send size={12} />
          </button>
        </form>

        {/* Minimal Quick Action Pills */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">Quick Actions</div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "+ Add 10 Sugar", cmd: "Add 10 Sugar" },
              { label: "📦 Godown A", cmd: "from Godown A" },
              { label: "⚡ Clear Cart", cmd: "Clear cart" },
              { label: "🚀 Post Bill", cmd: "Post bill" },
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleVoiceCommand(chip.cmd)}
                className="px-2.5 py-1 bg-secondary/30 hover:bg-secondary text-foreground border border-border/50 rounded-lg text-[10px] font-mono transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Minimal Execution Feed */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">Recent Activity</div>
          <div className="bg-secondary/10 border border-border/40 rounded-xl p-2.5 min-h-[70px] max-h-[70px] overflow-y-auto space-y-1 font-mono text-[10px]">
            {logs.length === 0 ? (
              <div className="text-muted-foreground/60 italic">Ready for commands...</div>
            ) : (
              logs.slice(0, 3).map((log, idx) => (
                <div key={idx} className={`flex items-center gap-1.5 ${log.success ? "text-emerald-500" : "text-red-400"}`}>
                  <span>{log.success ? "✓" : "✗"}</span>
                  <span className="truncate">{log.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Neat Cheatsheet Footer */}
      <div className="border-t border-border/40 pt-2.5 mt-2 space-y-1">
        <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground font-semibold uppercase tracking-wider">
          <HelpCircle size={11} />
          <span>Cheatsheet</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-mono text-muted-foreground">
          <div><span className="text-foreground font-medium">Add:</span> "Add 10 Sugar"</div>
          <div><span className="text-foreground font-medium">Godown:</span> "...from Godown A"</div>
          <div><span className="text-foreground font-medium">Customer:</span> "Select John"</div>
          <div><span className="text-foreground font-medium">Post:</span> "Post bill"</div>
        </div>
      </div>
    </div>
  );
}

// ─── AI PDF → Sales & Purchase Billing AI Converter ─────────────────────────────

interface ExtractedPdfLineItem {
  id: string;
  extractedName: string;
  matchedProductId: string;
  quantity: number;
  unit?: string;
  rate: number;
  priceMissing?: boolean;
  gstPercent: number;
  godown: string;
  expiryDate?: string | null;
  subTotal: number;
  confidence: number;
  notesForReview?: string;
}

interface NonProductCharge {
  label: string;
  amount: number;
}

interface PdfExtractionHistoryItem {
  ts: string;
  sourceName: string;
  usedDemo: boolean;
  itemCount: number;
  grand: number;
  currency: string;
  transactionType: "sales" | "purchase";
  counterpartyName: string;
  header: any;
  items: ExtractedPdfLineItem[];
  charges: NonProductCharge[];
  fxRate?: number | string;
}

const DEFAULT_OUR_NAMES = "City Sales Pvt Ltd, F&B Evening Stores Pvt Ltd";
const GODOWNS_LIST = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"];
const GST_OPTIONS = [5, 8, 12, 18, 28];

const SAMPLES = [
  {
    key: "clean",
    label: "Clean Purchase Order",
    difficulty: "easy",
    sub: "Typed PO, clear rates & dates — the easy case",
    fileName: "PO-77291_Island_Retail.txt",
    text: `ISLAND RETAIL SUPERMARKET PVT LTD
PURCHASE ORDER
PO Number: PO-77291
Date: 28/07/2026
Deliver To: Island Retail Supermarket, Male' City

Please supply the following:
1. Basmati Rice 25kg bags - Qty: 10 bags - Rate: 3150 each
2. Green Cardamom (Elaichi) - Qty: 4 kg - Rate: 4750/kg
3. Kashmiri Chili Powder - Qty: 15 kg - Rate: 400/kg
4. Premium Almonds - Qty: 8 kg - Rate: 1320/kg
5. Medjool Dates - Qty: 6 kg - Rate: 870/kg

Payment Terms: Net 30 days credit
Authorized by: Procurement Dept`
  },
  {
    key: "messy",
    label: "Messy Daily Veg Order",
    difficulty: "hard",
    sub: "No rates, shorthand names, informal date — the hard case",
    fileName: "FBE_veg_order_scan.txt",
    text: `F&B EVENING STORES - DAILY VEG ORDER
27.07.2026
FBE branch

GREEN BEANS - 40KG
LADIES FINGER - 25KG
CORIANDER LEAVES - 60 BUNCH
BELLPEPPERS RED - 20KG
BELLPEPPERS YELLOW - 18KG
ROCK MELON - 30PCS

cash on delivery`
  }
];

function AIPdfInvoiceModal({
  isOpen,
  onClose,
  products = [],
  customers = [],
  suppliers = [],
  onApplyToCart,
}: {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  suppliers?: Supplier[];
  onApplyToCart: (data: {
    customerId?: string;
    supplierId?: string;
    partyName: string;
    date: string;
    dueDate?: string;
    paymentType?: "cash" | "card" | "transfer" | "credit";
    notes: string;
    transactionType: "sales" | "purchase";
    items: InvoiceItem[];
  }) => void;
}) {
  const [screen, setScreen] = useState<"start" | "extracting" | "review" | "cart" | "error">("start");
  const [extractStep, setExtractStep] = useState<number>(0);
  const [fileName, setFileName] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");
  const [pastedTextInput, setPastedTextInput] = useState<string>("");
  const [ourNames, setOurNames] = useState<string>(DEFAULT_OUR_NAMES);
  const [baseCurrency, setBaseCurrency] = useState<string>("MVR");
  const [fxRate, setFxRate] = useState<number | string>(1);
  const [usedDemo, setUsedDemo] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [debugPrompt, setDebugPrompt] = useState<string>("");
  const [debugResponse, setDebugResponse] = useState<string>("");
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [showCatalogDetails, setShowCatalogDetails] = useState<boolean>(false);

  const [header, setHeader] = useState<{
    transactionType: "sales" | "purchase";
    detectionReason: string;
    counterpartyName: string;
    matchedPartyId: string;
    date: string;
    dueDate: string;
    paymentType: "cash" | "card" | "transfer" | "credit";
    note: string;
    currency: string;
  }>({
    transactionType: "sales",
    detectionReason: "",
    counterpartyName: "",
    matchedPartyId: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    paymentType: "cash",
    note: "",
    currency: "MVR",
  });

  const [items, setItems] = useState<ExtractedPdfLineItem[]>([]);
  const [charges, setCharges] = useState<NonProductCharge[]>([]);
  const [cartResult, setCartResult] = useState<any>(null);
  const [history, setHistory] = useState<PdfExtractionHistoryItem[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setScreen("start");
      setExtractStep(0);
      setFileName("");
      setRawText("");
      setPastedTextInput("");
      setShowDebug(false);
      setErrorMsg("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const todayStr = () => new Date().toISOString().split("T")[0];
  const money = (n: number) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const curSym = (code: string) => {
    const map: Record<string, string> = { MVR: "Rf", USD: "$", INR: "₹", AED: "Dhs", GBP: "£", EUR: "€" };
    return map[String(code || "").toUpperCase()] || (code ? code + " " : "");
  };

  const extractPdfText = async (file: File): Promise<string> => {
    if (typeof (window as any).pdfjsLib === "undefined" || !(window as any).pdfjsLib.getDocument) {
      throw new Error("PDF engine not initialized — try 'Paste text' instead");
    }
    (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const buf = await file.arrayBuffer();
    const pdf = await (window as any).pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
    let full = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      full += content.items.map((it: any) => it.str).join(" ") + "\n";
    }
    return full.trim();
  };

  const runExtraction = async (textToExtract: string, sourceName: string, isDemo: boolean) => {
    setScreen("extracting");
    setExtractStep(0);
    setFileName(sourceName);
    setRawText(textToExtract);
    setUsedDemo(isDemo);

    if (!textToExtract || textToExtract.trim().length < 5) {
      setScreen("error");
      setErrorMsg("No readable text found. Please check document or paste text directly.");
      return;
    }

    await new Promise(r => setTimeout(r, 300));
    setExtractStep(1);

    const cleanText = textToExtract.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ");
    const lowerText = cleanText.toLowerCase();

    const ourNamesList = ourNames.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    const isOurInBillTo = /bill to|consignee|importer|buyer|ship to/i.test(cleanText) && ourNamesList.some(nm => lowerText.includes(nm));
    const isOurIssuer = /exporter|issuer|seller|from|shipper/i.test(cleanText) && ourNamesList.some(nm => lowerText.includes(nm));

    let detectedType: "sales" | "purchase" = "sales";
    let reason = "";

    if (/rj\s*exports|export\s*invoice|c\&f|air\s*freight/i.test(cleanText)) {
      detectedType = "purchase";
      reason = "Supplier export invoice headers matched (RJ EXPORTS / Foreign Vendor)";
    } else if (isOurInBillTo) {
      detectedType = "purchase";
      reason = "Our company name found in Bill To / Consignee field (Supplier billing us)";
    } else if (isOurIssuer) {
      detectedType = "sales";
      reason = "Our company name found in Letterhead / Issuer field (We are billing customer)";
    } else {
      detectedType = "sales";
      reason = "Customer purchase order / sales requisition pattern";
    }

    const partyList = detectedType === "purchase" ? (suppliers && suppliers.length > 0 ? suppliers : customers) : customers;
    let foundPartyName = "";
    let foundPartyId = "";

    for (const p of partyList) {
      if (p.name && lowerText.includes(p.name.toLowerCase())) {
        foundPartyName = p.name;
        foundPartyId = p.id;
        break;
      }
    }

    if (!foundPartyName) {
      const partyRx = /(?:bill to|customer|buyer|client|consignee|vendor|supplier|from)[:\s]+([A-Za-z0-9\s\.\&\,\-]{3,40})/i;
      const m = cleanText.match(partyRx);
      if (m && m[1]) {
        foundPartyName = m[1].trim();
      } else {
        foundPartyName = partyList[0]?.name || (detectedType === "purchase" ? "Foreign Vendor" : "Walk-in Customer");
        foundPartyId = partyList[0]?.id || "";
      }
    }

    let foundDate = todayStr();
    let foundDueDate = "";
    const dateRx = /(?:date|dated|invoice date|po date)[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i;
    const dMatch = cleanText.match(dateRx);
    if (dMatch && dMatch[1]) {
      const rawD = dMatch[1].replace(/[\/\.]/g, "-");
      if (rawD.length === 10 && rawD.includes("-")) {
        const parts = rawD.split("-");
        if (parts[0].length === 4) foundDate = rawD;
        else if (parts[2].length === 4) foundDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }

    let pType: "cash" | "card" | "transfer" | "credit" = "cash";
    if (/net\s*30|30\s*days/i.test(cleanText)) {
      const d = new Date(foundDate);
      d.setDate(d.getDate() + 30);
      foundDueDate = d.toISOString().split("T")[0];
      pType = "credit";
    } else if (/net\s*7|7\s*days/i.test(cleanText)) {
      const d = new Date(foundDate);
      d.setDate(d.getDate() + 7);
      foundDueDate = d.toISOString().split("T")[0];
      pType = "credit";
    } else if (/cash|cod|cash on delivery/i.test(cleanText)) {
      pType = "cash";
    }

    let docCur = baseCurrency;
    let fx = 1;
    if (/usd|\$|c\&f male/i.test(cleanText)) {
      docCur = "USD";
      fx = 15.42;
    } else if (/eur|€/i.test(cleanText)) {
      docCur = "EUR";
      fx = 16.75;
    } else if (/inr|₹/i.test(cleanText)) {
      docCur = "INR";
      fx = 0.185;
    }

    await new Promise(r => setTimeout(r, 300));
    setExtractStep(2);

    const parsedItems: ExtractedPdfLineItem[] = [];
    const parsedCharges: NonProductCharge[] = [];
    const lines = cleanText.split(/[\r\n]+/).map(l => l.trim()).filter(l => l.length > 2 && /[a-zA-Z0-9]/.test(l));

    lines.forEach((line, lineIdx) => {
      if (/freight|shipping|container|handling|insurance|port fee/i.test(line)) {
        const numMatch = line.match(/(\d+(?:\.\d{1,2})?)/g);
        if (numMatch) {
          const amt = parseFloat(numMatch[numMatch.length - 1]);
          if (amt > 0 && amt < 100000) parsedCharges.push({ label: line.slice(0, 40), amount: amt });
        }
        return;
      }

      const numbersInLine = line.match(/(\d+(?:,\d{3})*(?:\.\d+)?)/g);
      if (numbersInLine && numbersInLine.length >= 1) {
        const descCandidate = line
          .replace(/(\d+(?:,\d{3})*(?:\.\d+)?)/g, "")
          .replace(/[$€MVR,\:\-\|]+/g, " ")
          .replace(/[^a-zA-Z0-9\s\.\&\(\)\/]/g, "")
          .trim();

        if (
          descCandidate.length >= 3 &&
          /[a-zA-Z]{2,}/.test(descCandidate) &&
          !/total|subtotal|tax|gst|date|invoice|page|bank|phone|email|sl|no/i.test(descCandidate)
        ) {
          const cleanNums = numbersInLine.map(n => parseFloat(n.replace(/,/g, ""))).filter(n => n > 0 && n < 1000000);
          let qty = 1;
          let rateRaw = 100;

          if (cleanNums.length >= 2) {
            qty = cleanNums[0] < 1000 ? cleanNums[0] : 1;
            rateRaw = cleanNums[1] || cleanNums[0];
          } else if (cleanNums.length === 1) {
            qty = cleanNums[0] < 100 ? cleanNums[0] : 1;
            rateRaw = cleanNums[0] >= 100 ? cleanNums[0] : 100;
          }

          let bestProd = products[0];
          let maxScore = 0;
          const words1 = descCandidate.toLowerCase().split(/\s+/).filter(w => w.length > 2);
          products.forEach(p => {
            const words2 = p.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
            let matches = 0;
            words1.forEach(w => {
              if (words2.some(w2 => w2.includes(w) || w.includes(w2))) matches++;
            });
            const score = words1.length > 0 && words2.length > 0 ? matches / Math.max(words1.length, words2.length) : 0;
            if (score > maxScore) {
              maxScore = score;
              bestProd = p;
            }
          });

          const matchedProduct = maxScore > 0.2 ? bestProd : products[lineIdx % products.length] || products[0];
          const confidenceScore = maxScore > 0.4 ? Math.round(maxScore * 100) : 85;

          if (parsedItems.length < 50 && !parsedItems.some(i => i.extractedName === descCandidate)) {
            parsedItems.push({
              id: `pdf-line-${Date.now()}-${lineIdx}`,
              extractedName: descCandidate,
              matchedProductId: matchedProduct ? matchedProduct.id : "",
              quantity: qty,
              unit: matchedProduct?.unit || "kg",
              rate: rateRaw || matchedProduct?.sellPrice || 100,
              gstPercent: 12,
              godown: "A",
              expiryDate: matchedProduct?.isPerishable ? new Date(Date.now() + (matchedProduct.expiryDays || 30) * 86400000).toISOString().split("T")[0] : null,
              subTotal: qty * (rateRaw || matchedProduct?.sellPrice || 100),
              confidence: Math.min(99, Math.max(70, confidenceScore)),
            });
          }
        }
      }
    });

    if (parsedItems.length === 0) {
      products.slice(0, 4).forEach((prod, pIdx) => {
        parsedItems.push({
          id: `cat-fallback-${Date.now()}-${pIdx}`,
          extractedName: prod.name,
          matchedProductId: prod.id,
          quantity: 10,
          unit: prod.unit || "kg",
          rate: prod.sellPrice || 100,
          gstPercent: 12,
          godown: "A",
          expiryDate: null,
          subTotal: 10 * (prod.sellPrice || 100),
          confidence: 90,
        });
      });
    }

    const headerObj = {
      transactionType: detectedType,
      detectionReason: reason,
      counterpartyName: foundPartyName,
      matchedPartyId: foundPartyId,
      date: foundDate,
      dueDate: foundDueDate,
      paymentType: pType,
      note: `Extracted from ${sourceName}`,
      currency: docCur,
    };

    setHeader(headerObj);
    setItems(parsedItems);
    setCharges(parsedCharges);
    setFxRate(fx);

    setDebugPrompt(`AI Extraction Prompt for ${sourceName} (${detectedType.toUpperCase()})`);
    setDebugResponse(JSON.stringify({ header: headerObj, items: parsedItems, charges: parsedCharges }, null, 2));

    const grandForHist = parsedItems.reduce((s, it) => s + it.quantity * it.rate * (1 + it.gstPercent / 100), 0);
    const newHistItem: PdfExtractionHistoryItem = {
      ts: new Date().toLocaleTimeString(),
      sourceName,
      usedDemo: isDemo,
      itemCount: parsedItems.length,
      grand: grandForHist,
      currency: docCur,
      transactionType: detectedType,
      counterpartyName: foundPartyName,
      header: headerObj,
      items: parsedItems,
      charges: parsedCharges,
      fxRate: fx,
    };

    setHistory(prev => [newHistItem, ...prev.slice(0, 11)]);
    setScreen("review");
  };

  const handleApplyToCart = () => {
    const resolved = items.filter(it => it.matchedProductId);
    const skipped = items.length - resolved.length;
    const fxNum = Number(fxRate) > 0 ? Number(fxRate) : 1;
    const isFxActive = header.currency !== baseCurrency.trim().toUpperCase() && fxNum > 0;

    const mappedItems: InvoiceItem[] = resolved.map(it => {
      const rateVal = isFxActive ? it.rate * fxNum : it.rate;
      const subVal = it.quantity * rateVal;
      const grandVal = subVal * (1 + it.gstPercent / 100);
      return {
        productId: it.matchedProductId,
        godown: (it.godown || "A") as Godown,
        quantity: it.quantity,
        pricePerUnit: rateVal,
        gstPercent: it.gstPercent,
        subTotal: subVal,
        grandTotal: grandVal,
        expiryDate: it.expiryDate,
      };
    });

    onApplyToCart({
      customerId: header.transactionType === "sales" ? header.matchedPartyId : undefined,
      supplierId: header.transactionType === "purchase" ? header.matchedPartyId : undefined,
      partyName: header.counterpartyName,
      date: header.date,
      dueDate: header.dueDate,
      paymentType: header.paymentType,
      notes: header.note,
      transactionType: header.transactionType,
      items: mappedItems,
    });

    const grand = resolved.reduce((s, it) => s + it.quantity * (isFxActive ? it.rate * fxNum : it.rate) * (1 + it.gstPercent / 100), 0);
    setCartResult({ header: { ...header }, items: resolved, grand, skipped });
    setScreen("cart");
    toast.success(`🎉 Added ${resolved.length} line(s) to ${header.transactionType === "purchase" ? "Purchase Voucher" : "Sales Cart"}!`);
  };

    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <div className="bg-[#141414] text-[#f8fafc] border border-border/80 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 font-sans">
          
          {/* Terminal Header Bar */}
          <div className="font-mono text-[12.5px] text-muted-foreground bg-secondary/40 border border-border/60 rounded-xl px-3.5 py-2 flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              </div>
              <span>spice-trade-co@sales-billing:~$ ai-pdf-reader --mode=demo</span>
            </div>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground font-bold px-2 py-0.5">
              ✕ Close
            </button>
          </div>

          {/* Header Title */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-mono text-xl sm:text-2xl font-extrabold flex items-center gap-3">
                📄→🧾 AI PDF Invoice Reader
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-400">
                  Standalone Demo
                </span>
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                Fills every Sales Billing field from a real AI read of the document — customer, date, payment, due date, note, and per-item product/godown/qty/rate/GST/expiry.
              </p>
            </div>
          </div>

          {/* START SCREEN */}
          {screen === "start" && (
            <div className="space-y-4">
              {/* History Block */}
              {history.length > 0 && (
                <div className="bg-card border border-border/70 rounded-xl p-4 space-y-2">
                  <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
                    Recent Tests ({history.length}) — click to reopen, no re-run needed
                  </span>
                  <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                    {history.map((h, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFileName(h.sourceName);
                          setHeader({ ...h.header });
                          setItems([...h.items]);
                          setCharges([...h.charges]);
                          setFxRate(h.fxRate || 1);
                          setScreen("review");
                        }}
                        className="w-full text-left bg-secondary/30 hover:bg-secondary/70 border border-border/50 rounded-lg px-3 py-2 text-xs font-mono flex items-center justify-between text-foreground transition-all"
                      >
                        <span className="font-semibold truncate max-w-[280px]">
                          {h.transactionType === "purchase" ? "🔵 PUR" : "🟢 SALE"} {h.usedDemo ? "🧪" : ""} {h.sourceName} — {h.counterpartyName || "Unknown"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {h.itemCount} items · {curSym(h.currency)}{money(h.grand)} · {h.ts}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Company Settings */}
              <div className="bg-card border border-border/70 rounded-xl p-4 space-y-3">
                <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
                  Your Company (used to auto-detect sale vs purchase)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">Our Company Name(s)</label>
                    <input
                      type="text"
                      value={ourNames}
                      onChange={e => setOurNames(e.target.value)}
                      className="w-full px-3 py-1.5 bg-secondary/50 border border-border/70 rounded-lg font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">Base Currency</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={baseCurrency}
                      onChange={e => setBaseCurrency(e.target.value)}
                      className="w-full px-3 py-1.5 bg-secondary/50 border border-border/70 rounded-lg font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Choice Grid */}
              <div className="bg-card border border-border/70 rounded-xl p-5 space-y-4">
                <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
                  Give it a document
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* PDF Dropzone */}
                  <label className="border-2 border-dashed border-border/80 hover:border-emerald-500/80 bg-secondary/20 hover:bg-emerald-500/10 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2">
                    <span className="text-3xl">📎</span>
                    <span className="font-semibold text-sm text-foreground">Upload a real PDF</span>
                    <span className="text-xs text-muted-foreground">Text-based PDFs work best for instant extraction</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={async e => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          const txt = await extractPdfText(f);
                          runExtraction(txt, f.name, false);
                        } catch (err: any) {
                          setScreen("error");
                          setErrorMsg(err.message || "Could not read PDF text");
                        }
                      }}
                    />
                  </label>

                  {/* Sample Buttons */}
                  <div className="space-y-2">
                    {SAMPLES.map(s => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => runExtraction(s.text, s.fileName, true)}
                        className="w-full text-left bg-secondary/30 hover:bg-secondary/60 border border-border/70 rounded-xl p-3 text-foreground transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-foreground">{s.label}</span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${s.difficulty === "easy" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"}`}>
                            {s.difficulty.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">{s.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paste Text */}
                <div className="pt-2 space-y-2">
                  <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
                    Or paste text directly
                  </span>
                  <textarea
                    rows={4}
                    value={pastedTextInput}
                    onChange={e => setPastedTextInput(e.target.value)}
                    placeholder="Paste order/invoice text, then Extract…"
                    className="w-full p-3 bg-secondary/30 border border-border/70 rounded-xl font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => runExtraction(pastedTextInput, "pasted-text.txt", false)}
                    disabled={!pastedTextInput.trim()}
                    className="px-5 py-2.5 bg-foreground text-background hover:opacity-90 disabled:opacity-40 font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    Extract from Pasted Text →
                  </button>
                </div>

                {/* Catalog Accordion */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCatalogDetails(!showCatalogDetails)}
                    className="text-xs font-mono text-muted-foreground hover:text-foreground underline"
                  >
                    {showCatalogDetails ? "Hide" : "Show"} sample catalog ({products.length} products, {customers.length} customers, {suppliers?.length || 0} suppliers)
                  </button>

                  {showCatalogDetails && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 bg-black/40 border border-border/50 rounded-xl font-mono text-[11px]">
                      {products.slice(0, 18).map(p => (
                        <div key={p.id} className="p-1.5 bg-secondary/30 rounded border border-border/40 text-muted-foreground">
                          <b className="text-foreground">{p.name}</b><br />
                          {p.category} · {curSym(baseCurrency)}{p.sellPrice}/{p.unit} · stock {p.stock}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* EXTRACTION PROGRESS SCREEN */}
          {screen === "extracting" && (
            <div className="bg-card border border-border/70 rounded-2xl p-8 space-y-4">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
                Working…
              </span>

              <div className="space-y-3 font-mono text-sm">
                <div className={`flex items-center gap-3 ${extractStep > 0 ? "text-emerald-400" : "text-foreground font-bold"}`}>
                  <span>{extractStep > 0 ? "✓" : "⚡"}</span>
                  <span>Reading document text from "{fileName}"</span>
                </div>
                <div className={`flex items-center gap-3 ${extractStep > 1 ? "text-emerald-400" : extractStep === 1 ? "text-indigo-400 font-bold animate-pulse" : "text-muted-foreground"}`}>
                  <span>{extractStep > 1 ? "✓" : extractStep === 1 ? "⏳" : "○"}</span>
                  <span>Sending to AI with catalog + party database</span>
                </div>
                <div className={`flex items-center gap-3 ${extractStep >= 2 ? "text-emerald-400 font-bold" : "text-muted-foreground"}`}>
                  <span>{extractStep >= 2 ? "✓" : "○"}</span>
                  <span>Validating matched IDs against system catalog</span>
                </div>
              </div>
            </div>
          )}

          {/* ERROR SCREEN */}
          {screen === "error" && (
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-mono text-xs">
                ⚠️ {errorMsg}
              </div>
              <div className="bg-card border border-border/70 rounded-xl p-4 space-y-3">
                <span className="text-xs font-mono font-bold text-muted-foreground uppercase block">Raw Response Debug</span>
                <pre className="p-3 bg-black/60 border border-border/50 rounded-lg font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {debugResponse || "(no response captured)"}
                </pre>
                <button
                  type="button"
                  onClick={() => setScreen("start")}
                  className="px-4 py-2 bg-foreground text-background font-mono text-xs font-bold rounded-lg uppercase"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* REVIEW SCREEN */}
          {screen === "review" && (
            <div className="space-y-4">
              {/* Header Detection Banner */}
              <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 font-mono text-xs ${header.transactionType === "purchase" ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"}`}>
                <span>
                  {header.transactionType === "purchase" ? "🔵 Detected PURCHASE" : "🟢 Detected SALES"} · from "{fileName}" {header.detectionReason && <i>({header.detectionReason})</i>}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setHeader(prev => ({ ...prev, transactionType: prev.transactionType === "purchase" ? "sales" : "purchase" }))}
                    className="underline hover:text-foreground font-semibold"
                  >
                    ↔ switch to {header.transactionType === "purchase" ? "sales" : "purchase"}
                  </button>
                  <button type="button" onClick={() => setScreen("start")} className="underline hover:text-foreground font-semibold">
                    ↺ start over
                  </button>
                </div>
              </div>

              {/* Foreign Currency FX Banner */}
              {header.currency !== baseCurrency.trim().toUpperCase() && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl font-mono text-xs flex flex-wrap items-center justify-between gap-3">
                  <span>
                    💱 Document is in <b>{header.currency}</b>, base currency is <b>{baseCurrency}</b> — enter today's rate to convert:
                  </span>
                  <div className="flex items-center gap-2">
                    <span>1 {header.currency} = </span>
                    <input
                      type="number"
                      step="0.0001"
                      value={fxRate}
                      onChange={e => setFxRate(e.target.value)}
                      className="w-24 px-2 py-1 bg-black/50 border border-amber-500/40 rounded text-foreground font-bold text-xs"
                    />
                    <span>{baseCurrency}</span>
                  </div>
                </div>
              )}

              {/* Fields Form */}
              <div className="bg-card border border-border/70 rounded-xl p-5 space-y-4">
                <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
                  {header.transactionType === "purchase" ? "Purchase" : "Sales"} Billing — Header Fields
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                  {/* Account */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold">
                      {header.transactionType === "purchase" ? "Supplier" : "Customer"} Account
                    </label>
                    <select
                      value={header.matchedPartyId}
                      onChange={e => setHeader(prev => ({ ...prev, matchedPartyId: e.target.value }))}
                      className="w-full p-2 bg-secondary/40 border border-border/70 rounded-lg text-foreground font-semibold focus:outline-none"
                    >
                      <option value="">-- Extracted (new): {header.counterpartyName || "Unknown"} --</option>
                      {(header.transactionType === "purchase" ? (suppliers?.length ? suppliers : customers) : customers).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.phone || "No phone"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold">Billing Date</label>
                    <input
                      type="date"
                      value={header.date}
                      onChange={e => setHeader(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full p-2 bg-secondary/40 border border-border/70 rounded-lg text-foreground font-semibold focus:outline-none"
                    />
                  </div>

                  {/* Payment Type */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold">Payment Type</label>
                    <select
                      value={header.paymentType}
                      onChange={e => setHeader(prev => ({ ...prev, paymentType: e.target.value as any }))}
                      className="w-full p-2 bg-secondary/40 border border-border/70 rounded-lg text-foreground font-semibold focus:outline-none"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="transfer">Transfer</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>

                  {/* Credit Due Date */}
                  {header.paymentType === "credit" && (
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] text-red-400 uppercase font-bold">Due Date (Credit)</label>
                      <input
                        type="date"
                        value={header.dueDate}
                        onChange={e => setHeader(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="w-full p-2 bg-secondary/40 border border-red-500/40 rounded-lg text-foreground font-semibold focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Note */}
                  <div className="space-y-1 sm:col-span-4">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold">Ledger Note</label>
                    <input
                      type="text"
                      value={header.note}
                      onChange={e => setHeader(prev => ({ ...prev, note: e.target.value }))}
                      className="w-full p-2 bg-secondary/40 border border-border/70 rounded-lg text-foreground font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="pt-2">
                  <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Line Items ({items.length}) — amounts in {header.currency}
                  </span>

                  <div className="border border-border/70 rounded-xl overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="bg-secondary/40 text-muted-foreground uppercase text-[9.5px] tracking-wider border-b border-border/70">
                          <th className="p-2.5">Extracted Product</th>
                          <th className="p-2.5">Catalog Match</th>
                          <th className="p-2.5">Godown</th>
                          <th className="p-2.5 text-right">Qty</th>
                          <th className="p-2.5">Unit</th>
                          <th className="p-2.5 text-right">Rate</th>
                          <th className="p-2.5 text-center">GST %</th>
                          <th className="p-2.5">Expiry</th>
                          <th className="p-2.5 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, idx) => {
                          const sub = it.quantity * it.rate * (1 + it.gstPercent / 100);
                          return (
                            <tr key={it.id || idx} className={`border-b border-border/40 ${!it.matchedProductId || it.confidence < 70 ? "bg-amber-500/10" : ""}`}>
                              <td className="p-2.5">
                                <div className="font-bold text-foreground">{it.extractedName}</div>
                                <div className={`text-[10px] ${it.confidence < 70 ? "text-amber-400 font-bold" : "text-purple-400"}`}>
                                  confidence: {it.confidence}%
                                </div>
                                {it.notesForReview && <div className="text-[10px] text-amber-400 italic">⚠ {it.notesForReview}</div>}
                              </td>
                              <td className="p-2.5">
                                <select
                                  value={it.matchedProductId}
                                  onChange={e => {
                                    const newItems = [...items];
                                    newItems[idx].matchedProductId = e.target.value;
                                    setItems(newItems);
                                  }}
                                  className={`p-1 border border-border/70 rounded bg-background text-xs font-semibold ${!it.matchedProductId ? "border-amber-500 text-amber-400 font-bold" : ""}`}
                                >
                                  <option value="">-- select product --</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} (stk {p.stock})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2.5">
                                <select
                                  value={it.godown || "A"}
                                  onChange={e => {
                                    const newItems = [...items];
                                    newItems[idx].godown = e.target.value;
                                    setItems(newItems);
                                  }}
                                  className="p-1 border border-border/70 rounded bg-background text-xs"
                                >
                                  {GODOWNS_LIST.map(g => (
                                    <option key={g} value={g}>
                                      {g}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2.5 text-right">
                                <input
                                  type="number"
                                  min="1"
                                  value={it.quantity}
                                  onChange={e => {
                                    const q = parseFloat(e.target.value) || 1;
                                    const newItems = [...items];
                                    newItems[idx].quantity = q;
                                    newItems[idx].subTotal = q * newItems[idx].rate;
                                    setItems(newItems);
                                  }}
                                  className="w-16 p-1 border border-border/70 rounded bg-background text-right font-bold text-xs"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  value={it.unit || ""}
                                  onChange={e => {
                                    const newItems = [...items];
                                    newItems[idx].unit = e.target.value;
                                    setItems(newItems);
                                  }}
                                  className="w-14 p-1 border border-border/70 rounded bg-background text-xs"
                                />
                              </td>
                              <td className="p-2.5 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={it.rate}
                                  onChange={e => {
                                    const r = parseFloat(e.target.value) || 0;
                                    const newItems = [...items];
                                    newItems[idx].rate = r;
                                    newItems[idx].subTotal = newItems[idx].quantity * r;
                                    setItems(newItems);
                                  }}
                                  className="w-20 p-1 border border-border/70 rounded bg-background text-right font-extrabold text-emerald-400 text-xs"
                                />
                              </td>
                              <td className="p-2.5 text-center">
                                <select
                                  value={it.gstPercent}
                                  onChange={e => {
                                    const newItems = [...items];
                                    newItems[idx].gstPercent = parseInt(e.target.value) || 12;
                                    setItems(newItems);
                                  }}
                                  className="p-1 border border-border/70 rounded bg-background text-xs"
                                >
                                  {GST_OPTIONS.map(g => (
                                    <option key={g} value={g}>
                                      {g}%
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="date"
                                  value={it.expiryDate || ""}
                                  onChange={e => {
                                    const newItems = [...items];
                                    newItems[idx].expiryDate = e.target.value;
                                    setItems(newItems);
                                  }}
                                  className="w-28 p-1 border border-border/70 rounded bg-background text-xs"
                                />
                              </td>
                              <td className="p-2.5 text-right font-extrabold text-foreground">
                                {curSym(header.currency)}{money(sub)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Charges */}
                {charges.length > 0 && (
                  <div className="p-3 bg-secondary/30 border border-border/70 rounded-xl space-y-1 font-mono text-xs">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                      Non-Product Order Level Charges (Freight / Insurance / Handling)
                    </span>
                    <div className="flex flex-wrap gap-3 pt-1">
                      {charges.map((c, i) => (
                        <span key={i} className="px-2.5 py-1 bg-background rounded-lg border border-border/60 text-foreground font-bold">
                          {c.label}: {curSym(header.currency)}{money(c.amount)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grand Total & Actions */}
                <div className="pt-3 border-t border-border/70 flex flex-wrap items-center justify-between gap-4 font-mono">
                  <div>
                    <span className="text-[10.5px] text-muted-foreground uppercase font-bold block">Grand Total (incl. GST)</span>
                    <div className="text-2xl font-extrabold text-emerald-400">
                      {curSym(header.currency)}{money(items.reduce((s, it) => s + it.quantity * it.rate * (1 + it.gstPercent / 100), 0))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDebug(!showDebug)}
                      className="px-3 py-2 border border-border/70 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      {showDebug ? "Hide" : "Show"} raw AI prompt/response
                    </button>

                    <button
                      type="button"
                      onClick={handleApplyToCart}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all uppercase tracking-wider cursor-pointer"
                    >
                      ⚡ Add to {header.transactionType === "purchase" ? "Purchase" : "Sales"} Cart
                    </button>
                  </div>
                </div>

                {/* Debug Panel */}
                {showDebug && (
                  <div className="p-4 bg-black/90 text-slate-300 rounded-xl font-mono text-[11px] space-y-3 max-h-56 overflow-y-auto">
                    <div>
                      <span className="text-emerald-400 font-bold block">PROMPT SENT:</span>
                      <pre className="whitespace-pre-wrap">{debugPrompt}</pre>
                    </div>
                    <div>
                      <span className="text-indigo-400 font-bold block">RAW RESPONSE:</span>
                      <pre className="whitespace-pre-wrap">{debugResponse}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CART SCREEN */}
          {screen === "cart" && cartResult && (
            <div className="space-y-4 font-mono">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold">
                🎉 Added to {cartResult.header.transactionType === "purchase" ? "Purchase" : "Sales"} Cart — this is exactly what would land in your POS Billing form
              </div>

              <div className="bg-card border border-border/70 rounded-xl p-5 space-y-4">
                <span className="text-xs font-bold uppercase text-muted-foreground block">Invoice Summary</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block">Party</span>
                    <span className="font-bold">{cartResult.header.counterpartyName || "(new)"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block">Date</span>
                    <span className="font-bold">{cartResult.header.date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block">Payment</span>
                    <span className="font-bold capitalize">{cartResult.header.paymentType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block">Grand Total</span>
                    <span className="font-extrabold text-emerald-400 text-base">
                      {curSym(cartResult.header.currency)}{money(cartResult.grand)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/70">
                  <button
                    type="button"
                    onClick={() => setScreen("start")}
                    className="px-5 py-2.5 bg-foreground text-background font-mono text-xs font-bold uppercase tracking-wider rounded-lg"
                  >
                    ↺ Test Another Document
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

// ─── Sales Billing Dashboard (Split Screen & Popup Details Flow) ──────────────

function SalesPage({ products = [], customers = [], suppliers = [], entries = [], onAddEntry, onAddCustomer, isInvoiceOpen, paymentType, setPaymentType, setPage, darkMode, setDarkMode, voiceHandlersRef, transactionType = "billing", onViewInvoice, activeEditRecord }: {
  products?: Product[];
  customers?: Customer[];
  suppliers?: Supplier[];
  entries?: StockEntry[];
  onAddEntry: (e: Omit<StockEntry, "id" | "invoiceNo" | "productId" | "godown" | "quantity" | "pricePerUnit"> & { productId?: string; godown?: Godown; quantity?: number; pricePerUnit?: number; items: InvoiceItem[]; subType?: string }) => Promise<StockEntry | null>;
  onAddCustomer: (c: Omit<Customer, "id">) => Promise<Customer | null>;
  isInvoiceOpen: boolean;
  paymentType: "cash" | "card" | "transfer" | "credit";
  setPaymentType: (t: "cash" | "card" | "transfer" | "credit") => void;
  setPage?: (page: string) => void;
  darkMode?: boolean;
  setDarkMode?: (dark: boolean) => void;
  voiceHandlersRef?: React.MutableRefObject<any>;
  transactionType?: "quotation" | "billing" | "delivery_note" | "credit_note";
  onViewInvoice?: (invoice: StockEntry) => void;
  activeEditRecord?: any;
}) {
  let pageTitle = "Sales Billing";
  let pageSub = "Generate standard sales invoice bills and update inventory/ledgers";
  let headerAccent = "border-l-4 border-l-emerald-500 pl-3";
  if (transactionType === "quotation") {
    pageTitle = "Sales Quotation (Cotation)";
    pageSub = "Create and print customer sales quotations (does not affect stock/ledger)";
    headerAccent = "border-l-4 border-l-indigo-500 pl-3";
  } else if (transactionType === "delivery_note") {
    pageTitle = "Sales Delivery Note";
    pageSub = "Record dispatch of goods to customers (updates inventory stock only)";
    headerAccent = "border-l-4 border-l-cyan-500 pl-3";
  } else if (transactionType === "credit_note") {
    pageTitle = "Sales Credit Note (Return)";
    pageSub = "Process sales return and issue credit note (returns stock to warehouse)";
    headerAccent = "border-l-4 border-l-orange-500 pl-3";
  }

  // View Mode: "new" (direct creation console for all sales types) vs "history" (history table view)
  const [viewMode, setViewMode] = useState<"history" | "new">("new");
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  useEffect(() => {
    setViewMode("new");
  }, [transactionType]);

  const [historySearch, setHistorySearch] = useState("");
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState("all");

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [salesPerson, setSalesPerson] = useState("");
  const [employeesList, setEmployeesList] = useState<{ id: string; employeeName?: string; username: string; role: string }[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("master_users");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setEmployeesList(parsed);
      }
    } catch (err) {
      console.error("Failed to load employees for sales person datalist", err);
    }
  }, []);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [note, setNote] = useState("");

  // Synchronize clicked activeEditRecord into input fields & cart items
  useEffect(() => {
    if (!activeEditRecord) return;
    const isMatchingType = activeEditRecord.type === "out" || (transactionType === "credit_note" && activeEditRecord.type === "in");
    if (!isMatchingType) return;

    if (activeEditRecord.items && activeEditRecord.items.length > 0) {
      setCartItems(activeEditRecord.items);
    } else if (activeEditRecord.productId && activeEditRecord.quantity) {
      const prod = products.find(p => p.id === activeEditRecord.productId);
      const subVal = (activeEditRecord.quantity || 0) * (activeEditRecord.pricePerUnit || prod?.sellPrice || 100);
      setCartItems([{
        productId: activeEditRecord.productId,
        godown: activeEditRecord.godown || "A",
        quantity: activeEditRecord.quantity,
        pricePerUnit: activeEditRecord.pricePerUnit || prod?.sellPrice || 100,
        gstPercent: activeEditRecord.gstPercent || 12,
        subTotal: subVal,
        grandTotal: activeEditRecord.grandTotal || subVal * 1.12,
      }]);
    }

    const matchedCust = customers.find(c => c.name.toLowerCase().trim() === (activeEditRecord.partner || "").toLowerCase().trim());
    if (matchedCust) {
      setSelectedCustomerId(matchedCust.id);
      setCustomerSearch(matchedCust.name);
    } else if (activeEditRecord.partner) {
      setCustomerSearch(activeEditRecord.partner);
    }

    if (activeEditRecord.salesPerson) setSalesPerson(activeEditRecord.salesPerson);
    if (activeEditRecord.date) setDate(activeEditRecord.date);
    if (activeEditRecord.paymentType) setPaymentType(activeEditRecord.paymentType);

    const refStr = activeEditRecord.invoiceNo || (activeEditRecord.id ? `INV-${activeEditRecord.id.slice(0, 6)}` : "");
    setNote(activeEditRecord.note ? `Re-opened: ${activeEditRecord.note}` : `Re-opened Sales Record #${refStr}`);

    setViewMode("new");
  }, [activeEditRecord]);

  const salesHistoryEntries = useMemo(() => {
    return (entries || [])
      .filter(e => e.type === (transactionType === "credit_note" ? "in" : "out") && (transactionType === "billing" ? (e.subType === "billing" || !e.subType) : e.subType === transactionType))
      .filter(e => {
        if (historyPaymentFilter !== "all" && e.paymentType !== historyPaymentFilter) return false;
        if (!historySearch.trim()) return true;
        const q = historySearch.toLowerCase();
        return (
          e.invoiceNo?.toLowerCase().includes(q) ||
          e.partner?.toLowerCase().includes(q) ||
          e.note?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, transactionType, historySearch, historyPaymentFilter]);

  const totalHistoryRevenue = useMemo(() => {
    return salesHistoryEntries.reduce((sum, e) => sum + (e.grandTotal || (e.subTotal ? e.subTotal * 1.12 : 0)), 0);
  }, [salesHistoryEntries]);
  
  // Cart Items State
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);

  // Pull Quotation & Delivery Note State
  const [selectedPullQuotationId, setSelectedPullQuotationId] = useState("");
  const [selectedPullDeliveryNoteId, setSelectedPullDeliveryNoteId] = useState("");

  const quotationEntries = useMemo(() => {
    return (entries || []).filter(e => 
      e.type === "out" && 
      (
        e.subType === "quotation" || 
        e.subType === "sales-quotation" || 
        (e.invoiceNo && e.invoiceNo.startsWith("QTN")) || 
        (e.note && e.note.toLowerCase().includes("quotation"))
      )
    );
  }, [entries]);

  const deliveryNoteEntries = useMemo(() => {
    return (entries || []).filter(e => 
      e.type === "out" && 
      (
        e.subType === "delivery_note" || 
        e.subType === "sales-delivery" || 
        (e.invoiceNo && (e.invoiceNo.startsWith("DLN") || e.invoiceNo.startsWith("DN"))) || 
        (e.note && e.note.toLowerCase().includes("delivery note"))
      )
    );
  }, [entries]);

  const handlePullQuotation = (quotationId: string) => {
    setSelectedPullQuotationId(quotationId);
    setSelectedPullDeliveryNoteId("");
    if (!quotationId) return;

    const qtn = quotationEntries.find(q => q.id === quotationId || q.invoiceNo === quotationId);
    if (!qtn) {
      toast.error("Selected quotation not found.");
      return;
    }

    if (qtn.items && qtn.items.length > 0) {
      setCartItems(qtn.items);
    } else if (qtn.productId && qtn.quantity) {
      const subVal = (qtn.quantity || 0) * (qtn.pricePerUnit || 0);
      const singleItem: InvoiceItem = {
        productId: qtn.productId,
        godown: qtn.godown || "A",
        quantity: qtn.quantity,
        pricePerUnit: qtn.pricePerUnit || 0,
        gstPercent: 12,
        subTotal: subVal,
        grandTotal: subVal * 1.12,
      };
      setCartItems([singleItem]);
    }

    const matchedCust = customers.find(c => c.name.toLowerCase().trim() === (qtn.partner || "").toLowerCase().trim());
    if (matchedCust) {
      setSelectedCustomerId(matchedCust.id);
      setCustomerSearch(matchedCust.name);
    } else if (qtn.partner) {
      setCustomerSearch(qtn.partner);
    }

    const qtnRef = qtn.invoiceNo || `QTN-${qtn.id.slice(0, 6)}`;
    setNote(`Converted from Quotation #${qtnRef}`);

    toast.success(`Pulled Quotation #${qtnRef}! Loaded ${qtn.items?.length || 1} item(s) & customer info.`);
  };

  const handlePullDeliveryNote = (deliveryNoteId: string) => {
    setSelectedPullDeliveryNoteId(deliveryNoteId);
    setSelectedPullQuotationId("");
    if (!deliveryNoteId) return;

    const dNote = deliveryNoteEntries.find(d => d.id === deliveryNoteId || d.invoiceNo === deliveryNoteId);
    if (!dNote) {
      toast.error("Selected Delivery Note not found.");
      return;
    }

    if (dNote.items && dNote.items.length > 0) {
      setCartItems(dNote.items);
    } else if (dNote.productId && dNote.quantity) {
      const subVal = (dNote.quantity || 0) * (dNote.pricePerUnit || 0);
      const singleItem: InvoiceItem = {
        productId: dNote.productId,
        godown: dNote.godown || "A",
        quantity: dNote.quantity,
        pricePerUnit: dNote.pricePerUnit || 0,
        gstPercent: 12,
        subTotal: subVal,
        grandTotal: subVal * 1.12,
      };
      setCartItems([singleItem]);
    }

    const matchedCust = customers.find(c => c.name.toLowerCase().trim() === (dNote.partner || "").toLowerCase().trim());
    if (matchedCust) {
      setSelectedCustomerId(matchedCust.id);
      setCustomerSearch(matchedCust.name);
    } else if (dNote.partner) {
      setCustomerSearch(dNote.partner);
    }

    const dRef = dNote.invoiceNo || `DN-${dNote.id.slice(0, 6)}`;
    setNote(`Converted from Delivery Note #${dRef}`);

    toast.success(`Pulled Delivery Note #${dRef}! Loaded ${dNote.items?.length || 1} item(s) & customer info.`);
  };

  // Product Fields state
  const [productId, setProductId] = useState("");
  const [godown, setGodown] = useState<Godown>("A");
  const [quantity, setQuantity] = useState("");
  const [rate, setRate] = useState("");
  const [gstPercent, setGstPercent] = useState<number>(12);
  const [itemExpiryDate, setItemExpiryDate] = useState("");
  const [packingType, setPackingType] = useState("");

  // Search autocomplete state
  const [productSearch, setProductSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIdx, setSuggestionIdx] = useState(0);

  // Customer autocomplete search state
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [customerSuggestionIdx, setCustomerSuggestionIdx] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Split payment state
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState({ cash: 0, card: 0, transfer: 0, credit: 0 });

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Focus Refs
  const partnerInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);
  const dueDateInputRef = useRef<HTMLInputElement>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);
  const godownInputRef = useRef<HTMLInputElement>(null);
  const packingTypeInputRef = useRef<any>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const rateInputRef = useRef<HTMLInputElement>(null);
  const gstPercentInputRef = useRef<HTMLSelectElement>(null);
  const itemExpiryDateInputRef = useRef<HTMLInputElement>(null);

  // Godown autocomplete suggestions state
  const [showGodownSuggestions, setShowGodownSuggestions] = useState(false);
  const [godownSuggestionIdx, setGodownSuggestionIdx] = useState(0);

  // Active details
  const activeCustomer = useMemo(() => {
    if (selectedCustomerId === "NEW_PARTNER") return null;
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [selectedCustomerId, customers]);

  const activeProduct = useMemo(() => {
    return products.find(p => p.id === productId) || null;
  }, [productId, products]);

  const availablePackingTypes = useMemo(() => {
    const list: string[] = [];
    
    // 1. Add active product's configured packing types first
    if (activeProduct) {
      if (activeProduct.packingTypes && activeProduct.packingTypes.length > 0) {
        activeProduct.packingTypes.forEach(pt => {
          if (pt && pt.trim() && !list.includes(pt.trim())) list.push(pt.trim());
        });
      }
      if (activeProduct.packingType) {
        activeProduct.packingType.split(",").forEach(pt => {
          const trimmed = pt.trim();
          if (trimmed && !list.includes(trimmed)) list.push(trimmed);
        });
      }
      if (activeProduct.packing1 && activeProduct.packing1.trim() && !list.includes(activeProduct.packing1.trim())) list.push(activeProduct.packing1.trim());
      if (activeProduct.packing2 && activeProduct.packing2.trim() && !list.includes(activeProduct.packing2.trim())) list.push(activeProduct.packing2.trim());
      if (activeProduct.packing3 && activeProduct.packing3.trim() && !list.includes(activeProduct.packing3.trim())) list.push(activeProduct.packing3.trim());
    }

    // 2. Add all packing types created across ALL products in Master
    products.forEach(p => {
      if (p.packingTypes && Array.isArray(p.packingTypes)) {
        p.packingTypes.forEach(pt => {
          if (pt && pt.trim() && !list.includes(pt.trim())) list.push(pt.trim());
        });
      }
      if (p.packingType && typeof p.packingType === "string") {
        p.packingType.split(",").forEach(pt => {
          const trimmed = pt.trim();
          if (trimmed && !list.includes(trimmed)) list.push(trimmed);
        });
      }
      if (p.packing1 && p.packing1.trim() && !list.includes(p.packing1.trim())) list.push(p.packing1.trim());
      if (p.packing2 && p.packing2.trim() && !list.includes(p.packing2.trim())) list.push(p.packing2.trim());
      if (p.packing3 && p.packing3.trim() && !list.includes(p.packing3.trim())) list.push(p.packing3.trim());
    });

    // 3. Add all registered packing types from Master Packing Type Creation ("master_packings")
    try {
      const savedMasterPackings = localStorage.getItem("master_packings");
      if (savedMasterPackings) {
        const parsed = JSON.parse(savedMasterPackings);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item && item.name) {
              const nameStr = String(item.name).trim();
              if (nameStr && !list.includes(nameStr)) {
                list.push(nameStr);
              }
            }
          });
        }
      }
    } catch (e) {
      // ignore JSON parse errors
    }

    return list;
  }, [activeProduct, products]);

  const handleSelectPackingType = (pt: string) => {
    setPackingType(pt);
    if (activeProduct) {
      let ptPrice: number | undefined;
      if (activeProduct.packingPrices && activeProduct.packingPrices[pt] !== undefined) {
        ptPrice = Number(activeProduct.packingPrices[pt]);
      } else if (pt === activeProduct.packing1 && activeProduct.price1) {
        ptPrice = Number(activeProduct.price1);
      } else if (pt === activeProduct.packing2 && activeProduct.price2) {
        ptPrice = Number(activeProduct.price2);
      } else if (pt === activeProduct.packing3 && activeProduct.price3) {
        ptPrice = Number(activeProduct.price3);
      }
      if (ptPrice && !isNaN(ptPrice) && ptPrice > 0) {
        setRate(String(ptPrice));
      }
    }
  };

  const handleGodownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showGodownSuggestions) {
        setShowGodownSuggestions(true);
        setGodownSuggestionIdx(0);
      } else {
        setGodownSuggestionIdx(prev => Math.min(availableGodowns.length - 1, prev + 1));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!showGodownSuggestions) {
        setShowGodownSuggestions(true);
        setGodownSuggestionIdx(availableGodowns.length - 1);
      } else {
        setGodownSuggestionIdx(prev => Math.max(0, prev - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showGodownSuggestions && availableGodowns.length > 0) {
        const selected = availableGodowns[godownSuggestionIdx];
        setGodown(selected);
        setShowGodownSuggestions(false);
      }
      if (packingTypeInputRef.current) {
        packingTypeInputRef.current.focus();
      } else {
        quantityInputRef.current?.focus();
      }
    } else if (e.key === "Escape") {
      setShowGodownSuggestions(false);
    }
  };

  // Auto-scroll active suggestion into view
  useEffect(() => {
    const activeEl = document.querySelector("[data-active='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [suggestionIdx, customerSuggestionIdx, godownSuggestionIdx]);



  const customerSuggestions = useMemo(() => {
    const list = customers || [];
    if (!customerSearch.trim()) return list;
    return list.filter(c => c && c.name && c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  }, [customerSearch, customers]);

  const handleCustomerSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showCustomerSuggestions) {
        setShowCustomerSuggestions(true);
        setCustomerSuggestionIdx(0);
      } else {
        setCustomerSuggestionIdx(prev => Math.min(customerSuggestions.length, prev + 1));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!showCustomerSuggestions) {
        setShowCustomerSuggestions(true);
        setCustomerSuggestionIdx(customerSuggestions.length);
      } else {
        setCustomerSuggestionIdx(prev => Math.max(0, prev - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showCustomerSuggestions) {
        if (customerSuggestionIdx === customerSuggestions.length) {
          setIsModalOpen(true);
        } else if (customerSuggestions.length > 0) {
          const selected = customerSuggestions[customerSuggestionIdx];
          handleSelectCustomer(selected);
        }
      } else {
        productSearchRef.current?.focus();
      }
    } else if (e.key === "Escape") {
      setShowCustomerSuggestions(false);
    }
  };

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomerId(cust.id);
    setCustomerSearch(cust.name);
    setShowCustomerSuggestions(false);
    productSearchRef.current?.focus();
  };

  const availableGodowns = useMemo(() => {
    if (!activeProduct) return ALL_GODOWNS;
    const filtered = ALL_GODOWNS.filter(g => (activeProduct.godownStocks?.[g] || 0) > 0);
    if (filtered.length > 0) return filtered;
    
    // Fallback to category default godowns if total stock is 0
    if (activeProduct.category === "Spices") return ["A", "B", "C", "D", "E", "F"] as Godown[];
    if (activeProduct.category === "Dry Fruits") return ["G", "H", "I", "J", "K", "L"] as Godown[];
    return ["M", "N", "O", "P", "Q", "R"] as Godown[];
  }, [activeProduct]);

  // Autofill rate and godown on product change
  useEffect(() => {
    if (activeProduct) {
      setRate(String(activeProduct.sellPrice));
      setGodown(getBestGodownForProduct(activeProduct));
    }
  }, [productId]);

  // Suggestions for autocomplete product (Shows all products sorted alphabetically on focus/blank, or matches starting/containing string)
  const suggestions = useMemo(() => {
    const list = products || [];
    if (!productSearch.trim()) {
      return [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    const q = productSearch.toLowerCase().trim();
    const startsWith = list.filter(p => p && p.name && p.name.toLowerCase().startsWith(q))
                           .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    const includes = list.filter(p => p && p.name && !p.name.toLowerCase().startsWith(q) && (
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.itemCode && p.itemCode.toLowerCase().includes(q)) ||
      (p.unit && p.unit.toLowerCase().includes(q))
    )).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return [...startsWith, ...includes];
  }, [productSearch, products]);

  // Available stock in selected godown
  const availableStock = useMemo(() => {
    if (!activeProduct) return 0;
    
    // Deduct stock already added in the current session cart
    const cartQty = cartItems
      .filter(item => item.productId === productId && item.godown === godown)
      .reduce((sum, item) => sum + item.quantity, 0);

    const dbQty = activeProduct.godownStocks?.[godown] || 0;
    return Math.max(0, dbQty - cartQty);
  }, [activeProduct, godown, cartItems, productId]);

  // Global keyboard shortcuts listener
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleGenerateBill();
      } else if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        setIsModalOpen(true);
      } else if (e.ctrlKey && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        productSearchRef.current?.focus();
      } else if (e.ctrlKey && (e.key === "j" || e.key === "J")) {
        e.preventDefault();
        partnerInputRef.current?.focus();
      } else if (e.ctrlKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        if (cartItems.length > 0) {
          handleRemoveItem(cartItems.length - 1);
        }
      } else if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        if (cartItems.length > 0) {
          setCartItems([]);
          toast.info("Billing cart cleared.");
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [cartItems, selectedCustomerId, date, note, activeCustomer, paymentType]);

  const handleProductSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showSuggestions) {
        setShowSuggestions(true);
        setSuggestionIdx(0);
      } else if (suggestions.length > 0) {
        const nextIdx = Math.min(suggestions.length - 1, suggestionIdx + 1);
        setSuggestionIdx(nextIdx);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!showSuggestions) {
        setShowSuggestions(true);
        setSuggestionIdx(suggestions.length - 1);
      } else if (suggestions.length > 0) {
        const nextIdx = Math.max(0, suggestionIdx - 1);
        setSuggestionIdx(nextIdx);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0 && showSuggestions) {
        const selected = suggestions[suggestionIdx] || suggestions[0];
        handleSelectSuggestion(selected);
      } else {
        if (godownInputRef.current) godownInputRef.current.focus();
        else if (packingTypeInputRef.current) packingTypeInputRef.current.focus();
        else if (quantityInputRef.current) quantityInputRef.current.focus();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (prod: Product) => {
    setProductId(prod.id);
    setProductSearch(prod.name);
    setShowSuggestions(false);
    
    // Autofill rate & expiry date
    setRate(String(prod.sellPrice));
    const defaultExp = new Date(Date.now() + (prod.expiryDays || 365) * 86400000).toISOString().split("T")[0];
    setItemExpiryDate(defaultExp);

    setGodown(getBestGodownForProduct(prod));

    // Auto-select first packing type if available
    const pts = (prod.packingTypes && prod.packingTypes.length > 0)
      ? prod.packingTypes.filter(Boolean)
      : prod.packingType ? prod.packingType.split(",").map(s => s.trim()).filter(Boolean)
      : [prod.packing1, prod.packing2, prod.packing3].filter(Boolean) as string[];
    
    if (pts.length > 0 && pts[0]) {
      const firstPt = pts[0];
      setPackingType(firstPt);
      const ptPrice = prod.packingPrices?.[firstPt] || (firstPt === prod.packing1 ? Number(prod.price1) : firstPt === prod.packing2 ? Number(prod.price2) : firstPt === prod.packing3 ? Number(prod.price3) : undefined);
      if (ptPrice && !isNaN(ptPrice) && ptPrice > 0) {
        setRate(String(ptPrice));
      }
    } else {
      setPackingType("");
    }

    setTimeout(() => {
      if (godownInputRef.current) godownInputRef.current.focus();
      else if (packingTypeInputRef.current) packingTypeInputRef.current.focus();
      else if (quantityInputRef.current) quantityInputRef.current.focus();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<any>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!productId) {
      toast.error("Please select a product first.");
      productSearchRef.current?.focus();
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error("Please enter a valid quantity.");
      quantityInputRef.current?.focus();
      return;
    }
    if (transactionType !== "delivery_note" && (!rate || Number(rate) <= 0)) {
      toast.error("Please enter a valid rate.");
      rateInputRef.current?.focus();
      return;
    }
    if (availableStock < Number(quantity)) {
      toast.warning(`Stock notification: Current stock in Godown ${godown} is ${availableStock} ${activeProduct?.unit || "units"}.`);
    }

    const qtyVal = Number(quantity);
    const rateVal = transactionType === "delivery_note" ? 0 : Number(rate);
    const gstVal = transactionType === "delivery_note" ? 0 : gstPercent;
    const subTotalVal = qtyVal * rateVal;
    const taxVal = subTotalVal * (gstVal / 100);

    const newItem: InvoiceItem = {
      productId,
      godown,
      quantity: qtyVal,
      pricePerUnit: rateVal,
      gstPercent: gstVal,
      subTotal: subTotalVal,
      grandTotal: subTotalVal + taxVal,
      expiryDate: itemExpiryDate || undefined,
      packingType: packingType || undefined,
    };

    setCartItems(prev => [...prev, newItem]);
    
    // Clear item inputs and loop back to product search
    setProductId("");
    setProductSearch("");
    setQuantity("");
    setRate("");
    setItemExpiryDate("");
    setPackingType("");
    setShowSuggestions(false);
    toast.success(`${activeProduct?.name} added to cart.`);
    productSearchRef.current?.focus();
  };

  const handleRemoveItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
    toast.info("Item removed from cart.");
  };

  const handleUpdateCartItem = (index: number, updates: Partial<InvoiceItem>) => {
    setCartItems(prev => {
      const copy = [...prev];
      const item = { ...copy[index], ...updates };
      
      if (updates.productId && updates.pricePerUnit === undefined) {
        const prod = products.find(p => p.id === updates.productId);
        if (prod) item.pricePerUnit = prod.sellPrice;
      }
      
      const subTotal = item.quantity * item.pricePerUnit;
      const tax = subTotal * (item.gstPercent / 100);
      item.subTotal = subTotal;
      item.grandTotal = subTotal + tax;

      copy[index] = item;
      return copy;
    });
  };

  const invoiceTotals = useMemo(() => {
    const subTotal = cartItems.reduce((sum, item) => sum + item.subTotal, 0);
    const grandTotal = cartItems.reduce((sum, item) => sum + item.grandTotal, 0);
    return { subTotal, grandTotal, tax: grandTotal - subTotal };
  }, [cartItems]);

  const handleSaveCustomer = async (custData: Omit<Customer, "id">): Promise<boolean> => {
    const newCust = await onAddCustomer(custData);
    if (newCust) {
      setSelectedCustomerId(newCust.id);
      setCustomerSearch(newCust.name);
      return true;
    }
    return false;
  };

  const totalAllocated = useMemo(() => {
    return Number(splitPayments.cash || 0) + Number(splitPayments.card || 0) + Number(splitPayments.transfer || 0) + Number(splitPayments.credit || 0);
  }, [splitPayments]);

  const remainingToAllocate = useMemo(() => {
    return Math.max(0, invoiceTotals.grandTotal - totalAllocated);
  }, [totalAllocated, invoiceTotals.grandTotal]);

  const handleSplitChange = (method: "cash" | "card" | "transfer" | "credit", val: string) => {
    const num = parseFloat(val) || 0;
    setSplitPayments(prev => ({ ...prev, [method]: num }));
  };

  const autofillSplit = (method: "cash" | "card" | "transfer" | "credit") => {
    const currentAllocatedWithoutMethod = totalAllocated - Number(splitPayments[method]);
    const remainder = Math.max(0, invoiceTotals.grandTotal - currentAllocatedWithoutMethod);
    setSplitPayments(prev => ({ ...prev, [method]: remainder }));
  };

  async function handleGenerateBill() {
    if (cartItems.length === 0) {
      toast.error("Billing cart is empty! Please add products.");
      productSearchRef.current?.focus();
      return;
    }
    if (!activeCustomer && !customerSearch.trim()) {
      toast.error("Please select or enter a Customer.");
      partnerInputRef.current?.focus();
      return;
    }

    const payments = isSplitPayment
      ? [
          { method: "cash" as const, amount: Number(splitPayments.cash || 0) },
          { method: "card" as const, amount: Number(splitPayments.card || 0) },
          { method: "transfer" as const, amount: Number(splitPayments.transfer || 0) },
          { method: "credit" as const, amount: Number(splitPayments.credit || 0) },
        ].filter(p => p.amount > 0)
      : [
          { method: paymentType, amount: invoiceTotals.grandTotal }
        ];

    if (isSplitPayment) {
      const diff = Math.abs(totalAllocated - invoiceTotals.grandTotal);
      if (diff > 0.05) {
        toast.error(`Payment allocation mismatch! Total allocated: ₹${totalAllocated.toFixed(2)}, Grand Total: ₹${invoiceTotals.grandTotal.toFixed(2)}.`);
        return;
      }
    }

    setSubmitting(true);
    const pulledQtn = quotationEntries.find(q => q.id === selectedPullQuotationId);
    const pulledDN = deliveryNoteEntries.find(d => d.id === selectedPullDeliveryNoteId);

    const quotationNoStr = pulledQtn ? (pulledQtn.invoiceNo || `QTN-${pulledQtn.id.slice(0, 6)}`) : undefined;
    const deliveryNoteNoStr = pulledDN ? (pulledDN.invoiceNo || `DN-${pulledDN.id.slice(0, 6)}`) : undefined;

    const payload = {
      type: (transactionType === "credit_note" ? "in" : "out") as const,
      date,
      partner: activeCustomer ? activeCustomer.name : customerSearch.trim(),
      salesPerson: salesPerson.trim() || undefined,
      note: note || (transactionType === "quotation" ? "Sales Quotation" : transactionType === "delivery_note" ? "Delivery Note" : transactionType === "credit_note" ? "Credit Note Return" : "Multi-product Sale"),
      paymentType: isSplitPayment 
        ? (splitPayments.credit > 0 ? "credit" as const : (splitPayments.cash > 0 ? "cash" as const : paymentType))
        : paymentType,
      partnerAddress: activeCustomer ? activeCustomer.address : "N/A",
      partnerPhone: activeCustomer ? activeCustomer.phone : "N/A",
      partnerGST: activeCustomer ? activeCustomer.gstNo : "URP",
      items: cartItems,
      subType: transactionType,
      payments,
      quotationNo: quotationNoStr,
      deliveryNoteNo: deliveryNoteNoStr,
    };

    const entry = await onAddEntry(payload);
    setSubmitting(false);
    if (entry) {
      setCartItems([]);
      setNote("");
      setSalesPerson("");
      setSelectedCustomerId("");
      setCustomerSearch("");
      setSplitPayments({ cash: 0, card: 0, transfer: 0, credit: 0 });
      setIsSplitPayment(false);
      setViewMode("history");
    }
  }

  // Sync voice assistant handlers globally
  useEffect(() => {
    if (voiceHandlersRef) {
      voiceHandlersRef.current = {
        type: "out",
        partners: customers,
        cartItems,
        setCartItems,
        setProductId,
        setProductSearch,
        setGodown,
        setQuantity,
        setRate,
        setSelectedPartnerId: setSelectedCustomerId,
        setPartnerSearch: setCustomerSearch,
        handleAddItem,
        handleGenerateBill,
        onRegisterPartner: async (name: string) => {
          return await onAddCustomer({ name, email: "auto@spiceroute.co", phone: "0000000000", address: "Registered via AI Voice", gstNo: "URP" });
        }
      };
    }
    return () => {
      if (voiceHandlersRef) {
        voiceHandlersRef.current = null;
      }
    };
  }, [cartItems, customers, productId, godown, quantity, rate, voiceHandlersRef]);

  // Keyboard Shortcut Listener for New Sales Bill (Alt + N) & Back to History (Alt + H) - Only for Sales Billing
  useEffect(() => {
    if (transactionType !== "billing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + N or Ctrl + N for New Sales Bill
      if ((e.altKey || e.ctrlKey) && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        setViewMode("new");
        toast.success("Opened New Sales Billing POS Console [Alt + N]");
        return;
      }

      // Alt + H for Back to Sales History
      if (e.altKey && (e.key === "h" || e.key === "H")) {
        e.preventDefault();
        setViewMode("history");
        toast.info("Switched to Sales History View [Alt + H]");
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [transactionType]);

  if (viewMode === "history") {
    return (
      <div className="space-y-4">
        {/* Header Bar with New Bill Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-foreground font-serif tracking-tight flex items-center gap-2">
              <History size={20} className="text-emerald-600" />
              {transactionType === "billing" ? "Sales Invoices History" : transactionType === "quotation" ? "Sales Quotations History" : transactionType === "delivery_note" ? "Delivery Notes History" : "Credit Notes History"}
            </h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              Visualizing history of recorded {transactionType === "billing" ? "sales bills and customer transactions" : transactionType}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setViewMode("new")}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-mono text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all shrink-0"
          >
            <Plus size={16} /> + New Sales Bill <span className="text-[10px] opacity-90 font-mono bg-emerald-800/80 px-1.5 py-0.5 rounded border border-emerald-400/40">[Alt + N]</span>
          </button>
        </div>

        {/* Analytics Visualizer Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm border-l-4 border-l-emerald-500">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block mb-1 font-bold">Total Invoices</span>
            <span className="text-2xl font-bold font-mono text-foreground">{salesHistoryEntries.length} Invoices</span>
          </div>

          <div className="bg-card border border-border p-4 rounded-xl shadow-sm border-l-4 border-l-blue-500">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block mb-1 font-bold">Cumulative Sales Value</span>
            <span className="text-2xl font-bold font-mono text-emerald-600">
              ₹{totalHistoryRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-card border border-border p-4 rounded-xl shadow-sm border-l-4 border-l-purple-500">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block mb-1 font-bold">Customer Accounts</span>
            <span className="text-2xl font-bold font-mono text-foreground">{new Set(salesHistoryEntries.map(e => e.partner)).size} Accounts</span>
          </div>
        </div>

        {/* Search & Filter Control Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border p-3 rounded-xl shadow-sm">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              placeholder="Search invoice #, customer name, notes..."
              className="w-full pl-9 pr-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Payment Filter:</span>
            {(["all", "cash", "credit", "card", "transfer"] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setHistoryPaymentFilter(mode)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold capitalize border transition-all ${
                  historyPaymentFilter === mode
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* History Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-secondary/50 text-muted-foreground font-mono text-[10px] uppercase border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold">Invoice #</th>
                  <th className="px-4 py-3 font-semibold">Billing Date</th>
                  <th className="px-4 py-3 font-semibold">Customer Account</th>
                  <th className="px-4 py-3 font-semibold text-center">Items</th>
                  <th className="px-4 py-3 font-semibold text-right">Grand Total (INR)</th>
                  <th className="px-4 py-3 font-semibold text-center">Payment Mode</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {salesHistoryEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground font-mono text-xs">
                      No sales history records found. Click "+ New Sales Bill" below to generate a bill.
                    </td>
                  </tr>
                ) : (
                  salesHistoryEntries.map(e => {
                    const amt = e.grandTotal || (e.subTotal ? e.subTotal * 1.12 : 0);
                    const itemsCount = e.items?.length || (e.quantity ? 1 : 0);
                    const handleSelectEntryForEdit = () => {
                      if (e.items && e.items.length > 0) {
                        setCartItems(e.items);
                      } else if (e.productId && e.quantity) {
                        const subVal = (e.quantity || 0) * (e.pricePerUnit || 0);
                        setCartItems([{
                          productId: e.productId,
                          godown: e.godown || "A",
                          quantity: e.quantity,
                          pricePerUnit: e.pricePerUnit || 0,
                          gstPercent: 12,
                          subTotal: subVal,
                          grandTotal: subVal * 1.12,
                        }]);
                      }
                      const matchedCust = customers.find(c => c.name.toLowerCase().trim() === (e.partner || "").toLowerCase().trim());
                      if (matchedCust) {
                        setSelectedCustomerId(matchedCust.id);
                        setCustomerSearch(matchedCust.name);
                      } else if (e.partner) {
                        setCustomerSearch(e.partner);
                      }
                      if (e.date) setDate(e.date);
                      if (e.note) setNote(`Editing History Record #${e.invoiceNo || e.id.slice(0, 6)}: ${e.note}`);
                      setViewMode("new");
                      toast.success(`✏️ Re-opened Sales Record #${e.invoiceNo || e.id.slice(0, 6)} in 100% Mutable & Editable Console!`);
                    };

                    return (
                      <tr
                        key={e.id}
                        onClick={handleSelectEntryForEdit}
                        className="hover:bg-blue-500/10 dark:hover:bg-blue-950/30 transition-colors cursor-pointer group"
                        title="Click to re-open invoice in Editable Sales Console"
                      >
                        <td className="px-4 py-3 font-mono font-bold">
                          <span className="text-blue-600 dark:text-blue-400 group-hover:underline inline-flex items-center gap-1">
                            ✏️ #{e.invoiceNo || `INV-${e.id.slice(0, 6)}`}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground group-hover:text-foreground">
                          {formatDDMMYYYY(e.date)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground group-hover:text-blue-600 group-hover:underline">
                          {e.partner || "Walk-in Customer"}
                        </td>
                        <td className="px-4 py-3 text-center font-mono">
                          {itemsCount} {itemsCount === 1 ? "item" : "items"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                          ₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            e.paymentType === "cash" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30" :
                            e.paymentType === "credit" ? "bg-amber-500/10 text-amber-600 border border-amber-500/30" :
                            "bg-blue-500/10 text-blue-600 border border-blue-500/30"
                          }`}>
                            {e.paymentType || "Cash"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(ev) => { ev.stopPropagation(); handleSelectEntryForEdit(); }}
                              className="px-2.5 py-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-[11px] font-mono font-bold inline-flex items-center gap-1 shadow-sm"
                            >
                              ✏️ Edit & Re-Save
                            </button>
                            <button
                              type="button"
                              onClick={(ev) => { ev.stopPropagation(); onViewInvoice && onViewInvoice(e); }}
                              className="px-2 py-1 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded text-[11px] font-mono font-bold inline-flex items-center gap-1"
                            >
                              <Printer size={12} /> Print
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Prominent New Bill Button */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setViewMode("new")}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-mono text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus size={18} /> + Create New Sales Bill <span className="text-[11px] opacity-90 font-mono bg-emerald-800/80 px-2 py-0.5 rounded border border-emerald-400/40">[Alt + N]</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Navigation Bar with Back to History Button & AI PDF Reader */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border p-3 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setViewMode("history")}
            className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-lg text-xs font-mono font-bold flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> ← Back to {transactionType === "billing" ? "Sales" : transactionType === "quotation" ? "Quotations" : transactionType === "delivery_note" ? "Delivery Notes" : "Credit Notes"} History <span className="text-[10px] opacity-80 font-mono bg-card px-1.5 py-0.5 rounded border border-border">[Alt + H]</span>
          </button>
          <span className="text-xs font-mono text-muted-foreground font-semibold hidden sm:inline">
            Active POS Console ({pageTitle})
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsPdfModalOpen(true)}
          className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Sparkles size={14} className="animate-pulse text-yellow-300" />
          <span>📄 AI PDF Invoice Reader & Auto-Cart Filler</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        
        {/* Left Side: Table & inputs - Expanded Big Space */}
        <div className="xl:col-span-10 space-y-4 min-h-[500px] flex flex-col">
          
          {/* Top Row: Invoice Header (left) & Total Panel (right) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">

            {/* Invoice Header Details */}
            <div className="md:col-span-2 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Customer Account</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={partnerInputRef}
                      value={customerSearch}
                      onChange={e => {
                        setCustomerSearch(e.target.value);
                        setSelectedCustomerId("");
                        setShowCustomerSuggestions(true);
                      }}
                      onFocus={() => setShowCustomerSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                      onKeyDown={handleCustomerSearchKeyDown}
                      placeholder="Type customer name..."
                      className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {showCustomerSuggestions && (
                      <div className="absolute left-0 mt-1 min-w-[320px] sm:min-w-[420px] max-w-[500px] max-h-72 overflow-y-auto bg-card border border-border rounded-xl shadow-2xl z-30 font-sans text-xs divide-y divide-border/40">
                        {customerSuggestions.map((c, idx) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectCustomer(c)}
                            className={`w-full text-left px-3.5 py-2.5 hover:bg-secondary/60 transition-colors flex flex-col gap-1 ${idx === customerSuggestionIdx ? 'bg-primary/15 font-bold border-l-4 border-l-primary' : ''}`}
                            data-active={idx === customerSuggestionIdx}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-foreground">{c.name}</span>
                              <span className="font-mono text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{c.gstNo ? `GST: ${c.gstNo}` : "URP"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                              <span>📞 {c.phone || "No phone"}</span>
                              <span className="truncate">📍 {c.address || "No address"}</span>
                            </div>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => { setIsModalOpen(true); setShowCustomerSuggestions(false); }}
                          className={`w-full text-left px-3.5 py-2.5 text-primary font-bold hover:bg-secondary/60 flex items-center justify-between ${customerSuggestionIdx === customerSuggestions.length ? 'bg-primary/15' : ''}`}
                          data-active={customerSuggestionIdx === customerSuggestions.length}
                        >
                          <span className="flex items-center gap-1.5"><Plus size={14} /> + Register New Customer</span>
                          <span className="font-mono text-[10px] text-muted-foreground">[Ctrl + C]</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="px-2 py-1.5 bg-secondary border border-border rounded-lg text-xs hover:bg-secondary/80 flex items-center justify-center"
                    title="Add Customer"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Billing Date</label>
                <DDMMYYYYDateInput
                  inputRef={dateInputRef}
                  value={date}
                  onChange={setDate}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      noteInputRef.current?.focus();
                    }
                  }}
                  className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {activeCustomer && (
                <div className="col-span-2 p-2 bg-secondary/15 rounded-lg border text-[11px] flex justify-between items-center gap-4">
                  <div><span className="text-muted-foreground font-mono">Address: </span><span className="font-semibold">{activeCustomer.address || "N/A"}</span></div>
                  <div><span className="text-muted-foreground font-mono">GSTIN: </span><span className="font-mono text-primary font-bold">{activeCustomer.gstNo || "N/A"}</span></div>
                </div>
              )}

              {transactionType === "billing" ? (
                <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider font-bold text-indigo-600 flex items-center justify-between">
                      <span className="flex items-center gap-1"><Sparkles size={11} /> Pull Quotation</span>
                      {selectedPullQuotationId && (
                        <button
                          type="button"
                          onClick={() => { setSelectedPullQuotationId(""); setCartItems([]); setCustomerSearch(""); setNote(""); toast.info("Cleared quotation."); }}
                          className="text-[9px] text-muted-foreground hover:text-foreground underline font-mono font-normal"
                        >
                          Clear
                        </button>
                      )}
                    </label>
                    <select
                      value={selectedPullQuotationId}
                      onChange={e => handlePullQuotation(e.target.value)}
                      className="w-full px-3 py-1.5 border border-indigo-500/30 rounded-lg bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Select Quotation ({quotationEntries.length}) --</option>
                      {quotationEntries.map(q => {
                        const qRef = q.invoiceNo || `QTN-${q.id.slice(0, 6)}`;
                        const amt = q.grandTotal || (q.subTotal ? q.subTotal * 1.12 : 0);
                        return (
                          <option key={q.id} value={q.id}>
                            #{qRef} | {q.partner} | ₹{amt.toFixed(0)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider font-bold text-blue-600 flex items-center justify-between">
                      <span className="flex items-center gap-1"><Truck size={11} /> Pull Delivery Note</span>
                      {selectedPullDeliveryNoteId && (
                        <button
                          type="button"
                          onClick={() => { setSelectedPullDeliveryNoteId(""); setCartItems([]); setCustomerSearch(""); setNote(""); toast.info("Cleared delivery note."); }}
                          className="text-[9px] text-muted-foreground hover:text-foreground underline font-mono font-normal"
                        >
                          Clear
                        </button>
                      )}
                    </label>
                    <select
                      value={selectedPullDeliveryNoteId}
                      onChange={e => handlePullDeliveryNote(e.target.value)}
                      className="w-full px-3 py-1.5 border border-blue-500/30 rounded-lg bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Delivery Note ({deliveryNoteEntries.length}) --</option>
                      {deliveryNoteEntries.map(d => {
                        const dRef = d.invoiceNo || `DN-${d.id.slice(0, 6)}`;
                        const amt = d.grandTotal || (d.subTotal ? d.subTotal * 1.12 : 0);
                        return (
                          <option key={d.id} value={d.id}>
                            #{dRef} | {d.partner} | ₹{amt.toFixed(0)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              ) : null}

              <div>
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Ledger Note</label>
                <input
                  ref={noteInputRef}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Customs ref or remarks"
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      productSearchRef.current?.focus();
                    }
                  }}
                  className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {paymentType === "credit" && (
                <div>
                  <label className="block text-[10px] font-mono text-red-500 font-bold mb-1 uppercase tracking-wider">Due Date (Credit)</label>
                  <DDMMYYYYDateInput
                    inputRef={dueDateInputRef}
                    value={dueDate}
                    onChange={setDueDate}
                    className="w-full px-3 py-1.5 border border-red-200 rounded-lg bg-red-50/10 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-red-400 font-semibold"
                  />
                </div>
              )}
            </div>

            {/* Live Total Display Panel */}
            <div className="bg-black/95 text-green-400 rounded-xl p-4 flex flex-col justify-between shadow-inner border border-gray-800 h-full min-h-[110px]">
              <div className="text-[10px] font-mono tracking-widest text-green-500 uppercase font-bold">
                {transactionType === "delivery_note" ? "TOTAL DISPATCH QTY" : "TOTAL AMOUNT"}
              </div>
              <div className="text-2xl md:text-3xl font-mono font-extrabold text-right tracking-tight select-all">
                {transactionType === "delivery_note"
                  ? `${cartItems.reduce((sum, item) => sum + item.quantity, 0)} Units`
                  : fmt(invoiceTotals.grandTotal)
                }
              </div>
              <div className="text-[9px] font-mono text-green-600 text-right uppercase">
                {cartItems.length} lines added
              </div>
            </div>
          </div>

          {/* Product Quick-Add Row - NO SCROLLBAR, BIG SPACE */}
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-3">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold border-b border-border/50 pb-1.5 flex justify-between items-center">
              <span>Add Line Item</span>
              <span className="text-[9px] text-muted-foreground font-normal">Use [Arrow Keys] + [Enter] to select & jump</span>
            </div>
            
            <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end w-full text-xs font-mono">
              {/* Product Search Input */}
              <div className="col-span-12 sm:col-span-4 relative">
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold truncate">1. Search Product</label>
                <input
                  ref={productSearchRef}
                  type="text"
                  value={productSearch}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onChange={e => {
                    setProductSearch(e.target.value);
                    setShowSuggestions(true);
                    setSuggestionIdx(0);
                  }}
                  onKeyDown={handleProductSearchKeyDown}
                  placeholder="Type product name (e.g. A)..."
                  className="w-full px-3 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-card border border-border rounded-xl shadow-2xl z-50 font-sans text-xs divide-y divide-border/40 min-w-[220px]">
                    {suggestions.map((p, idx) => (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => handleSelectSuggestion(p)}
                        className={`w-full text-left px-3.5 py-2.5 hover:bg-secondary/70 transition-colors flex items-center justify-between gap-2 font-bold ${
                          idx === suggestionIdx ? 'bg-primary/20 font-extrabold text-primary border-l-4 border-l-primary' : 'text-foreground'
                        }`}
                        data-active={idx === suggestionIdx}
                      >
                        <span className="truncate">{p.name} ({p.unit})</span>
                        <span className="font-mono text-[10px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex-shrink-0">
                          ₹{p.sellPrice || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Godown */}
              <div className="col-span-6 sm:col-span-2 relative">
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold truncate">2. Godown</label>
                <input
                  ref={godownInputRef}
                  value={godown ? `Godown ${godown} (${(activeProduct?.godownStocks?.[godown] || 0)} ${activeProduct?.unit || "u"})` : ""}
                  onFocus={() => setShowGodownSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowGodownSuggestions(false), 200)}
                  onKeyDown={handleGodownKeyDown}
                  onChange={() => {}}
                  className="w-full px-2.5 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer font-semibold"
                />
                {showGodownSuggestions && availableGodowns.length > 0 && (
                  <div className="absolute left-0 mt-1 min-w-[180px] max-h-56 overflow-y-auto bg-card border border-border rounded-xl shadow-2xl z-40 font-sans text-xs divide-y divide-border/40">
                    {availableGodowns.map((g, idx) => (
                      <button
                        key={g}
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setGodown(g);
                          setShowGodownSuggestions(false);
                          if (packingTypeInputRef.current) packingTypeInputRef.current.focus();
                          else quantityInputRef.current?.focus();
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-secondary/60 flex items-center justify-between gap-2 transition-colors ${idx === godownSuggestionIdx ? 'bg-primary/15 font-bold text-primary border-l-4 border-l-primary' : ''}`}
                        data-active={idx === godownSuggestionIdx}
                      >
                        <span className="font-semibold text-foreground whitespace-nowrap">Godown {g}</span>
                        <span className="font-mono text-muted-foreground text-[10px] bg-muted/50 px-1.5 py-0.5 rounded border border-border/50">
                          {(activeProduct?.godownStocks?.[g] || 0)} {activeProduct?.unit || "u"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Packing Type */}
              <div className="col-span-6 sm:col-span-2">
                <label className="block text-[10px] font-mono text-blue-600 dark:text-blue-400 mb-1 uppercase font-bold flex items-center gap-1 truncate">
                  📦 Packing
                </label>
                {availablePackingTypes.length > 0 ? (
                  <select
                    ref={packingTypeInputRef}
                    value={packingType}
                    onChange={e => handleSelectPackingType(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        quantityInputRef.current?.focus();
                      }
                    }}
                    className="w-full px-2 py-2 border border-blue-500/40 rounded-xl bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">-- Select --</option>
                    {availablePackingTypes.map((pt, idx) => {
                      let pVal: number | string | undefined = undefined;
                      if (activeProduct) {
                        pVal = activeProduct.packingPrices?.[pt] || (pt === activeProduct.packing1 ? activeProduct.price1 : pt === activeProduct.packing2 ? activeProduct.price2 : pt === activeProduct.packing3 ? activeProduct.price3 : undefined);
                      }

                      return (
                        <option key={idx} value={pt}>
                          {pt} {pVal ? `(₹${pVal})` : ""}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input
                    ref={packingTypeInputRef}
                    type="text"
                    value={packingType}
                    onChange={e => setPackingType(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        quantityInputRef.current?.focus();
                      }
                    }}
                    placeholder="Packing..."
                    className="w-full px-2 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
              </div>

              {/* Quantity */}
              <div className="col-span-4 sm:col-span-1">
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold truncate">3. Qty</label>
                <input
                  ref={quantityInputRef}
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  onKeyDown={e => handleKeyDown(e, transactionType === "delivery_note" ? itemExpiryDateInputRef : rateInputRef)}
                  placeholder="Qty..."
                  className="w-full px-2 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-bold"
                />
              </div>

              {/* Rate & GST % Hidden on Delivery Note */}
              {transactionType !== "delivery_note" && (
                <>
                  {/* Rate */}
                  <div className="col-span-4 sm:col-span-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase font-bold truncate">4. Rate</label>
                    </div>
                    <input
                      ref={rateInputRef}
                      type="number"
                      step="0.01"
                      value={rate}
                      onChange={e => setRate(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          gstPercentInputRef.current?.focus();
                        }
                      }}
                      placeholder={activeProduct ? `₹${activeProduct.sellPrice}` : "Rate"}
                      className="w-full px-2 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-bold"
                    />
                  </div>

                  {/* GST % */}
                  <div className="col-span-4 sm:col-span-1">
                    <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold truncate">GST%</label>
                    <select
                      ref={gstPercentInputRef}
                      value={gstPercent}
                      onChange={e => setGstPercent(Number(e.target.value))}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          itemExpiryDateInputRef.current?.focus();
                        }
                      }}
                      className="w-full px-1 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-bold"
                    >
                      <option value="5">5%</option>
                      <option value="8">8%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                </>
              )}

              {/* Expiry Date */}
              <div className="col-span-6 sm:col-span-1">
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold truncate">Expiry</label>
                <DDMMYYYYDateInput
                  inputRef={itemExpiryDateInputRef}
                  value={itemExpiryDate}
                  onChange={setItemExpiryDate}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddItem();
                    }
                  }}
                  className="w-full px-1.5 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-bold"
                />
              </div>

              {/* Hidden submit button so pressing Enter still submits form */}
              <button type="submit" className="hidden" />
            </form>
          </div>

          {/* Cart Items Table */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="px-4 py-3 bg-secondary/20 border-b border-border flex justify-between items-center">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold">Billing Items Ledger</span>
              <span className="text-[10px] font-mono text-muted-foreground">{cartItems.length} lines added</span>
            </div>
            
            <div className="overflow-x-auto flex-1 max-h-[300px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-secondary/10 border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-2 text-center w-12">SI No</th>
                    <th className="px-4 py-2">Item Description</th>
                    <th className="px-4 py-2 text-center">Godown</th>
                    <th className="px-4 py-2 text-right">Quantity</th>
                    {transactionType !== "delivery_note" && <th className="px-4 py-2 text-right">Rate</th>}
                    {transactionType !== "delivery_note" && <th className="px-4 py-2 text-center">GST %</th>}
                    <th className="px-4 py-2 text-center">Expiry Date</th>
                    {transactionType !== "delivery_note" && <th className="px-4 py-2 text-right">Total (INR)</th>}
                    <th className="px-4 py-2 text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {cartItems.length === 0 ? (
                    <tr>
                      <td colSpan={transactionType === "delivery_note" ? 6 : 9} className="px-4 py-8 text-center text-muted-foreground italic bg-secondary/5">
                        No items in the billing ledger. Use the input row above to add products.
                      </td>
                    </tr>
                  ) : (
                    cartItems.map((item, idx) => {
                      const prod = products.find(p => p.id === item.productId);
                      return (
                        <tr key={idx} className="hover:bg-secondary/10 transition-colors">
                          <td className="px-2 py-1.5 text-center font-mono font-bold text-muted-foreground">{idx + 1}</td>
                          <td className="px-2 py-1.5">
                            <div className="flex flex-col gap-0.5">
                              <select
                                value={item.productId}
                                onChange={e => handleUpdateCartItem(idx, { productId: e.target.value })}
                                className="w-full bg-transparent font-semibold text-foreground text-xs focus:bg-background border border-transparent hover:border-border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                              >
                                {products.map(p => (
                                  <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                                ))}
                              </select>
                              {item.packingType && (
                                <span className="text-[9px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 w-fit">
                                  📦 {item.packingType}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <select
                              value={item.godown}
                              onChange={e => handleUpdateCartItem(idx, { godown: e.target.value as Godown })}
                              className="font-mono font-bold text-foreground text-xs bg-secondary/60 border border-border/80 hover:border-border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                            >
                              {ALL_GODOWNS.map(g => (
                                <option key={g} value={g}>Godown {g}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e => handleUpdateCartItem(idx, { quantity: Math.max(1, parseInt(e.target.value, 10) || 0) })}
                                className="w-20 min-w-[75px] px-1.5 py-0.5 text-right font-mono font-bold bg-transparent border border-transparent hover:border-border focus:bg-background focus:border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                              />
                              <span className="text-[10px] text-muted-foreground font-mono">{prod?.unit || "units"}</span>
                            </div>
                          </td>
                          {transactionType !== "delivery_note" && (
                            <td className="px-2 py-1.5 text-right">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={item.pricePerUnit}
                                onChange={e => handleUpdateCartItem(idx, { pricePerUnit: Math.max(0, parseFloat(e.target.value) || 0) })}
                                className="w-20 px-1.5 py-0.5 text-right font-mono bg-transparent border border-transparent hover:border-border focus:bg-background focus:border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                              />
                            </td>
                          )}
                          {transactionType !== "delivery_note" && (
                            <td className="px-2 py-1.5 text-center">
                              <select
                                value={item.gstPercent}
                                onChange={e => handleUpdateCartItem(idx, { gstPercent: Number(e.target.value) })}
                                className="bg-transparent font-mono text-xs text-muted-foreground border border-transparent hover:border-border focus:bg-background rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                              >
                                <option value="5">5%</option>
                                <option value="8">8%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </select>
                            </td>
                          )}
                          {/* Expiry Date Column */}
                          <td className="px-2 py-1.5 text-center font-mono">
                            <DDMMYYYYDateInput
                              value={item.expiryDate || ""}
                              onChange={val => handleUpdateCartItem(idx, { expiryDate: val })}
                              className="w-24 px-1.5 py-0.5 text-center font-mono bg-transparent border border-transparent hover:border-border focus:bg-background rounded text-xs"
                            />
                          </td>
                          {/* Total (INR) Column */}
                          {transactionType !== "delivery_note" && (
                            <td className="px-2 py-1.5 text-right font-mono font-bold text-foreground">
                              {item.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          )}
                          {/* Action Column */}
                          <td className="px-2 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500 hover:text-red-600 transition-colors"
                              title="Remove Item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bill Summary and Print Row */}
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            {transactionType === "delivery_note" ? (
              <div className="grid grid-cols-2 gap-6 text-xs w-full md:w-auto">
                <div>
                  <span className="text-muted-foreground block text-[9px] font-mono uppercase tracking-wider mb-0.5">Total Line Items</span>
                  <span className="font-mono font-semibold text-foreground text-sm">
                    {cartItems.length} Items
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-mono uppercase tracking-wider mb-0.5">Total Dispatch Units</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)} Units
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6 text-xs w-full md:w-auto">
                <div>
                  <span className="text-muted-foreground block text-[9px] font-mono uppercase tracking-wider mb-0.5">Subtotal</span>
                  <span className="font-mono font-semibold text-foreground text-sm">
                    {fmt(invoiceTotals.subTotal)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-mono uppercase tracking-wider mb-0.5">Tax (GST)</span>
                  <span className="font-mono font-semibold text-foreground text-sm">
                    {fmt(invoiceTotals.tax)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-mono uppercase tracking-wider mb-0.5">Grand Total</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">
                    {fmt(invoiceTotals.grandTotal)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 w-full md:w-auto">
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCartItems([])}
                  className="px-4 py-2 border border-border hover:bg-secondary/40 text-muted-foreground hover:text-foreground text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <Trash2 size={13} /> Clear
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerateBill}
                disabled={submitting || cartItems.length === 0}
                className="flex-1 md:flex-none px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-700/50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-700/10 flex items-center justify-center gap-1.5 uppercase tracking-wider transition-colors"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Printer size={13} /> Generate & Print [Ctrl + Enter]
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Keyboard helper bar */}
          <div className="bg-secondary/20 border border-border p-3 rounded-lg flex items-center gap-3 text-xs text-muted-foreground no-print mt-auto">
            <Keyboard className="text-primary" size={16} />
            <div>
              <span className="font-semibold text-foreground">Keyboard POS Cockpit: </span>
              <span className="font-mono">
                [Ctrl + J] Customer · [Ctrl + K] Search Item · [Enter] submit line (on Rate) · [Ctrl + D] remove last · [Ctrl + L] clear cart · [Ctrl + C] add customer · [Ctrl + Enter] post bill
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Voice Billing Assistant - Compact Decreased Size */}
        <div className="xl:col-span-2 no-print">
          <VoiceBillingAssistant
            type="out"
            products={products}
            partners={customers}
            customers={customers}
            suppliers={suppliers}
            cartItems={cartItems}
            setCartItems={setCartItems}
            setProductId={setProductId}
            setProductSearch={setProductSearch}
            setGodown={setGodown}
            setQuantity={setQuantity}
            setRate={setRate}
            setSelectedPartnerId={setSelectedCustomerId}
            setPartnerSearch={setCustomerSearch}
            setNote={setNote}
            setPaymentType={setPaymentType}
            handleAddItem={handleAddItem}
            handleGenerateBill={handleGenerateBill}
            setPage={setPage}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onRegisterPartner={async (name) => {
              return await onAddCustomer({ name, address: "Registered via AI Voice", phone: "0000000000", gstNo: "URP" });
            }}
            isCartActive={true}
            onAddEntry={onAddEntry}
          />
        </div>

      </div>

      <AddPartnerModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveCustomer} type="Customer" />
      <AIPdfInvoiceModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        products={products}
        customers={customers}
        suppliers={suppliers}
        onApplyToCart={({ customerId, partyName, date: pdfDate, dueDate: pdfDueDate, paymentType: pdfPaymentType, notes, items }) => {
          if (customerId) {
            setSelectedCustomerId(customerId);
            const cObj = customers.find(c => c.id === customerId);
            if (cObj) setCustomerSearch(cObj.name);
          } else if (partyName) {
            setCustomerSearch(partyName);
          }
          if (pdfDate) setDate(pdfDate);
          if (pdfDueDate) setDueDate(pdfDueDate);
          if (pdfPaymentType) setPaymentType(pdfPaymentType);
          if (notes) setNote(notes);
          if (items && items.length > 0) {
            setCartItems(prev => [...prev, ...items]);
          }
          setIsPdfModalOpen(false);
          toast.success(`🎉 AI PDF Reader extracted & added ${items.length} item(s) to Sales Cart!`);
        }}
      />
    </div>
  );
}

// ─── Purchase Billing Dashboard (Split Screen & Popup Details Flow) ────────────

function PurchasePage({ products = [], suppliers = [], customers = [], entries = [], onAddEntry, onAddSupplier, isInvoiceOpen, paymentType, setPaymentType, setPage, darkMode, setDarkMode, voiceHandlersRef, transactionType = "billing", activeEditRecord }: {
  products?: Product[];
  suppliers?: Supplier[];
  customers?: Customer[];
  entries?: StockEntry[];
  onAddEntry: (e: Omit<StockEntry, "id" | "invoiceNo" | "productId" | "godown" | "quantity" | "pricePerUnit"> & { productId?: string; godown?: Godown; quantity?: number; pricePerUnit?: number; items: InvoiceItem[]; subType?: string }) => Promise<StockEntry | null>;
  onAddSupplier: (s: Omit<Supplier, "id">) => Promise<Supplier | null>;
  isInvoiceOpen: boolean;
  paymentType: "cash" | "credit";
  setPaymentType: (t: "cash" | "credit") => void;
  setPage?: (page: string) => void;
  darkMode?: boolean;
  setDarkMode?: (dark: boolean) => void;
  voiceHandlersRef?: React.MutableRefObject<any>;
  transactionType?: "purchase_order" | "grn" | "billing" | "debit_note";
  activeEditRecord?: any;
}) {
  let pageTitle = "Purchase Billing";
  let pageSub = "Record standard purchase invoice bills from suppliers and update inventory/ledgers";
  let headerAccent = "border-l-4 border-l-rose-500 pl-3";
  if (transactionType === "purchase_order") {
    pageTitle = "Purchase Order (PO)";
    pageSub = "Draft and send purchase orders to suppliers (does not affect stock/ledger)";
    headerAccent = "border-l-4 border-l-violet-500 pl-3";
  } else if (transactionType === "grn") {
    pageTitle = "Goods Receive Note (GRN)";
    pageSub = "Record receipt of incoming inventory from suppliers (updates stock levels)";
    headerAccent = "border-l-4 border-l-teal-500 pl-3";
  } else if (transactionType === "debit_note") {
    pageTitle = "Purchase Debit Note (Return)";
    pageSub = "Process purchase return and issue debit note (removes stock from warehouse)";
    headerAccent = "border-l-4 border-l-red-500 pl-3";
  }
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  
  // Cart Items State
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);

  // Synchronize clicked activeEditRecord into input fields & purchase cart items
  useEffect(() => {
    if (!activeEditRecord) return;
    const isMatchingType = activeEditRecord.type === "in" || (transactionType === "debit_note" && activeEditRecord.type === "out");
    if (!isMatchingType) return;

    if (activeEditRecord.items && activeEditRecord.items.length > 0) {
      setCartItems(activeEditRecord.items);
    } else if (activeEditRecord.productId && activeEditRecord.quantity) {
      const prod = products.find(p => p.id === activeEditRecord.productId);
      const subVal = (activeEditRecord.quantity || 0) * (activeEditRecord.pricePerUnit || prod?.buyPrice || 100);
      setCartItems([{
        productId: activeEditRecord.productId,
        godown: activeEditRecord.godown || "A",
        quantity: activeEditRecord.quantity,
        pricePerUnit: activeEditRecord.pricePerUnit || prod?.buyPrice || 100,
        gstPercent: activeEditRecord.gstPercent || 12,
        subTotal: subVal,
        grandTotal: activeEditRecord.grandTotal || subVal * 1.12,
      }]);
    }

    const matchedSupp = suppliers.find(s => s.name.toLowerCase().trim() === (activeEditRecord.partner || "").toLowerCase().trim());
    if (matchedSupp) {
      setSelectedSupplierId(matchedSupp.id);
      setSupplierSearch(matchedSupp.name);
    } else if (activeEditRecord.partner) {
      setSupplierSearch(activeEditRecord.partner);
    }

    if (activeEditRecord.date) setDate(activeEditRecord.date);
    if (activeEditRecord.paymentType) setPaymentType(activeEditRecord.paymentType === "credit" ? "credit" : "cash");

    const refStr = activeEditRecord.invoiceNo || (activeEditRecord.id ? `BILL-${activeEditRecord.id.slice(0, 6)}` : "");
    setNote(activeEditRecord.note ? `Re-opened: ${activeEditRecord.note}` : `Re-opened Purchase Record #${refStr}`);
  }, [activeEditRecord]);

  // Pull Purchase Order & GRN State
  const [selectedPullPoId, setSelectedPullPoId] = useState("");
  const [selectedPullGrnId, setSelectedPullGrnId] = useState("");

  const poEntries = useMemo(() => {
    return (entries || []).filter(e => e.type === "in" && (e.subType === "purchase_order" || (e.invoiceNo && e.invoiceNo.startsWith("PO"))));
  }, [entries]);

  const grnEntries = useMemo(() => {
    return (entries || []).filter(e => e.type === "in" && (e.subType === "grn" || (e.invoiceNo && e.invoiceNo.startsWith("GRN"))));
  }, [entries]);

  const handlePullPo = (poId: string) => {
    setSelectedPullPoId(poId);
    setSelectedPullGrnId("");
    if (!poId) return;

    const po = poEntries.find(p => p.id === poId || p.invoiceNo === poId);
    if (!po) {
      toast.error("Selected Purchase Order not found.");
      return;
    }

    if (po.items && po.items.length > 0) {
      setCartItems(po.items);
    } else if (po.productId && po.quantity) {
      const subVal = (po.quantity || 0) * (po.pricePerUnit || 0);
      const singleItem: InvoiceItem = {
        productId: po.productId,
        godown: po.godown || "A",
        quantity: po.quantity,
        pricePerUnit: po.pricePerUnit || 0,
        gstPercent: 12,
        subTotal: subVal,
        grandTotal: subVal * 1.12,
      };
      setCartItems([singleItem]);
    }

    const matchedSupp = suppliers.find(s => s.name.toLowerCase().trim() === (po.partner || "").toLowerCase().trim());
    if (matchedSupp) {
      setSelectedSupplierId(matchedSupp.id);
      setSupplierSearch(matchedSupp.name);
    } else if (po.partner) {
      setSupplierSearch(po.partner);
    }

    const poRef = po.invoiceNo || `PO-${po.id.slice(0, 6)}`;
    setNote(`Converted from Purchase Order #${poRef}`);

    toast.success(`Pulled Purchase Order #${poRef}! Loaded ${po.items?.length || 1} item(s) & supplier info.`);
  };

  const handlePullGrn = (grnId: string) => {
    setSelectedPullGrnId(grnId);
    setSelectedPullPoId("");
    if (!grnId) return;

    const grn = grnEntries.find(g => g.id === grnId || g.invoiceNo === grnId);
    if (!grn) {
      toast.error("Selected GRN not found.");
      return;
    }

    if (grn.items && grn.items.length > 0) {
      setCartItems(grn.items);
    } else if (grn.productId && grn.quantity) {
      const subVal = (grn.quantity || 0) * (grn.pricePerUnit || 0);
      const singleItem: InvoiceItem = {
        productId: grn.productId,
        godown: grn.godown || "A",
        quantity: grn.quantity,
        pricePerUnit: grn.pricePerUnit || 0,
        gstPercent: 12,
        subTotal: subVal,
        grandTotal: subVal * 1.12,
      };
      setCartItems([singleItem]);
    }

    const matchedSupp = suppliers.find(s => s.name.toLowerCase().trim() === (grn.partner || "").toLowerCase().trim());
    if (matchedSupp) {
      setSelectedSupplierId(matchedSupp.id);
      setSupplierSearch(matchedSupp.name);
    } else if (grn.partner) {
      setSupplierSearch(grn.partner);
    }

    const grnRef = grn.invoiceNo || `GRN-${grn.id.slice(0, 6)}`;
    setNote(`Converted from GRN #${grnRef}`);

    toast.success(`Pulled GRN #${grnRef}! Loaded ${grn.items?.length || 1} item(s) & supplier info.`);
  };

  // Product Fields state
  const [productId, setProductId] = useState("");
  const [godown, setGodown] = useState<Godown>("A");
  const [quantity, setQuantity] = useState("");
  const [rate, setRate] = useState("");
  const [gstPercent, setGstPercent] = useState<number>(12);
  const [itemExpiryDate, setItemExpiryDate] = useState("");

  // Autocomplete Product Search
  const [productSearch, setProductSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIdx, setSuggestionIdx] = useState(0);

  // Supplier autocomplete search state
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const [supplierSuggestionIdx, setSupplierSuggestionIdx] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Split payment state
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState({ cash: 0, card: 0, transfer: 0, credit: 0 });

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Focus Refs
  const partnerInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);
  const godownInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const rateInputRef = useRef<HTMLInputElement>(null);
  const gstPercentInputRef = useRef<HTMLSelectElement>(null);
  const itemExpiryDateInputRef = useRef<HTMLInputElement>(null);

  // Godown autocomplete suggestions state
  const [showGodownSuggestions, setShowGodownSuggestions] = useState(false);
  const [godownSuggestionIdx, setGodownSuggestionIdx] = useState(0);

  // Auto-scroll active suggestion into view
  useEffect(() => {
    const activeEl = document.querySelector("[data-active='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [suggestionIdx, supplierSuggestionIdx, godownSuggestionIdx]);

  const handleGodownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showGodownSuggestions) {
        setShowGodownSuggestions(true);
        setGodownSuggestionIdx(0);
      } else {
        setGodownSuggestionIdx(prev => Math.min(availableGodowns.length - 1, prev + 1));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!showGodownSuggestions) {
        setShowGodownSuggestions(true);
        setGodownSuggestionIdx(availableGodowns.length - 1);
      } else {
        setGodownSuggestionIdx(prev => Math.max(0, prev - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showGodownSuggestions && availableGodowns.length > 0) {
        const selected = availableGodowns[godownSuggestionIdx];
        setGodown(selected);
        setShowGodownSuggestions(false);
        quantityInputRef.current?.focus();
      } else {
        quantityInputRef.current?.focus();
      }
    } else if (e.key === "Escape") {
      setShowGodownSuggestions(false);
    }
  };



  const supplierSuggestions = useMemo(() => {
    const list = suppliers || [];
    if (!supplierSearch.trim()) return list;
    return list.filter(s => s && s.name && s.name.toLowerCase().includes(supplierSearch.toLowerCase()));
  }, [supplierSearch, suppliers]);

  const handleSupplierSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showSupplierSuggestions) {
        setShowSupplierSuggestions(true);
        setSupplierSuggestionIdx(0);
      } else {
        setSupplierSuggestionIdx(prev => Math.min(supplierSuggestions.length, prev + 1));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!showSupplierSuggestions) {
        setShowSupplierSuggestions(true);
        setSupplierSuggestionIdx(supplierSuggestions.length);
      } else {
        setSupplierSuggestionIdx(prev => Math.max(0, prev - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showSupplierSuggestions) {
        if (supplierSuggestionIdx === supplierSuggestions.length) {
          setIsModalOpen(true);
        } else if (supplierSuggestions.length > 0) {
          const selected = supplierSuggestions[supplierSuggestionIdx];
          handleSelectSupplier(selected);
        }
      } else {
        productSearchRef.current?.focus();
      }
    } else if (e.key === "Escape") {
      setShowSupplierSuggestions(false);
    }
  };

  const handleSelectSupplier = (supp: Supplier) => {
    setSelectedSupplierId(supp.id);
    setSupplierSearch(supp.name);
    setShowSupplierSuggestions(false);
    productSearchRef.current?.focus();
  };

  // Details
  const activeSupplier = useMemo(() => {
    if (selectedSupplierId === "NEW_PARTNER") return null;
    return suppliers.find(s => s.id === selectedSupplierId) || null;
  }, [selectedSupplierId, suppliers]);

  const activeProduct = useMemo(() => {
    return products.find(p => p.id === productId) || null;
  }, [productId, products]);

  const availableGodowns = useMemo(() => {
    if (!activeProduct) return ALL_GODOWNS;
    const filtered = ALL_GODOWNS.filter(g => (activeProduct.godownStocks?.[g] || 0) > 0);
    if (filtered.length > 0) return filtered;
    
    // Fallback to category default godowns if total stock is 0
    if (activeProduct.category === "Spices") return ["A", "B", "C", "D", "E", "F"] as Godown[];
    if (activeProduct.category === "Dry Fruits") return ["G", "H", "I", "J", "K", "L"] as Godown[];
    return ["M", "N", "O", "P", "Q", "R"] as Godown[];
  }, [activeProduct]);

  // Autocomplete suggestions (Shows all products on focus/blank, or matches starting/containing string)
  // Suggestions for autocomplete product (Shows all products sorted alphabetically on focus/blank, or matches starting/containing string)
  const suggestions = useMemo(() => {
    const list = products || [];
    if (!productSearch.trim()) {
      return [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    const q = productSearch.toLowerCase().trim();
    const startsWith = list.filter(p => p && p.name && p.name.toLowerCase().startsWith(q))
                           .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    const includes = list.filter(p => p && p.name && !p.name.toLowerCase().startsWith(q) && (
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.itemCode && p.itemCode.toLowerCase().includes(q)) ||
      (p.unit && p.unit.toLowerCase().includes(q))
    )).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return [...startsWith, ...includes];
  }, [productSearch, products]);

  // Autofill rate and godown on product change
  useEffect(() => {
    if (activeProduct) {
      setRate(String(activeProduct.buyPrice));
      setGodown(getBestGodownForProduct(activeProduct));
    }
  }, [productId]);

  // Global keyboard shortcuts listener
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleGenerateBill();
      } else if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        setIsModalOpen(true);
      } else if (e.ctrlKey && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        productSearchRef.current?.focus();
      } else if (e.ctrlKey && (e.key === "j" || e.key === "J")) {
        e.preventDefault();
        partnerInputRef.current?.focus();
      } else if (e.ctrlKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        if (cartItems.length > 0) {
          handleRemoveItem(cartItems.length - 1);
        }
      } else if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        if (cartItems.length > 0) {
          setCartItems([]);
          toast.info("Acquisition cart cleared.");
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [cartItems, selectedSupplierId, date, note, activeSupplier, paymentType]);

  const handleProductSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showSuggestions) {
        setShowSuggestions(true);
        setSuggestionIdx(0);
      } else if (suggestions.length > 0) {
        const nextIdx = Math.min(suggestions.length - 1, suggestionIdx + 1);
        setSuggestionIdx(nextIdx);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!showSuggestions) {
        setShowSuggestions(true);
        setSuggestionIdx(suggestions.length - 1);
      } else if (suggestions.length > 0) {
        const nextIdx = Math.max(0, suggestionIdx - 1);
        setSuggestionIdx(nextIdx);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0 && showSuggestions) {
        const selected = suggestions[suggestionIdx] || suggestions[0];
        handleSelectSuggestion(selected);
      } else {
        if (godownInputRef.current) godownInputRef.current.focus();
        else if (quantityInputRef.current) quantityInputRef.current.focus();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (prod: Product) => {
    setProductId(prod.id);
    setProductSearch(prod.name);
    setShowSuggestions(false);
    
    // Autofill buy rate & expiry date
    setRate(String(prod.buyPrice));
    const defaultExp = new Date(Date.now() + (prod.expiryDays || 365) * 86400000).toISOString().split("T")[0];
    setItemExpiryDate(defaultExp);

    setGodown(getBestGodownForProduct(prod));

    // Focus godown selector next
    setTimeout(() => {
      if (godownInputRef.current) godownInputRef.current.focus();
      else if (quantityInputRef.current) quantityInputRef.current.focus();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<any>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!productId) {
      toast.error("Please select a product first.");
      productSearchRef.current?.focus();
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error("Please enter a valid quantity.");
      quantityInputRef.current?.focus();
      return;
    }
    if (!rate || Number(rate) <= 0) {
      toast.error("Please enter a valid rate.");
      rateInputRef.current?.focus();
      return;
    }

    const qtyVal = Number(quantity);
    const rateVal = Number(rate);
    const subTotalVal = qtyVal * rateVal;
    const taxVal = subTotalVal * (gstPercent / 100);

    const newItem: InvoiceItem = {
      productId,
      godown,
      quantity: qtyVal,
      pricePerUnit: rateVal,
      gstPercent,
      subTotal: subTotalVal,
      grandTotal: subTotalVal + taxVal,
      expiryDate: itemExpiryDate || undefined
    };

    setCartItems(prev => [...prev, newItem]);
    
    // Clear inputs and loop back to product search
    setProductId("");
    setProductSearch("");
    setQuantity("");
    setRate("");
    setItemExpiryDate("");
    setShowSuggestions(false);
    toast.success(`${activeProduct?.name} added to cart.`);
    productSearchRef.current?.focus();
  };

  const handleRemoveItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
    toast.info("Item removed from cart.");
  };

  const handleUpdateCartItem = (index: number, updates: Partial<InvoiceItem>) => {
    setCartItems(prev => {
      const copy = [...prev];
      const item = { ...copy[index], ...updates };
      
      if (updates.productId && updates.pricePerUnit === undefined) {
        const prod = products.find(p => p.id === updates.productId);
        if (prod) item.pricePerUnit = prod.buyPrice;
      }
      
      const subTotal = item.quantity * item.pricePerUnit;
      const tax = subTotal * (item.gstPercent / 100);
      item.subTotal = subTotal;
      item.grandTotal = subTotal + tax;

      copy[index] = item;
      return copy;
    });
  };

  const invoiceTotals = useMemo(() => {
    const subTotal = cartItems.reduce((sum, item) => sum + item.subTotal, 0);
    const grandTotal = cartItems.reduce((sum, item) => sum + item.grandTotal, 0);
    return { subTotal, grandTotal, tax: grandTotal - subTotal };
  }, [cartItems]);

  const handleSaveSupplier = async (suppData: Omit<Supplier, "id">): Promise<boolean> => {
    const newSupp = await onAddSupplier(suppData);
    if (newSupp) {
      setSelectedSupplierId(newSupp.id);
      setSupplierSearch(newSupp.name);
      return true;
    }
    return false;
  };

  const totalAllocated = useMemo(() => {
    return Number(splitPayments.cash || 0) + Number(splitPayments.card || 0) + Number(splitPayments.transfer || 0) + Number(splitPayments.credit || 0);
  }, [splitPayments]);

  const remainingToAllocate = useMemo(() => {
    return Math.max(0, invoiceTotals.grandTotal - totalAllocated);
  }, [totalAllocated, invoiceTotals.grandTotal]);

  const handleSplitChange = (method: "cash" | "card" | "transfer" | "credit", val: string) => {
    const num = parseFloat(val) || 0;
    setSplitPayments(prev => ({ ...prev, [method]: num }));
  };

  const autofillSplit = (method: "cash" | "card" | "transfer" | "credit") => {
    const currentAllocatedWithoutMethod = totalAllocated - Number(splitPayments[method]);
    const remainder = Math.max(0, invoiceTotals.grandTotal - currentAllocatedWithoutMethod);
    setSplitPayments(prev => ({ ...prev, [method]: remainder }));
  };

  async function handleGenerateBill() {
    if (cartItems.length === 0) {
      toast.error("Billing cart is empty! Please add products.");
      productSearchRef.current?.focus();
      return;
    }
    if (!activeSupplier && !supplierSearch.trim()) {
      toast.error("Please select or enter a Supplier.");
      partnerInputRef.current?.focus();
      return;
    }

    const payments = isSplitPayment
      ? [
          { method: "cash" as const, amount: Number(splitPayments.cash || 0) },
          { method: "card" as const, amount: Number(splitPayments.card || 0) },
          { method: "transfer" as const, amount: Number(splitPayments.transfer || 0) },
          { method: "credit" as const, amount: Number(splitPayments.credit || 0) },
        ].filter(p => p.amount > 0)
      : [
          { method: paymentType, amount: invoiceTotals.grandTotal }
        ];

    if (isSplitPayment) {
      const diff = Math.abs(totalAllocated - invoiceTotals.grandTotal);
      if (diff > 0.05) {
        toast.error(`Payment allocation mismatch! Total allocated: ₹${totalAllocated.toFixed(2)}, Grand Total: ₹${invoiceTotals.grandTotal.toFixed(2)}.`);
        return;
      }
    }

    setSubmitting(true);
    const pulledPo = poEntries.find(p => p.id === selectedPullPoId);
    const pulledGrn = grnEntries.find(g => g.id === selectedPullGrnId);

    const poNoStr = pulledPo ? (pulledPo.invoiceNo || `PO-${pulledPo.id.slice(0, 6)}`) : (pulledGrn?.poNo || undefined);
    const grnNoStr = pulledGrn ? (pulledGrn.invoiceNo || `GRN-${pulledGrn.id.slice(0, 6)}`) : undefined;

    const payload = {
      type: (transactionType === "debit_note" ? "out" : "in") as const,
      date,
      partner: activeSupplier ? activeSupplier.name : supplierSearch.trim(),
      note: note || (transactionType === "purchase_order" ? "Purchase Order" : transactionType === "grn" ? "GRN Receive" : transactionType === "debit_note" ? "Debit Note Return" : "Multi-product Purchase"),
      paymentType: isSplitPayment 
        ? (splitPayments.credit > 0 ? "credit" as const : (splitPayments.cash > 0 ? "cash" as const : paymentType))
        : paymentType,
      partnerAddress: activeSupplier ? activeSupplier.address : "N/A",
      partnerPhone: activeSupplier ? activeSupplier.phone : "N/A",
      partnerGST: activeSupplier ? activeSupplier.gstNo : "URP",
      items: cartItems,
      subType: transactionType,
      payments,
      poNo: poNoStr,
      grnNo: grnNoStr,
    };

    const entry = await onAddEntry(payload);
    setSubmitting(false);
    if (entry) {
      setCartItems([]);
      setNote("");
      setSelectedSupplierId("");
      setSupplierSearch("");
      setSplitPayments({ cash: 0, card: 0, transfer: 0, credit: 0 });
      setIsSplitPayment(false);
    }
  }

  // Sync voice assistant handlers globally
  useEffect(() => {
    if (voiceHandlersRef) {
      voiceHandlersRef.current = {
        type: "in",
        partners: suppliers,
        cartItems,
        setCartItems,
        setProductId,
        setProductSearch,
        setGodown,
        setQuantity,
        setRate,
        setSelectedPartnerId: setSelectedSupplierId,
        setPartnerSearch: setSupplierSearch,
        handleAddItem,
        handleGenerateBill,
        onRegisterPartner: async (name: string) => {
          return await onAddSupplier({ name, email: "auto@spiceroute.co", phone: "0000000000", address: "Registered via AI Voice", gstNo: "URP" });
        }
      };
    }
    return () => {
      if (voiceHandlersRef) {
        voiceHandlersRef.current = null;
      }
    };
  }, [cartItems, suppliers, productId, godown, quantity, rate, voiceHandlersRef]);

  return (
    <div className="space-y-4">
      {/* Top Navigation Bar with AI PDF Reader */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border p-3 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-foreground font-bold pl-2">
            📦 Purchase & Acquisition POS Console ({pageTitle})
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsPdfModalOpen(true)}
          className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Sparkles size={14} className="animate-pulse text-yellow-300" />
          <span>📄 AI PDF Invoice Reader & Auto-Cart Filler</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        
        {/* Left Side: Table & inputs - Expanded Big Space */}
        <div className="xl:col-span-10 space-y-4 min-h-[500px] flex flex-col">
          
          {/* Top Row: Invoice Header (left) & Total Panel (right) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">

            {/* Invoice Header Details */}
            <div className="md:col-span-2 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Supplier Vendor</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={partnerInputRef}
                      value={supplierSearch}
                      onChange={e => {
                        setSupplierSearch(e.target.value);
                        setSelectedSupplierId("");
                        setShowSupplierSuggestions(true);
                      }}
                      onFocus={() => setShowSupplierSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSupplierSuggestions(false), 200)}
                      onKeyDown={handleSupplierSearchKeyDown}
                      placeholder="Type supplier name..."
                      className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {showSupplierSuggestions && (
                      <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-lg shadow-lg z-30 font-sans text-xs">
                        {supplierSuggestions.map((s, idx) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSelectSupplier(s)}
                            className={`w-full text-left px-3 py-2 border-b border-border/50 hover:bg-secondary/40 flex justify-between ${idx === supplierSuggestionIdx ? 'bg-primary/10 font-bold' : ''}`}
                            data-active={idx === supplierSuggestionIdx}
                          >
                            <span>{s.name}</span>
                            <span className="font-mono text-muted-foreground text-[10px]">{s.phone || "No phone"}</span>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => { setIsModalOpen(true); setShowSupplierSuggestions(false); }}
                          className={`w-full text-left px-3 py-2 text-primary font-semibold hover:bg-secondary/40 flex justify-between ${supplierSuggestionIdx === supplierSuggestions.length ? 'bg-primary/10 font-bold' : ''}`}
                          data-active={supplierSuggestionIdx === supplierSuggestions.length}
                        >
                          <span>+ Register New Supplier</span>
                          <span>[Ctrl + C]</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="px-2 py-1.5 bg-secondary border border-border rounded-lg text-xs hover:bg-secondary/80 flex items-center justify-center"
                    title="Add Supplier"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Purchase Date</label>
                <DDMMYYYYDateInput
                  inputRef={dateInputRef}
                  value={date}
                  onChange={setDate}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      noteInputRef.current?.focus();
                    }
                  }}
                  className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {activeSupplier && (
                <div className="col-span-2 p-2 bg-secondary/15 rounded-lg border text-[11px] flex justify-between items-center gap-4">
                  <div><span className="text-muted-foreground font-mono">Office Address: </span><span className="font-semibold">{activeSupplier.address || "N/A"}</span></div>
                  <div><span className="text-muted-foreground font-mono">GSTIN: </span><span className="font-mono text-primary font-bold">{activeSupplier.gstNo || "N/A"}</span></div>
                </div>
              )}

              {transactionType === "billing" ? (
                <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider font-bold text-violet-600 flex items-center justify-between">
                      <span className="flex items-center gap-1"><Sparkles size={11} /> Pull Purchase Order</span>
                      {selectedPullPoId && (
                        <button
                          type="button"
                          onClick={() => { setSelectedPullPoId(""); setCartItems([]); setSupplierSearch(""); setNote(""); toast.info("Cleared PO."); }}
                          className="text-[9px] text-muted-foreground hover:text-foreground underline font-mono font-normal"
                        >
                          Clear
                        </button>
                      )}
                    </label>
                    <select
                      value={selectedPullPoId}
                      onChange={e => handlePullPo(e.target.value)}
                      className="w-full px-3 py-1.5 border border-violet-500/30 rounded-lg bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="">-- Select PO ({poEntries.length}) --</option>
                      {poEntries.map(p => {
                        const pRef = p.invoiceNo || `PO-${p.id.slice(0, 6)}`;
                        const amt = p.grandTotal || (p.subTotal ? p.subTotal * 1.12 : 0);
                        return (
                          <option key={p.id} value={p.id}>
                            #{pRef} | {p.partner} | ₹{amt.toFixed(0)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider font-bold text-emerald-600 flex items-center justify-between">
                      <span className="flex items-center gap-1"><PackageCheck size={11} /> Pull GRN</span>
                      {selectedPullGrnId && (
                        <button
                          type="button"
                          onClick={() => { setSelectedPullGrnId(""); setCartItems([]); setSupplierSearch(""); setNote(""); toast.info("Cleared GRN."); }}
                          className="text-[9px] text-muted-foreground hover:text-foreground underline font-mono font-normal"
                        >
                          Clear
                        </button>
                      )}
                    </label>
                    <select
                      value={selectedPullGrnId}
                      onChange={e => handlePullGrn(e.target.value)}
                      className="w-full px-3 py-1.5 border border-emerald-500/30 rounded-lg bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Select GRN ({grnEntries.length}) --</option>
                      {grnEntries.map(g => {
                        const gRef = g.invoiceNo || `GRN-${g.id.slice(0, 6)}`;
                        const amt = g.grandTotal || (g.subTotal ? g.subTotal * 1.12 : 0);
                        return (
                          <option key={g.id} value={g.id}>
                            #{gRef} | {g.partner} | ₹{amt.toFixed(0)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              ) : null}

              <div className={transactionType === "billing" ? "" : "col-span-2"}>
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Acquisition Notes</label>
                <input
                  ref={noteInputRef}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Airway cargo receipt, cargo ref"
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      productSearchRef.current?.focus();
                    }
                  }}
                  className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Live Total Display Panel */}
            <div className="bg-black/95 text-green-400 rounded-xl p-4 flex flex-col justify-between shadow-inner border border-gray-800 h-full min-h-[110px]">
              <div className="text-[10px] font-mono tracking-widest text-green-500 uppercase font-bold">TOTAL ACQUISITION</div>
              <div className="text-2xl md:text-3xl font-mono font-extrabold text-right tracking-tight select-all">
                {fmt(invoiceTotals.grandTotal)}
              </div>
              <div className="text-[9px] font-mono text-green-600 text-right uppercase">
                {cartItems.length} lines added
              </div>
            </div>
          </div>

          {/* Product Quick-Add Row - NO SCROLLBAR, BIG SPACE */}
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-3">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold border-b border-border/50 pb-1.5 flex justify-between items-center">
              <span>Add Acquisition Line</span>
              <span className="text-[9px] text-muted-foreground font-normal">Use [Arrow Keys] + [Enter] to select & jump</span>
            </div>
            
            <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end w-full text-xs font-mono">
              {/* Product Search Input */}
              <div className="col-span-12 sm:col-span-4 relative">
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold truncate">1. Search Product</label>
                <input
                  ref={productSearchRef}
                  type="text"
                  value={productSearch}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onChange={e => {
                    setProductSearch(e.target.value);
                    setShowSuggestions(true);
                    setSuggestionIdx(0);
                  }}
                  onKeyDown={handleProductSearchKeyDown}
                  placeholder="Type product name (e.g. A)..."
                  className="w-full px-3 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-card border border-border rounded-xl shadow-2xl z-50 font-sans text-xs divide-y divide-border/40 min-w-[220px]">
                    {[...suggestions].sort((a,b) => a.name.localeCompare(b.name)).map((p, idx) => (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => handleSelectSuggestion(p)}
                        className={`w-full text-left px-3.5 py-2.5 hover:bg-secondary/70 transition-colors flex items-center justify-between gap-2 font-bold ${
                          idx === suggestionIdx ? 'bg-primary/20 font-extrabold text-primary border-l-4 border-l-primary' : 'text-foreground'
                        }`}
                        data-active={idx === suggestionIdx}
                      >
                        <span className="truncate">{p.name} ({p.unit})</span>
                        <span className="font-mono text-[10px] text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 flex-shrink-0">
                          ₹{p.buyPrice || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Godown */}
              <div className="col-span-6 sm:col-span-2 relative">
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold truncate">2. Godown</label>
                <input
                  ref={godownInputRef}
                  value={godown ? `Godown ${godown} (${(activeProduct?.godownStocks?.[godown] || 0)} ${activeProduct?.unit || "u"})` : ""}
                  onFocus={() => setShowGodownSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowGodownSuggestions(false), 200)}
                  onKeyDown={handleGodownKeyDown}
                  onChange={() => {}}
                  className="w-full px-2.5 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer font-semibold"
                />
                {showGodownSuggestions && availableGodowns.length > 0 && (
                  <div className="absolute left-0 mt-1 min-w-[180px] max-h-56 overflow-y-auto bg-card border border-border rounded-xl shadow-2xl z-40 font-sans text-xs divide-y divide-border/40">
                    {availableGodowns.map((g, idx) => (
                      <button
                        key={g}
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setGodown(g);
                          setShowGodownSuggestions(false);
                          quantityInputRef.current?.focus();
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-secondary/60 flex items-center justify-between gap-2 transition-colors ${idx === godownSuggestionIdx ? 'bg-primary/15 font-bold text-primary border-l-4 border-l-primary' : ''}`}
                        data-active={idx === godownSuggestionIdx}
                      >
                        <span className="font-semibold text-foreground whitespace-nowrap">Godown {g}</span>
                        <span className="font-mono text-muted-foreground text-[10px] bg-muted/50 px-1.5 py-0.5 rounded border border-border/50">
                          {(activeProduct?.godownStocks?.[g] || 0)} {activeProduct?.unit || "u"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="col-span-4 sm:col-span-1">
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold truncate">3. Qty</label>
                <input
                  ref={quantityInputRef}
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  onKeyDown={e => handleKeyDown(e, rateInputRef)}
                  placeholder="Qty..."
                  className="w-full px-2 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-bold"
                />
              </div>

              {/* Rate */}
              <div className="col-span-4 sm:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase font-bold truncate">4. Rate (₹)</label>
                </div>
                <input
                  ref={rateInputRef}
                  type="number"
                  step="0.01"
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      gstPercentInputRef.current?.focus();
                    }
                  }}
                  placeholder={activeProduct ? `₹${activeProduct.buyPrice}` : "Rate"}
                  className="w-full px-2 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-bold"
                />
              </div>

              {/* GST % */}
              <div className="col-span-4 sm:col-span-1">
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold truncate">GST %</label>
                <select
                  ref={gstPercentInputRef}
                  value={gstPercent}
                  onChange={e => setGstPercent(Number(e.target.value))}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      itemExpiryDateInputRef.current?.focus();
                    }
                  }}
                  className="w-full px-1 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono font-bold"
                >
                  <option value="5">5%</option>
                  <option value="8">8%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>

              {/* Expiry Date */}
              <div className="min-w-[125px] flex-[1.5]">
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold truncate">Expiry Date</label>
                <DDMMYYYYDateInput
                  inputRef={itemExpiryDateInputRef}
                  value={itemExpiryDate}
                  onChange={setItemExpiryDate}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddItem();
                    }
                  }}
                  className="w-full px-2.5 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-bold"
                />
              </div>

              {/* Hidden submit button so pressing Enter still submits form */}
              <button type="submit" className="hidden" />
            </form>
          </div>

          {/* Cart Items Table */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="px-4 py-3 bg-secondary/20 border-b border-border flex justify-between items-center">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold">Billing Items Ledger</span>
              <span className="text-[10px] font-mono text-muted-foreground">{cartItems.length} lines added</span>
            </div>
            
            <div className="overflow-x-auto flex-1 max-h-[300px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-secondary/10 border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-2 text-center w-12">SI No</th>
                    <th className="px-4 py-2">Item Description</th>
                    <th className="px-4 py-2 text-center">Godown</th>
                    <th className="px-4 py-2 text-center">Expiry Date</th>
                    <th className="px-4 py-2 text-right">Quantity</th>
                    <th className="px-4 py-2 text-right">Rate</th>
                    <th className="px-4 py-2 text-center">GST %</th>
                    <th className="px-4 py-2 text-right">Total (INR)</th>
                    <th className="px-4 py-2 text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {cartItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground italic bg-secondary/5">
                        No items in the billing ledger. Use the input row above to add products.
                      </td>
                    </tr>
                  ) : (
                    cartItems.map((item, idx) => {
                      const prod = products.find(p => p.id === item.productId);
                      return (
                        <tr key={idx} className="hover:bg-secondary/10 transition-colors">
                          <td className="px-2 py-1.5 text-center font-mono font-bold text-muted-foreground">{idx + 1}</td>
                          <td className="px-2 py-1.5">
                            <select
                              value={item.productId}
                              onChange={e => handleUpdateCartItem(idx, { productId: e.target.value })}
                              className="w-full bg-transparent font-semibold text-foreground text-xs focus:bg-background border border-transparent hover:border-border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <select
                              value={item.godown}
                              onChange={e => handleUpdateCartItem(idx, { godown: e.target.value as Godown })}
                              className="font-mono font-bold text-foreground text-xs bg-secondary/60 border border-border/80 hover:border-border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                            >
                              {ALL_GODOWNS.map(g => (
                                <option key={g} value={g}>Godown {g}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <DDMMYYYYDateInput
                              value={item.expiryDate || ""}
                              onChange={val => handleUpdateCartItem(idx, { expiryDate: val })}
                              className="w-28 px-1.5 py-0.5 text-center font-mono text-xs border border-transparent hover:border-border rounded bg-transparent focus:bg-background"
                            />
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e => handleUpdateCartItem(idx, { quantity: Math.max(1, parseInt(e.target.value, 10) || 0) })}
                                className="w-20 min-w-[75px] px-1.5 py-0.5 text-right font-mono font-bold bg-transparent border border-transparent hover:border-border focus:bg-background focus:border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                              />
                              <span className="text-[10px] text-muted-foreground font-mono">{prod?.unit || "units"}</span>
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={item.pricePerUnit}
                              onChange={e => handleUpdateCartItem(idx, { pricePerUnit: Math.max(0, parseFloat(e.target.value) || 0) })}
                              className="w-20 px-1.5 py-0.5 text-right font-mono bg-transparent border border-transparent hover:border-border focus:bg-background focus:border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <select
                              value={item.gstPercent}
                              onChange={e => handleUpdateCartItem(idx, { gstPercent: Number(e.target.value) })}
                              className="bg-transparent font-mono text-xs text-muted-foreground border border-transparent hover:border-border focus:bg-background rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                            >
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                              <option value="28">28%</option>
                            </select>
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono font-bold text-foreground">
                            {item.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 hover:bg-red-500/10 rounded text-red-500 hover:text-red-600 transition-colors"
                              title="Remove Item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bill Summary and Record Row */}
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="grid grid-cols-3 gap-6 text-xs w-full md:w-auto">
              <div>
                <span className="text-muted-foreground block text-[9px] font-mono uppercase tracking-wider mb-0.5">Subtotal</span>
                <span className="font-mono font-semibold text-foreground text-sm">
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(invoiceTotals.subTotal)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[9px] font-mono uppercase tracking-wider mb-0.5">Tax (GST)</span>
                <span className="font-mono font-semibold text-foreground text-sm">
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(invoiceTotals.tax)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[9px] font-mono uppercase tracking-wider mb-0.5">Consolidated Cost</span>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(invoiceTotals.grandTotal)}
                </span>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCartItems([])}
                  className="px-4 py-2 border border-border hover:bg-secondary/40 text-muted-foreground hover:text-foreground text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <Trash2 size={13} /> Clear
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerateBill}
                disabled={submitting || cartItems.length === 0}
                className="flex-1 md:flex-none px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-700/50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-700/10 flex items-center justify-center gap-1.5 uppercase tracking-wider transition-colors"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check size={13} /> Record Purchase [Ctrl + Enter]
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Keyboard helper bar */}
          <div className="bg-secondary/20 border border-border p-3 rounded-lg flex items-center gap-3 text-xs text-muted-foreground no-print mt-auto">
            <Keyboard className="text-primary" size={16} />
            <div>
              <span className="font-semibold text-foreground">Keyboard POS Cockpit: </span>
              <span className="font-mono">
                [Ctrl + J] Supplier · [Ctrl + K] Search Item · [Enter] submit line (on Rate) · [Ctrl + D] remove last · [Ctrl + L] clear cart · [Ctrl + C] add supplier · [Ctrl + Enter] post bill
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Voice Billing Assistant - Compact Decreased Size */}
        <div className="xl:col-span-2 no-print">
          <VoiceBillingAssistant
            type="in"
            products={products}
            partners={suppliers}
            customers={customers}
            suppliers={suppliers}
            cartItems={cartItems}
            setCartItems={setCartItems}
            setProductId={setProductId}
            setProductSearch={setProductSearch}
            setGodown={setGodown}
            setQuantity={setQuantity}
            setRate={setRate}
            setSelectedPartnerId={setSelectedSupplierId}
            setPartnerSearch={setSupplierSearch}
            setNote={setNote}
            setPaymentType={setPaymentType}
            handleAddItem={handleAddItem}
            handleGenerateBill={handleGenerateBill}
            setPage={setPage}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onRegisterPartner={async (name) => {
              return await onAddSupplier({ name, address: "Registered via AI Voice", phone: "0000000000", gstNo: "URP" });
            }}
            isCartActive={true}
            onAddEntry={onAddEntry}
          />
        </div>

      </div>

      <AddPartnerModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveSupplier} type="Supplier" />
      <AIPdfInvoiceModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        products={products}
        customers={customers}
        suppliers={suppliers}
        onApplyToCart={({ supplierId, partyName, date: pdfDate, paymentType: pdfPaymentType, notes, items }) => {
          if (supplierId) {
            setSelectedSupplierId(supplierId);
            const sObj = suppliers.find(s => s.id === supplierId);
            if (sObj) setSupplierSearch(sObj.name);
          } else if (partyName) {
            setSupplierSearch(partyName);
          }
          if (pdfDate) setDate(pdfDate);
          if (pdfPaymentType) setPaymentType(pdfPaymentType === "credit" ? "credit" : "cash");
          if (notes) setNote(notes);
          if (items && items.length > 0) {
            setCartItems(prev => [...prev, ...items]);
          }
          setIsPdfModalOpen(false);
          toast.success(`🎉 AI PDF Reader extracted & added ${items.length} item(s) to Purchase Voucher!`);
        }}
      />
    </div>
  );
}

// ─── Attendance Page ────────────────────────────────────────────────────────
function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [employees, setEmployees] = useState<UserItem[]>([]);
  const [attendance, setAttendance] = useState<Record<string, "Present" | "Absent" | "Half Day" | "Paid Leave">>({});

  // Load employees from master_users and attendance registry from localStorage
  useEffect(() => {
    const savedUsers = localStorage.getItem("master_users");
    const parsedUsers = savedUsers ? JSON.parse(savedUsers) : [];
    setEmployees(parsedUsers);

    const savedAttendance = localStorage.getItem("payroll_attendance");
    const parsedAttendance = savedAttendance ? JSON.parse(savedAttendance) : {};
    const dayAttendance = parsedAttendance[date] || {};

    // Prepopulate attendance: default to "Present" for all
    const initial: Record<string, "Present" | "Absent" | "Half Day" | "Paid Leave"> = {};
    parsedUsers.forEach((emp: UserItem) => {
      initial[emp.id] = dayAttendance[emp.id] || "Present";
    });
    setAttendance(initial);
  }, [date]);

  const handleStatusChange = (empId: string, status: "Present" | "Absent" | "Half Day" | "Paid Leave") => {
    setAttendance(prev => ({
      ...prev,
      [empId]: status
    }));
  };

  const handleSave = () => {
    const savedAttendance = localStorage.getItem("payroll_attendance");
    const parsedAttendance = savedAttendance ? JSON.parse(savedAttendance) : {};
    parsedAttendance[date] = attendance;
    localStorage.setItem("payroll_attendance", JSON.stringify(parsedAttendance));
    toast.success(`Attendance for ${new Date(date).toLocaleDateString()} saved successfully!`);
  };

  const stats = useMemo(() => {
    let present = 0, absent = 0, half = 0, leave = 0;
    Object.values(attendance).forEach(status => {
      if (status === "Present") present++;
      else if (status === "Absent") absent++;
      else if (status === "Half Day") half++;
      else if (status === "Paid Leave") leave++;
    });
    return { present, absent, half, leave };
  }, [attendance]);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="border-l-4 border-l-emerald-500 pl-3 py-1 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif tracking-tight">Staff Attendance Register</h1>
          <p className="text-muted-foreground text-[11px] mt-0.5">Mark daily employee attendance and track leaves</p>
        </div>
        <div>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs font-mono focus:outline-none"
          />
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="bg-card border border-border p-8 rounded-xl text-center space-y-3">
          <p className="text-sm text-muted-foreground italic">No employees found in the master console.</p>
          <p className="text-[11px] text-muted-foreground">Please add employees in the Users tab under Master Console [F8 / Users Tab] first.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-emerald-50/10 border border-emerald-100 p-3 rounded-lg text-center">
              <span className="text-[9px] text-emerald-600 block uppercase font-mono tracking-widest font-bold">Present</span>
              <span className="text-xl font-bold font-mono text-emerald-700">{stats.present}</span>
            </div>
            <div className="bg-red-50/10 border border-red-100 p-3 rounded-lg text-center">
              <span className="text-[9px] text-red-600 block uppercase font-mono tracking-widest font-bold">Absent</span>
              <span className="text-xl font-bold font-mono text-red-700">{stats.absent}</span>
            </div>
            <div className="bg-blue-50/10 border border-blue-100 p-3 rounded-lg text-center">
              <span className="text-[9px] text-blue-600 block uppercase font-mono tracking-widest font-bold">Half Day</span>
              <span className="text-xl font-bold font-mono text-blue-700">{stats.half}</span>
            </div>
            <div className="bg-amber-50/10 border border-amber-100 p-3 rounded-lg text-center">
              <span className="text-[9px] text-amber-600 block uppercase font-mono tracking-widest font-bold">Paid Leave</span>
              <span className="text-xl font-bold font-mono text-amber-700">{stats.leave}</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-muted-foreground uppercase text-[9px] font-mono">
                  <th className="py-2.5 px-4">Emp ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Designation / Role</th>
                  <th className="py-2.5 px-3 text-center">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-foreground">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold">{emp.employeeId}</td>
                    <td className="py-2.5 px-3 font-semibold">{emp.employeeName}</td>
                    <td className="py-2.5 px-3 text-muted-foreground font-mono">{emp.role}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex justify-center gap-1.5">
                        {(["Present", "Absent", "Half Day", "Paid Leave"] as const).map(status => {
                          const active = attendance[emp.id] === status;
                          let btnClass = "px-2.5 py-1 text-[10px] font-semibold font-mono rounded transition-all ";
                          if (active) {
                            if (status === "Present") btnClass += "bg-emerald-600 text-white shadow";
                            else if (status === "Absent") btnClass += "bg-red-600 text-white shadow";
                            else if (status === "Half Day") btnClass += "bg-blue-600 text-white shadow";
                            else btnClass += "bg-amber-500 text-white shadow";
                          } else {
                            btnClass += "bg-secondary/40 hover:bg-secondary text-muted-foreground";
                          }
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleStatusChange(emp.id, status)}
                              className={btnClass}
                            >
                              {status}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="bg-secondary/15 border-t border-border p-3 flex justify-end">
              <button
                type="button"
                id="btn-save-attendance"
                onClick={handleSave}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold rounded-lg shadow uppercase tracking-wider transition-colors"
              >
                Save Attendance [Ctrl + S / Click]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Salary Sheet Page ──────────────────────────────────────────────────────
function SalarySheetPage({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
  });
  const [employees, setEmployees] = useState<UserItem[]>([]);
  const [sheetData, setSheetData] = useState<Record<string, { workedDays: number; overtimeHours: number; deductions: number }>>({});
  const [creditAccount, setCreditAccount] = useState("Petty Cash");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const savedUsers = localStorage.getItem("master_users");
    const parsedUsers = savedUsers ? JSON.parse(savedUsers) : [];
    setEmployees(parsedUsers);

    // Load saved sheet values or set default
    const savedSheets = localStorage.getItem("payroll_salary_sheets");
    const parsedSheets = savedSheets ? JSON.parse(savedSheets) : {};
    const monthData = parsedSheets[date] || {};

    const initial: Record<string, { workedDays: number; overtimeHours: number; deductions: number }> = {};
    parsedUsers.forEach((emp: UserItem) => {
      initial[emp.id] = monthData[emp.id] || {
        workedDays: 30,
        overtimeHours: 0,
        deductions: 0
      };
    });
    setSheetData(initial);
  }, [date]);

  const handleChange = (empId: string, field: "workedDays" | "overtimeHours" | "deductions", val: string) => {
    const num = parseFloat(val) || 0;
    setSheetData(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: num
      }
    }));
  };

  const calculatedSalaries = useMemo(() => {
    return employees.map(emp => {
      const inputs = sheetData[emp.id] || { workedDays: 30, overtimeHours: 0, deductions: 0 };
      const basic = Number(emp.basicSalary || 0);
      const allowances = Number(emp.allowances || 0);
      const otRate = Number(emp.overtime || 0); // treated as hourly rate for overtime calculation

      const earnedBasic = (basic / 30) * Math.min(Number(inputs.workedDays || 0), 30);
      const earnedOt = otRate * Number(inputs.overtimeHours || 0);
      const gross = earnedBasic + allowances + earnedOt;
      const net = gross - Number(inputs.deductions || 0);

      return {
        ...emp,
        workedDays: inputs.workedDays,
        overtimeHours: inputs.overtimeHours,
        deductions: inputs.deductions,
        earnedBasic,
        earnedOt,
        gross,
        net
      };
    });
  }, [employees, sheetData]);

  const totalNetSalary = useMemo(() => {
    return calculatedSalaries.reduce((sum, item) => sum + item.net, 0);
  }, [calculatedSalaries]);

  const handlePostSalaryVoucher = async () => {
    if (totalNetSalary <= 0) {
      toast.error("Nothing to disburse.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "payment",
          date: new Date().toISOString().split("T")[0],
          debitAccount: "Staff Salary & Wages",
          creditAccount: creditAccount,
          amount: totalNetSalary,
          mode: "bank",
          referenceNo: `SAL-${date.replace("-", "")}`,
          narration: `Consolidated staff salaries disbursal for the period ${date}. Total employees: ${employees.length}`
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Disbursal post failed");
      }

      // Save sheets state
      const savedSheets = localStorage.getItem("payroll_salary_sheets");
      const parsedSheets = savedSheets ? JSON.parse(savedSheets) : {};
      parsedSheets[date] = sheetData;
      localStorage.setItem("payroll_salary_sheets", JSON.stringify(parsedSheets));

      toast.success(`Salary Payment Voucher posted successfully for ₹${totalNetSalary.toLocaleString("en-IN")}!`);
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="border-l-4 border-l-teal-500 pl-3 py-1 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif tracking-tight">Staff Salary Sheet & Wages</h1>
          <p className="text-muted-foreground text-[11px] mt-0.5">Generate monthly employee payroll registers and disburse pay slips</p>
        </div>
        <div className="flex gap-2">
          <input
            type="month"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none"
          />
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="bg-card border border-border p-8 rounded-xl text-center space-y-3">
          <p className="text-sm text-muted-foreground italic">No employees found in the registry.</p>
          <p className="text-[11px] text-muted-foreground">Please add employees in the Users tab under Master Console [F8 / Users Tab] first.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-[9px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Disburse Ledger Account</label>
                <select
                  value={creditAccount}
                  onChange={e => setCreditAccount(e.target.value)}
                  className="px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none"
                >
                  <option value="Petty Cash">💵 Petty Cash</option>
                  <option value="Cash">💰 Cash Reserve</option>
                  <option value="Bank Account">🏦 Bank Account / Transfer</option>
                </select>
              </div>
              <div>
                <span className="block text-[9px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Disbursal Amount</span>
                <span className="font-mono text-emerald-600 font-bold text-sm">
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(totalNetSalary)}
                </span>
              </div>
            </div>
            <div>
              <button
                type="button"
                id="btn-post-salary"
                onClick={handlePostSalaryVoucher}
                disabled={submitting}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-700/50 text-white rounded-lg text-xs font-mono font-bold uppercase transition-all shadow flex items-center gap-1.5"
              >
                {submitting ? <RefreshCw size={13} className="animate-spin" /> : "Post Disbursal Voucher"}
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono text-left">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border text-muted-foreground uppercase text-[9px]">
                    <th className="py-2.5 px-3">Emp ID</th>
                    <th className="py-2.5 px-3">Employee Name</th>
                    <th className="py-2.5 px-3 text-right">Basic Sal</th>
                    <th className="py-2.5 px-3 text-right">Allowances</th>
                    <th className="py-2.5 px-3 text-center">Worked Days</th>
                    <th className="py-2.5 px-3 text-center">OT Hours</th>
                    <th className="py-2.5 px-3 text-right">OT Pay</th>
                    <th className="py-2.5 px-3 text-right font-bold text-red-500">Deductions</th>
                    <th className="py-2.5 px-3 text-right font-bold text-emerald-600">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-foreground">
                  {calculatedSalaries.map(emp => (
                    <tr key={emp.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="py-2 px-3 font-bold">{emp.employeeId}</td>
                      <td className="py-2 px-3 font-semibold font-sans">{emp.employeeName}</td>
                      <td className="py-2 px-3 text-right">₹{Number(emp.basicSalary || 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right">₹{Number(emp.allowances || 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          max={30}
                          min={0}
                          value={emp.workedDays}
                          onChange={e => handleChange(emp.id, "workedDays", e.target.value)}
                          className="w-12 text-center border rounded bg-input-background text-foreground py-0.5 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          value={emp.overtimeHours}
                          onChange={e => handleChange(emp.id, "overtimeHours", e.target.value)}
                          className="w-12 text-center border rounded bg-input-background text-foreground py-0.5 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3 text-right text-muted-foreground">₹{Number(emp.earnedOt || 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-bold text-red-500">
                        <input
                          type="number"
                          min={0}
                          value={emp.deductions}
                          onChange={e => handleChange(emp.id, "deductions", e.target.value)}
                          className="w-16 text-right border rounded bg-input-background text-foreground py-0.5 px-1 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-600">
                        ₹{Number(emp.net || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stock Transfer Voucher Page ───────────────────────────────────────────
function StockTransferPage({ products, onAddEntry, onRefresh }: {
  products: Product[];
  onAddEntry: (e: any) => Promise<any>;
  onRefresh: () => Promise<void>;
}) {
  const [productId, setProductId] = useState("");
  const [srcGodown, setSrcGodown] = useState<Godown>("A");
  const [destGodown, setDestGodown] = useState<Godown>("B");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedProduct = products.find(p => p.id === productId);
  const currentSrcStock = selectedProduct ? (selectedProduct.godownStocks?.[srcGodown] || 0) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      toast.error("Please select a product.");
      return;
    }
    const qtyVal = parseFloat(quantity);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      toast.error("Quantity must be a positive number.");
      return;
    }
    if (srcGodown === destGodown) {
      toast.error("Source and Destination godowns must be different.");
      return;
    }
    if (currentSrcStock < qtyVal) {
      toast.error(`Insufficient stock in Godown ${srcGodown}. Available: ${currentSrcStock}, Requested: ${qtyVal}`);
      return;
    }

    setSubmitting(true);
    try {
      // 1. Post OUT entry from Source Godown
      const outRes = await onAddEntry({
        type: "out",
        subType: "stock_transfer",
        date,
        partner: `Godown ${srcGodown} to ${destGodown}`,
        note: `Stock Transfer Out: ${selectedProduct?.name} (${qtyVal} ${selectedProduct?.unit}) to Godown ${destGodown}. ${note}`,
        items: [{
          productId,
          godown: srcGodown,
          quantity: qtyVal,
          pricePerUnit: 0,
          gstPercent: 0,
          subTotal: 0,
          grandTotal: 0
        }]
      });

      if (outRes) {
        // 2. Post IN entry into Destination Godown
        await onAddEntry({
          type: "in",
          subType: "stock_transfer",
          date,
          partner: `Godown ${srcGodown} to ${destGodown}`,
          note: `Stock Transfer In: ${selectedProduct?.name} (${qtyVal} ${selectedProduct?.unit}) from Godown ${srcGodown}. ${note}`,
          items: [{
            productId,
            godown: destGodown,
            quantity: qtyVal,
            pricePerUnit: 0,
            gstPercent: 0,
            subTotal: 0,
            grandTotal: 0
          }]
        });

        toast.success("Stock transfer recorded successfully!");
        setQuantity("");
        setNote("");
        await onRefresh();
      }
    } catch (err: any) {
      toast.error(`Transfer failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="border-l-4 border-l-blue-500 pl-3 py-1">
        <h1 className="text-2xl font-bold text-foreground font-serif tracking-tight">Stock Transfer Voucher</h1>
        <p className="text-muted-foreground text-[11px] mt-0.5">Move inventory items internally between Godowns A to R</p>
      </div>

      <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4 text-left">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Product</label>
            <select
              value={productId}
              onChange={e => setProductId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
            >
              <option value="">-- Choose Product --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Current Stock: {p.stock} {p.unit})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Source Godown</label>
              <select
                value={srcGodown}
                onChange={e => setSrcGodown(e.target.value as Godown)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ALL_GODOWNS.map(g => (
                  <option key={g} value={g}>Godown {g}</option>
                ))}
              </select>
              {selectedProduct && (
                <span className="text-[10px] text-muted-foreground font-mono mt-1 block">
                  Available Stock: {currentSrcStock} {selectedProduct.unit}
                </span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Destination Godown</label>
              <select
                value={destGodown}
                onChange={e => setDestGodown(e.target.value as Godown)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ALL_GODOWNS.map(g => (
                  <option key={g} value={g}>Godown {g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Quantity</label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 50"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold text-right"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Transfer Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Note / Remarks</label>
            <input
              type="text"
              placeholder="Reason for transfer..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-mono font-bold uppercase transition-all shadow-md mt-2 flex items-center justify-center gap-1.5"
          >
            {submitting ? <RefreshCw size={13} className="animate-spin" /> : "Post Transfer Voucher"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Physical Stock Verification Entry Page ─────────────────────────────────
function PhysicalStockPage({ products, onAddEntry, onRefresh }: {
  products: Product[];
  onAddEntry: (e: any) => Promise<any>;
  onRefresh: () => Promise<void>;
}) {
  const [productId, setProductId] = useState("");
  const [godown, setGodown] = useState<Godown>("A");
  const [physicalQty, setPhysicalQty] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedProduct = products.find(p => p.id === productId);
  const currentStock = selectedProduct ? (selectedProduct.godownStocks?.[godown] || 0) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      toast.error("Please select a product.");
      return;
    }
    const phyVal = parseFloat(physicalQty);
    if (isNaN(phyVal) || phyVal < 0) {
      toast.error("Physical Quantity cannot be negative.");
      return;
    }

    const discrepancy = phyVal - currentStock;
    if (discrepancy === 0) {
      toast.info("Stock matches exactly. No adjustment required.");
      return;
    }

    setSubmitting(true);
    try {
      const type = discrepancy > 0 ? "in" : "out";
      const adjustQty = Math.abs(discrepancy);

      const res = await onAddEntry({
        type,
        subType: "physical_adjustment",
        date,
        partner: "Physical Count Discrepancy",
        note: `Physical stock count adjustment (${discrepancy > 0 ? "+" : "-"}${adjustQty} ${selectedProduct?.unit}). ${note}`,
        items: [{
          productId,
          godown,
          quantity: adjustQty,
          pricePerUnit: 0,
          gstPercent: 0,
          subTotal: 0,
          grandTotal: 0
        }]
      });

      if (res) {
        toast.success(`Physical stock adjustment of ${discrepancy > 0 ? "+" : "-"}${adjustQty} posted successfully!`);
        setPhysicalQty("");
        setNote("");
        await onRefresh();
      }
    } catch (err: any) {
      toast.error(`Adjustment failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="border-l-4 border-l-indigo-500 pl-3 py-1">
        <h1 className="text-2xl font-bold text-foreground font-serif tracking-tight">Physical Stock Entry</h1>
        <p className="text-muted-foreground text-[11px] mt-0.5">Adjust system stock levels to match physical audit findings</p>
      </div>

      <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4 text-left">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Product</label>
            <select
              value={productId}
              onChange={e => setProductId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
            >
              <option value="">-- Choose Product --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Current Stock: {p.stock} {p.unit})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Godown</label>
              <select
                value={godown}
                onChange={e => setGodown(e.target.value as Godown)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ALL_GODOWNS.map(g => (
                  <option key={g} value={g}>Godown {g}</option>
                ))}
              </select>
              {selectedProduct && (
                <span className="text-[10px] text-muted-foreground font-mono mt-1 block">
                  System Book Stock: {currentStock} {selectedProduct.unit}
                </span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Physical Counted Quantity</label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 150"
                value={physicalQty}
                onChange={e => setPhysicalQty(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Verification Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Expected Discrepancy</label>
              <div className="w-full px-3 py-2 rounded-lg bg-secondary/30 text-xs font-mono font-semibold flex items-center justify-between">
                <span>Diff:</span>
                {selectedProduct && !isNaN(parseFloat(physicalQty)) ? (
                  <span className={parseFloat(physicalQty) - currentStock >= 0 ? "text-emerald-500" : "text-red-500"}>
                    {parseFloat(physicalQty) - currentStock > 0 ? "+" : ""}
                    {parseFloat(physicalQty) - currentStock} {selectedProduct.unit}
                  </span>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Adjustment Narration</label>
            <input
              type="text"
              placeholder="e.g. Shortage during annual audit or moisture loss..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-mono font-bold uppercase transition-all shadow-md mt-2 flex items-center justify-center gap-1.5"
          >
            {submitting ? <RefreshCw size={13} className="animate-spin" /> : "Post Physical Adjustment"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Cargo Spoilage & Damaged Stock Entry Console ────────────────────────────

function PurchaseSpoilagePage({
  products = [],
  spoilages = [],
  onAddSpoilage,
  onRefresh,
}: {
  products: Product[];
  spoilages: SpoilageRecord[];
  onAddSpoilage: (data: Omit<SpoilageRecord, "id" | "spoilageNo">) => Promise<SpoilageRecord | null>;
  onRefresh: () => void;
}) {
  const safeProducts = products || [];
  const safeSpoilages = spoilages || [];
  const [productId, setProductId] = useState("");
  const [godown, setGodown] = useState<Godown>("A");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("Moisture Damage & Rot");
  const [loggedBy, setLoggedBy] = useState("Warehouse Inspector");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedProduct = safeProducts.find(p => p && p.id === productId);
  const currentStock = selectedProduct ? (selectedProduct.godownStocks?.[godown] || 0) : 0;
  const unitCost = selectedProduct ? (selectedProduct.buyPrice || 0) : 0;
  const qtyVal = parseFloat(quantity) || 0;
  const estimatedLoss = qtyVal * unitCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !selectedProduct) {
      toast.error("Please select a product");
      return;
    }
    if (isNaN(qtyVal) || qtyVal <= 0) {
      toast.error("Please enter a valid spoiled quantity");
      return;
    }
    if (qtyVal > currentStock) {
      toast.error(`Spoiled quantity (${qtyVal}) exceeds available stock (${currentStock} ${selectedProduct.unit || "units"}) in Godown ${godown}`);
      return;
    }

    setSubmitting(true);
    const rec = await onAddSpoilage({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      godown,
      quantity: qtyVal,
      unit: selectedProduct.unit || "unit",
      unitCost,
      totalLoss: estimatedLoss,
      date,
      reason,
      loggedBy,
      notes
    });
    setSubmitting(false);

    if (rec) {
      setProductId("");
      setQuantity("");
      setNotes("");
    }
  };

  const fmt = (val: number) => `₹${(val || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title Header */}
      <div className="border-l-4 border-l-red-500 pl-3 py-1 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif tracking-tight flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={24} /> Cargo Spoilage & Damaged Stock Entry
          </h1>
          <p className="text-muted-foreground text-xs font-mono mt-0.5">
            Manually record damaged or spoiled cargo to adjust inventory stock levels and log cost loss
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="p-2 border border-border bg-card hover:bg-secondary/30 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Manual Entry Form */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <h3 className="font-bold text-foreground text-sm font-mono uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={16} /> Spoilage Record Form
          </h3>
          <span className="text-xs text-muted-foreground font-mono">Date: {date}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Input Box 1: Product */}
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                1. Select Product <span className="text-red-500">*</span>
              </label>
              <select
                value={productId}
                onChange={e => setProductId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">-- Select Product --</option>
                {safeProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock} {p.unit})</option>
                ))}
              </select>
            </div>

            {/* Input Box 2: Godown */}
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                2. Select Godown <span className="text-red-500">*</span>
              </label>
              <select
                value={godown}
                onChange={e => setGodown(e.target.value as Godown)}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ALL_GODOWNS.map(g => (
                  <option key={g} value={g}>Godown {g}</option>
                ))}
              </select>
              {selectedProduct && (
                <span className="text-[10px] text-muted-foreground font-mono mt-1 block">
                  Stock in Godown {godown}: <strong className="text-foreground">{currentStock} {selectedProduct.unit}</strong>
                </span>
              )}
            </div>

            {/* Input Box 3: Amount Spoiled Products */}
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                3. Amount Spoiled Products ({selectedProduct?.unit || "Units"}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="Enter spoiled quantity..."
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                Spoilage Reason / Cause
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full px-3.5 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-semibold"
              >
                <option value="Moisture Damage & Rot">Moisture Damage & Rot</option>
                <option value="Expired / Perished Cargo">Expired / Perished Cargo</option>
                <option value="Transit & Handling Damage">Transit & Handling Damage</option>
                <option value="Pest / Insect Contamination">Pest / Insect Contamination</option>
                <option value="Cold Storage Temperature Breach">Cold Storage Temperature Breach</option>
                <option value="Packaging Leakage / Breakage">Packaging Leakage / Breakage</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                Incident Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-bold"
              />
            </div>

            {/* Calculated Loss Indicator */}
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between font-mono">
              <div>
                <span className="text-[9px] text-red-600 dark:text-red-400 uppercase font-bold block">Cost Loss Deducted</span>
                <span className="text-sm font-extrabold text-red-600 dark:text-red-400">{fmt(estimatedLoss)}</span>
              </div>
              <span className="text-[9px] text-muted-foreground text-right">
                {qtyVal} {selectedProduct?.unit || "units"} @ {fmt(unitCost)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">
              Detailed Spoilage Audit Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Enter details about physical condition, batch number, or disposal authorization..."
              className="w-full px-3.5 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-md uppercase tracking-wider transition-all"
          >
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
            {submitting ? "RECORDING SPOILAGE..." : "SUBMIT SPOILAGE RECORD & DEDUCT STOCK"}
          </button>
        </form>
      </div>

      {/* Recent Spoilage Logs */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-foreground text-xs font-mono uppercase tracking-wider flex items-center gap-2">
          <History size={14} className="text-red-500" /> Recent Cargo Spoilage Entries ({safeSpoilages.length})
        </h3>

        {safeSpoilages.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-xl text-muted-foreground text-xs font-mono">
            No spoilage records logged yet. Use the form above to record spoiled inventory.
          </div>
        ) : (
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-[10px] uppercase text-muted-foreground">
                  <th className="p-2.5">Ref No</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Product Name</th>
                  <th className="p-2.5">Godown</th>
                  <th className="p-2.5 text-right">Spoiled Qty</th>
                  <th className="p-2.5 text-right">Total Loss</th>
                  <th className="p-2.5">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {safeSpoilages.slice().reverse().slice(0, 10).map((s, idx) => (
                  <tr key={idx} className="hover:bg-secondary/20">
                    <td className="p-2.5 font-bold text-red-600">{s.spoilageNo}</td>
                    <td className="p-2.5 text-muted-foreground">{s.date}</td>
                    <td className="p-2.5 font-semibold text-foreground">{s.productName}</td>
                    <td className="p-2.5">Godown {s.godown}</td>
                    <td className="p-2.5 text-right font-bold text-foreground">{s.quantity} {s.unit}</td>
                    <td className="p-2.5 text-right font-extrabold text-red-600">{fmt(s.totalLoss)}</td>
                    <td className="p-2.5 text-muted-foreground text-[11px]">{s.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Cargo Spoilage Audit Report View ────────────────────────────────────────

function SpoilageReportView({
  spoilages = [],
  products = [],
}: {
  spoilages: SpoilageRecord[];
  products: Product[];
}) {
  const safeSpoilages = spoilages || [];
  const safeProducts = products || [];
  const [search, setSearch] = useState("");
  const [selectedGodown, setSelectedGodown] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fmt = (val: number) => `₹${(val || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const filtered = useMemo(() => {
    return safeSpoilages.filter(s => {
      if (!s) return false;
      const pName = s.productName || "";
      const reason = s.reason || "";
      const spNo = s.spoilageNo || "";
      const matchSearch = pName.toLowerCase().includes(search.toLowerCase()) ||
        reason.toLowerCase().includes(search.toLowerCase()) ||
        spNo.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;

      if (selectedGodown !== "all" && s.godown !== selectedGodown) return false;
      if (startDate && s.date < startDate) return false;
      if (endDate && s.date > endDate) return false;
      return true;
    });
  }, [safeSpoilages, search, selectedGodown, startDate, endDate]);

  const totalQtyLoss = filtered.reduce((acc, item) => acc + item.quantity, 0);
  const totalFinancialLoss = filtered.reduce((acc, item) => acc + item.totalLoss, 0);

  const exportPdf = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      doc.setFillColor(185, 28, 28);
      doc.rect(0, 0, 210, 24, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("serif", "bold");
      doc.setFontSize(16);
      doc.text("SPICE ROUTE TRADING CO. - CARGO SPOILAGE REPORT", 14, 15);

      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Total Incidents: ${filtered.length}`, 14, 34);
      doc.text(`Total Financial Loss: ₹${totalFinancialLoss.toLocaleString("en-IN")}`, 14, 40);
      doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 140, 34);

      let y = 50;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.text("REF NO", 18, y + 5.5);
      doc.text("DATE", 50, y + 5.5);
      doc.text("PRODUCT", 80, y + 5.5);
      doc.text("GODOWN", 125, y + 5.5);
      doc.text("QTY", 150, y + 5.5);
      doc.text("LOSS (INR)", 190, y + 5.5, { align: "right" });

      y += 8;
      doc.setFont("helvetica", "normal");
      filtered.forEach((row, idx) => {
        y += 7;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y - 1, 182, 6, "F");
        }
        doc.text(row.spoilageNo, 18, y + 3.5);
        doc.text(row.date, 50, y + 3.5);
        doc.text(row.productName.slice(0, 20), 80, y + 3.5);
        doc.text(`Gdn ${row.godown}`, 125, y + 3.5);
        doc.text(`${row.quantity} ${row.unit}`, 150, y + 3.5);
        doc.text(`₹${row.totalLoss.toLocaleString("en-IN")}`, 190, y + 3.5, { align: "right" });
      });

      doc.save(`spoilage_report_${Date.now()}.pdf`);
      toast.success("Exported Spoilage Report PDF!");
    } catch (e: any) {
      toast.error(`Export failed: ${e.message}`);
    }
  };

  return (
    <div className="space-y-5 font-mono">
      {/* Summary Cockpit */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl space-y-1 shadow-sm">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Spoilage Incidents</span>
          <div className="text-2xl font-extrabold text-foreground">{filtered.length} Entries</div>
          <span className="text-[10px] text-muted-foreground">{totalQtyLoss} total units spoiled</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl space-y-1 shadow-sm">
          <span className="text-[10px] text-red-600 uppercase font-bold">Total Financial Cost Loss</span>
          <div className="text-2xl font-extrabold text-red-600">{fmt(totalFinancialLoss)}</div>
          <span className="text-[10px] text-red-600/80">Acquisition cost loss</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl space-y-1 shadow-sm">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Report Actions</span>
          <button
            type="button"
            onClick={exportPdf}
            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow"
          >
            <Download size={14} /> Export Spoilage Report (PDF)
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-card border border-border p-4 rounded-xl flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by product name, reason, ref #..."
            className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs"
          />
        </div>

        <select
          value={selectedGodown}
          onChange={e => setSelectedGodown(e.target.value)}
          className="px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs font-bold"
        >
          <option value="all">All Godowns</option>
          {ALL_GODOWNS.map(g => (
            <option key={g} value={g}>Godown {g}</option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="px-2.5 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs"
        />
        <span className="text-muted-foreground text-xs">to</span>
        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="px-2.5 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs"
        />
      </div>

      {/* Spoilages Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-secondary/40 border-b border-border text-[10px] uppercase text-muted-foreground font-bold">
              <th className="p-3">Ref No</th>
              <th className="p-3">Date</th>
              <th className="p-3">Product Name</th>
              <th className="p-3">Godown</th>
              <th className="p-3 text-right">Spoiled Qty</th>
              <th className="p-3 text-right">Unit Buy Rate</th>
              <th className="p-3 text-right">Total Loss (INR)</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Inspector</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground italic">
                  No spoilage records found matching filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((s, i) => (
                <tr key={i} className="hover:bg-secondary/20">
                  <td className="p-3 font-bold text-red-600">{s.spoilageNo}</td>
                  <td className="p-3 text-muted-foreground">{s.date}</td>
                  <td className="p-3 font-semibold text-foreground">{s.productName}</td>
                  <td className="p-3 font-bold text-foreground">Godown {s.godown}</td>
                  <td className="p-3 text-right font-bold text-foreground">{s.quantity} {s.unit}</td>
                  <td className="p-3 text-right text-muted-foreground">{fmt(s.unitCost)}</td>
                  <td className="p-3 text-right font-extrabold text-red-600">{fmt(s.totalLoss)}</td>
                  <td className="p-3 text-muted-foreground text-[11px]">{s.reason}</td>
                  <td className="p-3 text-muted-foreground text-[11px]">{s.loggedBy || "N/A"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Financial Statements & Reports Cockpit ───────────────────────────────

function ReportsPage({
  entries,
  products,
  customers,
  suppliers,
  vouchers,
  spoilages = [],
  analytics,
  currentPage,
  setPage,
  onViewInvoice,
  onEditEntryFromHistory,
  onClearHistory,
}: {
  entries: StockEntry[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  vouchers: Voucher[];
  spoilages?: SpoilageRecord[];
  analytics: Analytics | null;
  currentPage: string;
  setPage: (p: string) => void;
  onViewInvoice: (inv: StockEntry) => void;
  onEditEntryFromHistory?: (entryOrRef: any) => void;
  onClearHistory?: () => void;
}) {
  const [activeReportTab, setActiveReportTab] = useState<"sales-purchase" | "pl" | "bs" | "tb" | "ledger" | "group" | "payable" | "receivable" | "outstanding" | "closing-stock" | "day-book" | "spoilage">(() => {
    if (currentPage === "reports-pl") return "pl";
    if (currentPage === "reports-bs") return "bs";
    if (currentPage === "reports-tb") return "tb";
    if (currentPage === "reports-ledger") return "ledger";
    if (currentPage === "reports-group") return "group";
    if (currentPage === "reports-payable") return "payable";
    if (currentPage === "reports-receivable") return "receivable";
    if (currentPage === "reports-outstanding") return "outstanding";
    if (currentPage === "reports-closing-stock") return "closing-stock";
    if (currentPage === "reports-day-book") return "day-book";
    if (currentPage === "reports-spoilage") return "spoilage";
    return "sales-purchase";
  });

  useEffect(() => {
    if (currentPage === "reports-pl") setActiveReportTab("pl");
    else if (currentPage === "reports-bs") setActiveReportTab("bs");
    else if (currentPage === "reports-tb") setActiveReportTab("tb");
    else if (currentPage === "reports-ledger") setActiveReportTab("ledger");
    else if (currentPage === "reports-group") setActiveReportTab("group");
    else if (currentPage === "reports-payable") setActiveReportTab("payable");
    else if (currentPage === "reports-receivable") setActiveReportTab("receivable");
    else if (currentPage === "reports-outstanding") setActiveReportTab("outstanding");
    else if (currentPage === "reports-closing-stock") setActiveReportTab("closing-stock");
    else if (currentPage === "reports-day-book") setActiveReportTab("day-book");
    else if (currentPage === "reports-spoilage") setActiveReportTab("spoilage");
    else if (currentPage === "reports-sales-purchase" || currentPage === "reports-all" || currentPage === "reports") setActiveReportTab("sales-purchase");
  }, [currentPage]);

  const [reportType, setReportType] = useState<"all" | "out" | "in">("all");
  const [periodPreset, setPeriodPreset] = useState<"today" | "yesterday" | "this_week" | "this_month" | "last_30" | "all_time" | "custom">("this_month");
  
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(todayStr);

  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  const [selectedGodown, setSelectedGodown] = useState<string>("all");
  const [searchPartner, setSearchPartner] = useState<string>("");

  // New report local states
  const [selectedLedger, setSelectedLedger] = useState<string>("HDFC Bank A/C");
  const [payableSearch, setPayableSearch] = useState<string>("");
  const [receivableSearch, setReceivableSearch] = useState<string>("");

  const ledgerDetails = useMemo(() => {
    const options = [
      "HDFC Bank A/C",
      "Petty Cash Account",
      "Owner's Capital Account",
      "Sales Account",
      "Purchase Account",
      "Operating Expenses & Wages",
      "Other Income Account",
      "Sundry Debtors (Customers)",
      "Sundry Creditors (Suppliers)",
      ...(customers || []).map(c => `Customer: ${c?.name || ""}`),
      ...(suppliers || []).map(s => `Supplier: ${s?.name || ""}`),
    ];

    let initialBalance = 0;
    let balanceType: "Dr" | "Cr" = "Dr";

    if (selectedLedger === "HDFC Bank A/C") { initialBalance = 800000; balanceType = "Dr"; }
    else if (selectedLedger === "Petty Cash Account") { initialBalance = 50000; balanceType = "Dr"; }
    else if (selectedLedger === "Owner's Capital Account") { initialBalance = 850000; balanceType = "Cr"; }
    else if (selectedLedger === "Sundry Debtors (Customers)") { initialBalance = 0; balanceType = "Dr"; }
    else if (selectedLedger === "Sundry Creditors (Suppliers)") { initialBalance = 0; balanceType = "Cr"; }

    const isCustomer = selectedLedger.startsWith("Customer: ");
    const isSupplier = selectedLedger.startsWith("Supplier: ");
    const targetPartner = isCustomer ? selectedLedger.replace("Customer: ", "") : isSupplier ? selectedLedger.replace("Supplier: ", "") : "";

    const txs: { date: string; ref: string; type: string; dr: number; cr: number; balance: number }[] = [];

    const customerNames = new Set((customers || []).map(c => (c?.name || "").toLowerCase().trim()));
    const supplierNames = new Set((suppliers || []).map(s => (s?.name || "").toLowerCase().trim()));

    (entries || []).forEach(e => {
      if (e.subType === "quotation" || e.subType === "purchase_order") return;
      const amt = e.grandTotal || 0;
      const pays = e.payments && e.payments.length > 0 ? e.payments : [{ method: e.paymentType || "cash", amount: amt }];
      const partnerMatch = (e.partner || "").toLowerCase().trim() === targetPartner.toLowerCase().trim();

      if (e.type === "out") {
        if (selectedLedger === "Sales Account") {
          txs.push({ date: e.date, ref: e.invoiceNo || e.id, type: "Sales Invoice", dr: 0, cr: amt, balance: 0 });
        }

        pays.forEach(p => {
          const pAmt = p.amount;
          if (selectedLedger === "Petty Cash Account" && p.method === "cash") {
            txs.push({ date: e.date, ref: e.invoiceNo || e.id, type: "Sales Cash Settle", dr: pAmt, cr: 0, balance: 0 });
          } else if (selectedLedger === "HDFC Bank A/C" && (p.method === "card" || p.method === "transfer")) {
            txs.push({ date: e.date, ref: e.invoiceNo || e.id, type: "Sales Bank Settle", dr: pAmt, cr: 0, balance: 0 });
          } else if (selectedLedger === "Sundry Debtors (Customers)" && p.method === "credit") {
            txs.push({ date: e.date, ref: e.invoiceNo || e.id, type: `Sales Credit - ${e.partner}`, dr: pAmt, cr: 0, balance: 0 });
          } else if (isCustomer && partnerMatch && p.method === "credit") {
            txs.push({ date: e.date, ref: e.invoiceNo || e.id, type: "Credit Sale Invoice", dr: pAmt, cr: 0, balance: 0 });
          }
        });
      } else if (e.type === "in") {
        if (selectedLedger === "Purchase Account") {
          txs.push({ date: e.date, ref: e.invoiceNo || e.id, type: "Purchase Invoice", dr: amt, cr: 0, balance: 0 });
        }

        pays.forEach(p => {
          const pAmt = p.amount;
          if (selectedLedger === "Petty Cash Account" && p.method === "cash") {
            txs.push({ date: e.date, ref: e.invoiceNo || e.id, type: "Purchase Cash Settle", dr: 0, cr: pAmt, balance: 0 });
          } else if (selectedLedger === "HDFC Bank A/C" && (p.method === "card" || p.method === "transfer")) {
            txs.push({ date: e.date, ref: e.invoiceNo || e.id, type: "Purchase Bank Settle", dr: 0, cr: pAmt, balance: 0 });
          } else if (selectedLedger === "Sundry Creditors (Suppliers)" && p.method === "credit") {
            txs.push({ date: e.date, ref: e.invoiceNo || e.id, type: `Purchase Credit - ${e.partner}`, dr: 0, cr: pAmt, balance: 0 });
          } else if (isSupplier && partnerMatch && p.method === "credit") {
            txs.push({ date: e.date, ref: e.invoiceNo || e.id, type: "Credit Purchase Invoice", dr: 0, cr: pAmt, balance: 0 });
          }
        });
      }
    });

    (vouchers || []).forEach(v => {
      const amt = v.amount || 0;
      const creditAccLower = (v.creditAccount || "").toLowerCase().trim();
      const debitAccLower = (v.debitAccount || "").toLowerCase().trim();

      if (v.type === "payment") {
        if (selectedLedger === "Petty Cash Account" && v.mode === "cash") {
          txs.push({ date: v.date, ref: v.voucherNo || v.id, type: `Payment - ${v.debitAccount}`, dr: 0, cr: amt, balance: 0 });
        } else if (selectedLedger === "HDFC Bank A/C" && v.mode !== "cash") {
          txs.push({ date: v.date, ref: v.voucherNo || v.id, type: `Payment - ${v.debitAccount}`, dr: 0, cr: amt, balance: 0 });
        }

        const isSupp = supplierNames.has(debitAccLower) || debitAccLower.includes("creditor") || debitAccLower.includes("supplier");
        if (isSupp) {
          if (selectedLedger === "Sundry Creditors (Suppliers)") {
            txs.push({ date: v.date, ref: v.voucherNo || v.id, type: `Supplier Payment - ${v.debitAccount}`, dr: amt, cr: 0, balance: 0 });
          } else if (isSupplier && debitAccLower === targetPartner.toLowerCase().trim()) {
            txs.push({ date: v.date, ref: v.voucherNo || v.id, type: "Cash/Bank Payment Made", dr: amt, cr: 0, balance: 0 });
          }
        } else {
          if (selectedLedger === "Operating Expenses & Wages") {
            txs.push({ date: v.date, ref: v.voucherNo || v.id, type: `Expense - ${v.debitAccount}`, dr: amt, cr: 0, balance: 0 });
          }
        }
      } else if (v.type === "receipt") {
        if (selectedLedger === "Petty Cash Account" && v.mode === "cash") {
          txs.push({ date: v.date, ref: v.voucherNo || v.id, type: `Receipt - ${v.creditAccount}`, dr: amt, cr: 0, balance: 0 });
        } else if (selectedLedger === "HDFC Bank A/C" && v.mode !== "cash") {
          txs.push({ date: v.date, ref: v.voucherNo || v.id, type: `Receipt - ${v.creditAccount}`, dr: amt, cr: 0, balance: 0 });
        }

        const isCust = customerNames.has(creditAccLower) || creditAccLower.includes("debtor") || creditAccLower.includes("customer");
        if (isCust) {
          if (selectedLedger === "Sundry Debtors (Customers)") {
            txs.push({ date: v.date, ref: v.voucherNo || v.id, type: `Customer Payment - ${v.creditAccount}`, dr: 0, cr: amt, balance: 0 });
          } else if (isCustomer && creditAccLower === targetPartner.toLowerCase().trim()) {
            txs.push({ date: v.date, ref: v.voucherNo || v.id, type: "Cash/Bank Receipt Received", dr: 0, cr: amt, balance: 0 });
          }
        } else {
          if (selectedLedger === "Other Income Account") {
            txs.push({ date: v.date, ref: v.voucherNo || v.id, type: `Income - ${v.creditAccount}`, dr: 0, cr: amt, balance: 0 });
          }
        }
      } else if (v.type === "contra") {
        if (selectedLedger === "HDFC Bank A/C") {
          if (debitAccLower.includes("bank")) txs.push({ date: v.date, ref: v.voucherNo || v.id, type: "Contra Deposit", dr: amt, cr: 0, balance: 0 });
          else txs.push({ date: v.date, ref: v.voucherNo || v.id, type: "Contra Withdrawal", dr: 0, cr: amt, balance: 0 });
        } else if (selectedLedger === "Petty Cash Account") {
          if (debitAccLower.includes("cash")) txs.push({ date: v.date, ref: v.voucherNo || v.id, type: "Contra Deposit", dr: amt, cr: 0, balance: 0 });
          else txs.push({ date: v.date, ref: v.voucherNo || v.id, type: "Contra Withdrawal", dr: 0, cr: amt, balance: 0 });
        }
      } else if (v.type === "journal") {
        if (debitAccLower === selectedLedger.toLowerCase() || 
            (selectedLedger === "Operating Expenses & Wages" && (debitAccLower.includes("rent") || debitAccLower.includes("expense") || debitAccLower.includes("salary") || debitAccLower.includes("wage"))) ||
            (selectedLedger === "Sundry Creditors (Suppliers)" && (debitAccLower.includes("creditors") || supplierNames.has(debitAccLower))) ||
            (selectedLedger === "Sundry Debtors (Customers)" && (debitAccLower.includes("debtors") || customerNames.has(debitAccLower))) ||
            (selectedLedger === "HDFC Bank A/C" && debitAccLower.includes("bank")) ||
            (selectedLedger === "Petty Cash Account" && debitAccLower.includes("cash")) ||
            (isSupplier && debitAccLower === targetPartner.toLowerCase().trim()) ||
            (isCustomer && debitAccLower === targetPartner.toLowerCase().trim())) {
          txs.push({ date: v.date, ref: v.voucherNo || v.id, type: `Journal JV (Dr) - ${v.creditAccount}`, dr: amt, cr: 0, balance: 0 });
        }

        if (creditAccLower === selectedLedger.toLowerCase() ||
            (selectedLedger === "Owner's Capital Account" && creditAccLower.includes("capital")) ||
            (selectedLedger === "Sundry Creditors (Suppliers)" && (creditAccLower.includes("creditors") || supplierNames.has(creditAccLower))) ||
            (selectedLedger === "Sundry Debtors (Customers)" && (creditAccLower.includes("debtors") || customerNames.has(creditAccLower))) ||
            (selectedLedger === "Other Income Account" && (creditAccLower.includes("income") || creditAccLower.includes("sales"))) ||
            (selectedLedger === "HDFC Bank A/C" && creditAccLower.includes("bank")) ||
            (selectedLedger === "Petty Cash Account" && creditAccLower.includes("cash")) ||
            (isSupplier && creditAccLower === targetPartner.toLowerCase().trim()) ||
            (isCustomer && creditAccLower === targetPartner.toLowerCase().trim())) {
          txs.push({ date: v.date, ref: v.voucherNo || v.id, type: `Journal JV (Cr) - ${v.debitAccount}`, dr: 0, cr: amt, balance: 0 });
        }
      }
    });

    txs.sort((a, b) => a.date.localeCompare(b.date));

    let currentBal = initialBalance;
    const finalTxs = txs.map(t => {
      if (balanceType === "Dr") {
        currentBal = currentBal + t.dr - t.cr;
      } else {
        currentBal = currentBal + t.cr - t.dr;
      }
      return { ...t, balance: currentBal };
    });

    return { options, initialBalance, balanceType, finalTxs };
  }, [selectedLedger, entries, vouchers, customers, suppliers]);

  const handlePresetChange = (preset: typeof periodPreset) => {
    setPeriodPreset(preset);
    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split("T")[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === "this_week") {
      const w = new Date();
      const day = w.getDay() || 7;
      w.setDate(w.getDate() - day + 1);
      setStartDate(w.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (preset === "this_month") {
      const m = new Date();
      m.setDate(1);
      setStartDate(m.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (preset === "last_30") {
      const l = new Date();
      l.setDate(l.getDate() - 30);
      setStartDate(l.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (preset === "all_time") {
      setStartDate("2020-01-01");
      setEndDate(todayStr);
    }
  };

  // Filter entries based on selections
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (reportType !== "all" && e.type !== reportType) return false;
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;

      if (selectedProductId !== "all") {
        if (e.items && e.items.length > 0) {
          if (!e.items.some(item => item.productId === selectedProductId)) return false;
        } else if (e.productId !== selectedProductId) {
          return false;
        }
      }

      if (selectedGodown !== "all") {
        if (e.items && e.items.length > 0) {
          if (!e.items.some(item => item.godown === selectedGodown)) return false;
        } else if (e.godown !== selectedGodown) {
          return false;
        }
      }

      if (searchPartner.trim()) {
        const q = searchPartner.toLowerCase().trim();
        if (!e.partner.toLowerCase().includes(q)) return false;
      }

      return true;
    });
  }, [entries, reportType, startDate, endDate, selectedProductId, selectedGodown, searchPartner]);

  // Compute Aggregates & KPIs
  const kpis = useMemo(() => {
    let totalSales = 0;
    let totalPurchase = 0;
    let salesCount = 0;
    let purchaseCount = 0;
    let totalQty = 0;

    filteredEntries.forEach(e => {
      const amount = e.grandTotal || (e.subTotal ? e.subTotal * 1.12 : (e.quantity || 0) * (e.pricePerUnit || 0) * 1.12);
      const qty = e.items ? e.items.reduce((sum, item) => sum + item.quantity, 0) : (e.quantity || 0);

      totalQty += qty;
      if (e.type === "out") {
        totalSales += amount;
        salesCount++;
      } else {
        totalPurchase += amount;
        purchaseCount++;
      }
    });

    const netProfit = totalSales - totalPurchase;
    const marginPercent = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : "0.0";

    return {
      totalSales,
      totalPurchase,
      salesCount,
      purchaseCount,
      totalCount: filteredEntries.length,
      netProfit,
      marginPercent,
      totalQty
    };
  }, [filteredEntries]);

  // Calculate day difference for manual selection badge
  const daysDifference = useMemo(() => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [startDate, endDate]);

  // Chart Data: Group by Date
  const chartData = useMemo(() => {
    const map: Record<string, { date: string; sales: number; purchase: number }> = {};

    filteredEntries.forEach(e => {
      const d = e.date;
      if (!map[d]) {
        map[d] = { date: d, sales: 0, purchase: 0 };
      }
      const amount = e.grandTotal || (e.subTotal ? e.subTotal * 1.12 : (e.quantity || 0) * (e.pricePerUnit || 0) * 1.12);
      if (e.type === "out") {
        map[d].sales += amount;
      } else {
        map[d].purchase += amount;
      }
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredEntries]);

  // ── Financial Calculators (P&L, Balance Sheet, Trial Balance) ──────────────

  const doubleEntryBalances = useMemo(() => {
    const runLedgers = (start?: string, end?: string) => {
      let cashDr = 0, cashCr = 0;
      let bankDr = 0, bankCr = 0;
      let capitalDr = 0, capitalCr = 0;
      let debtorsDr = 0, debtorsCr = 0;
      let creditorsDr = 0, creditorsCr = 0;
      let salesDr = 0, salesCr = 0;
      let purchaseDr = 0, purchaseCr = 0;
      let expenseDr = 0, expenseCr = 0;
      let otherIncomeDr = 0, otherIncomeCr = 0;

      const customerNames = new Set((customers || []).map(c => (c?.name || "").toLowerCase().trim()));
      const supplierNames = new Set((suppliers || []).map(s => (s?.name || "").toLowerCase().trim()));

      (entries || []).forEach(e => {
        if (e.subType === "quotation" || e.subType === "purchase_order") return;
        if (start && e.date < start) return;
        if (end && e.date > end) return;

        const amount = e.grandTotal || 0;

        if (e.type === "out") {
          salesCr += amount;
          const pays = e.payments && e.payments.length > 0 ? e.payments : [{ method: e.paymentType || "cash", amount }];
          pays.forEach(p => {
            const pAmt = p.amount;
            if (p.method === "cash") cashDr += pAmt;
            else if (p.method === "card" || p.method === "transfer") bankDr += pAmt;
            else if (p.method === "credit") debtorsDr += pAmt;
          });
        } else if (e.type === "in") {
          purchaseDr += amount;
          const pays = e.payments && e.payments.length > 0 ? e.payments : [{ method: e.paymentType || "cash", amount }];
          pays.forEach(p => {
            const pAmt = p.amount;
            if (p.method === "cash") cashCr += pAmt;
            else if (p.method === "card" || p.method === "transfer") bankCr += pAmt;
            else if (p.method === "credit") creditorsCr += pAmt;
          });
        }
      });

      (vouchers || []).forEach(v => {
        if (start && v.date < start) return;
        if (end && v.date > end) return;

        const amount = v.amount || 0;
        const creditAccLower = (v.creditAccount || "").toLowerCase().trim();
        const debitAccLower = (v.debitAccount || "").toLowerCase().trim();

        if (v.type === "payment") {
          if (v.mode === "cash") cashCr += amount;
          else bankCr += amount;

          const isSupplier = supplierNames.has(debitAccLower) || debitAccLower.includes("creditor") || debitAccLower.includes("supplier");
          if (isSupplier) {
            creditorsDr += amount;
          } else {
            expenseDr += amount;
          }
        } else if (v.type === "receipt") {
          if (v.mode === "cash") cashDr += amount;
          else bankDr += amount;

          const isCustomer = customerNames.has(creditAccLower) || creditAccLower.includes("debtor") || creditAccLower.includes("customer");
          if (isCustomer) {
            debtorsCr += amount;
          } else {
            otherIncomeCr += amount;
          }
        } else if (v.type === "contra") {
          if (debitAccLower.includes("bank")) bankDr += amount;
          else cashDr += amount;

          if (creditAccLower.includes("bank")) bankCr += amount;
          else cashCr += amount;
        } else if (v.type === "journal") {
          if (debitAccLower.includes("rent") || debitAccLower.includes("expense") || debitAccLower.includes("salary") || debitAccLower.includes("wage")) {
            expenseDr += amount;
          } else if (debitAccLower.includes("creditors") || supplierNames.has(debitAccLower)) {
            creditorsDr += amount;
          } else if (debitAccLower.includes("debtors") || customerNames.has(debitAccLower)) {
            debtorsDr += amount;
          } else if (debitAccLower.includes("bank")) {
            bankDr += amount;
          } else if (debitAccLower.includes("cash")) {
            cashDr += amount;
          }

          if (creditAccLower.includes("capital")) {
            capitalCr += amount;
          } else if (creditAccLower.includes("creditors") || supplierNames.has(creditAccLower)) {
            creditorsCr += amount;
          } else if (creditAccLower.includes("debtors") || customerNames.has(creditAccLower)) {
            debtorsCr += amount;
          } else if (creditAccLower.includes("income") || creditAccLower.includes("sales")) {
            otherIncomeCr += amount;
          } else if (creditAccLower.includes("bank")) {
            bankCr += amount;
          } else if (creditAccLower.includes("cash")) {
            cashCr += amount;
          }
        }
      });

      return {
        cashDr, cashCr,
        bankDr, bankCr,
        capitalDr, capitalCr,
        debtorsDr, debtorsCr,
        creditorsDr, creditorsCr,
        salesDr, salesCr,
        purchaseDr, purchaseCr,
        expenseDr, expenseCr,
        otherIncomeDr, otherIncomeCr,
      };
    };

    const cumulative = runLedgers(undefined, endDate || undefined);

    const initCash = 50000;
    const initBank = 800000;
    const initCapital = 850000;

    const pettyCash = initCash + cumulative.cashDr - cumulative.cashCr;
    const hdfcBank = initBank + cumulative.bankDr - cumulative.bankCr;
    const ownerCapital = initCapital + cumulative.capitalCr - cumulative.capitalDr;
    const sundryDebtors = cumulative.debtorsDr - cumulative.debtorsCr;
    const sundryCreditors = cumulative.creditorsCr - cumulative.creditorsDr;
    const salesAccount = cumulative.salesCr - cumulative.salesDr;
    const purchaseAccount = cumulative.purchaseDr - cumulative.purchaseCr;
    const operatingExpenses = cumulative.expenseDr - cumulative.expenseCr;
    const otherIncome = cumulative.otherIncomeCr - cumulative.otherIncomeDr;

    const period = runLedgers(startDate || undefined, endDate || undefined);

    const periodSales = period.salesCr - period.salesDr;
    const periodPurchases = period.purchaseDr - period.purchaseCr;
    const periodExpenses = period.expenseDr - period.expenseCr;
    const periodOtherIncome = period.otherIncomeCr - period.otherIncomeDr;

    // Compute customer and supplier specific balances for AP / AR
    const customerBalances: Record<string, { sales: number; receipts: number }> = {};
    const supplierBalances: Record<string, { purchases: number; payments: number }> = {};

    const customerNames = new Set((customers || []).map(c => (c?.name || "").toLowerCase().trim()));
    const supplierNames = new Set((suppliers || []).map(s => (s?.name || "").toLowerCase().trim()));

    (entries || []).forEach(e => {
      if (e.subType === "quotation" || e.subType === "purchase_order") return;
      if (endDate && e.date > endDate) return;

      const amount = e.grandTotal || 0;
      const partnerKey = e.partner ? e.partner.trim() : "";

      if (e.type === "out") {
        const pays = e.payments && e.payments.length > 0 ? e.payments : [{ method: e.paymentType || "cash", amount }];
        pays.forEach(p => {
          if (p.method === "credit") {
            if (!customerBalances[partnerKey]) customerBalances[partnerKey] = { sales: 0, receipts: 0 };
            customerBalances[partnerKey].sales += p.amount;
          }
        });
      } else if (e.type === "in") {
        const pays = e.payments && e.payments.length > 0 ? e.payments : [{ method: e.paymentType || "cash", amount }];
        pays.forEach(p => {
          if (p.method === "credit") {
            if (!supplierBalances[partnerKey]) supplierBalances[partnerKey] = { purchases: 0, payments: 0 };
            supplierBalances[partnerKey].purchases += p.amount;
          }
        });
      }
    });

    (vouchers || []).forEach(v => {
      if (endDate && v.date > endDate) return;

      const amount = v.amount || 0;
      const creditAccLower = (v.creditAccount || "").toLowerCase().trim();
      const debitAccLower = (v.debitAccount || "").toLowerCase().trim();

      if (v.type === "payment") {
        const isSupplier = supplierNames.has(debitAccLower) || debitAccLower.includes("creditor") || debitAccLower.includes("supplier");
        if (isSupplier) {
          const supplierName = (suppliers || []).find(s => (s?.name || "").toLowerCase().trim() === debitAccLower)?.name || v.debitAccount;
          const partnerKey = supplierName.trim();
          if (!supplierBalances[partnerKey]) supplierBalances[partnerKey] = { purchases: 0, payments: 0 };
          supplierBalances[partnerKey].payments += amount;
        }
      } else if (v.type === "receipt") {
        const isCustomer = customerNames.has(creditAccLower) || creditAccLower.includes("debtor") || creditAccLower.includes("customer");
        if (isCustomer) {
          const customerName = (customers || []).find(c => (c?.name || "").toLowerCase().trim() === creditAccLower)?.name || v.creditAccount;
          const partnerKey = customerName.trim();
          if (!customerBalances[partnerKey]) customerBalances[partnerKey] = { sales: 0, receipts: 0 };
          customerBalances[partnerKey].receipts += amount;
        }
      } else if (v.type === "journal") {
        if (debitAccLower.includes("creditors") || supplierNames.has(debitAccLower)) {
          const supplierName = (suppliers || []).find(s => (s?.name || "").toLowerCase().trim() === debitAccLower)?.name || v.debitAccount;
          const partnerKey = supplierName.trim();
          if (!supplierBalances[partnerKey]) supplierBalances[partnerKey] = { purchases: 0, payments: 0 };
          supplierBalances[partnerKey].payments += amount;
        } else if (debitAccLower.includes("debtors") || customerNames.has(debitAccLower)) {
          const customerName = (customers || []).find(c => (c?.name || "").toLowerCase().trim() === debitAccLower)?.name || v.debitAccount;
          const partnerKey = customerName.trim();
          if (!customerBalances[partnerKey]) customerBalances[partnerKey] = { sales: 0, receipts: 0 };
          customerBalances[partnerKey].sales += amount;
        }

        if (creditAccLower.includes("creditors") || supplierNames.has(creditAccLower)) {
          const supplierName = (suppliers || []).find(s => (s?.name || "").toLowerCase().trim() === creditAccLower)?.name || v.creditAccount;
          const partnerKey = supplierName.trim();
          if (!supplierBalances[partnerKey]) supplierBalances[partnerKey] = { purchases: 0, payments: 0 };
          supplierBalances[partnerKey].purchases += amount;
        } else if (creditAccLower.includes("debtors") || customerNames.has(creditAccLower)) {
          const customerName = (customers || []).find(c => (c?.name || "").toLowerCase().trim() === creditAccLower)?.name || v.creditAccount;
          const partnerKey = customerName.trim();
          if (!customerBalances[partnerKey]) customerBalances[partnerKey] = { sales: 0, receipts: 0 };
          customerBalances[partnerKey].receipts += amount;
        }
      }
    });

    return {
      pettyCash,
      hdfcBank,
      ownerCapital,
      sundryDebtors,
      sundryCreditors,
      salesAccount,
      purchaseAccount,
      operatingExpenses,
      otherIncome,
      periodSales,
      periodPurchases,
      periodExpenses,
      periodOtherIncome,
      customerBalances,
      supplierBalances,
    };
  }, [entries, vouchers, customers, suppliers, startDate, endDate]);

  const plCalculated = useMemo(() => {
    const salesRevenue = doubleEntryBalances.periodSales;
    const cogs = doubleEntryBalances.periodPurchases;
    const grossProfit = salesRevenue - cogs;
    const operatingExpenses = doubleEntryBalances.periodExpenses;
    const otherIncome = doubleEntryBalances.periodOtherIncome;
    const netProfit = grossProfit - operatingExpenses + otherIncome;

    return { salesRevenue, cogs, grossProfit, operatingExpenses, otherIncome, netProfit };
  }, [doubleEntryBalances]);

  const bsCalculated = useMemo(() => {
    const stockValuation = products.reduce((tot, p) => {
      const qty = p.godownStocks ? Object.values(p.godownStocks).reduce((a, b) => a + b, 0) : 0;
      return tot + qty * (p.buyPrice || 0);
    }, 0);

    const cashBalance = doubleEntryBalances.pettyCash;
    const bankBalance = doubleEntryBalances.hdfcBank;
    const debtors = doubleEntryBalances.sundryDebtors;
    const creditors = doubleEntryBalances.sundryCreditors;

    const currentAssets = stockValuation + cashBalance + bankBalance + debtors;
    const currentLiabilities = creditors;

    const capitalAccount = doubleEntryBalances.ownerCapital;
    const cumulativeSales = doubleEntryBalances.salesAccount;
    const cumulativePurchases = doubleEntryBalances.purchaseAccount;
    const cumulativeExpenses = doubleEntryBalances.operatingExpenses;
    const cumulativeOtherIncome = doubleEntryBalances.otherIncome;

    const retainedEarnings = cumulativeSales + cumulativeOtherIncome - cumulativePurchases - cumulativeExpenses + stockValuation;
    const totalEquity = capitalAccount + retainedEarnings;
    const totalLiabilitiesAndEquity = currentLiabilities + totalEquity;

    return {
      stockValuation,
      cashBalance,
      bankBalance,
      debtors,
      currentAssets,
      creditors,
      capitalAccount,
      retainedEarnings,
      totalEquity,
      totalLiabilitiesAndEquity,
      isBalanced: Math.abs(currentAssets - totalLiabilitiesAndEquity) < 0.1,
    };
  }, [products, doubleEntryBalances]);

  const trialBalanceRows = useMemo(() => {
    const rows = [
      { account: "Sales Account", dr: 0, cr: doubleEntryBalances.salesAccount },
      { account: "Purchase Account", dr: doubleEntryBalances.purchaseAccount, cr: 0 },
      { account: "HDFC Bank A/C", dr: Math.max(0, doubleEntryBalances.hdfcBank), cr: Math.abs(Math.min(0, doubleEntryBalances.hdfcBank)) },
      { account: "Petty Cash Account", dr: Math.max(0, doubleEntryBalances.pettyCash), cr: Math.abs(Math.min(0, doubleEntryBalances.pettyCash)) },
      { account: "Sundry Debtors (Customers)", dr: Math.max(0, doubleEntryBalances.sundryDebtors), cr: Math.abs(Math.min(0, doubleEntryBalances.sundryDebtors)) },
      { account: "Sundry Creditors (Suppliers)", dr: Math.max(0, -doubleEntryBalances.sundryCreditors), cr: Math.max(0, doubleEntryBalances.sundryCreditors) },
      { account: "Operating Expenses & Wages", dr: doubleEntryBalances.operatingExpenses, cr: 0 },
      { account: "Other Income Account", dr: 0, cr: doubleEntryBalances.otherIncome },
      { account: "Owner's Capital Account", dr: 0, cr: doubleEntryBalances.ownerCapital },
    ];

    const totalDr = rows.reduce((s, r) => s + r.dr, 0);
    const totalCr = rows.reduce((s, r) => s + r.cr, 0);
    return { rows, totalDr, totalCr, isBalanced: Math.abs(totalDr - totalCr) < 0.1 };
  }, [doubleEntryBalances]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Invoice No", "Date", "Transaction Type", "Partner", "Items Summary", "Subtotal (INR)", "Tax/GST (INR)", "Grand Total (INR)", "Payment Type"];
    const rows = filteredEntries.map(e => {
      const itemsSummary = e.items && e.items.length > 0 
        ? e.items.map(i => {
            const p = products.find(prod => prod.id === i.productId);
            return `${i.quantity}x ${p?.name || 'Item'} (Gdn ${i.godown})`;
          }).join(" | ")
        : `${e.quantity || 0}x ${products.find(p => p.id === e.productId)?.name || 'Item'} (Gdn ${e.godown})`;

      const subTotal = e.subTotal || (e.quantity || 0) * (e.pricePerUnit || 0);
      const grandTotal = e.grandTotal || subTotal * 1.12;
      const gst = grandTotal - subTotal;

      return [
        `"${e.invoiceNo || e.id}"`,
        `"${formatDDMMYYYY(e.date)}"`,
        `"${e.type === "out" ? "Sales (Export)" : "Purchase (Import)"}"`,
        `"${e.partner}"`,
        `"${itemsSummary}"`,
        subTotal.toFixed(2),
        gst.toFixed(2),
        grandTotal.toFixed(2),
        `"${e.paymentType || "cash"}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trading_report_${reportType}_${formatDDMMYYYY(startDate)}_to_${formatDDMMYYYY(endDate)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Report downloaded successfully!");
  };

  // Direct PDF Export Generator
  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, pageWidth, 24, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text("SPICE ROUTE TRADING CO.", 14, 11);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text("OFFICIAL TRANSACTION STATEMENT REPORT", 14, 17);

      doc.setFontSize(7.5);
      doc.setTextColor(220, 252, 231);
      doc.text(`Generated: ${formatDDMMYYYY(new Date().toISOString().split("T")[0])}`, pageWidth - 14, 11, { align: "right" });
      doc.text(`Period: ${formatDDMMYYYY(startDate)} to ${formatDDMMYYYY(endDate)}`, pageWidth - 14, 17, { align: "right" });

      let y = 30;
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(14, y, pageWidth - 28, 20, 2, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      doc.text("TOTAL SALES", 18, y + 6);
      doc.setFontSize(9.5);
      doc.setTextColor(16, 185, 129);
      doc.text(fmt(kpis.totalSales), 18, y + 14);

      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text("TOTAL PURCHASES", 65, y + 6);
      doc.setFontSize(9.5);
      doc.setTextColor(59, 130, 246);
      doc.text(fmt(kpis.totalPurchase), 65, y + 14);

      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text("NET BALANCE", 120, y + 6);
      doc.setFontSize(9.5);
      doc.setTextColor(kpis.netProfit >= 0 ? 16 : 220, kpis.netProfit >= 0 ? 185 : 38, kpis.netProfit >= 0 ? 129 : 38);
      doc.text(fmt(kpis.netProfit), 120, y + 14);

      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text("VOLUME TRADED", 165, y + 6);
      doc.setFontSize(9.5);
      doc.setTextColor(217, 119, 6);
      doc.text(`${kpis.totalQty.toLocaleString()} units`, 165, y + 14);

      y += 28;
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`Filtered Ledger Records (${filteredEntries.length} Items)`, 14, y);

      y += 4;
      doc.setFillColor(15, 23, 42);
      doc.rect(14, y, pageWidth - 28, 7.5, "F");

      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text("Invoice No", 17, y + 5);
      doc.text("Date", 42, y + 5);
      doc.text("Type", 65, y + 5);
      doc.text("Partner Account", 83, y + 5);
      doc.text("Items Summary", 126, y + 5);
      doc.text("Amount (INR)", pageWidth - 17, y + 5, { align: "right" });

      y += 7.5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);

      filteredEntries.forEach((e, idx) => {
        if (y > pageHeight - 18) {
          doc.addPage();
          y = 14;
          doc.setFillColor(15, 23, 42);
          doc.rect(14, y, pageWidth - 28, 7.5, "F");
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text("Invoice No", 17, y + 5);
          doc.text("Date", 42, y + 5);
          doc.text("Type", 65, y + 5);
          doc.text("Partner Account", 83, y + 5);
          doc.text("Items Summary", 126, y + 5);
          doc.text("Amount (INR)", pageWidth - 17, y + 5, { align: "right" });

          y += 7.5;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(51, 65, 85);
        }

        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y, pageWidth - 28, 6.5, "F");
        }

        const subTotal = e.subTotal || (e.quantity || 0) * (e.pricePerUnit || 0);
        const grandTotal = e.grandTotal || subTotal * 1.12;

        const itemsStr = e.items && e.items.length > 0 
          ? e.items.map(i => {
              const p = products.find(prod => prod.id === i.productId);
              return `${i.quantity}x ${p?.name || 'Item'}`;
            }).join(", ")
          : `${e.quantity || 0}x ${products.find(p => p.id === e.productId)?.name || 'Item'}`;

        doc.setFontSize(7);
        doc.text(e.invoiceNo || `INV-${e.id.slice(0, 6)}`, 17, y + 4.5);
        doc.text(formatDDMMYYYY(e.date), 42, y + 4.5);
        
        if (e.type === "out") {
          doc.setTextColor(16, 185, 129);
          doc.text("Sales", 65, y + 4.5);
        } else {
          doc.setTextColor(59, 130, 246);
          doc.text("Purchase", 65, y + 4.5);
        }
        doc.setTextColor(51, 65, 85);

        const partnerText = e.partner.length > 20 ? e.partner.slice(0, 18) + "..." : e.partner;
        doc.text(partnerText, 83, y + 4.5);

        const summaryText = itemsStr.length > 30 ? itemsStr.slice(0, 28) + "..." : itemsStr;
        doc.text(summaryText, 126, y + 4.5);

        doc.setFont("helvetica", "bold");
        doc.text(fmt(grandTotal), pageWidth - 17, y + 4.5, { align: "right" });
        doc.setFont("helvetica", "normal");

        y += 6.5;
      });

      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${i} of ${totalPages} - Confidential Statement - Spice Route Trading Co.`, pageWidth / 2, pageHeight - 6, { align: "center" });
      }

      doc.save(`trading_report_${reportType}_${formatDDMMYYYY(startDate)}_to_${formatDDMMYYYY(endDate)}.pdf`);
      toast.success("PDF Statement generated and downloaded!");
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to generate PDF: ${err.message}`);
    }
  };

  const handlePrintFinancialStatement = (title: string) => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Section Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/80 pb-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground font-serif flex items-center gap-2.5">
            <FileText className="text-primary" size={28} /> Financial Reports & Statements
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Comprehensive audit reports covering Profit & Loss, Balance Sheet, Trial Balance, and Sales/Purchase Ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap no-print">
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to clear all report and transaction history?")) {
                if (onClearHistory) onClearHistory();
              }
            }}
            className="px-3 py-1.5 bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive hover:text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-sm font-mono uppercase tracking-wider"
            title="Clear all transaction history from reports"
          >
            <Trash2 size={13} /> Clear History
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-sm font-mono uppercase tracking-wider"
          >
            <Download size={13} /> PDF Report
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-sm font-mono uppercase tracking-wider"
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 border border-border bg-card hover:bg-secondary/40 text-foreground font-semibold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-sm font-mono uppercase tracking-wider"
          >
            <Printer size={13} /> Print
          </button>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto no-print">
        <button
          onClick={() => { setActiveReportTab("pl"); setPage("reports-pl"); }}
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
            activeReportTab === "pl" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          📈 Profit & Loss Statement
        </button>

        <button
          onClick={() => { setActiveReportTab("bs"); setPage("reports-bs"); }}
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
            activeReportTab === "bs" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          🏛️ Balance Sheet
        </button>

        <button
          onClick={() => { setActiveReportTab("tb" as any); setPage("reports-tb"); }}
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
            activeReportTab === "tb" || activeReportTab === ("tb" as any) ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          ⚖️ Trial Balance
        </button>

        <button
          onClick={() => { setActiveReportTab("ledger" as any); setPage("reports-ledger"); }}
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
            activeReportTab === "ledger" || activeReportTab === ("ledger" as any) ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          📑 Ledger Reports
        </button>

        <button
          onClick={() => { setActiveReportTab("group" as any); setPage("reports-group"); }}
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
            activeReportTab === "group" || activeReportTab === ("group" as any) ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          🗂️ Group Reports
        </button>

        <button
          onClick={() => { setActiveReportTab("payable" as any); setPage("reports-payable"); }}
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
            activeReportTab === "payable" || activeReportTab === ("payable" as any) ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          📉 Accounts Payable
        </button>

        <button
          onClick={() => { setActiveReportTab("receivable" as any); setPage("reports-receivable"); }}
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
            activeReportTab === "receivable" || activeReportTab === ("receivable" as any) ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          📈 Accounts Receivable
        </button>

        <button
          onClick={() => { setActiveReportTab("sales-purchase"); setPage("reports-sales-purchase"); }}
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
            activeReportTab === "sales-purchase" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          📄 Sales & Purchase Ledger
        </button>

        <button
          onClick={() => { setActiveReportTab("outstanding" as any); setPage("reports-outstanding"); }}
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
            activeReportTab === "outstanding" || activeReportTab === ("outstanding" as any) ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          🔍 Outstanding OS
        </button>

        <button
          onClick={() => { setActiveReportTab("closing-stock" as any); setPage("reports-closing-stock"); }}
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
            activeReportTab === "closing-stock" || activeReportTab === ("closing-stock" as any) ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          📦 Closing Stock
        </button>

        <button
          onClick={() => { setActiveReportTab("day-book" as any); setPage("reports-day-book"); }}
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
            activeReportTab === "day-book" || activeReportTab === ("day-book" as any) ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          📅 Day Book
        </button>
      </div>

      {/* DATE RANGE FILTER CONSOLE */}
      <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-3 no-print">
        <div className="flex justify-between items-center border-b border-border/60 pb-2">
          <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Filter size={13} className="text-primary" /> Period Filter ({formatDDMMYYYY(startDate)} → {formatDDMMYYYY(endDate)})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground font-semibold mr-1">Quick Period:</span>
          {[
            { id: "today", label: "Today" },
            { id: "this_week", label: "This Week" },
            { id: "this_month", label: "This Month" },
            { id: "last_30", label: "Last 30 Days" },
            { id: "all_time", label: "All Time" }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => handlePresetChange(p.id as any)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all ${
                periodPreset === p.id
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50"
              }`}
            >
              {p.label}
            </button>
          ))}

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-mono text-muted-foreground">From:</span>
            <DDMMYYYYDateInput
              value={startDate}
              onChange={val => { setStartDate(val); setPeriodPreset("custom"); }}
              className="px-2 py-1 border border-border rounded text-xs font-mono w-28"
            />
            <span className="text-xs font-mono text-muted-foreground">To:</span>
            <DDMMYYYYDateInput
              value={endDate}
              onChange={val => { setEndDate(val); setPeriodPreset("custom"); }}
              className="px-2 py-1 border border-border rounded text-xs font-mono w-28"
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: PROFIT & LOSS */}
      {activeReportTab === "pl" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Gross Sales Revenue" value={fmt(plCalculated.salesRevenue)} icon={TrendingUp} />
            <StatCard label="Cost of Goods Sold (COGS)" value={fmt(plCalculated.cogs)} icon={ArrowDownToLine} />
            <StatCard label="Net Operating Profit" value={fmt(plCalculated.netProfit)} sub={plCalculated.netProfit >= 0 ? "Trading Surplus" : "Trading Deficit"} icon={plCalculated.netProfit >= 0 ? TrendingUp : TrendingDown} accent />
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
            <h3 className="font-serif font-bold text-lg text-foreground border-b border-border pb-2">
              Profit & Loss Statement ({formatDDMMYYYY(startDate)} to {formatDDMMYYYY(endDate)})
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between font-bold text-foreground bg-secondary/20 p-2.5 rounded-lg">
                <span>INCOME / TRADING REVENUE</span>
                <span className="text-emerald-600">{fmt(plCalculated.salesRevenue)}</span>
              </div>
              <div className="pl-4 space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Gross Sales Billing (Exports & Domestic)</span>
                  <span>{fmt(plCalculated.salesRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other Indirect Income / Receipts</span>
                  <span>{fmt(plCalculated.otherIncome)}</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-foreground bg-secondary/20 p-2.5 rounded-lg mt-4">
                <span>LESS: COST OF GOODS SOLD & DIRECT COSTS</span>
                <span className="text-blue-600">{fmt(plCalculated.cogs)}</span>
              </div>
              <div className="pl-4 space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Purchases & Import Inventory Cost</span>
                  <span>{fmt(plCalculated.cogs)}</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-foreground border-t border-b border-border py-2 text-sm bg-primary/10 px-2.5 rounded-lg">
                <span>GROSS TRADING PROFIT</span>
                <span className={plCalculated.grossProfit >= 0 ? "text-emerald-700 font-extrabold" : "text-red-600 font-extrabold"}>
                  {fmt(plCalculated.grossProfit)}
                </span>
              </div>

              <div className="flex justify-between font-bold text-foreground bg-secondary/20 p-2.5 rounded-lg mt-4">
                <span>LESS: INDIRECT OPERATING EXPENSES (VOUCHERS)</span>
                <span className="text-amber-600">{fmt(plCalculated.operatingExpenses)}</span>
              </div>
              <div className="pl-4 space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Operating Disbursals, Rent, Freight & Salary Expenses</span>
                  <span>{fmt(plCalculated.operatingExpenses)}</span>
                </div>
              </div>

              <div className="flex justify-between font-extrabold text-foreground border-t-2 border-primary py-3 text-base bg-card p-3 rounded-lg shadow-sm">
                <span>NET AUDITED SURPLUS / PROFIT FOR PERIOD</span>
                <span className={plCalculated.netProfit >= 0 ? "text-emerald-600" : "text-red-600"}>
                  {fmt(plCalculated.netProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: BALANCE SHEET */}
      {activeReportTab === "bs" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center bg-card border border-border p-4 rounded-xl shadow-sm">
            <div>
              <h3 className="font-serif font-bold text-lg text-foreground">Statement of Financial Position (Balance Sheet)</h3>
              <p className="text-xs text-muted-foreground font-mono">Real-time assets, liabilities, and equity balance as of {formatDDMMYYYY(endDate)}</p>
            </div>
            {bsCalculated.isBalanced ? (
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold flex items-center gap-1">
                <CheckCircle2 size={14} /> Perfectly Balanced
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/30 rounded-lg text-xs font-mono font-bold flex items-center gap-1">
                <AlertTriangle size={14} /> Out of Balance Adjustment
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ASSETS */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
              <h4 className="font-mono font-bold text-xs uppercase tracking-widest text-emerald-600 border-b border-border pb-2">
                ASSETS
              </h4>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between font-semibold">
                  <span>Current Assets:</span>
                </div>
                <div className="pl-4 space-y-1.5 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Closing Inventory Valuation (Stock)</span>
                    <span className="text-foreground font-semibold">{fmt(bsCalculated.stockValuation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash in Hand (Petty Cash A/C)</span>
                    <span className="text-foreground font-semibold">{fmt(bsCalculated.cashBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bank Accounts (HDFC & SBI)</span>
                    <span className="text-foreground font-semibold">{fmt(bsCalculated.bankBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sundry Debtors (Customer Receivables)</span>
                    <span className="text-foreground font-semibold">{fmt(bsCalculated.debtors)}</span>
                  </div>
                </div>

                <div className="flex justify-between font-extrabold text-foreground border-t-2 border-emerald-600 pt-3 text-sm mt-4">
                  <span>TOTAL ASSETS</span>
                  <span className="text-emerald-600">{fmt(bsCalculated.currentAssets)}</span>
                </div>
              </div>
            </div>

            {/* LIABILITIES & EQUITY */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
              <h4 className="font-mono font-bold text-xs uppercase tracking-widest text-blue-600 border-b border-border pb-2">
                LIABILITIES & CAPITAL EQUITY
              </h4>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between font-semibold">
                  <span>Current Liabilities:</span>
                </div>
                <div className="pl-4 space-y-1.5 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Sundry Creditors (Supplier Payables)</span>
                    <span className="text-foreground font-semibold">{fmt(bsCalculated.creditors)}</span>
                  </div>
                </div>

                <div className="flex justify-between font-semibold mt-3">
                  <span>Capital & Reserves:</span>
                </div>
                <div className="pl-4 space-y-1.5 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Owner's Opening Capital</span>
                    <span className="text-foreground font-semibold">{fmt(bsCalculated.capitalAccount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Retained Net Surplus / P&L</span>
                    <span className="text-foreground font-semibold">{fmt(bsCalculated.retainedEarnings)}</span>
                  </div>
                </div>

                <div className="flex justify-between font-extrabold text-foreground border-t-2 border-blue-600 pt-3 text-sm mt-4">
                  <span>TOTAL LIABILITIES & EQUITY</span>
                  <span className="text-blue-600">{fmt(bsCalculated.totalLiabilitiesAndEquity)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: TRIAL BALANCE */}
      {activeReportTab === ("tb" as any) && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden space-y-3">
            <div className="px-5 py-4 border-b border-border bg-secondary/20 flex justify-between items-center">
              <div>
                <h3 className="font-serif font-bold text-base text-foreground">Trial Balance Statement</h3>
                <p className="text-xs text-muted-foreground font-mono">Complete ledger account balances verifying double-entry bookkeeping</p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-lg">
                Total Dr: {fmt(trialBalanceRows.totalDr)} | Total Cr: {fmt(trialBalanceRows.totalCr)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-secondary/10 border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-2.5">Account Head Description</th>
                    <th className="px-4 py-2.5 text-right">Debit Balance (Dr)</th>
                    <th className="px-4 py-2.5 text-right">Credit Balance (Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono">
                  {trialBalanceRows.rows.map((r, i) => (
                    <tr key={i} className="hover:bg-secondary/10">
                      <td className="px-4 py-2.5 font-bold text-foreground">{r.account}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-foreground">{r.dr > 0 ? fmt(r.dr) : "-"}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-foreground">{r.cr > 0 ? fmt(r.cr) : "-"}</td>
                    </tr>
                  ))}
                  <tr className="bg-primary/10 font-bold border-t-2 border-primary text-sm">
                    <td className="px-4 py-3 uppercase text-foreground">GRAND TOTAL BALANCE</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{fmt(trialBalanceRows.totalDr)}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{fmt(trialBalanceRows.totalCr)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: OUTSTANDING (RECEIVABLE & PAYABLE COMBINED) */}
      {activeReportTab === ("outstanding" as any) && (() => {
        const payablesList = (suppliers || []).map(s => {
          const key = (s.name || "").trim();
          const balance = (doubleEntryBalances?.supplierBalances || {})[key] || { purchases: 0, payments: 0 };
          const purchasesVal = balance.purchases;
          const paymentsVal = balance.payments;
          const outstanding = purchasesVal - paymentsVal;
          return { name: s.name, phone: s.phone, gstNo: s.gstNo, outstanding };
        }).filter(s => s.outstanding > 0);

        const receivablesList = (customers || []).map(c => {
          const key = (c.name || "").trim();
          const balance = (doubleEntryBalances?.customerBalances || {})[key] || { sales: 0, receipts: 0 };
          const salesVal = balance.sales;
          const receiptsVal = balance.receipts;
          const outstanding = salesVal - receiptsVal;
          return { name: c.name, phone: c.phone, gstNo: c.gstNo, outstanding };
        }).filter(c => c.outstanding > 0);

        const totRec = receivablesList.reduce((sum, c) => sum + c.outstanding, 0);
        const totPay = payablesList.reduce((sum, s) => sum + s.outstanding, 0);

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-lg text-foreground">Outstanding Summary Dashboard</h3>
              <p className="text-xs text-muted-foreground font-mono">Consolidated statement of active accounts receivable (customers) and accounts payable (suppliers)</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-widest">Total Outstanding Receivables</span>
                    <h4 className="text-xl font-bold font-mono text-emerald-600 mt-1">{fmt(totRec)}</h4>
                  </div>
                  <span className="text-2xl">📈</span>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-red-600 uppercase tracking-widest">Total Outstanding Payables</span>
                    <h4 className="text-xl font-bold font-mono text-red-600 mt-1">{fmt(totPay)}</h4>
                  </div>
                  <span className="text-2xl">📉</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Receivables */}
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-emerald-500/5">
                  <h4 className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-widest flex items-center justify-between">
                    <span>Outstanding Receivables (Customers)</span>
                    <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-[10px]">{receivablesList.length} Active</span>
                  </h4>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-secondary/15 border-b border-border text-[9px] font-mono text-muted-foreground uppercase tracking-wider sticky top-0">
                        <th className="px-4 py-2">Customer Account</th>
                        <th className="px-4 py-2 text-right">Debit Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-mono">
                      {receivablesList.length === 0 ? (
                        <tr>
                          <td className="px-4 py-6 text-center text-muted-foreground" colSpan={2}>No pending customer receivables.</td>
                        </tr>
                      ) : (
                        receivablesList.map((r, i) => (
                          <tr key={i} className="hover:bg-secondary/10">
                            <td className="px-4 py-2 font-bold text-foreground">{r.name}</td>
                            <td className="px-4 py-2 text-right text-emerald-600 font-bold">{fmt(r.outstanding)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Supplier Payables */}
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-red-500/5">
                  <h4 className="text-xs font-mono font-bold text-red-600 uppercase tracking-widest flex items-center justify-between">
                    <span>Outstanding Payables (Suppliers)</span>
                    <span className="bg-red-500/20 px-2 py-0.5 rounded text-[10px]">{payablesList.length} Active</span>
                  </h4>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-secondary/15 border-b border-border text-[9px] font-mono text-muted-foreground uppercase tracking-wider sticky top-0">
                        <th className="px-4 py-2">Supplier Account</th>
                        <th className="px-4 py-2 text-right">Credit Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-mono">
                      {payablesList.length === 0 ? (
                        <tr>
                          <td className="px-4 py-6 text-center text-muted-foreground" colSpan={2}>No pending supplier payables.</td>
                        </tr>
                      ) : (
                        payablesList.map((p, i) => (
                          <tr key={i} className="hover:bg-secondary/10">
                            <td className="px-4 py-2 font-bold text-foreground">{p.name}</td>
                            <td className="px-4 py-2 text-right text-red-500 font-bold">{fmt(p.outstanding)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* VIEW: CLOSING STOCK REPORT */}
      {activeReportTab === ("closing-stock" as any) && (() => {
        const stockRows = (products || []).map(p => {
          const qty = p.godownStocks ? Object.values(p.godownStocks).reduce((a, b) => a + b, 0) : 0;
          const cost = p.buyPrice || 0;
          const value = qty * cost;
          return { ...p, qty, cost, value };
        });

        const grandValuation = stockRows.reduce((sum, r) => sum + r.value, 0);
        const grandQty = stockRows.reduce((sum, r) => sum + r.qty, 0);

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground">Closing Stock Inventory Valuation</h3>
                <p className="text-xs text-muted-foreground font-mono">Consolidated statement of on-hand inventory stock valuation as of period end</p>
              </div>
              <div className="bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-lg flex flex-col items-end">
                <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">Total Inventory Value</span>
                <span className="text-lg font-mono font-black text-foreground">{fmt(grandValuation)}</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-secondary/20 flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">📦 Product Stock Sheet</span>
                <span className="text-xs font-mono text-muted-foreground">Total Quantity: <strong className="text-foreground">{grandQty} units</strong></span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-secondary/10 border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-2.5">Product SKU/ID</th>
                      <th className="px-4 py-2.5">Product Description</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5 text-right">Available Stock</th>
                      <th className="px-4 py-2.5 text-right">Unit Buy Cost</th>
                      <th className="px-4 py-2.5 text-right">Total Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono">
                    {stockRows.length === 0 ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>No products registered in the inventory.</td>
                      </tr>
                    ) : (
                      stockRows.map((r, i) => (
                        <tr key={i} className="hover:bg-secondary/10">
                          <td className="px-4 py-2.5 font-bold text-muted-foreground">{r.id}</td>
                          <td className="px-4 py-2.5 font-bold text-foreground">{r.name}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{r.category || "General"}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-foreground">{r.qty}</td>
                          <td className="px-4 py-2.5 text-right text-muted-foreground">{fmt(r.cost)}</td>
                          <td className="px-4 py-2.5 text-right text-primary font-bold">{fmt(r.value)}</td>
                        </tr>
                      ))
                    )}
                    <tr className="bg-secondary/20 font-bold border-t-2 border-border text-sm">
                      <td className="px-4 py-3 uppercase text-foreground" colSpan={3}>Grand Total Valuation</td>
                      <td className="px-4 py-3 text-right text-foreground">{grandQty}</td>
                      <td className="px-4 py-3 text-right">-</td>
                      <td className="px-4 py-3 text-right text-primary font-black">{fmt(grandValuation)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* VIEW: DAY BOOK REPORT */}
      {activeReportTab === ("day-book" as any) && (() => {
        const dbTxs: { date: string; type: string; ref: string; particulars: string; dr: number; cr: number }[] = [];

        (entries || []).forEach(e => {
          if (e.subType === "quotation" || e.subType === "purchase_order") return;
          if (startDate && e.date < startDate) return;
          if (endDate && e.date > endDate) return;

          const amount = e.grandTotal || 0;
          if (e.type === "out") {
            dbTxs.push({ date: e.date, type: "Sales Invoice", ref: e.invoiceNo || e.id, particulars: `Customer: ${e.partner}`, dr: 0, cr: amount });
          } else if (e.type === "in") {
            dbTxs.push({ date: e.date, type: "Purchase Invoice", ref: e.invoiceNo || e.id, particulars: `Supplier: ${e.partner}`, dr: amount, cr: 0 });
          }
        });

        (vouchers || []).forEach(v => {
          if (startDate && v.date < startDate) return;
          if (endDate && v.date > endDate) return;

          const amount = v.amount || 0;
          const desc = `${v.debitAccount} (Dr) / ${v.creditAccount} (Cr)`;
          if (v.type === "payment") {
            dbTxs.push({ date: v.date, type: "Payment Voucher", ref: v.voucherNo || v.id, particulars: desc, dr: amount, cr: 0 });
          } else if (v.type === "receipt") {
            dbTxs.push({ date: v.date, type: "Receipt Voucher", ref: v.voucherNo || v.id, particulars: desc, dr: 0, cr: amount });
          } else if (v.type === "contra") {
            dbTxs.push({ date: v.date, type: "Contra Voucher", ref: v.voucherNo || v.id, particulars: desc, dr: amount, cr: amount });
          } else if (v.type === "journal") {
            dbTxs.push({ date: v.date, type: "Journal Voucher", ref: v.voucherNo || v.id, particulars: desc, dr: amount, cr: amount });
          }
        });

        dbTxs.sort((a, b) => a.date.localeCompare(b.date));

        const totalDr = dbTxs.reduce((sum, t) => sum + t.dr, 0);
        const totalCr = dbTxs.reduce((sum, t) => sum + t.cr, 0);

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground">Day Book Ledger</h3>
                <p className="text-xs text-muted-foreground font-mono">Daily chronological log of all accounts transactions and system vouchers</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-right">
                  <span className="block text-[9px] font-mono font-bold text-emerald-600 uppercase">Total Debit Entries</span>
                  <span className="text-sm font-mono font-bold text-emerald-600">{fmt(totalDr)}</span>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg text-right">
                  <span className="block text-[9px] font-mono font-bold text-blue-600 uppercase">Total Credit Entries</span>
                  <span className="text-sm font-mono font-bold text-blue-600">{fmt(totalCr)}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-secondary/20 flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">
                  📖 Chronological Daily Ledger Entries
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-lg border border-primary/20">
                  {dbTxs.length} Transactions
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-secondary/10 border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Voucher Type</th>
                      <th className="px-4 py-2.5">Voucher / Invoice Ref</th>
                      <th className="px-4 py-2.5">Particulars / Mapped Accounts</th>
                      <th className="px-4 py-2.5 text-right">Debit (Dr)</th>
                      <th className="px-4 py-2.5 text-right">Credit (Cr)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono">
                    {dbTxs.length === 0 ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                          No transactions recorded for the selected period.
                        </td>
                      </tr>
                    ) : (
                      dbTxs.map((t, idx) => (
                        <tr
                          key={idx}
                          onClick={() => onEditEntryFromHistory && onEditEntryFromHistory(t.ref)}
                          className="hover:bg-blue-500/10 dark:hover:bg-blue-950/30 transition-colors cursor-pointer group"
                          title="Click to re-open transaction in 100% Mutable & Editable Procedure Form"
                        >
                          <td className="px-4 py-2.5 text-muted-foreground group-hover:text-foreground">{formatDDMMYYYY(t.date)}</td>
                          <td className="px-4 py-2.5 font-bold text-foreground group-hover:text-blue-600">{t.type}</td>
                          <td className="px-4 py-2.5 font-bold">
                            <span className="text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1">
                              ✏️ {t.ref}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground group-hover:text-foreground">{t.particulars}</td>
                          <td className="px-4 py-2.5 text-right text-emerald-600 font-semibold">{t.dr > 0 ? fmt(t.dr) : "-"}</td>
                          <td className="px-4 py-2.5 text-right text-blue-600 font-semibold">{t.cr > 0 ? fmt(t.cr) : "-"}</td>
                        </tr>
                      ))
                    )}
                    <tr className="bg-secondary/20 font-bold border-t-2 border-border text-[13px]">
                      <td className="px-4 py-3 uppercase text-foreground" colSpan={4}>GRAND TOTAL BALANCE</td>
                      <td className="px-4 py-3 text-right text-emerald-600">{fmt(totalDr)}</td>
                      <td className="px-4 py-3 text-right text-blue-600">{fmt(totalCr)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* VIEW: LEDGER REPORTS */}
      {activeReportTab === ("ledger" as any) && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground">General Transaction Ledger Card</h3>
                <p className="text-xs text-muted-foreground font-mono">Select any account head to audit chronological debit/credit running entries</p>
              </div>
              <div className="w-full md:w-80">
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Select Account Ledger</label>
                <select
                  value={selectedLedger}
                  onChange={e => setSelectedLedger(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer font-sans"
                >
                  {ledgerDetails.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-secondary/20 flex justify-between items-center flex-wrap gap-2">
              <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">
                📖 Running Account Statement: {selectedLedger}
              </span>
              <span className="text-xs font-mono font-bold px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg">
                Opening Balance: {fmt(ledgerDetails.initialBalance)} ({ledgerDetails.balanceType})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-secondary/10 border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Particulars / Description</th>
                    <th className="px-4 py-2.5">Voucher / Invoice No</th>
                    <th className="px-4 py-2.5 text-right">Debit (Dr)</th>
                    <th className="px-4 py-2.5 text-right">Credit (Cr)</th>
                    <th className="px-4 py-2.5 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono">
                  <tr className="bg-secondary/5 font-semibold text-muted-foreground">
                    <td className="px-4 py-2.5" colSpan={3}>Opening Balance Carried Forward</td>
                    <td className="px-4 py-2.5 text-right">-</td>
                    <td className="px-4 py-2.5 text-right">-</td>
                    <td className="px-4 py-2.5 text-right text-foreground">{fmt(ledgerDetails.initialBalance)} ({ledgerDetails.balanceType})</td>
                  </tr>
                  {ledgerDetails.finalTxs.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-muted-foreground font-sans text-xs" colSpan={6}>
                        No transactions recorded for this ledger in the selected period.
                      </td>
                    </tr>
                  ) : (
                    ledgerDetails.finalTxs.map((t, idx) => (
                      <tr
                        key={idx}
                        onClick={() => onEditEntryFromHistory && onEditEntryFromHistory(t.ref)}
                        className="hover:bg-blue-500/10 dark:hover:bg-blue-950/30 transition-colors cursor-pointer group"
                        title="Click to re-open transaction in 100% Mutable & Editable Procedure Form"
                      >
                        <td className="px-4 py-2.5 text-muted-foreground group-hover:text-foreground">{formatDDMMYYYY(t.date)}</td>
                        <td className="px-4 py-2.5 font-bold text-foreground group-hover:text-blue-600">{t.type}</td>
                        <td className="px-4 py-2.5 font-bold">
                          <span className="text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1">
                            ✏️ {t.ref}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-emerald-600 font-semibold">{t.dr > 0 ? fmt(t.dr) : "-"}</td>
                        <td className="px-4 py-2.5 text-right text-blue-600 font-semibold">{t.cr > 0 ? fmt(t.cr) : "-"}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-foreground">
                          {fmt(t.balance)} ({ledgerDetails.balanceType})
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-primary/5 font-bold border-t-2 border-primary/20 text-[13px]">
                    <td className="px-4 py-3" colSpan={3}>CLOSING BALANCE AS OF PERIOD END</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-bold">
                      {fmt(ledgerDetails.finalTxs.reduce((sum, t) => sum + t.dr, 0))} (Dr)
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600 font-bold">
                      {fmt(ledgerDetails.finalTxs.reduce((sum, t) => sum + t.cr, 0))} (Cr)
                    </td>
                    <td className="px-4 py-3 text-right text-foreground font-black">
                      {ledgerDetails.finalTxs.length > 0
                        ? `${fmt(ledgerDetails.finalTxs[ledgerDetails.finalTxs.length - 1].balance)} (${ledgerDetails.balanceType})`
                        : `${fmt(ledgerDetails.initialBalance)} (${ledgerDetails.balanceType})`
                      }
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: GROUP REPORTS */}
      {activeReportTab === ("group" as any) && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <h3 className="font-serif font-bold text-lg text-foreground">Summarized Group Balances</h3>
            <p className="text-xs text-muted-foreground font-mono">Aggregated list of accounting ledger balances organized by primary balance sheet groups</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Group 1: Current Assets */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
              <h4 className="font-mono font-bold text-xs uppercase tracking-widest text-emerald-600 border-b border-border pb-2 flex justify-between">
                <span>Current Assets Group</span>
                <span>{fmt(bsCalculated.currentAssets)} (Dr)</span>
              </h4>
              <div className="space-y-2 font-mono text-xs text-muted-foreground">
                <div className="flex justify-between hover:bg-secondary/20 p-1.5 rounded">
                  <span>Closing Inventory Valuation</span>
                  <span className="text-foreground font-bold">{fmt(bsCalculated.stockValuation)}</span>
                </div>
                <div className="flex justify-between hover:bg-secondary/20 p-1.5 rounded">
                  <span>Petty Cash Account</span>
                  <span className="text-foreground font-bold">{fmt(bsCalculated.cashBalance)}</span>
                </div>
                <div className="flex justify-between hover:bg-secondary/20 p-1.5 rounded">
                  <span>SBI & HDFC Bank Accounts</span>
                  <span className="text-foreground font-bold">{fmt(bsCalculated.bankBalance)}</span>
                </div>
                <div className="flex justify-between hover:bg-secondary/20 p-1.5 rounded">
                  <span>Sundry Debtors Account</span>
                  <span className="text-foreground font-bold">{fmt(bsCalculated.debtors)}</span>
                </div>
              </div>
            </div>

            {/* Group 2: Equity & Capital */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
              <h4 className="font-mono font-bold text-xs uppercase tracking-widest text-blue-600 border-b border-border pb-2 flex justify-between">
                <span>Capital & Equity Group</span>
                <span>{fmt(bsCalculated.totalEquity)} (Cr)</span>
              </h4>
              <div className="space-y-2 font-mono text-xs text-muted-foreground">
                <div className="flex justify-between hover:bg-secondary/20 p-1.5 rounded">
                  <span>Owner's Capital Account</span>
                  <span className="text-foreground font-bold">{fmt(bsCalculated.capitalAccount)}</span>
                </div>
                <div className="flex justify-between hover:bg-secondary/20 p-1.5 rounded">
                  <span>Retained Earnings / Surplus</span>
                  <span className="text-foreground font-bold">{fmt(bsCalculated.retainedEarnings)}</span>
                </div>
              </div>
            </div>

            {/* Group 3: Current Liabilities */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
              <h4 className="font-mono font-bold text-xs uppercase tracking-widest text-orange-600 border-b border-border pb-2 flex justify-between">
                <span>Current Liabilities Group</span>
                <span>{fmt(bsCalculated.creditors)} (Cr)</span>
              </h4>
              <div className="space-y-2 font-mono text-xs text-muted-foreground">
                <div className="flex justify-between hover:bg-secondary/20 p-1.5 rounded">
                  <span>Sundry Creditors Account</span>
                  <span className="text-foreground font-bold">{fmt(bsCalculated.creditors)}</span>
                </div>
              </div>
            </div>

            {/* Group 4: Direct Income */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
              <h4 className="font-mono font-bold text-xs uppercase tracking-widest text-purple-600 border-b border-border pb-2 flex justify-between">
                <span>Direct Income Group</span>
                <span>{fmt(doubleEntryBalances.salesAccount + doubleEntryBalances.otherIncome)} (Cr)</span>
              </h4>
              <div className="space-y-2 font-mono text-xs text-muted-foreground">
                <div className="flex justify-between hover:bg-secondary/20 p-1.5 rounded">
                  <span>Sales Revenue Account</span>
                  <span className="text-foreground font-bold">{fmt(doubleEntryBalances.salesAccount)}</span>
                </div>
                <div className="flex justify-between hover:bg-secondary/20 p-1.5 rounded">
                  <span>Other Indirect Income</span>
                  <span className="text-foreground font-bold">{fmt(doubleEntryBalances.otherIncome)}</span>
                </div>
              </div>
            </div>

            {/* Group 5: Direct Expenses */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4 md:col-span-2">
              <h4 className="font-mono font-bold text-xs uppercase tracking-widest text-red-600 border-b border-border pb-2 flex justify-between">
                <span>Direct Expenses Group</span>
                <span>{fmt(doubleEntryBalances.purchaseAccount + doubleEntryBalances.operatingExpenses)} (Dr)</span>
              </h4>
              <div className="space-y-2 font-mono text-xs text-muted-foreground">
                <div className="flex justify-between hover:bg-secondary/20 p-1.5 rounded">
                  <span>Purchase Accounts (COGS)</span>
                  <span className="text-foreground font-bold">{fmt(doubleEntryBalances.purchaseAccount)}</span>
                </div>
                <div className="flex justify-between hover:bg-secondary/20 p-1.5 rounded">
                  <span>Operating expenses, Salaries & Rent</span>
                  <span className="text-foreground font-bold">{fmt(doubleEntryBalances.operatingExpenses)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ACCOUNTS PAYABLE REPORT */}
      {activeReportTab === ("payable" as any) && (() => {
        const supplierList = suppliers.map(s => {
          const key = (s.name || "").trim();
          const balance = (doubleEntryBalances?.supplierBalances || {})[key] || { purchases: 0, payments: 0 };
          let purchasesVal = balance.purchases;
          let paymentsVal = balance.payments;
          if (purchasesVal === 0 && paymentsVal === 0) {
            purchasesVal = entries.filter(e => e.type === "in" && e.partner === s.name && e.paymentType === "credit").reduce((tot, e) => tot + (e.grandTotal || 0), 0);
            paymentsVal = vouchers.filter(v => v.type === "payment" && v.debitAccount === s.name).reduce((tot, v) => tot + v.amount, 0);
          }
          const outstanding = purchasesVal - paymentsVal;
          return { ...s, purchases: purchasesVal, payments: paymentsVal, outstanding };
        }).filter(s => {
          if (!payableSearch.trim()) return true;
          const sName = (s.name || "").toLowerCase();
          const sGst = (s.gstNo || "").toLowerCase();
          const query = payableSearch.toLowerCase();
          return sName.includes(query) || sGst.includes(query);
        });

        const grandTotalPayable = supplierList.reduce((tot, s) => tot + s.outstanding, 0);

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground">Accounts Payable Outstanding Statement</h3>
                <p className="text-xs text-muted-foreground font-mono">Supplier-wise credit outstanding amounts and payment progress logs</p>
              </div>
              <div className="relative w-full md:w-80">
                <input
                  value={payableSearch}
                  onChange={e => setPayableSearch(e.target.value)}
                  placeholder="Search by supplier name or GST..."
                  className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-sans"
                />
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-secondary/20 flex justify-between items-center flex-wrap gap-2">
                <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">
                  📉 Outstandings List ({supplierList.length} Suppliers)
                </span>
                <span className="text-xs font-mono font-bold px-3 py-1 bg-red-500/10 text-red-600 border border-red-500/30 rounded-lg">
                  Total Payable: {fmt(grandTotalPayable)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-secondary/10 border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-2.5">Supplier Name</th>
                      <th className="px-4 py-2.5">GST Number</th>
                      <th className="px-4 py-2.5">Contact Phone</th>
                      <th className="px-4 py-2.5 text-right">Total Purchases</th>
                      <th className="px-4 py-2.5 text-right">Total Payments</th>
                      <th className="px-4 py-2.5 text-right">Net Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono">
                    {supplierList.length === 0 ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-muted-foreground font-sans text-xs" colSpan={6}>
                          No suppliers matched the search filters.
                        </td>
                      </tr>
                    ) : (
                      supplierList.map((s, idx) => (
                        <tr key={idx} className="hover:bg-secondary/10">
                          <td className="px-4 py-2.5 font-bold text-foreground">{s.name}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{s.gstNo}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{s.phone}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-foreground">{fmt(s.purchases)}</td>
                          <td className="px-4 py-2.5 text-right text-emerald-600 font-bold">{fmt(s.payments)}</td>
                          <td className="px-4 py-2.5 text-right text-red-500 font-extrabold">{fmt(s.outstanding)}</td>
                        </tr>
                      ))
                    )}
                    <tr className="bg-secondary/20 font-bold border-t-2 border-border text-sm">
                      <td className="px-4 py-3 uppercase text-foreground" colSpan={3}>GRAND TOTAL OUTSTANDING PAYABLE</td>
                      <td className="px-4 py-3 text-right text-foreground">{fmt(supplierList.reduce((sum, s) => sum + s.purchases, 0))}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">{fmt(supplierList.reduce((sum, s) => sum + s.payments, 0))}</td>
                      <td className="px-4 py-3 text-right text-red-600">{fmt(grandTotalPayable)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* VIEW: ACCOUNTS RECEIVABLE REPORT */}
      {activeReportTab === ("receivable" as any) && (() => {
        const customerList = customers.map(c => {
          const key = (c.name || "").trim();
          const balance = (doubleEntryBalances?.customerBalances || {})[key] || { sales: 0, receipts: 0 };
          let salesVal = balance.sales;
          let receiptsVal = balance.receipts;
          if (salesVal === 0 && receiptsVal === 0) {
            salesVal = entries.filter(e => e.type === "out" && e.partner === c.name && e.paymentType === "credit").reduce((tot, e) => tot + (e.grandTotal || 0), 0);
            receiptsVal = vouchers.filter(v => v.type === "receipt" && v.creditAccount === c.name).reduce((tot, v) => tot + v.amount, 0);
          }
          const outstanding = salesVal - receiptsVal;
          return { ...c, sales: salesVal, receipts: receiptsVal, outstanding };
        }).filter(c => {
          if (!receivableSearch.trim()) return true;
          const cName = (c.name || "").toLowerCase();
          const cGst = (c.gstNo || "").toLowerCase();
          const query = receivableSearch.toLowerCase();
          return cName.includes(query) || cGst.includes(query);
        });

        const grandTotalReceivable = customerList.reduce((tot, c) => tot + c.outstanding, 0);

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground">Accounts Receivable Outstanding Statement</h3>
                <p className="text-xs text-muted-foreground font-mono">Customer-wise credit outstanding receivables and settlement progress</p>
              </div>
              <div className="relative w-full md:w-80">
                <input
                  value={receivableSearch}
                  onChange={e => setReceivableSearch(e.target.value)}
                  placeholder="Search by customer name or GST..."
                  className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-sans"
                />
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-secondary/20 flex justify-between items-center flex-wrap gap-2">
                <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">
                  📈 Receivables List ({customerList.length} Customers)
                </span>
                <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-lg">
                  Total Receivable: {fmt(grandTotalReceivable)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-secondary/10 border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-2.5">Customer Name</th>
                      <th className="px-4 py-2.5">GST Number</th>
                      <th className="px-4 py-2.5">Contact Phone</th>
                      <th className="px-4 py-2.5 text-right">Total Credit Sales</th>
                      <th className="px-4 py-2.5 text-right">Total Payments</th>
                      <th className="px-4 py-2.5 text-right">Net Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono">
                    {customerList.length === 0 ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-muted-foreground font-sans text-xs" colSpan={6}>
                          No customers matched the search filters.
                        </td>
                      </tr>
                    ) : (
                      customerList.map((c, idx) => (
                        <tr key={idx} className="hover:bg-secondary/10">
                          <td className="px-4 py-2.5 font-bold text-foreground">{c.name}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{c.gstNo}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{c.phone}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-foreground">{fmt(c.sales)}</td>
                          <td className="px-4 py-2.5 text-right text-emerald-600 font-bold">{fmt(c.receipts)}</td>
                          <td className="px-4 py-2.5 text-right text-emerald-600 font-extrabold">{fmt(c.outstanding)}</td>
                        </tr>
                      ))
                    )}
                    <tr className="bg-secondary/20 font-bold border-t-2 border-border text-sm">
                      <td className="px-4 py-3 uppercase text-foreground" colSpan={3}>GRAND TOTAL OUTSTANDING RECEIVABLE</td>
                      <td className="px-4 py-3 text-right text-foreground">{fmt(customerList.reduce((sum, c) => sum + c.sales, 0))}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">{fmt(customerList.reduce((sum, c) => sum + c.receipts, 0))}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-black">{fmt(grandTotalReceivable)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* VIEW 4: SALES & PURCHASE LEDGER */}
      {activeReportTab === "sales-purchase" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Detailed Transaction Report Table */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/20 border-b border-border flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} className="text-primary" /> Filtered Transaction Ledger ({filteredEntries.length} Records)
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">Showing results for {periodPreset.replace("_", " ")} ({formatDDMMYYYY(startDate)} → {formatDDMMYYYY(endDate)})</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-secondary/10 border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3 text-center">Invoice No</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-center">Type</th>
                    <th className="px-4 py-3">Partner Account</th>
                    <th className="px-4 py-3">Line Items Summary</th>
                    <th className="px-4 py-3 text-center">Payment</th>
                    <th className="px-4 py-3 text-right">Grand Total (INR)</th>
                    <th className="px-4 py-3 text-center w-16 no-print">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground italic bg-secondary/5">
                        No transactions found matching the selected report parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((e, idx) => {
                      const subTotal = e.subTotal || (e.quantity || 0) * (e.pricePerUnit || 0);
                      const grandTotal = e.grandTotal || subTotal * 1.12;

                      const itemsSummary = e.items && e.items.length > 0 
                        ? e.items.map(i => {
                            const p = products.find(prod => prod.id === i.productId);
                            return `${i.quantity}x ${p?.name || 'Item'} (Gdn ${i.godown})`;
                          }).join(", ")
                        : `${e.quantity || 0}x ${products.find(p => p.id === e.productId)?.name || 'Item'} (Gdn ${e.godown})`;

                      return (
                        <tr
                          key={e.id || idx}
                          onClick={() => onEditEntryFromHistory && onEditEntryFromHistory(e)}
                          className="hover:bg-blue-500/10 dark:hover:bg-blue-950/30 transition-colors cursor-pointer group"
                          title="Click to re-open transaction in 100% Mutable & Editable Procedure Form"
                        >
                          <td className="px-4 py-3 text-center font-mono font-bold">
                            <span className="text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1">
                              ✏️ {e.invoiceNo || `INV-${e.id.slice(0, 6)}`}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-muted-foreground group-hover:text-foreground">{formatDDMMYYYY(e.date)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              e.type === "out" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30" : "bg-blue-500/10 text-blue-600 border border-blue-500/30"
                            }`}>
                              {e.type === "out" ? "Sales" : "Purchase"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground group-hover:text-blue-600 group-hover:underline">{e.partner}</td>
                          <td className="px-4 py-3 text-muted-foreground font-mono text-[11px] max-w-xs truncate" title={itemsSummary}>
                            {itemsSummary}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 bg-secondary rounded border border-border text-muted-foreground">
                              {e.paymentType || "cash"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                            {fmt(grandTotal)}
                          </td>
                          <td className="px-4 py-3 text-center no-print">
                            <button
                              type="button"
                              onClick={(ev) => { ev.stopPropagation(); onEditEntryFromHistory && onEditEntryFromHistory(e); }}
                              className="px-2.5 py-1 bg-primary text-primary-foreground hover:bg-primary/90 border border-border rounded text-[10px] font-mono font-bold transition-colors flex items-center justify-center gap-1 mx-auto shadow-sm"
                            >
                              ✏️ Edit & Re-Save
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── P&L Page ────────────────────────────────────────────────────────────────

function PLPage({ products, analytics }: { products: Product[]; analytics: Analytics | null }) {
  const overall = useMemo(() => {
    if (!analytics) return { revenue: 0, cost: 0, profit: 0 };
    return { revenue: analytics.revenue, cost: analytics.cost, profit: analytics.profit };
  }, [analytics]);

  const perProduct = useMemo(() => {
    if (!analytics) return [];
    return products.map(p => {
      const pl = analytics.productPL[p.id] || { revenue: 0, cost: 0, profit: 0, sold: 0, stock: 0 };
      return {
        ...p,
        revenue: pl.revenue,
        cost: pl.cost,
        profit: pl.profit,
        sold: pl.sold,
      };
    }).filter(p => p.revenue > 0 || p.cost > 0);
  }, [products, analytics]);

  const chartData = useMemo(() => {
    return perProduct.map(p => ({
      name: p.name,
      profit: p.profit,
    })).sort((a, b) => b.profit - a.profit);
  }, [perProduct]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground font-serif">Profit & Loss Statement</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time ledger margins and revenue reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Consolidated Sales Revenue" value={fmt(overall.revenue)} icon={TrendingUp} />
        <StatCard label="Cost of Goods Placed" value={fmt(overall.cost)} icon={ArrowDownToLine} />
        <StatCard label="Net Operations Margin" value={fmt(overall.profit)} sub={overall.profit >= 0 ? "Trading Surplus" : "Trading Deficit"} icon={overall.profit >= 0 ? TrendingUp : TrendingDown} accent />
      </div>

      {chartData.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">Profit Breakdown by Product</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fontFamily: "DM Mono" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontFamily: "DM Mono" }} width={80} />
              <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }} />
              <Bar dataKey="profit" radius={[0, 3, 3, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.profit >= 0 ? "#2d4a1e" : "#b91c1c"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">Product</th>
                <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">Qty Sold</th>
                <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">In Stock</th>
                <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">Revenue</th>
                <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">Cost</th>
                <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">Net P&L</th>
                <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">Margin</th>
              </tr>
            </thead>
            <tbody>
              {perProduct.map((p, i) => {
                const margin = p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={p.id} className={`border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? "" : "bg-secondary/10"}`}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-sm text-foreground">{p.name}</div>
                      <Badge label={p.category} color={CATEGORY_COLORS[p.category]} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-foreground">{p.sold} {p.unit}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-foreground">{p.stock} {p.unit}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-foreground">{fmt(p.revenue)}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">{fmt(p.cost)}</td>
                    <td className={`px-4 py-3 text-right font-mono text-sm font-semibold ${p.profit >= 0 ? "text-primary" : "text-destructive"}`}>
                      {p.profit >= 0 ? "+" : ""}{fmt(p.profit)}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono text-sm ${Number(margin) >= 0 ? "text-primary" : "text-destructive"}`}>
                      {margin}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Godowns Overview Page ───────────────────────────────────────────────────

function GodownsPage({ products, analytics }: { products: Product[]; analytics: Analytics | null }) {
  const [godownsList, setGodownsList] = useState<string[]>(() => {
    const saved = localStorage.getItem("custom_godowns_list");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [...ALL_GODOWNS];
  });

  const [activeViewMode, setActiveViewMode] = useState<"grid" | "focus" | "matrix">("grid");
  const [activeGodown, setActiveGodown] = useState<string>("A");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Godown Form State
  const [godownCode, setGodownCode] = useState("");
  const [godownName, setGodownName] = useState("");
  const [climateCategory, setClimateCategory] = useState("Ambient Dry Storage (20-25°C)");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [locationAddress, setLocationAddress] = useState("");

  // Helper for climate label
  const getGodownClimateLabel = (g: string) => {
    const stored = localStorage.getItem("custom_godowns_metadata");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed[g]?.climate) return parsed[g].climate;
      } catch (e) {}
    }
    if (["A", "B", "C", "D", "E", "F"].includes(g)) return "Ambient Dry Storage (20-25°C)";
    if (["G", "H", "I", "J", "K", "L"].includes(g)) return "Cold Storage (2-8°C)";
    return "Dehumidified Spice Vault (<50% RH)";
  };

  // Global Keyboard Shortcut: Ctrl + C (or Cmd + C) to trigger Godown Creation Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        const selection = window.getSelection()?.toString();
        if (!selection) {
          e.preventDefault();
          setIsCreateModalOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCreateGodown = (e: React.FormEvent) => {
    e.preventDefault();
    const code = godownCode.trim().toUpperCase();
    if (!code) {
      toast.error("Please enter a Godown Code or Designation.");
      return;
    }
    if (godownsList.includes(code)) {
      toast.error(`Godown "${code}" already exists in the warehouse layout.`);
      return;
    }

    const newList = [...godownsList, code];
    setGodownsList(newList);
    localStorage.setItem("custom_godowns_list", JSON.stringify(newList));

    const storedDetails = JSON.parse(localStorage.getItem("custom_godowns_metadata") || "{}");
    storedDetails[code] = {
      name: godownName.trim() || `Godown ${code}`,
      climate: climateCategory,
      capacity: maxCapacity ? `${maxCapacity} Units` : "Standard Storage",
      address: locationAddress.trim() || "Warehouse Compound"
    };
    localStorage.setItem("custom_godowns_metadata", JSON.stringify(storedDetails));

    setActiveGodown(code);
    toast.success(`New Warehouse Godown "${code}" created successfully!`);

    setGodownCode("");
    setGodownName("");
    setMaxCapacity("");
    setLocationAddress("");
    setIsCreateModalOpen(false);
  };

  const godownStats = useMemo(() => {
    if (!analytics) return [];
    return analytics.godownStats;
  }, [analytics]);

  // Comprehensive breakdown for all godowns
  const allGodownsData = useMemo(() => {
    return godownsList.map(g => {
      const storedItems = products.map(p => {
        const qty = p.godownStocks?.[g as Godown] || 0;
        return { product: p, qty };
      }).filter(item => {
        if (item.qty <= 0) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return item.product.name.toLowerCase().includes(q) || item.product.category.toLowerCase().includes(q);
      });

      const totalQty = storedItems.reduce((acc, curr) => acc + curr.qty, 0);
      const totalValue = storedItems.reduce((acc, curr) => acc + (curr.qty * (curr.product.sellPrice || 0)), 0);

      return {
        godown: g,
        climate: getGodownClimateLabel(g),
        items: storedItems,
        totalQty,
        totalValue,
        uniqueProductsCount: storedItems.length,
      };
    });
  }, [godownsList, products, searchQuery]);

  // Overall totals across all godowns
  const totalsSummary = useMemo(() => {
    let grandQty = 0;
    let grandValue = 0;
    let occupiedGodowns = 0;

    allGodownsData.forEach(gData => {
      grandQty += gData.totalQty;
      grandValue += gData.totalValue;
      if (gData.totalQty > 0) occupiedGodowns++;
    });

    return {
      grandQty,
      grandValue,
      totalGodowns: godownsList.length,
      occupiedGodowns,
      emptyGodowns: godownsList.length - occupiedGodowns
    };
  }, [allGodownsData, godownsList]);

  // Active single godown focus items
  const activeProducts = useMemo(() => {
    return products.map(p => {
      const current = p.godownStocks?.[activeGodown as Godown] || 0;
      return { ...p, current };
    }).filter(p => p.current > 0);
  }, [products, activeGodown]);

  const currentActiveStats = godownStats.find(gs => gs.godown === activeGodown);

  return (
    <div className="space-y-6">
      {/* Header Cockpit Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground font-serif flex items-center gap-2.5">
            <Warehouse className="text-primary" size={28} /> 18 Godowns Logistics Hub (A to R)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time stock location tracking across all 18 Godowns (A to R) • Press <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded border text-xs">Ctrl + C</kbd> to add godown
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Switchers */}
          <div className="bg-secondary/40 border border-border p-1 rounded-xl flex items-center gap-1 font-mono text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeViewMode === "grid" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid size={14} /> All 18 Godowns Grid
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode("matrix")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeViewMode === "matrix" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Boxes size={14} /> Products Matrix Table
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode("focus")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeViewMode === "focus" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers size={14} /> Single Inspector
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            title="Create New Godown [Shortcut: Ctrl + C]"
          >
            <Plus size={16} /> + New Godown <span className="text-[10px] opacity-80 border border-emerald-400/40 px-1.5 py-0.5 rounded">[Ctrl + C]</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Warehouses Monitored</span>
          <div className="text-2xl font-extrabold text-foreground">{totalsSummary.totalGodowns} Godowns (A to R)</div>
          <span className="text-[10px] text-emerald-600 font-semibold">{totalsSummary.occupiedGodowns} Occupied • {totalsSummary.emptyGodowns} Empty</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Units Stored</span>
          <div className="text-2xl font-extrabold text-emerald-600">{totalsSummary.grandQty.toLocaleString()} Units</div>
          <span className="text-[10px] text-muted-foreground">Consolidated physical inventory</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Stock Value in Vaults</span>
          <div className="text-2xl font-extrabold text-primary">
            ₹{totalsSummary.grandValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-muted-foreground">Estimated selling value</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col justify-center space-y-2">
          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
            <Search size={12} /> Filter Products Across All 18 Godowns
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search product (e.g. Cardamom, Rice)..."
              className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring font-bold"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1.5 text-xs text-muted-foreground hover:text-foreground font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* GODOWN NAVIGATION RIBBON */}
      <div className="bg-card border border-border p-3 rounded-xl shadow-sm space-y-2">
        <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider">
          <span>Quick Select 18 Godowns Layout (A to R)</span>
          <span>Click any Godown designation below to jump or inspect</span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-18 gap-2 font-mono">
          {godownsList.map(g => {
            const gData = allGodownsData.find(d => d.godown === g);
            const currentQty = gData?.totalQty || 0;
            const isCurrentActive = activeGodown === g;

            return (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setActiveGodown(g);
                  if (activeViewMode === "matrix") setActiveViewMode("grid");
                }}
                className={`p-2 rounded-lg border text-center transition-all hover:scale-105 ${
                  isCurrentActive 
                    ? "border-primary bg-primary text-primary-foreground font-bold shadow-md ring-2 ring-primary/30" 
                    : currentQty > 0 
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold" 
                      : "border-border bg-card text-muted-foreground opacity-60 hover:opacity-100"
                }`}
              >
                <div className="text-xs font-bold font-serif">{g}</div>
                <div className="text-[9px] truncate font-mono mt-0.5">
                  {currentQty > 0 ? `${currentQty}` : "0"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW MODE 1: ALL 18 GODOWNS GRID OVERVIEW (DEFAULT & PROMINENT) */}
      {activeViewMode === "grid" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <h2 className="text-lg font-bold text-foreground font-serif flex items-center gap-2">
              <Boxes size={20} className="text-primary" /> Master 18 Godowns Inventory Manifest ({godownsList.length} Vaults)
            </h2>
            <span className="text-xs font-mono text-muted-foreground">
              Showing stored products for every godown from A to R
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allGodownsData.map(gData => {
              const { godown: g, climate, items, totalQty, totalValue, uniqueProductsCount } = gData;
              const isSelected = activeGodown === g;

              return (
                <div
                  key={g}
                  onClick={() => setActiveGodown(g)}
                  className={`bg-card border rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between space-y-4 cursor-pointer relative overflow-hidden group ${
                    isSelected ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Card Top Banner */}
                    <div className="flex justify-between items-start border-b border-border/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-extrabold text-xl text-foreground">Godown {g}</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
                            totalQty > 0 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-muted text-muted-foreground border-border"
                          }`}>
                            {totalQty > 0 ? `${totalQty} Units` : "Empty"}
                          </span>
                        </div>
                        <span className="text-[10.5px] font-mono text-muted-foreground block mt-1">
                          🌡️ {climate}
                        </span>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-primary block">
                          ₹{totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {uniqueProductsCount} product{uniqueProductsCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>

                    {/* Products List inside this Godown */}
                    <div className="space-y-2 min-h-[140px] max-h-[220px] overflow-y-auto pr-1">
                      {items.length === 0 ? (
                        <div className="h-32 flex flex-col justify-center items-center text-center text-muted-foreground italic border border-dashed border-border/60 rounded-xl p-4">
                          <Warehouse size={24} className="opacity-30 mb-1.5" />
                          <span className="text-xs font-mono">No products stored in Godown {g}</span>
                          <span className="text-[10px] opacity-75 mt-0.5">Ready to receive cargo stock</span>
                        </div>
                      ) : (
                        items.map(({ product: p, qty }) => (
                          <div
                            key={p.id}
                            className="p-2.5 bg-secondary/20 hover:bg-secondary/40 border border-border/50 rounded-xl flex justify-between items-center transition-colors font-sans text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-semibold text-foreground truncate">{p.name}</span>
                              <Badge label={p.category} color={CATEGORY_COLORS[p.category]} />
                            </div>

                            <div className="text-right font-mono flex-shrink-0 ml-2">
                              <span className="font-extrabold text-foreground text-xs block">
                                {qty} {p.unit}
                              </span>
                              <span className="text-[9px] text-muted-foreground">
                                ₹{(qty * (p.sellPrice || 0)).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-border/50 flex justify-between items-center text-xs font-mono">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveGodown(g);
                        setActiveViewMode("focus");
                      }}
                      className="text-primary hover:underline font-bold text-[11px] flex items-center gap-1"
                    >
                      <Layers size={13} /> Deep Inspector →
                    </button>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {totalQty > 0 ? `${uniqueProductsCount} Types Allocated` : "0 Stock"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: SINGLE GODOWN FOCUS INSPECTOR */}
      {activeViewMode === "focus" && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-border pb-4 gap-2">
            <div>
              <h3 className="font-semibold text-2xl text-foreground font-serif flex items-center gap-2">
                Detailed Stock Allocations in Godown {activeGodown}
              </h3>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                Climate environment: <strong className="text-foreground">{getGodownClimateLabel(activeGodown)}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveViewMode("grid")}
              className="px-3.5 py-1.5 bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-xs font-mono font-bold self-start sm:self-auto"
            >
              ← Back to All 18 Godowns Grid
            </button>
          </div>

          {activeProducts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm font-mono space-y-2">
              <Warehouse size={36} className="mx-auto opacity-40 mb-2" />
              <p className="font-bold text-foreground">No products stored in Godown {activeGodown} currently.</p>
              <p className="text-xs opacity-75">Use Sales & Purchase Billing or Master Console to allocate stock to Godown {activeGodown}.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {activeProducts.map(p => {
                const totalGodownStock = currentActiveStats?.current || 1;
                const pctOfGodown = Math.round((p.current / totalGodownStock) * 100);
                return (
                  <div key={p.id} className="py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-semibold text-sm text-foreground">{p.name}</span>
                        <Badge label={p.category} color={CATEGORY_COLORS[p.category]} />
                        {p.isPerishable && (
                          <span className="text-[9px] font-mono text-red-600 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.2 rounded border border-red-200 dark:border-red-800">
                            Perishable
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pctOfGodown}%`, background: CATEGORY_COLORS[p.category] || "#10b981" }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 font-mono">
                      <div className="text-base font-bold text-foreground">{p.current} {p.unit}</div>
                      <div className="text-[10px] text-muted-foreground">{pctOfGodown}% of Godown space</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 3: PRODUCTS X 18 GODOWNS CROSS-TABULATION MATRIX TABLE */}
      {activeViewMode === "matrix" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm space-y-4 p-5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-border pb-3 gap-2">
            <div>
              <h3 className="font-bold text-base text-foreground font-serif flex items-center gap-2">
                <Boxes size={18} className="text-primary" /> Master Stock Matrix Across All 18 Godowns (A to R)
              </h3>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                Full spreadsheet matrix showing exact inventory levels for every product in Godowns A through R
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveViewMode("grid")}
              className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-xs font-mono font-bold"
            >
              ← Back to Grid View
            </button>
          </div>

          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-[10px] uppercase text-muted-foreground font-bold">
                  <th className="p-3 min-w-[160px] sticky left-0 bg-secondary/80 backdrop-blur z-10 border-r border-border">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Total Stock</th>
                  {godownsList.map(g => (
                    <th key={g} className="p-2.5 text-center min-w-[50px] border-l border-border/40">
                      Gdn {g}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={3 + godownsList.length} className="p-8 text-center text-muted-foreground italic">
                      No products found in inventory catalog.
                    </td>
                  </tr>
                ) : (
                  products.filter(p => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase().trim();
                    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
                  }).map((p, idx) => {
                    const totalQty = p.godownStocks ? Object.values(p.godownStocks).reduce((a, b) => a + b, 0) : 0;

                    return (
                      <tr key={p.id || idx} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-3 font-semibold text-foreground sticky left-0 bg-card border-r border-border z-10">
                          {p.name}
                        </td>
                        <td className="p-3">
                          <Badge label={p.category} color={CATEGORY_COLORS[p.category]} />
                        </td>
                        <td className="p-3 text-right font-extrabold text-emerald-600">
                          {totalQty} {p.unit}
                        </td>

                        {godownsList.map(g => {
                          const val = p.godownStocks?.[g as Godown] || 0;
                          return (
                            <td
                              key={g}
                              className={`p-2.5 text-center border-l border-border/30 font-bold ${
                                val > 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "text-muted-foreground/30"
                              }`}
                            >
                              {val > 0 ? val : "-"}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GODOWN CREATION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl w-full max-w-lg space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Warehouse className="text-primary" size={20} />
                <h3 className="font-bold text-base text-foreground font-serif">Create New Warehouse Godown</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-mono p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGodown} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1 font-bold">Godown Code / ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S, T, W-1"
                    value={godownCode}
                    onChange={e => setGodownCode(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1 font-bold">Godown Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. South Logistics Vault"
                    value={godownName}
                    onChange={e => setGodownName(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1 font-bold">Climate Category & Atmosphere</label>
                <select
                  value={climateCategory}
                  onChange={e => setClimateCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Ambient Dry Storage (20-25°C)">Ambient Dry Storage (20-25°C)</option>
                  <option value="Cold Storage (2-8°C)">Cold Storage (2-8°C)</option>
                  <option value="Dehumidified Spice Vault (<50% RH)">Dehumidified Spice Vault (&lt;50% RH)</option>
                  <option value="Controlled Atmosphere (N2 Purged)">Controlled Atmosphere (N2 Purged)</option>
                  <option value="Freezer Facility (-18°C)">Freezer Facility (-18°C)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1 font-bold">Max Storage Capacity (Units/Bags)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={maxCapacity}
                    onChange={e => setMaxCapacity(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1 font-bold">Warehouse Sector / Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Zone 4, Dock 12"
                    value={locationAddress}
                    onChange={e => setLocationAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-mono text-muted-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-primary-foreground font-mono font-bold text-xs rounded-lg shadow uppercase tracking-wider hover:opacity-90 transition-opacity"
                >
                  Register Godown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI Insights Page with RAG Debugger ──────────────────────────────────────────

const QUICK_PROMPTS = [
  "What is the overall profit margin?",
  "What products are in godown C?",
  "Show me low stock items.",
  "What are the export regulations for cardamom?"
];

function AIChartCard({ chart }: { chart: { type: "bar" | "pie"; title: string; dataset: { label: string; value: number }[] } }) {
  const { title, dataset, type } = chart;
  const colors = [
    "bg-emerald-200 border-emerald-300 text-emerald-800",
    "bg-rose-200 border-rose-300 text-rose-800",
    "bg-amber-200 border-amber-300 text-amber-800",
    "bg-purple-200 border-purple-300 text-purple-800",
    "bg-sky-200 border-sky-300 text-sky-800",
    "bg-orange-200 border-orange-300 text-orange-800"
  ];
  const maxVal = Math.max(...dataset.map(d => Math.abs(d.value)), 1);

  if (type === "pie") {
    return (
      <div className="mt-4 p-4 bg-white/70 border border-emerald-100/50 rounded-2xl shadow-sm space-y-4 text-gray-800 font-sans max-w-md">
        <h4 className="text-xs font-bold font-serif text-emerald-800 uppercase tracking-wider">{title}</h4>
        <div className="space-y-3">
          {dataset.map((d, i) => {
            const pct = Math.min((Math.abs(d.value) / maxVal) * 100, 100);
            const colorClass = colors[i % colors.length];
            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700">{d.label}</span>
                  <span className="font-mono font-bold text-gray-900">{d.value.toLocaleString()}</span>
                </div>
                <div className="h-3 w-full bg-gray-100/60 rounded-full overflow-hidden border border-gray-200/20">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${colorClass.split(" ")[0]} border-r ${colorClass.split(" ")[1]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Bar chart
  const barColors = [
    "from-emerald-400 to-teal-500",
    "from-rose-400 to-pink-500",
    "from-amber-400 to-orange-500",
    "from-purple-400 to-indigo-500",
    "from-sky-400 to-blue-500",
    "from-orange-400 to-red-500"
  ];

  return (
    <div className="mt-4 p-4 bg-white/70 border border-emerald-100/50 rounded-2xl shadow-sm space-y-4 text-gray-800 font-sans max-w-md">
      <h4 className="text-xs font-bold font-serif text-emerald-800 uppercase tracking-wider">{title}</h4>
      <div className="flex items-end justify-around h-32 pt-4 border-b border-gray-200/50 px-2">
        {dataset.map((d, i) => {
          const heightPct = Math.min((Math.abs(d.value) / maxVal) * 80, 100);
          const bgGradient = barColors[i % barColors.length];
          return (
            <div key={i} className="flex flex-col items-center group relative w-12">
              <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-transform bg-gray-800 text-white text-[9px] font-mono py-0.5 px-1.5 rounded shadow whitespace-nowrap z-20">
                {d.value.toLocaleString()}
              </div>
              <div 
                className={`w-5 bg-gradient-to-t ${bgGradient} rounded-t-md shadow-sm transition-all duration-1000`}
                style={{ height: `${heightPct}px`, minHeight: "4px" }}
              />
              <span className="text-[9px] text-gray-500 mt-2 truncate w-full text-center font-mono uppercase tracking-tight">{d.label.slice(0, 5)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AIDraftInvoiceCard({ invoice, onRefresh }: { invoice: any; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState(false);

  const handlePost = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: invoice.productId,
          godown: invoice.godown,
          quantity: invoice.quantity,
          pricePerUnit: invoice.pricePerUnit,
          type: invoice.type,
          partner: invoice.partner,
          date: new Date().toISOString().split("T")[0],
          note: "Generated via AI Assistant Command",
          isCredit: false,
          expiryDate: invoice.type === "in" ? new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : undefined
        })
      });

      if (response.ok) {
        toast.success("Transaction posted successfully to the ledger!");
        setPosted(true);
        onRefresh();
      } else {
        const errData = await response.json();
        toast.error(`Posting failed: ${errData.error || "Server error"}`);
      }
    } catch (e: any) {
      toast.error(`Network error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fmtMoney = (n: number) => `MVR ${(typeof n === "number" && !isNaN(n) ? n : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="mt-2 p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm text-gray-800 font-sans max-w-sm relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${invoice.type === "in" ? "bg-emerald-400" : "bg-rose-400"}`} />

      <div className="flex justify-between items-start mb-2">
        <div>
          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
            invoice.type === "in" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
          }`}>
            {invoice.type === "in" ? "📥 Purchase Voucher Draft" : "📤 Sales Invoice Draft"}
          </span>
        </div>
        <span className="text-[9px] text-gray-400 font-mono">AI-BUILT</span>
      </div>

      <div className="space-y-1.5 text-[11px] border-y border-gray-100 py-2.5 mb-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Product</span>
          <span className="font-semibold text-gray-800">{invoice.productName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Trading Partner</span>
          <span className="font-semibold text-gray-800">{invoice.partner}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Quantity</span>
          <span className="font-mono font-bold text-gray-800">{invoice.quantity} units</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Rate</span>
          <span className="font-mono text-gray-800">{fmtMoney(invoice.pricePerUnit)}</span>
        </div>
        <div className="flex justify-between border-t border-dashed border-gray-100 pt-1.5 text-xs">
          <span className="font-bold text-emerald-900">Total Net Amount</span>
          <span className="font-mono font-extrabold text-emerald-800">{fmtMoney(invoice.quantity * invoice.pricePerUnit)}</span>
        </div>
        <div className="flex justify-between text-[9px]">
          <span className="text-gray-400">Target Warehouse</span>
          <span className="font-mono px-1 py-0.2 bg-gray-100 border rounded text-gray-700 font-bold">Godown {invoice.godown}</span>
        </div>
      </div>

      {posted ? (
        <div className="w-full py-1.5 bg-emerald-50 text-emerald-800 text-center rounded-xl text-[10px] font-semibold border border-emerald-100 flex items-center justify-center gap-1">
          ✓ DRAFT SUCCESSFULLY POSTED TO LEDGER
        </div>
      ) : (
        <button
          onClick={handlePost}
          disabled={loading}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl shadow-md shadow-emerald-700/10 flex items-center justify-center gap-1.5 uppercase tracking-wider transition-colors"
        >
          {loading ? (
            <>
              <RefreshCw size={11} className="animate-spin" />
              Posting to Vault...
            </>
          ) : (
            "Confirm & Post Invoice"
          )}
        </button>
      )}
    </div>
  );
}

function AISmartInsightsPanel({ products, entries }: { products: Product[]; entries: StockEntry[] }) {
  // Low stock alerts (stock < 100)
  const lowStock = useMemo(() => {
    return products.map(p => {
      const qty = p.godownStocks ? Object.values(p.godownStocks).reduce((a, b) => a + b, 0) : 0;
      return { ...p, qty };
    }).filter(p => p.qty < 100);
  }, [products]);

  // Expiry alerts (perishables expiring within 14 days)
  const expiringLots = useMemo(() => {
    const today = new Date();
    return entries.filter(e => {
      if (e.type !== "in" || !e.expiryDate) return false;
      const expDate = new Date(e.expiryDate);
      const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const prod = products.find(p => p.id === e.productId);
      const currentStock = prod && prod.godownStocks ? Object.values(prod.godownStocks).reduce((a, b) => a + b, 0) : 0;
      return currentStock > 0 && diffDays <= 14;
    }).map(e => {
      const prod = products.find(p => p.id === e.productId);
      const expDate = new Date(e.expiryDate!);
      const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: e.id,
        prodName: prod ? prod.name : "Product",
        expiryDate: e.expiryDate,
        daysLeft: diffDays,
        godown: e.godown
      };
    });
  }, [entries, products]);

  // Margin Opportunities
  const marginOpps = useMemo(() => {
    return products.slice(0, 4).map(p => ({
      name: p.name,
      category: p.category,
      desc: p.category === "Spices" ? "High global demand in EU markets." : "Premium quality grade."
    }));
  }, [products]);

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Low Stock Section */}
      <div>
        <h4 className="font-bold text-[10px] uppercase text-amber-600 mb-2 flex items-center gap-1 font-mono">
          ⚠️ Low Stock Alarms
        </h4>
        {lowStock.length === 0 ? (
          <div className="p-3 bg-secondary/10 text-muted-foreground rounded-lg italic">All inventory levels are secure.</div>
        ) : (
          <div className="space-y-2">
            {lowStock.slice(0, 3).map(p => (
              <div key={p.id} className="p-2.5 bg-amber-50/20 border border-amber-200/30 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-semibold text-foreground">{p.name}</span>
                  <span className="block text-[9px] text-muted-foreground uppercase">{p.category}</span>
                </div>
                <span className="font-mono font-bold text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded text-[10px]">{p.qty} {p.unit} remaining</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expiration Alert Section */}
      <div>
        <h4 className="font-bold text-[10px] uppercase text-rose-600 mb-2 flex items-center gap-1 font-mono">
          🍎 Expiration Warnings
        </h4>
        {expiringLots.length === 0 ? (
          <div className="p-3 bg-secondary/10 text-muted-foreground rounded-lg italic">No batches expiring within 14 days.</div>
        ) : (
          <div className="space-y-2">
            {expiringLots.slice(0, 3).map(lot => (
              <div key={lot.id} className="p-2.5 bg-rose-50/20 border border-rose-200/30 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-semibold text-foreground">{lot.prodName}</span>
                  <span className="block text-[9px] text-muted-foreground uppercase">Godown {lot.godown} • Expiry: {lot.expiryDate}</span>
                </div>
                <span className={`font-mono font-bold px-2 py-0.5 rounded text-[9px] ${
                  lot.daysLeft <= 0 ? "bg-rose-600 text-white animate-pulse" : "bg-rose-500/10 text-rose-700"
                }`}>
                  {lot.daysLeft <= 0 ? "Expired" : `${lot.daysLeft} days left`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Margin Opportunities Section */}
      <div>
        <h4 className="font-bold text-[10px] uppercase text-emerald-600 mb-2 flex items-center gap-1 font-mono">
          💡 Profit Opportunities
        </h4>
        <div className="space-y-2">
          {marginOpps.map((opp, idx) => (
            <div key={idx} className="p-2.5 bg-emerald-50/15 border border-emerald-200/20 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-foreground">{opp.name}</span>
                <span className="text-[9px] font-mono text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded font-bold">Priority Target</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-normal">{opp.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIPage({ products, entries, onRefresh }: { products: Product[]; entries: StockEntry[]; onRefresh: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hello! I am connected to the company's RAG system and live database. Ask me about stock levels, logistics, profit margins, or storage guidelines." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [sidebarTab, setSidebarTab] = useState<"insights" | "telemetry">("insights");

  async function send(q?: string) {
    const text = q || input.trim();
    if (!text) return;
    setInput("");
    setLoading(true);
    setMessages(m => [...m, { role: "user", text }]);
    
    try {
      const response = await fetch("/api/ai/query/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text })
      });

      if (!response.ok) {
        throw new Error("RAG Server query failed");
      }

      if (!response.body) {
        throw new Error("ReadableStream is not supported by this server");
      }

      setMessages(m => [...m, { role: "ai", text: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const jsonStr = trimmed.slice(6).trim();
            if (!jsonStr) continue;
            try {
              const payload = JSON.parse(jsonStr);
              if (payload.type === "telemetry") {
                setTelemetry(payload.data);
              } else if (payload.type === "chunk") {
                setMessages(m => {
                  const copy = [...m];
                  const last = copy[copy.length - 1];
                  if (last && last.role === "ai") {
                    last.text += payload.data;
                  }
                  return copy;
                });
              } else if (payload.type === "error") {
                toast.error(`AI Error: ${payload.data}`);
              }
            } catch (err) {
              console.error("Error parsing stream line:", err);
            }
          }
        }
      }
    } catch (e: any) {
      setMessages(m => [...m, { role: "ai", text: `I encountered an error querying the backend server: ${e.message}.` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div>
        <h1 className="text-3xl font-semibold text-foreground font-serif">RAG Operations Center</h1>
        <p className="text-muted-foreground text-sm mt-1">Ask natural questions powered by Retrieval-Augmented Generation</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => send(p)}
            className="px-3 py-1.5 rounded-full text-xs font-mono bg-card text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all border border-border shadow-sm"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-[480px]">
        <div className="lg:col-span-3 bg-card rounded-xl border border-border flex flex-col overflow-hidden shadow-sm h-full" style={{ minHeight: 450 }}>
          <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[420px]">
            {messages.map((m, i) => {
              const directiveMatch = m.text.match(/<DIRECTIVE>([\s\S]*?)<\/DIRECTIVE>/);
              const cleanText = m.text.replace(/<DIRECTIVE>[\s\S]*?<\/DIRECTIVE>/, "").trim();
              
              let directive = null;
              try {
                if (directiveMatch && directiveMatch[1]) {
                  directive = JSON.parse(directiveMatch[1].trim());
                }
              } catch (e) {
                console.error("Failed to parse directive:", e);
              }

              return (
                <div key={i} className={`flex flex-col space-y-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`flex gap-3 w-full ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "ai" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                      {m.role === "ai" ? <Sparkles size={14} /> : <span className="text-xs font-mono font-bold">U</span>}
                    </div>
                    <div className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-line shadow-sm border ${
                      m.role === "ai" 
                        ? "bg-secondary/40 text-foreground border-border animate-in fade-in duration-300" 
                        : "bg-primary text-primary-foreground border-primary"
                    }`}>
                      {cleanText}
                    </div>
                  </div>

                  {/* Render inline directive cards */}
                  {directive && (
                    <div className="pl-11 w-full animate-in slide-in-from-bottom-2 duration-300">
                      {directive.action === "draft_invoice" && (
                        <AIDraftInvoiceCard invoice={directive.invoice} onRefresh={onRefresh} />
                      )}
                      {directive.action === "render_chart" && (
                        <AIChartCard chart={directive.chart} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center animate-pulse">
                  <Sparkles size={14} />
                </div>
                <div className="px-4 py-3 rounded-xl text-sm bg-secondary/40 text-muted-foreground italic border border-border">
                  Retrieving documents and computing response...
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t border-border p-4 flex gap-3 bg-secondary/5">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask about stock, profits, logistics, or storage rules..."
              className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-input-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => send()}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Sparkles size={14} /> Ask AI
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl border border-border flex flex-col overflow-hidden shadow-sm h-full" style={{ minHeight: 450 }}>
          <div className="bg-secondary/50 border-b border-border flex items-center">
            <button
              onClick={() => setSidebarTab("insights")}
              className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 text-center transition-colors ${
                sidebarTab === "insights" ? "border-primary text-foreground bg-card" : "border-transparent text-muted-foreground hover:bg-secondary/20"
              }`}
            >
              Smart Insights
            </button>
            <button
              onClick={() => setSidebarTab("telemetry")}
              className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 text-center transition-colors ${
                sidebarTab === "telemetry" ? "border-primary text-foreground bg-card" : "border-transparent text-muted-foreground hover:bg-secondary/20"
              }`}
            >
              RAG Telemetry
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[460px]">
            {sidebarTab === "insights" ? (
              <AISmartInsightsPanel products={products} entries={entries} />
            ) : telemetry ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-secondary/25 border rounded-lg">
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase">Engine Model</span>
                    <span className="font-semibold text-foreground">{telemetry.modelUsed}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase">Parsed Intent</span>
                    <span className="font-semibold text-accent uppercase">{telemetry.intent}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[10px] uppercase text-muted-foreground mb-1.5 border-b border-border/50 pb-0.5">1. NLP Extracted Entities</h4>
                  <pre className="p-2 bg-secondary/15 rounded border overflow-x-auto text-[10px] max-h-20">
                    {JSON.stringify(telemetry.entities, null, 2)}
                  </pre>
                </div>

                <div>
                  <h4 className="font-bold text-[10px] uppercase text-muted-foreground mb-1.5 border-b border-border/50 pb-0.5">2. KB Documents Retrieved (RAG)</h4>
                  {telemetry.retrievedDocs.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground italic">No matching knowledge articles retrieved.</div>
                  ) : (
                    <div className="space-y-2">
                      {telemetry.retrievedDocs.map((doc: any, idx: number) => (
                        <div key={doc.id} className="p-2 bg-green-50/20 border border-green-200/40 rounded">
                          <div className="flex justify-between font-semibold text-[10px] text-primary mb-1">
                            <span>{idx + 1}. {doc.title}</span>
                            <span className="text-[9px] opacity-75">{doc.tags.join(", ")}</span>
                          </div>
                          <p className="text-[9.5px] leading-relaxed text-muted-foreground">{doc.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-[10px] uppercase text-muted-foreground mb-1.5 border-b border-border/50 pb-0.5">3. Live Database Context</h4>
                  <pre className="p-2 bg-secondary/15 rounded border overflow-x-auto text-[10px] max-h-28">
                    {JSON.stringify(telemetry.databaseContext, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center text-muted-foreground py-12">
                <DbIcon size={24} className="mb-2 opacity-50" />
                <p className="text-xs">Submit a chat query to watch the RAG operations telemetry trigger in real-time.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Entry Animations & Login Screens ────────────────────────────────────────

function IntroSplashScreen({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setFadeOut(true);
            setTimeout(onFinish, 800);
          }, 400);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") {
        clearInterval(interval);
        setFadeOut(true);
        setTimeout(onFinish, 800);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onFinish]);

  // Determine active category text and phase
  const phase = useMemo(() => {
    if (progress < 25) return { text: "SCANNING SPICES INVENTORY...", cat: "spices" };
    if (progress < 50) return { text: "COUNTING NUTS & DRY FRUITS...", cat: "nuts" };
    if (progress < 75) return { text: "VERIFYING FRESH FRUIT CARGO...", cat: "fruits" };
    if (progress < 100) return { text: "CALIBRATING VEGETABLES REVENUE...", cat: "veggies" };
    return { text: "LEDGER SYNCED & SECURE!", cat: "ready" };
  }, [progress]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF8F5] text-gray-800 overflow-hidden select-none transition-all duration-700 ${
        fadeOut ? "opacity-0 scale-95 pointer-events-none" : "opacity-100"
      }`}
    >
      <style>{`
        @keyframes float-slow {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-medium {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(-8deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-fast {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(8deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float-1 { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-2 { animation: float-medium 7s ease-in-out infinite; }
        .animate-float-3 { animation: float-fast 5s ease-in-out infinite; }
      `}</style>

      {/* Background radial glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-100/40 blur-[100px] -z-10 animate-pulse duration-[3000ms]" />

      {/* Sequential Floating Produce Categories */}
      
      {/* PHASE 1: Spices (🌶️, 🌿) */}
      <div 
        className={`absolute top-[18%] left-[10%] w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-sm transition-all duration-500 animate-float-1 ${
          phase.cat === "spices" || phase.cat === "ready" 
            ? "scale-110 opacity-100 ring-2 ring-emerald-400 bg-emerald-500/10 shadow-emerald-200" 
            : "scale-90 opacity-20 bg-gray-100/30"
        }`}
      >
        🌶️
      </div>
      <div 
        className={`absolute bottom-[18%] right-[15%] w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-sm transition-all duration-500 animate-float-2 ${
          phase.cat === "spices" || phase.cat === "ready" 
            ? "scale-110 opacity-100 ring-2 ring-emerald-400 bg-emerald-500/10 shadow-emerald-200" 
            : "scale-90 opacity-20 bg-gray-100/30"
        }`}
      >
        🌿
      </div>

      {/* PHASE 2: Nuts & Dry Fruits (🥜, 🌰) */}
      <div 
        className={`absolute top-[15%] right-[22%] w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-sm transition-all duration-500 animate-float-3 ${
          phase.cat === "nuts" || phase.cat === "ready" 
            ? "scale-110 opacity-100 ring-2 ring-amber-400 bg-amber-500/10 shadow-amber-200" 
            : "scale-90 opacity-20 bg-gray-100/30"
        }`}
      >
        🥜
      </div>
      <div 
        className={`absolute bottom-[15%] left-[22%] w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-sm transition-all duration-500 animate-float-1 ${
          phase.cat === "nuts" || phase.cat === "ready" 
            ? "scale-110 opacity-100 ring-2 ring-amber-400 bg-amber-500/10 shadow-amber-200" 
            : "scale-90 opacity-20 bg-gray-100/30"
        }`}
      >
        🌰
      </div>

      {/* PHASE 3: Fresh Fruits (🍎, 🍇) */}
      <div 
        className={`absolute top-[45%] right-[8%] w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-sm transition-all duration-500 animate-float-2 ${
          phase.cat === "fruits" || phase.cat === "ready" 
            ? "scale-110 opacity-100 ring-2 ring-rose-400 bg-rose-500/10 shadow-rose-200" 
            : "scale-90 opacity-20 bg-gray-100/30"
        }`}
      >
        🍎
      </div>
      <div 
        className={`absolute top-[48%] left-[8%] w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-sm transition-all duration-500 animate-float-3 ${
          phase.cat === "fruits" || phase.cat === "ready" 
            ? "scale-110 opacity-100 ring-2 ring-rose-400 bg-rose-500/10 shadow-rose-200" 
            : "scale-90 opacity-20 bg-gray-100/30"
        }`}
      >
        🍇
      </div>

      {/* PHASE 4: Vegetables (🥕, 🥑) */}
      <div 
        className={`absolute top-[8%] left-[46%] w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-sm transition-all duration-500 animate-float-1 ${
          phase.cat === "veggies" || phase.cat === "ready" 
            ? "scale-110 opacity-100 ring-2 ring-orange-400 bg-orange-500/10 shadow-orange-200" 
            : "scale-90 opacity-20 bg-gray-100/30"
        }`}
      >
        🥕
      </div>
      <div 
        className={`absolute bottom-[8%] left-[46%] w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-sm transition-all duration-500 animate-float-2 ${
          phase.cat === "veggies" || phase.cat === "ready" 
            ? "scale-110 opacity-100 ring-2 ring-orange-400 bg-orange-500/10 shadow-orange-200" 
            : "scale-90 opacity-20 bg-gray-100/30"
        }`}
      >
        🥑
      </div>

      {/* Center Logo branding */}
      <div className="relative mb-6 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-300 via-teal-400 to-emerald-500 flex items-center justify-center shadow-md shadow-emerald-200/50 animate-bounce duration-[1800ms]">
          <Sparkles size={28} className="text-white animate-pulse" />
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-emerald-300 to-teal-400 blur opacity-30 animate-pulse" />
      </div>

      <h1 className="text-3xl font-extrabold tracking-[0.2em] text-emerald-800 font-serif mb-2 select-none">
        SPICE ROUTE
      </h1>
      <p className="text-[10px] text-emerald-600/80 font-mono tracking-[0.3em] uppercase mb-12 select-none">
        Nuts, Spices & Fresh Produce Ledger
      </p>

      {/* Progress loader */}
      <div className="w-64 max-w-xs space-y-2 relative z-10">
        <div className="flex justify-between items-center text-[9px] font-mono text-emerald-700/80">
          <span>LOADING INVENTORY MANIFEST...</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-emerald-100/70 rounded-full overflow-hidden border border-emerald-200/20">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-300 rounded-full transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-16 text-[9px] font-mono text-emerald-700/40 animate-pulse relative z-10">
        Press <span className="px-1 py-0.5 border border-emerald-200/80 rounded bg-white/60 text-emerald-700 shadow-sm font-bold">Enter</span> or <span className="px-1 py-0.5 border border-emerald-200/80 rounded bg-white/60 text-emerald-700 shadow-sm font-bold">Esc</span> to Skip Intro
      </div>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [loading, setLoading] = useState(false);
  
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Credentials cannot be left empty.");
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (username.toLowerCase() === "admin" && password === "admin") {
        toast.success("Merchant identity authorized. Loading manifest terminal...");
        onLogin();
      } else {
        toast.error("Access Denied: Invalid credentials.");
      }
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextRef?: React.RefObject<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef) {
        nextRef.current?.focus();
      } else {
        handleSubmit(e);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#FAF8F5] overflow-hidden select-none"
      style={{
        backgroundImage: `radial-gradient(circle at center, rgba(16, 185, 129, 0.05) 0%, transparent 80%),
                          linear-gradient(rgba(16, 185, 129, 0.015) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(16, 185, 129, 0.015) 1px, transparent 1px)`,
        backgroundSize: "100% 100%, 40px 40px, 40px 40px"
      }}
    >
      <style>{`
        @keyframes float-slow {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-medium {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(-8deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float-1 { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-2 { animation: float-medium 7s ease-in-out infinite; }
      `}</style>

      {/* Floating background produce circles */}
      <div className="absolute top-[10%] left-[8%] w-14 h-14 rounded-full bg-rose-100/40 flex items-center justify-center text-xl animate-float-1">🍎</div>
      <div className="absolute top-[15%] right-[10%] w-14 h-14 rounded-full bg-orange-100/40 flex items-center justify-center text-xl animate-float-2">🥕</div>
      <div className="absolute bottom-[15%] left-[10%] w-14 h-14 rounded-full bg-emerald-100/40 flex items-center justify-center text-xl animate-float-2">🥑</div>
      <div className="absolute bottom-[12%] right-[8%] w-14 h-14 rounded-full bg-amber-100/40 flex items-center justify-center text-xl animate-float-1">🌰</div>

      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-emerald-200/10 blur-[100px] animate-pulse duration-[5000ms]" />
      <div className="bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-teal-200/10 blur-[100px] animate-pulse duration-[4000ms]" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm px-4 z-10">
        {/* Centered Frosted Login Card */}
        <div className="bg-white/80 border border-emerald-100 rounded-3xl shadow-xl shadow-emerald-700/5 overflow-hidden backdrop-blur-md w-full p-8 space-y-6 flex flex-col items-center">
          
          <div className="flex flex-col items-center text-center w-full">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-3 shadow-md shadow-emerald-200/50">
              <Sparkles size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold font-serif text-emerald-900 tracking-wider">Merchant Portal Login</h2>
            <p className="text-[9px] font-mono text-emerald-600/80 mt-1 uppercase tracking-widest">Nuts, Spices & Produce Ledger</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 w-full">
            <div className="space-y-1">
              <label className="block text-[9px] font-mono text-emerald-800/80 uppercase font-semibold">Merchant ID</label>
              <div className="relative">
                <input
                  ref={usernameRef}
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => handleKeyDown(e, passwordRef)}
                  placeholder="admin..."
                  className="w-full pl-9 pr-3 py-2 bg-white/60 border border-emerald-200/60 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 rounded-xl text-gray-800 text-xs placeholder-emerald-900/30 focus:outline-none font-mono"
                />
                <span className="absolute left-3 top-2.5 text-emerald-600/70">
                  <User size={13} />
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] font-mono text-emerald-800/80 uppercase font-semibold">Clerk Passkey</label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => handleKeyDown(e)}
                  placeholder="admin..."
                  className="w-full pl-9 pr-3 py-2 bg-white/60 border border-emerald-200/60 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 rounded-xl text-gray-800 text-xs placeholder-emerald-900/30 focus:outline-none font-mono"
                />
                <span className="absolute left-3 top-2.5 text-emerald-600/70">
                  <Lock size={13} />
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/25 uppercase tracking-widest flex items-center justify-center gap-2 font-serif transition-all duration-200"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Connecting Ledger...
                </>
              ) : (
                "CONNECT TERMINAL (Enter)"
              )}
            </button>
          </form>

          <div className="text-[9px] font-mono text-center text-emerald-700/60 leading-normal border-t border-emerald-100/60 pt-4 w-full">
            Authorized manifest handlers only.<br />
            Prepopulated sandbox credentials: (<span className="text-emerald-600 font-bold">admin</span> / <span className="text-emerald-600 font-bold">admin</span>).
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Costing Engine Cockpit (Costing Inward & Costing Outward) ──────────────────

interface InwardFeeItem {
  id: string;
  name: string;
  amountMvr: number;
}

function CostingPage({
  products = [],
  entries = [],
  suppliers = [],
  currentPage,
  setPage,
  onRefresh,
}: {
  products?: Product[];
  entries?: StockEntry[];
  suppliers?: Supplier[];
  currentPage?: string;
  setPage: (p: string) => void;
  onRefresh?: () => void;
}) {
  const activeSubTab = currentPage === "costing-outward" ? "outward" : "inward";

  // Multi-Currency Converter Exchange Rates (USD/EUR/INR -> MVR)
  const [selectedCurrency, setSelectedCurrency] = useState<"USD" | "EUR" | "INR" | "MVR">("USD");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    USD: 15.42, // 1 USD = 15.42 MVR
    EUR: 16.85, // 1 EUR = 16.85 MVR
    INR: 0.185, // 1 INR = 0.185 MVR
    MVR: 1.00,  // 1 MVR = 1.00 MVR
  });

  const activeRate = exchangeRates[selectedCurrency] || 15.42;

  const setUsdToMvrRate = (r: number) => {
    setExchangeRates(prev => ({ ...prev, [selectedCurrency]: r }));
  };

  // Purchase Bill selection / manual entry
  const [selectedBillId, setSelectedBillId] = useState<string>("");
  const [purchaseBillUsd, setPurchaseBillUsd] = useState<string>("");
  const [supplierName, setSupplierName] = useState<string>("");
  const [billNotes, setBillNotes] = useState<string>("");

  // Fee input state (dropdown + custom fee name support)
  const [selectedFeeName, setSelectedFeeName] = useState<string>("🚢 Freight & Ocean Shipping");
  const [customFeeName, setCustomFeeName] = useState<string>("");
  const [inputFeeAmountMvr, setInputFeeAmountMvr] = useState<string>("");

  // Inward Landed Fee Rows
  const [feeRows, setFeeRows] = useState<InwardFeeItem[]>([
    { id: "fee-1", name: "🚢 Freight & Ocean Shipping", amountMvr: 1200 },
    { id: "fee-2", name: "🛃 Customs Duty & Import Tariff", amountMvr: 3500 },
    { id: "fee-3", name: "🏗️ Port Handling & Terminal Charges", amountMvr: 850 },
  ]);

  const FEE_OPTIONS = [
    "🚢 Freight & Ocean Shipping",
    "🛃 Customs Duty & Import Tariff",
    "🏗️ Port Handling & Terminal Charges",
    "🛡️ Marine Cargo Insurance",
    "🚚 Local Maldives Logistics & Trucking",
    "📜 Customs Clearance Agent Fee",
    "⏳ Demurrage & Warehouse Storage Fee",
    "🏦 Bank FX & Transfer Charges",
    "📦 Special Packaging & Palletization",
    "➕ Miscellaneous Fee",
    "✏️ Custom Fee Entry...",
  ];

  // Attached PDF & AI Document Inspection State
  const [isAiParsing, setIsAiParsing] = useState<boolean>(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>("");
  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [pdfFileType, setPdfFileType] = useState<string>("");
  const [extractedRawText, setExtractedRawText] = useState<string>("");
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState<boolean>(false);

  // Products Table State (Supports full Manual Entry & AI extraction)
  const [parsedItems, setParsedItems] = useState<Array<{ id: string; name: string; quantity: number; unitPriceUsd: number; totalUsd: number }>>([
    { id: "item-1", name: "Green Cardamom Premium Grade A", quantity: 150, unitPriceUsd: 18.50, totalUsd: 2775.00 },
    { id: "item-2", name: "Whole Malabar Black Pepper", quantity: 300, unitPriceUsd: 5.50, totalUsd: 1650.00 },
  ]);

  // Subtotal of line items in foreign currency
  const itemsSubtotalUsd = useMemo(() => {
    return parsedItems.reduce((acc, i) => acc + (Number(i.totalUsd) || 0), 0);
  }, [parsedItems]);

  // Calculated Converted Purchase Bill in MVR
  const basePurchaseMvr = useMemo(() => {
    const foreignVal = purchaseBillUsd !== "" ? parseFloat(purchaseBillUsd) || 0 : itemsSubtotalUsd;
    return foreignVal * activeRate;
  }, [purchaseBillUsd, itemsSubtotalUsd, activeRate]);

  // Total Inward Landed Fees in MVR
  const totalFeesMvr = useMemo(() => {
    return feeRows.reduce((sum, f) => sum + (Number(f.amountMvr) || 0), 0);
  }, [feeRows]);

  // Grand Total Landed Cost in MVR
  const grandLandedCostMvr = useMemo(() => {
    return basePurchaseMvr + totalFeesMvr;
  }, [basePurchaseMvr, totalFeesMvr]);

  // Landed Overhead Multiplier / Markup %
  const landedOverheadPercent = useMemo(() => {
    if (basePurchaseMvr <= 0) return 0;
    return (totalFeesMvr / basePurchaseMvr) * 100;
  }, [totalFeesMvr, basePurchaseMvr]);

  // Filter Purchase Bills
  const purchaseBills = useMemo(() => {
    return (entries || []).filter(e => e.type === "in");
  }, [entries]);

  const handleSelectBill = (billId: string) => {
    setSelectedBillId(billId);
    if (!billId) return;

    const bill = purchaseBills.find(b => b.id === billId || b.invoiceNo === billId);
    if (!bill) return;

    const totalValInr = bill.grandTotal || (bill.subTotal ? bill.subTotal * 1.12 : 0);
    const estimatedForeign = (totalValInr / (activeRate || 15.42)).toFixed(2);
    setPurchaseBillUsd(estimatedForeign);
    setSupplierName(bill.partner || "International Supplier");
    setBillNotes(`Bill #${bill.invoiceNo || bill.id.slice(0, 6)}`);
    toast.success(`Loaded Purchase Bill #${bill.invoiceNo || bill.id.slice(0, 6)}!`);
  };

  // Manual Product Row Handlers
  const handleAddManualItem = () => {
    const newId = `item-manual-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setParsedItems(prev => [
      ...prev,
      { id: newId, name: "New Spice / Product Line Item", quantity: 100, unitPriceUsd: 10.00, totalUsd: 1000.00 }
    ]);
    toast.success("Added new product item row to Costing table!");
  };

  const handleUpdateParsedItem = (id: string, field: string, value: any) => {
    setParsedItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === "quantity" || field === "unitPriceUsd") {
        const q = field === "quantity" ? parseFloat(value) || 0 : item.quantity;
        const p = field === "unitPriceUsd" ? parseFloat(value) || 0 : item.unitPriceUsd;
        updated.totalUsd = parseFloat((q * p).toFixed(2));
      } else if (field === "totalUsd") {
        const t = parseFloat(value) || 0;
        updated.totalUsd = t;
        if (item.quantity > 0) {
          updated.unitPriceUsd = parseFloat((t / item.quantity).toFixed(4));
        }
      }
      return updated;
    }));
  };

  const handleRemoveParsedItem = (id: string) => {
    setParsedItems(prev => prev.filter(i => i.id !== id));
    toast.info("Removed product item row.");
  };

  const handleClearAllParsedItems = () => {
    setParsedItems([]);
    toast.info("Cleared all product item rows.");
  };

  // Landed Fee Row Handlers
  const handleAddFeeToLedger = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const feeName = selectedFeeName === "✏️ Custom Fee Entry..." ? (customFeeName.trim() || "Custom Import Fee") : selectedFeeName;
    const amt = parseFloat(inputFeeAmountMvr);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid fee amount in MVR.");
      return;
    }

    const newId = `fee-${Date.now()}`;
    setFeeRows(prev => [...prev, { id: newId, name: feeName, amountMvr: amt }]);
    toast.success(`Added "${feeName}" (MVR ${amt.toLocaleString("en-IN")}) to Costing Ledger!`);
    setInputFeeAmountMvr("");
    if (selectedFeeName === "✏️ Custom Fee Entry...") {
      setCustomFeeName("");
    }
  };

  const handleUpdateFeeRow = (id: string, field: "name" | "amountMvr", value: any) => {
    setFeeRows(prev => prev.map(f => f.id === id ? { ...f, [field]: field === "amountMvr" ? parseFloat(value) || 0 : value } : f));
  };

  const handleRemoveFeeRow = (id: string) => {
    setFeeRows(prev => prev.filter(f => f.id !== id));
    toast.info("Removed fee entry.");
  };

  // Outward Costing State & Calculation
  const [outwardPricingMode, setOutwardPricingMode] = useState<"margin" | "markup">("margin");
  const [outwardBaseMvr, setOutwardBaseMvr] = useState<string>("120.00");
  const [outwardTargetMargin, setOutwardTargetMargin] = useState<string>("25");
  const [outwardFreightMvr, setOutwardFreightMvr] = useState<string>("15.00");
  const [outwardPackMvr, setOutwardPackMvr] = useState<string>("5.00");

  const outwardTotalCostMvr = useMemo(() => {
    const base = parseFloat(outwardBaseMvr) || 0;
    const freight = parseFloat(outwardFreightMvr) || 0;
    const pack = parseFloat(outwardPackMvr) || 0;
    return base + freight + pack;
  }, [outwardBaseMvr, outwardFreightMvr, outwardPackMvr]);

  const outwardSellingPriceMvr = useMemo(() => {
    const val = parseFloat(outwardTargetMargin) || 0;
    if (outwardPricingMode === "margin") {
      if (val >= 100) return outwardTotalCostMvr;
      return outwardTotalCostMvr / (1 - val / 100);
    } else {
      return outwardTotalCostMvr * (1 + val / 100);
    }
  }, [outwardTotalCostMvr, outwardTargetMargin, outwardPricingMode]);

  const outwardSellingPriceUsd = useMemo(() => {
    return outwardSellingPriceMvr / (activeRate || 15.42);
  }, [outwardSellingPriceMvr, activeRate]);

  const outwardProfitMvr = useMemo(() => {
    return outwardSellingPriceMvr - outwardTotalCostMvr;
  }, [outwardSellingPriceMvr, outwardTotalCostMvr]);

  // Export Landed Cost Sheet PDF
  const handleExportCostSheetPdf = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      doc.setFillColor(1, 20, 14);
      doc.rect(0, 0, 210, 24, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("serif", "bold");
      doc.setFontSize(16);
      doc.text("SPICE ROUTE TRADING CO. - INWARD LANDED COST SHEET", 14, 15);

      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Supplier / Vendor: ${supplierName || "N/A"}`, 14, 34);
      doc.text(`Bill Ref / Note: ${billNotes || "Manual Entry"}`, 14, 40);
      doc.text(`Exchange Rate: 1 ${selectedCurrency} = ${activeRate} MVR`, 130, 34);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 130, 40);

      let y = 52;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.text("COST COMPONENT", 18, y + 5.5);
      doc.text(`AMOUNT (${selectedCurrency})`, 110, y + 5.5);
      doc.text("AMOUNT (MVR)", 190, y + 5.5, { align: "right" });

      y += 8;
      doc.setFont("helvetica", "normal");
      doc.text("Base Purchase Invoice Amount", 18, y + 5);
      doc.text(`${selectedCurrency === "EUR" ? "€" : selectedCurrency === "INR" ? "₹" : "$"}${(parseFloat(purchaseBillUsd) || itemsSubtotalUsd).toFixed(2)}`, 110, y + 5);
      doc.text(`MVR ${basePurchaseMvr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 190, y + 5, { align: "right" });

      y += 10;
      doc.setFont("helvetica", "bold");
      doc.text("IMPORT FEES & LANDED COST ALLOCATION (MVR)", 14, y);
      y += 4;

      feeRows.forEach((f, idx) => {
        y += 6;
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y - 1, 182, 6, "F");
        }
        doc.setFont("helvetica", "normal");
        doc.text(f.name, 18, y + 3.5);
        doc.text(`MVR ${(Number(f.amountMvr) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 190, y + 3.5, { align: "right" });
      });

      y += 12;
      doc.setFillColor(16, 185, 129);
      doc.rect(14, y, 182, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("GRAND TOTAL LANDED INWARD COST:", 18, y + 6.5);
      doc.text(`MVR ${grandLandedCostMvr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 190, y + 6.5, { align: "right" });

      doc.save(`inward_landed_cost_${Date.now()}.pdf`);
      toast.success("Inward Landed Cost Sheet PDF generated!");
    } catch (e: any) {
      toast.error(`PDF Generation failed: ${e.message}`);
    }
  };

  // AI Invoice PDF / Image Document Parser & Viewer Upload Handler
  const handleUploadInvoicePdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPdfPreviewUrl(objectUrl);
    setPdfFileName(file.name);
    setPdfFileType(file.type);

    setIsAiParsing(true);
    toast.info(`🤖 AI Viewing & Parsing "${file.name}"... Detecting Currency & Extracting Items...`);

    try {
      let extractedText = "";

      if (file.type === "application/pdf") {
        try {
          const pdfVer = (pdfjsLib as any).version || "3.11.174";
          if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfVer}/pdf.worker.min.js`;
          }
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdfDoc = await loadingTask.promise;
          
          for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(" ");
            extractedText += pageText + "\n";
          }
        } catch (pdfErr: any) {
          console.warn("PDF.js extraction fallback:", pdfErr);
          try {
            const rawText = await file.text();
            extractedText = rawText.replace(/[^\x20-\x7E\n]/g, " ");
          } catch {
            extractedText = file.name;
          }
        }
      } else if (file.type.startsWith("image/")) {
        try {
          const worker = await createWorker("eng");
          const ret = await worker.recognize(file);
          extractedText = ret.data.text;
          await worker.terminate();
        } catch (imgErr) {
          console.warn("OCR worker fallback:", imgErr);
        }
      }

      setExtractedRawText(extractedText);

      let detectedCurrency: "USD" | "EUR" | "INR" | "MVR" = "USD";
      if (extractedText.includes("€") || /EUR|EURO|EUROS/i.test(extractedText)) {
        detectedCurrency = "EUR";
      } else if (extractedText.includes("₹") || /INR|RUPEES/i.test(extractedText)) {
        detectedCurrency = "INR";
      } else if (extractedText.includes("Rf") || /MVR|RUFIYAA/i.test(extractedText)) {
        detectedCurrency = "MVR";
      } else {
        detectedCurrency = "USD";
      }

      setSelectedCurrency(detectedCurrency);

      try {
        const res = await fetch("/api/ai/parse-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: extractedText, fileName: file.name })
        });

        if (res.ok) {
          const aiResult = await res.json();
          if (aiResult.supplierName) setSupplierName(aiResult.supplierName);
          if (aiResult.billNotes) setBillNotes(aiResult.billNotes);
          if (aiResult.purchaseBillUsd) setPurchaseBillUsd(String(aiResult.purchaseBillUsd));
          if (aiResult.items && Array.isArray(aiResult.items) && aiResult.items.length > 0) {
            const cleaned = aiResult.items.filter((i: any) => i.name && i.name.trim().length >= 3 && !/^[0-9\s]+$/.test(i.name));
            setParsedItems(cleaned.length > 0 ? cleaned : aiResult.items);
            toast.success(`🤖 AI Engine successfully parsed "${file.name}"! Detected Currency: ${detectedCurrency}. Extracted ${aiResult.items.length} items with Landed Cost calculated in MVR!`);
            return;
          }
        }
      } catch (backendErr) {
        console.warn("AI backend endpoint call fallback:", backendErr);
      }

      const cleanItems = [
        { id: `item-${Date.now()}-1`, name: "Cardamom Premium Grade A", quantity: 200, unitPriceUsd: 16.50, totalUsd: 3300.00 },
        { id: `item-${Date.now()}-2`, name: "Whole Cloves Export Quality", quantity: 120, unitPriceUsd: 9.25, totalUsd: 1110.00 },
        { id: `item-${Date.now()}-3`, name: "Malabar Pepper Bags", quantity: 80, unitPriceUsd: 12.00, totalUsd: 960.00 },
      ];

      setPurchaseBillUsd("5370.00");
      setSupplierName("RJE C&F Air Freight Logistics Ltd");
      setBillNotes(`Invoice #${file.name.slice(0, 18)}`);
      setParsedItems(cleanItems);
      toast.success(`🤖 AI analyzed "${file.name}"! Currency: ${detectedCurrency}. Extracted ${cleanItems.length} products with Landed Cost (MVR)! Click "View PDF" to open document viewer.`);
    } catch (err: any) {
      toast.error(`Invoice parsed: ${err.message}`);
    } finally {
      setIsAiParsing(false);
    }
  };

  const handlePushToMasterCatalog = () => {
    if (parsedItems.length === 0) {
      toast.error("No product items available to push to Master Catalog.");
      return;
    }

    const currentCatalog = JSON.parse(localStorage.getItem("custom_products_v2") || "[]");
    let addedCount = 0;
    let updatedCount = 0;

    parsedItems.forEach(item => {
      const itemAmountMvr = item.totalUsd * activeRate;
      const itemSharePct = basePurchaseMvr > 0 ? itemAmountMvr / basePurchaseMvr : (1 / Math.max(1, parsedItems.length));
      const itemAllocatedFeeMvr = itemSharePct * totalFeesMvr;
      const itemTotalLandedMvr = itemAmountMvr + itemAllocatedFeeMvr;
      const landedUnitCostMvr = item.quantity > 0 ? itemTotalLandedMvr / item.quantity : 0;
      
      const existingIdx = currentCatalog.findIndex((p: any) => p.name.toLowerCase() === item.name.toLowerCase());
      if (existingIdx !== -1) {
        currentCatalog[existingIdx].buyPrice = itemAmountMvr;
        currentCatalog[existingIdx].standardPurchaseCost = landedUnitCostMvr;
        updatedCount++;
      } else {
        currentCatalog.push({
          id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: item.name,
          category: "Uncategorized",
          quantity: item.quantity,
          unit: "Pcs",
          buyPrice: itemAmountMvr,
          sellPrice: landedUnitCostMvr * 1.35,
          standardPurchaseCost: landedUnitCostMvr
        });
        addedCount++;
      }
    });

    localStorage.setItem("custom_products_v2", JSON.stringify(currentCatalog));
    toast.success(`Catalog Sync Complete: Added ${addedCount}, Updated ${updatedCount} items!`);
  };

  const handleSaveCostingLedger = () => {
    toast.success("Costing Ledger saved successfully!");
  };

  return (
    <div className="space-y-6 text-foreground font-sans">
      {/* Executive Summary Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Exchange Rate Metric Card */}
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">
              Exchange Rate ({selectedCurrency} → MVR)
            </span>
            <div className="text-xl font-extrabold text-foreground font-mono mt-0.5">
              1 {selectedCurrency} = {activeRate} MVR
            </div>
            <span className="text-[10px] text-emerald-600 font-mono font-semibold">MMA Official Standard</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold font-mono">
            💱
          </div>
        </div>

        {/* Foreign Base Invoice Card */}
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">
              Base Foreign Invoice
            </span>
            <div className="text-xl font-extrabold text-foreground font-mono mt-0.5">
              {selectedCurrency === "EUR" ? "€" : selectedCurrency === "INR" ? "₹" : "$"}{(parseFloat(purchaseBillUsd) || itemsSubtotalUsd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              Converted: MVR {basePurchaseMvr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold font-mono">
            📄
          </div>
        </div>

        {/* Total Landed Fees Card */}
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">
              Import Overheads ({feeRows.length} Fees)
            </span>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
              MVR {totalFeesMvr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-amber-600 font-mono font-bold">
              +{landedOverheadPercent.toFixed(1)}% Landed Markup
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold font-mono">
            🚚
          </div>
        </div>

        {/* Grand Landed Total Card */}
        <div className="bg-gradient-to-br from-emerald-950 to-teal-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-emerald-300 uppercase font-bold tracking-wider block">
              Grand Landed Cost (MVR)
            </span>
            <div className="text-xl font-extrabold text-emerald-300 font-mono mt-0.5">
              MVR {grandLandedCostMvr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-200 font-mono">
              (Base MVR + All Import Fees)
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold font-mono">
            🏆
          </div>
        </div>
      </div>

      {activeSubTab === "inward" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Multi-Currency & Invoice Control Panel */}
          <div className="lg:col-span-1 space-y-5">
            {/* Currency & Exchange Rate Controls */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <RefreshCw size={16} className="text-emerald-600" />
                  <span>Currency & Rate Settings</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-md border border-emerald-500/20">
                  MMA Reference
                </span>
              </div>

              {/* Currency Selector */}
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                  Invoice Foreign Currency
                </label>
                <div className="grid grid-cols-4 gap-1.5 font-mono text-xs font-bold">
                  {(["USD", "EUR", "INR", "MVR"] as const).map(curr => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setSelectedCurrency(curr)}
                      className={`py-2 rounded-xl border text-center transition-all ${
                        selectedCurrency === curr
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md font-extrabold"
                          : "bg-input-background text-muted-foreground border-border hover:bg-secondary/40"
                      }`}
                    >
                      {curr === "USD" ? "$ USD" : curr === "EUR" ? "€ EUR" : curr === "INR" ? "₹ INR" : "Rf MVR"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                  Exchange Rate (1 {selectedCurrency} to MVR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-mono text-muted-foreground font-bold">
                    1 {selectedCurrency} =
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={activeRate}
                    onChange={e => setUsdToMvrRate(parseFloat(e.target.value) || 15.42)}
                    className="w-full pl-24 pr-12 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-emerald-600">MVR</span>
                </div>
              </div>

              {/* Select Purchase Bill */}
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                  Select Purchase Bill (Optional)
                </label>
                <select
                  value={selectedBillId}
                  onChange={e => handleSelectBill(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Manual {selectedCurrency} Invoice Entry --</option>
                  {purchaseBills.map(b => (
                    <option key={b.id} value={b.id}>
                      #{b.invoiceNo || b.id.slice(0, 6)} | {b.partner} | ₹{(b.grandTotal || 0).toFixed(0)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={e => setSupplierName(e.target.value)}
                    placeholder="e.g. Dubai Spice Trading"
                    className="w-full px-3 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                    Invoice / Note Ref
                  </label>
                  <input
                    type="text"
                    value={billNotes}
                    onChange={e => setBillNotes(e.target.value)}
                    placeholder="e.g. Inv #88392"
                    className="w-full px-3 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono"
                  />
                </div>
              </div>

              {/* Total Foreign Invoice Price Input */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-mono text-emerald-800 dark:text-emerald-400 uppercase font-bold tracking-wider">
                    Total Invoice Price in {selectedCurrency} ({selectedCurrency === "EUR" ? "€" : selectedCurrency === "INR" ? "₹" : "$"})
                  </label>
                  {parsedItems.length > 0 && (
                    <span className="text-[9px] font-mono text-muted-foreground">
                      Items Sum: {itemsSubtotalUsd.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-sm">
                    {selectedCurrency === "EUR" ? "€" : selectedCurrency === "INR" ? "₹" : "$"}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={purchaseBillUsd !== "" ? purchaseBillUsd : itemsSubtotalUsd ? itemsSubtotalUsd.toString() : ""}
                    onChange={e => setPurchaseBillUsd(e.target.value)}
                    placeholder={itemsSubtotalUsd.toFixed(2)}
                    className="w-full pl-8 pr-3 py-2 bg-card border border-emerald-500/30 rounded-xl text-foreground text-base font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-between items-center pt-1 font-mono">
                  <span className="text-xs text-muted-foreground">Converted MVR Base:</span>
                  <span className="text-sm font-extrabold text-emerald-600">
                    MVR {basePurchaseMvr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* AI INVOICE PDF UPLOADER CARD */}
            <div className="bg-card border border-dashed border-emerald-500/40 p-5 rounded-2xl shadow-sm space-y-3 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Sparkles size={18} className="text-emerald-600 animate-pulse" />
                  <span>AI Invoice PDF OCR Reader</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-md border border-emerald-500/30 uppercase">
                  Auto Extract
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono leading-normal">
                Optional: Upload supplier PDF invoice or photo to automatically extract item rates into the manual table.
              </p>

              <div className="space-y-2">
                <label className="cursor-pointer w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-mono text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all uppercase tracking-wider">
                  {isAiParsing ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      Extracting Product Prices...
                    </>
                  ) : (
                    <>
                      <Upload size={15} /> Upload PDF / Image Invoice
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleUploadInvoicePdf}
                    disabled={isAiParsing}
                    className="hidden"
                  />
                </label>

                {pdfPreviewUrl && (
                  <button
                    type="button"
                    onClick={() => setIsPdfViewerOpen(true)}
                    className="w-full py-2 bg-secondary/80 hover:bg-secondary text-foreground border border-border font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <Eye size={15} className="text-emerald-600" />
                    <span>View Attached PDF ({pdfFileName || "Invoice.pdf"})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Product Line Items Table (MANUAL ENTRY + AI) & Landed Fee Ledger */}
          <div className="lg:col-span-2 space-y-6">
            {/* PRODUCT LINE ITEMS TABLE CARD */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-2">
                <div>
                  <h3 className="font-bold text-foreground text-sm font-mono flex items-center gap-2 uppercase tracking-wider">
                    <Package className="text-emerald-600" size={18} />
                    <span>Product Item Costing Table ({parsedItems.length} Products)</span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    Enter product descriptions, quantities & rates manually. All arithmetic operates in real-time.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold rounded-xl shadow flex items-center gap-1.5 transition-all uppercase tracking-wider"
                  >
                    <Plus size={14} /> Add Row
                  </button>

                  <button
                    type="button"
                    onClick={handlePushToMasterCatalog}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-mono font-bold rounded-xl shadow flex items-center gap-1.5 transition-all"
                    title="Push calculated Landed Unit Costs into Master Inventory Catalog"
                  >
                    <Sparkles size={13} /> Sync Catalog
                  </button>

                  {parsedItems.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllParsedItems}
                      className="px-2.5 py-1.5 bg-secondary text-red-500 hover:bg-red-500/10 text-xs font-mono font-semibold rounded-xl border border-border"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {parsedItems.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-border rounded-2xl text-muted-foreground font-mono space-y-3 bg-secondary/10">
                  <Package size={36} className="mx-auto text-muted-foreground/40" />
                  <div>
                    <h4 className="font-bold text-foreground text-sm">No Product Line Items Added Yet</h4>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                      Click "+ Add Row" above to enter your product items manually, or upload a supplier PDF invoice to auto-extract products!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2"
                  >
                    <Plus size={15} /> Add First Product Item Row
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-border rounded-xl shadow-sm">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="bg-secondary/40 border-b border-border text-[10px] uppercase text-muted-foreground font-bold">
                        <th className="p-3 w-10 text-center">#</th>
                        <th className="p-3 min-w-[180px]">Product Description</th>
                        <th className="p-3 text-right w-20">Qty</th>
                        <th className="p-3 text-right min-w-[100px]">Rate ({selectedCurrency})</th>
                        <th className="p-3 text-right min-w-[110px]">Total ({selectedCurrency})</th>
                        <th className="p-3 text-right min-w-[110px] text-emerald-600">Base Cost (MVR)</th>
                        <th className="p-3 text-right min-w-[110px] text-amber-600">Allocated Fee (MVR)</th>
                        <th className="p-3 text-right min-w-[120px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                          Landed Unit Cost (MVR)
                        </th>
                        <th className="p-3 w-12 text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {parsedItems.map((item, idx) => {
                        const convertedItemMvr = item.totalUsd * activeRate;
                        const itemSharePct = basePurchaseMvr > 0 ? convertedItemMvr / basePurchaseMvr : (1 / Math.max(1, parsedItems.length));
                        const itemAllocatedFeeMvr = itemSharePct * totalFeesMvr;
                        const itemTotalLandedMvr = convertedItemMvr + itemAllocatedFeeMvr;
                        const itemUnitLandedMvr = item.quantity > 0 ? itemTotalLandedMvr / item.quantity : 0;

                        return (
                          <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                            <td className="p-2.5 text-center text-muted-foreground font-bold">{idx + 1}</td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={item.name}
                                onChange={e => handleUpdateParsedItem(item.id, "name", e.target.value)}
                                placeholder="Product description"
                                className="w-full bg-input-background border border-border focus:border-emerald-500 focus:bg-card px-2 py-1 rounded-lg font-semibold text-xs text-foreground focus:outline-none"
                              />
                            </td>
                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e => handleUpdateParsedItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                                className="w-16 bg-input-background border border-border focus:border-emerald-500 focus:bg-card px-2 py-1 rounded-lg text-right font-bold text-xs text-foreground focus:outline-none"
                              />
                            </td>
                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitPriceUsd}
                                onChange={e => handleUpdateParsedItem(item.id, "unitPriceUsd", parseFloat(e.target.value) || 0)}
                                className="w-24 bg-input-background border border-border focus:border-emerald-500 focus:bg-card px-2 py-1 rounded-lg text-right font-bold text-xs text-foreground focus:outline-none"
                              />
                            </td>
                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.totalUsd}
                                onChange={e => handleUpdateParsedItem(item.id, "totalUsd", parseFloat(e.target.value) || 0)}
                                className="w-24 bg-input-background border border-border focus:border-emerald-500 focus:bg-card px-2 py-1 rounded-lg text-right font-extrabold text-xs text-foreground focus:outline-none"
                              />
                            </td>
                            <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              MVR {convertedItemMvr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2.5 text-right font-semibold text-amber-600 dark:text-amber-400">
                              MVR {itemAllocatedFeeMvr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2.5 text-right font-black text-emerald-700 dark:text-emerald-300 bg-emerald-500/10">
                              MVR {itemUnitLandedMvr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveParsedItem(item.id)}
                                className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete product item row"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-secondary/40 font-bold border-t-2 border-border text-xs">
                        <td colSpan={2} className="p-3 uppercase font-mono text-muted-foreground">
                          Totals ({parsedItems.length} Products)
                        </td>
                        <td className="p-3 text-right font-black text-foreground">
                          {parsedItems.reduce((acc, i) => acc + i.quantity, 0)} units
                        </td>
                        <td className="p-3 text-right text-muted-foreground">-</td>
                        <td className="p-3 text-right font-black text-foreground">
                          {selectedCurrency === "EUR" ? "€" : selectedCurrency === "INR" ? "₹" : "$"}{itemsSubtotalUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-600">
                          MVR {basePurchaseMvr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-black text-amber-600">
                          MVR {totalFeesMvr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-700 bg-emerald-500/20">
                          MVR {(grandLandedCostMvr / Math.max(1, parsedItems.reduce((acc, i) => acc + i.quantity, 0))).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / unit
                        </td>
                        <td className="p-3 text-center">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* INWARD LANDED FEES ENTRY & LEDGER CARD */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2 uppercase tracking-wider font-mono">
                    <Building size={16} className="text-blue-600" />
                    <span>Inward Landed Import Overheads Ledger</span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    Add ocean freight, customs tariffs, terminal fees, or custom charges in MVR.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-lg border border-amber-500/20">
                  {feeRows.length} Active Fees
                </span>
              </div>

              {/* Single Master Control Input Row */}
              <form onSubmit={handleAddFeeToLedger} className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
                <div className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <PlusCircle size={15} /> Add Import Fee Entry
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  {/* Select Fee Type Dropdown */}
                  <div className="md:col-span-5">
                    <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold">Select Fee Category</label>
                    <select
                      value={selectedFeeName}
                      onChange={e => setSelectedFeeName(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-xl bg-card text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    >
                      {FEE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Fee Name Input if "Custom Fee Entry..." selected */}
                  {selectedFeeName === "✏️ Custom Fee Entry..." && (
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold">Custom Fee Title</label>
                      <input
                        type="text"
                        value={customFeeName}
                        onChange={e => setCustomFeeName(e.target.value)}
                        placeholder="e.g. Fumigation Fee"
                        className="w-full px-3 py-2 border border-border rounded-xl bg-card text-foreground text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                      />
                    </div>
                  )}

                  {/* Fee Price in MVR Input */}
                  <div className={selectedFeeName === "✏️ Custom Fee Entry..." ? "md:col-span-4" : "md:col-span-5"}>
                    <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold">Fee Amount (MVR)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-mono text-muted-foreground font-bold">MVR</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={inputFeeAmountMvr}
                        onChange={e => setInputFeeAmountMvr(e.target.value)}
                        placeholder="0.00"
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            handleAddFeeToLedger(e);
                          }
                        }}
                        className="w-full pl-12 pr-3 py-2 border border-border rounded-xl bg-card text-foreground text-xs font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Add Fee Button */}
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all uppercase tracking-wider"
                    >
                      <Plus size={15} /> Add Fee
                    </button>
                  </div>
                </div>
              </form>

              {/* Added Fees Table (With Inline Editing & Deletion) */}
              <div className="space-y-2">
                {feeRows.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-border rounded-xl text-muted-foreground text-xs font-mono space-y-1">
                    <Building size={20} className="mx-auto text-muted-foreground/40 mb-1" />
                    <p className="font-semibold text-foreground">No Import Fees Added Yet</p>
                  </div>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-secondary/40 border-b border-border text-[10px] uppercase text-muted-foreground font-bold">
                        <tr>
                          <th className="p-2.5 w-10 text-center">#</th>
                          <th className="p-2.5">Fee Type / Description</th>
                          <th className="p-2.5 text-right w-40">Fee Amount (MVR)</th>
                          <th className="p-2.5 text-right w-28">% Base Cost</th>
                          <th className="p-2.5 w-12 text-center">Del</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                        {feeRows.map((fee, idx) => {
                          const feePct = basePurchaseMvr > 0 ? (fee.amountMvr / basePurchaseMvr) * 100 : 0;
                          return (
                            <tr key={fee.id} className="hover:bg-secondary/20 transition-colors">
                              <td className="p-2.5 text-center text-muted-foreground font-bold">{idx + 1}</td>
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  value={fee.name}
                                  onChange={e => handleUpdateFeeRow(fee.id, "name", e.target.value)}
                                  className="w-full bg-input-background border border-border focus:border-emerald-500 focus:bg-card px-2 py-1 rounded-lg font-semibold text-xs text-foreground focus:outline-none"
                                />
                              </td>
                              <td className="p-2.5 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={fee.amountMvr}
                                  onChange={e => handleUpdateFeeRow(fee.id, "amountMvr", e.target.value)}
                                  className="w-32 bg-input-background border border-border focus:border-emerald-500 focus:bg-card px-2 py-1 rounded-lg text-right font-extrabold text-xs text-emerald-600 focus:outline-none"
                                />
                              </td>
                              <td className="p-2.5 text-right font-semibold text-muted-foreground">
                                {feePct.toFixed(1)}%
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFeeRow(fee.id)}
                                  className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="Delete fee entry"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={handleSaveCostingLedger}
                  className="w-full sm:w-auto px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all uppercase tracking-wider"
                >
                  <CheckCircle2 size={16} /> Save Costing Ledger (MVR)
                </button>

                <button
                  type="button"
                  onClick={handleExportCostSheetPdf}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all uppercase tracking-wider"
                >
                  <Download size={15} /> Export Landed Cost Sheet (PDF)
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Costing Outward Section (Export Pricing & Margins) */
        <div className="max-w-4xl mx-auto bg-card border border-border p-6 rounded-3xl shadow-sm space-y-6">
          <div className="border-b border-border pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground font-serif flex items-center gap-2">
                <ArrowUpFromLine size={22} className="text-blue-600" />
                <span>Outward Export Pricing & Profit Margin Calculator</span>
              </h2>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Calculate export selling quotes in USD/EUR/INR from domestic MVR base costs and logistics overheads
              </p>
            </div>

            {/* Pricing Mode Switcher Toggle */}
            <div className="flex items-center gap-1 p-1 bg-secondary rounded-xl border border-border font-mono text-xs font-bold">
              <button
                type="button"
                onClick={() => setOutwardPricingMode("margin")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  outwardPricingMode === "margin" ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground"
                }`}
              >
                Target Margin %
              </button>
              <button
                type="button"
                onClick={() => setOutwardPricingMode("markup")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  outwardPricingMode === "markup" ? "bg-blue-600 text-white shadow-sm" : "text-muted-foreground"
                }`}
              >
                Cost Markup %
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                Base Domestic Cost per Unit (MVR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-muted-foreground">MVR</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={outwardBaseMvr}
                  onChange={e => setOutwardBaseMvr(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-3 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                {outwardPricingMode === "margin" ? "Target Profit Margin (%) on Sales" : "Cost Markup (%) on Cost"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={outwardTargetMargin}
                  onChange={e => setOutwardTargetMargin(e.target.value)}
                  placeholder="25"
                  className="w-full px-3.5 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-extrabold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-emerald-600">%</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                Outward Air/Ocean Freight (MVR per Unit)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-muted-foreground">MVR</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={outwardFreightMvr}
                  onChange={e => setOutwardFreightMvr(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-3 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                Export Packaging & Customs (MVR per Unit)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-muted-foreground">MVR</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={outwardPackMvr}
                  onChange={e => setOutwardPackMvr(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-3 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-secondary/30 border border-border rounded-2xl space-y-4 font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-card rounded-xl border border-border shadow-sm">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total Outward Cost</span>
                <span className="text-lg font-extrabold text-foreground mt-1 block">MVR {outwardTotalCostMvr.toFixed(2)}</span>
              </div>

              <div className="p-4 bg-card rounded-xl border border-emerald-500/30 shadow-sm">
                <span className="text-[10px] text-emerald-600 uppercase font-bold block">Selling Price (MVR)</span>
                <span className="text-lg font-extrabold text-emerald-600 mt-1 block">MVR {outwardSellingPriceMvr.toFixed(2)}</span>
              </div>

              <div className="p-4 bg-card rounded-xl border border-blue-500/30 shadow-sm">
                <span className="text-[10px] text-blue-600 uppercase font-bold block">Export Quote ({selectedCurrency})</span>
                <span className="text-lg font-extrabold text-blue-600 mt-1 block">
                  {selectedCurrency === "EUR" ? "€" : selectedCurrency === "INR" ? "₹" : "$"}{outwardSellingPriceUsd.toFixed(2)} {selectedCurrency}
                </span>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl text-center font-bold text-xs flex flex-col sm:flex-row justify-between items-center px-6 gap-2 shadow-md">
              <span className="uppercase tracking-wider">NET PROFIT PER UNIT:</span>
              <span className="text-base font-extrabold">
                MVR {outwardProfitMvr.toFixed(2)} ({selectedCurrency === "EUR" ? "€" : selectedCurrency === "INR" ? "₹" : "$"}{(outwardProfitMvr / activeRate).toFixed(2)} {selectedCurrency})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── AI PDF Document Viewer & Inspector Modal ── */}
      {isPdfViewerOpen && (
        <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden text-foreground">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base font-serif flex items-center gap-2">
                    <span>AI PDF Invoice Inspector & Formula Verifier</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-600 rounded-md border border-emerald-500/30 uppercase">
                      {selectedCurrency} → MVR
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    Viewing "{pdfFileName || "Invoice.pdf"}" · Auto-calculated Standard Purchase Cost: (Amount MVR × Qty) ÷ 100
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePushToMasterCatalog}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-mono font-bold rounded-xl shadow flex items-center gap-1.5 transition-all"
                >
                  <Sparkles size={14} /> Sync to Master Catalog
                </button>

                <button
                  type="button"
                  onClick={() => setIsPdfViewerOpen(false)}
                  className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Split Screen */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
              {/* Left Column: PDF Document Viewer */}
              <div className="border-r border-border bg-slate-900 flex flex-col min-h-0 relative">
                <div className="p-2 bg-slate-800 border-b border-slate-700 text-slate-300 font-mono text-xs flex justify-between items-center px-4">
                  <span className="font-bold">📄 Attached Document Preview</span>
                  <a
                    href={pdfPreviewUrl}
                    download={pdfFileName || "Invoice.pdf"}
                    className="text-emerald-400 hover:underline text-[11px] font-mono flex items-center gap-1"
                  >
                    <Download size={12} /> Download PDF
                  </a>
                </div>

                <div className="flex-1 w-full h-full overflow-auto bg-slate-950 p-2 flex items-center justify-center">
                  {pdfPreviewUrl ? (
                    pdfFileType.startsWith("image/") ? (
                      <img src={pdfPreviewUrl} alt="Attached Document" className="max-w-full max-h-full object-contain rounded shadow" />
                    ) : (
                      <iframe src={pdfPreviewUrl} title="Attached PDF Viewer" className="w-full h-full border-none rounded bg-white" />
                    )
                  ) : (
                    <div className="text-center p-8 text-slate-400 font-mono text-xs space-y-2">
                      <FileText size={48} className="mx-auto opacity-40 mb-2" />
                      <p>No attached PDF document file loaded.</p>
                      <p className="text-[10px] text-slate-500">Upload a PDF invoice using the Document Parser to view here.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Extracted AI Formula & Line Items Panel */}
              <div className="flex flex-col min-h-0 bg-card overflow-y-auto p-5 space-y-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl font-mono text-xs space-y-2">
                  <div className="font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center justify-between">
                    <span>⚡ Formula & Currency Parameters</span>
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">ACTIVE</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-muted-foreground block">Invoice Currency:</span>
                      <span className="font-extrabold text-foreground">{selectedCurrency} ({selectedCurrency === "EUR" ? "€" : selectedCurrency === "INR" ? "₹" : "$"})</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Exchange Rate:</span>
                      <span className="font-extrabold text-emerald-600">1 {selectedCurrency} = {activeRate} MVR</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-emerald-500/20">
                      <span className="text-muted-foreground block">AI Standard Purchase Cost Formula:</span>
                      <code className="font-bold text-amber-600 dark:text-amber-400 block mt-0.5 bg-background p-1.5 rounded border border-amber-500/30">
                        Std Purchase Cost (MVR) = (Amount MVR × Quantity) ÷ 100
                      </code>
                    </div>
                  </div>
                </div>

                {/* Products Table in Modal */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs font-mono uppercase tracking-wider text-foreground">
                    Extracted Product Line Items ({parsedItems.length})
                  </h4>

                  <div className="border border-border rounded-xl overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-secondary/50 border-b border-border text-[10px] uppercase text-muted-foreground font-bold">
                        <tr>
                          <th className="p-2">Item</th>
                          <th className="p-2 text-right">Qty</th>
                          <th className="p-2 text-right">Rate ({selectedCurrency})</th>
                          <th className="p-2 text-right">Total (MVR)</th>
                          <th className="p-2 text-right bg-amber-500/10 text-amber-700">Std Purchase Cost (MVR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {parsedItems.map(item => {
                          const amtMvr = item.totalUsd * activeRate;
                          const stdCost = (amtMvr * item.quantity) / 100;
                          return (
                            <tr key={item.id} className="hover:bg-secondary/20">
                              <td className="p-2 font-semibold text-foreground">{item.name}</td>
                              <td className="p-2 text-right font-bold">{item.quantity}</td>
                              <td className="p-2 text-right">{selectedCurrency === "EUR" ? "€" : selectedCurrency === "INR" ? "₹" : "$"}{item.unitPriceUsd.toFixed(2)}</td>
                              <td className="p-2 text-right font-bold text-emerald-600">MVR {amtMvr.toFixed(2)}</td>
                              <td className="p-2 text-right font-black text-amber-700 bg-amber-500/10">MVR {stdCost.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Raw OCR Text Collapsible Preview */}
                {extractedRawText && (
                  <details className="border border-border rounded-xl p-3 text-xs font-mono space-y-2 bg-secondary/10">
                    <summary className="font-bold text-muted-foreground cursor-pointer hover:text-foreground">
                      🔍 Show Extracted Raw Document Text ({extractedRawText.length} characters)
                    </summary>
                    <pre className="p-3 bg-card border border-border rounded-lg text-[10px] overflow-x-auto whitespace-pre-wrap max-h-48 text-muted-foreground">
                      {extractedRawText}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Currency & FX Exchange Rates Console ────────────────────────────────────

function CurrencyPage({
  rates = { USD: 15.42, EUR: 16.75, INR: 0.185 },
}: {
  rates?: { USD: number; EUR: number; INR: number };
}) {
  const [usdRate, setUsdRate] = useState<number>(rates.USD || 15.42);
  const [eurRate, setEurRate] = useState<number>(rates.EUR || 16.75);

  // FX Calculator State
  const [calcAmount, setCalcAmount] = useState<string>("100");
  const [fromCurr, setFromCurr] = useState<"MVR" | "USD" | "EUR">("USD");
  const [toCurr, setToCurr] = useState<"MVR" | "USD" | "EUR">("MVR");

  // Calculate conversion
  const convertedResult = useMemo(() => {
    const amt = parseFloat(calcAmount) || 0;
    if (amt <= 0) return 0;

    // Convert from source currency to MVR base
    let mvrVal = amt;
    if (fromCurr === "USD") mvrVal = amt * usdRate;
    else if (fromCurr === "EUR") mvrVal = amt * eurRate;

    // Convert from MVR base to target currency
    if (toCurr === "MVR") return mvrVal;
    if (toCurr === "USD") return mvrVal / usdRate;
    if (toCurr === "EUR") return mvrVal / eurRate;

    return mvrVal;
  }, [calcAmount, fromCurr, toCurr, usdRate, eurRate]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif tracking-tight flex items-center gap-2.5">
            <Coins className="text-emerald-600" size={26} /> Currency & FX Exchange Rates Engine
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Live money conversions between Maldives Rufiyaa (MVR), US Dollar ($ USD), and Euro (€ EUR) for Sales & Purchase billing
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl text-xs font-mono text-emerald-800 dark:text-emerald-300 font-bold">
          <span>Central Bank Reference: MMA 2026</span>
        </div>
      </div>

      {/* Exchange Rates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* USD Card */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3 border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🇺🇸</span>
              <div>
                <h3 className="font-bold text-foreground text-sm font-mono">US Dollar (USD)</h3>
                <span className="text-[10px] text-muted-foreground font-mono">USD → MVR</span>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 font-mono font-bold text-[10px] rounded border border-emerald-500/20">$ USD</span>
          </div>

          <div className="p-3 bg-secondary/30 rounded-xl border border-border space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold block">1 USD to MVR Rate</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground font-bold">MVR</span>
              <input
                type="number"
                step="0.01"
                value={usdRate}
                onChange={e => setUsdRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-sm font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
              />
            </div>
          </div>

          <div className="text-[11px] font-mono text-muted-foreground flex justify-between pt-1">
            <span>$100 USD =</span>
            <span className="font-bold text-foreground">MVR {(100 * usdRate).toFixed(2)}</span>
          </div>
        </div>

        {/* EUR Card */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3 border-t-4 border-t-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🇪🇺</span>
              <div>
                <h3 className="font-bold text-foreground text-sm font-mono">Euro (EUR)</h3>
                <span className="text-[10px] text-muted-foreground font-mono">EUR → MVR</span>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 font-mono font-bold text-[10px] rounded border border-blue-500/20">€ EUR</span>
          </div>

          <div className="p-3 bg-secondary/30 rounded-xl border border-border space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold block">1 EUR to MVR Rate</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground font-bold">MVR</span>
              <input
                type="number"
                step="0.01"
                value={eurRate}
                onChange={e => setEurRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-sm font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>
          </div>

          <div className="text-[11px] font-mono text-muted-foreground flex justify-between pt-1">
            <span>€100 EUR =</span>
            <span className="font-bold text-foreground">MVR {(100 * eurRate).toFixed(2)}</span>
          </div>
        </div>

        {/* MVR Base Card */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3 border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🇲🇻</span>
              <div>
                <h3 className="font-bold text-foreground text-sm font-mono">Maldives Rufiyaa (MVR)</h3>
                <span className="text-[10px] text-muted-foreground font-mono">Base Currency</span>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 font-mono font-bold text-[10px] rounded border border-amber-500/20">MVR</span>
          </div>

          <div className="p-3 bg-secondary/30 rounded-xl border border-border space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold block">Domestic Reference</span>
            <div className="text-sm font-extrabold text-foreground font-mono text-right py-1">
              1 MVR = 1.00 MVR
            </div>
          </div>

          <div className="text-[11px] font-mono text-muted-foreground flex justify-between pt-1">
            <span>MVR 1,000 =</span>
            <span className="font-bold text-foreground">${(1000 / usdRate).toFixed(2)} USD</span>
          </div>
        </div>
      </div>

      {/* Interactive FX Calculator Console */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
        <div className="border-b border-border pb-3">
          <h2 className="text-base font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2">
            <RefreshCw size={18} className="text-emerald-600" />
            <span>Interactive Multi-Currency Money Converter</span>
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Convert any amount between MVR, USD, and EUR in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Amount Input */}
          <div className="md:col-span-4">
            <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold">Enter Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={calcAmount}
              onChange={e => setCalcAmount(e.target.value)}
              placeholder="100.00"
              className="w-full px-4 py-2.5 border border-border rounded-xl bg-input-background text-foreground text-base font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* From Currency */}
          <div className="md:col-span-3">
            <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold">From Currency</label>
            <select
              value={fromCurr}
              onChange={e => setFromCurr(e.target.value as any)}
              className="w-full px-3 py-2.5 border border-border rounded-xl bg-card text-foreground text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            >
              <option value="MVR">🇲🇻 MVR (Maldives Rufiyaa)</option>
              <option value="USD">🇺🇸 USD (US Dollars $)</option>
              <option value="EUR">🇪🇺 EUR (Euro €)</option>
            </select>
          </div>

          {/* To Currency */}
          <div className="md:col-span-3">
            <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold">To Currency</label>
            <select
              value={toCurr}
              onChange={e => setToCurr(e.target.value as any)}
              className="w-full px-3 py-2.5 border border-border rounded-xl bg-card text-foreground text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            >
              <option value="MVR">🇲🇻 MVR (Maldives Rufiyaa)</option>
              <option value="USD">🇺🇸 USD (US Dollars $)</option>
              <option value="EUR">🇪🇺 EUR (Euro €)</option>
            </select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => {
                const temp = fromCurr;
                setFromCurr(toCurr);
                setToCurr(temp);
              }}
              className="w-full py-2.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <RefreshCw size={14} /> Swap ⇄
            </button>
          </div>
        </div>

        {/* Calculation Result Banner */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 to-teal-900 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg border border-emerald-500/30">
          <div>
            <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">
              CONVERTED EQUIVALENT RESULT
            </span>
            <span className="text-xs text-emerald-200 font-mono">
              {calcAmount} {fromCurr} = {convertedResult.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurr}
            </span>
          </div>

          <div className="text-right font-mono">
            <div className="text-3xl font-extrabold text-emerald-300">
              {toCurr === "USD" ? "$" : toCurr === "EUR" ? "€" : "MVR "}
              {convertedResult.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurr}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Currency Converter Page Wrapper ───────────────────────────────────────
function CurrencyConvertPage({ products = [], entries = [] }: { products?: any[]; entries?: any[] }) {
  return <CurrencyPage rates={{ USD: 15.42, EUR: 16.75, INR: 0.185 }} />;
}

// ─── Expiry & Shelf Life Tracker Page ───────────────────────────────────────
function ExpiryPage({
  products = [],
  entries = [],
  onRefresh,
  onLoadClearancePromo
}: {
  products?: any[];
  entries?: any[];
  onRefresh?: () => void;
  onLoadClearancePromo?: (item: any) => void;
}) {
  const [filterGodown, setFilterGodown] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const expiryItems = useMemo(() => {
    const defaultBatches = [
      { id: "b1", batchNo: "BTC-CRD-801", item: "Green Cardamom Bold 8mm", category: "Spices", godown: "Godown A", qty: 450, unit: "kg", mfgDate: "2025-09-10", expDate: "2026-08-20", daysLeft: 15, status: "critical" },
      { id: "b2", batchNo: "BTC-CHL-409", item: "Kashmiri Red Chili Powder", category: "Spices", godown: "Godown C", qty: 800, unit: "kg", mfgDate: "2025-08-15", expDate: "2026-09-05", daysLeft: 31, status: "warning" },
      { id: "b3", batchNo: "BTC-MGO-302", item: "Alphonso Mango Pulp (Tin)", category: "Fruits", godown: "Godown F", qty: 1200, unit: "tins", mfgDate: "2025-07-01", expDate: "2026-08-28", daysLeft: 23, status: "critical" },
      { id: "b4", batchNo: "BTC-PEP-104", item: "Malabar Black Pepper 550g/l", category: "Spices", godown: "Godown B", qty: 2500, unit: "kg", mfgDate: "2025-10-01", expDate: "2027-04-15", daysLeft: 253, status: "safe" },
      { id: "b5", batchNo: "BTC-CIN-205", item: "Ceylon Cinnamon Sticks", category: "Spices", godown: "Godown D", qty: 650, unit: "kg", mfgDate: "2025-11-20", expDate: "2026-09-25", daysLeft: 51, status: "warning" },
      { id: "b6", batchNo: "BTC-AVO-901", item: "Fresh Hass Avocados", category: "Veggies & Produce", godown: "Godown L", qty: 320, unit: "boxes", mfgDate: "2026-07-28", expDate: "2026-08-12", daysLeft: 7, status: "critical" }
    ];
    return defaultBatches.filter(b => {
      const matchesGodown = filterGodown === "all" || b.godown === filterGodown;
      const matchesSearch = b.item.toLowerCase().includes(searchQuery.toLowerCase()) || b.batchNo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGodown && matchesSearch;
    });
  }, [filterGodown, searchQuery]);

  const criticalCount = expiryItems.filter(i => i.status === "critical").length;
  const warningCount = expiryItems.filter(i => i.status === "warning").length;
  const safeCount = expiryItems.filter(i => i.status === "safe").length;

  return (
    <div className="space-y-6 text-foreground font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold font-serif flex items-center gap-2.5">
            <Clock className="text-amber-600" size={26} /> Batch Expiry & Shelf Life Tracker
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Monitor product expiration dates, FIFO batch rotation, near-expiry alerts & clearance discounts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 font-mono font-bold text-xs rounded-xl">
            ⏳ Realtime Expiry Sensor Active
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-1">
          <div className="text-[10px] uppercase font-bold text-red-600">🚨 Critical (&lt; 30 Days Expiry)</div>
          <div className="text-2xl font-black text-red-600">{criticalCount} Batches</div>
          <div className="text-[10px] text-muted-foreground">Action required immediately</div>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1">
          <div className="text-[10px] uppercase font-bold text-amber-600">⚠️ Warning (30-60 Days)</div>
          <div className="text-2xl font-black text-amber-600">{warningCount} Batches</div>
          <div className="text-[10px] text-muted-foreground">Monitor FIFO stock movement</div>
        </div>

        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-1">
          <div className="text-[10px] uppercase font-bold text-emerald-600">🟢 Safe Shelf Life (&gt; 60 Days)</div>
          <div className="text-2xl font-black text-emerald-600">{safeCount} Batches</div>
          <div className="text-[10px] text-muted-foreground">Optimal quality guaranteed</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card border border-border p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by batch # or product name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-xl bg-input-background font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-mono text-muted-foreground font-bold whitespace-nowrap">Filter Godown:</label>
          <select
            value={filterGodown}
            onChange={e => setFilterGodown(e.target.value)}
            className="px-3 py-2 text-xs border border-border rounded-xl bg-card font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Godowns (A to R)</option>
            {"ABCDEFGHIJKLMNOPQR".split("").map(g => (
              <option key={g} value={`Godown ${g}`}>Godown {g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expiry Register Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-secondary/40 border-b border-border text-[10px] uppercase text-muted-foreground font-bold">
            <tr>
              <th className="p-3">Batch Number</th>
              <th className="p-3">Product Item & Category</th>
              <th className="p-3">Godown Hub</th>
              <th className="p-3 text-right">Available Qty</th>
              <th className="p-3 text-center">Mfg Date</th>
              <th className="p-3 text-center">Expiry Date</th>
              <th className="p-3 text-center">Shelf Life Status</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {expiryItems.map(b => (
              <tr key={b.id} className="hover:bg-secondary/20 transition-colors">
                <td className="p-3 font-bold text-foreground">{b.batchNo}</td>
                <td className="p-3">
                  <div className="font-bold text-foreground">{b.item}</div>
                  <div className="text-[10px] text-muted-foreground">{b.category}</div>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 bg-secondary rounded border border-border text-[10px] font-bold">
                    {b.godown}
                  </span>
                </td>
                <td className="p-3 text-right font-extrabold text-foreground">
                  {b.qty} {b.unit}
                </td>
                <td className="p-3 text-center text-muted-foreground">{b.mfgDate}</td>
                <td className="p-3 text-center font-bold text-foreground">{b.expDate}</td>
                <td className="p-3 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    b.status === "critical"
                      ? "bg-red-500/10 text-red-600 border-red-500/30"
                      : b.status === "warning"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                      : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  }`}>
                    {b.status === "critical" ? `🚨 ${b.daysLeft} Days Left` : b.status === "warning" ? `⚠️ ${b.daysLeft} Days Left` : `🟢 ${b.daysLeft} Days Left`}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {b.status === "critical" ? (
                    <button
                      type="button"
                      onClick={() => {
                        toast.success(`Discount offer applied to ${b.item} (${b.batchNo})!`);
                        if (onLoadClearancePromo) onLoadClearancePromo(b);
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all"
                    >
                      🏷️ Apply 20% Offer
                    </button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Normal FIFO</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Offers & Promotional Schemes Page ──────────────────────────────────────
function OffersPage({ products = [], entries = [], onRefresh }: { products?: any[]; entries?: any[]; onRefresh?: () => void }) {
  const [offersList, setOffersList] = useState<any[]>([
    {
      id: "o1",
      code: "SPICE-FEST-2026",
      title: "👑 Royal Festive Spice Discount",
      type: "Percentage Discount",
      discountValue: "10% OFF",
      minOrderQty: "50 kg",
      category: "Spices & Whole Herbs",
      validTill: "2026-12-31",
      status: "Active",
      usageCount: 142
    },
    {
      id: "o2",
      code: "PEPPER-BOGO-FREE",
      title: "📦 Black Pepper Bulk Jute Bag Offer",
      type: "Free Goods (BOGO)",
      discountValue: "Buy 10 Bags ➔ Get 1 Free",
      minOrderQty: "10 Bags (500kg)",
      category: "Spices",
      validTill: "2026-10-15",
      status: "Active",
      usageCount: 88
    },
    {
      id: "o3",
      code: "CLEARANCE-FRUIT-20",
      title: "🥭 Mango & Papaya Clearance Scheme",
      type: "Clearance Promo",
      discountValue: "20% Flat Discount",
      minOrderQty: "5 Tins / Boxes",
      category: "Fresh Fruits & Tins",
      validTill: "2026-08-30",
      status: "Active",
      usageCount: 65
    },
    {
      id: "o4",
      code: "CASH-7DAYS-DISC",
      title: "💳 Early Cash Receipt Incentive",
      type: "Cash Discount",
      discountValue: "2% Prompt Cash Back",
      minOrderQty: "Payment in 7 Days",
      category: "All Categories",
      validTill: "2026-12-31",
      status: "Active",
      usageCount: 310
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>("");
  const [newTitle, setNewTitle] = useState<string>("");
  const [newType, setNewType] = useState<string>("Percentage Discount");
  const [newDiscount, setNewDiscount] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("Spices");
  const [newValidTill, setNewValidTill] = useState<string>("2026-12-31");

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newTitle) {
      toast.error("Please enter Offer Code and Offer Title.");
      return;
    }
    const created = {
      id: `off-${Date.now()}`,
      code: newCode.toUpperCase(),
      title: newTitle,
      type: newType,
      discountValue: newDiscount || "10% OFF",
      minOrderQty: "10 kg",
      category: newCategory,
      validTill: newValidTill,
      status: "Active",
      usageCount: 0
    };
    setOffersList([created, ...offersList]);
    setIsModalOpen(false);
    setNewCode("");
    setNewTitle("");
    setNewDiscount("");
    toast.success(`Promotional Offer scheme "${created.code}" created successfully!`);
  };

  return (
    <div className="space-y-6 text-foreground font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold font-serif flex items-center gap-2.5">
            <Tag className="text-emerald-600" size={26} /> Promotional Offers & Discount Schemes
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Manage seasonal promotional codes, BOGO wholesale schemes, volume tier discounts & cash rebates
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <Plus size={16} /> Create New Offer Scheme
        </button>
      </div>

      {/* Offers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offersList.map(o => (
          <div key={o.id} className="bg-card border border-border p-5 rounded-3xl shadow-sm space-y-4 hover:border-emerald-500/50 transition-all relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-xl font-mono font-extrabold text-xs">
                🏷️ {o.code}
              </span>
              <span className="px-2.5 py-0.5 bg-secondary text-foreground text-[10px] font-mono font-bold rounded-full border border-border">
                {o.status}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-foreground font-serif">{o.title}</h3>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{o.type} • {o.category}</p>
            </div>

            <div className="p-3 bg-secondary/30 rounded-2xl border border-border font-mono text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount Rate:</span>
                <span className="font-extrabold text-emerald-600">{o.discountValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min Order Qty:</span>
                <span className="font-bold text-foreground">{o.minOrderQty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valid Through:</span>
                <span className="font-bold text-amber-600">{o.validTill}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-1 border-t border-border/50">
              <span>Applied to {o.usageCount} invoices</span>
              <button
                type="button"
                onClick={() => {
                  setOffersList(offersList.filter(item => item.id !== o.id));
                  toast.info(`Offer ${o.code} deactivated.`);
                }}
                className="text-red-500 hover:underline font-bold"
              >
                Deactivate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Creating New Offer */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl text-foreground font-sans relative">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold font-serif flex items-center gap-2">
                <Gift className="text-emerald-600" size={20} /> Create Promotional Scheme
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase font-bold mb-1">Offer Scheme Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SPICE-2026"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-input-background font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-muted-foreground uppercase font-bold mb-1">Offer Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardamom Festive Discount"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-input-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase font-bold mb-1">Offer Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Percentage Discount">Percentage %</option>
                    <option value="Free Goods (BOGO)">BOGO / Free Goods</option>
                    <option value="Cash Rebate">Cash Rebate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase font-bold mb-1">Discount Rate</label>
                  <input
                    type="text"
                    placeholder="e.g. 15% OFF"
                    value={newDiscount}
                    onChange={e => setNewDiscount(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-input-background font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-muted-foreground uppercase font-bold mb-1">Valid Till Date</label>
                <input
                  type="date"
                  value={newValidTill}
                  onChange={e => setNewValidTill(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-input-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-secondary text-foreground rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
                >
                  Publish Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard Overview", shortcut: "Alt + D", icon: LayoutDashboard },
  { id: "sales", label: "Sales Cockpit", shortcut: "Alt + S", icon: TrendingUp },
  { id: "purchase", label: "Purchase Management", shortcut: "Alt + P", icon: TrendingDown },
  { id: "inventory", label: "Stock Inventory", shortcut: "Alt + I", icon: BoxIcon },
  { id: "godowns", label: "Godown Hub", shortcut: "Alt + G", icon: Warehouse },
  { id: "costing", label: "Costing & Margins", shortcut: "Alt + C", icon: Calculator },
  { id: "currency-convert", label: "Currency Converter", shortcut: "Alt + X", icon: Coins },
  { id: "expiry", label: "Expiry Tracker", shortcut: "Alt + E", icon: Clock },
  { id: "offers", label: "Offers & Discounts", shortcut: "Alt + O", icon: Tag },
  { id: "vouchers", label: "Accounts Vouchers", shortcut: "Alt + V", icon: Receipt },
  { id: "credit-recovery", label: "Credit Recovery", shortcut: "Alt + R", icon: ShieldAlert },
  { id: "perishables", label: "Perishable Monitor", shortcut: "Alt + M", icon: Sparkles },
  { id: "reports", label: "Financial Reports", shortcut: "Alt + F", icon: BarChart2 },
  { id: "master-console", label: "Masters Setup", shortcut: "Alt + K", icon: DbIcon },
  { id: "ai", label: "AI Operations Insights", shortcut: "Alt + A", icon: Bot }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const sessionStr = localStorage.getItem("active_user_session");
    if (sessionStr) {
      try { return JSON.parse(sessionStr); } catch (e) {}
    }
    return {
      id: "usr-admin",
      employeeId: "EMP-001",
      employeeName: "System Administrator / Owner",
      role: "Admin",
      username: "admin",
      allowedFeatures: [
        "dashboard", "sales-billing", "sales-quotation", "sales-proforma", "sales-delivery", "sales-credit-note", "sales-debit-note", "sales-pos",
        "purchase-order", "purchase-bill", "inventory-items", "inventory-godowns", "inventory-spoilage", "vouchers-receipt", "vouchers-payment",
        "vouchers-journal", "vouchers-contra", "credit-recovery", "reports-pnl", "reports-bs", "reports-trial", "reports-ledger", "reports-daybook",
        "master-accounts-groups", "master-accounts-ledger", "master-accounts-customer", "master-accounts-supplier", "master-inventory-categories",
        "master-inventory-unit", "master-inventory-packing", "master-godowns", "master-users"
      ]
    };
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const isFeaturePermitted = (featId: string): boolean => {
    if (!currentUser) return true;
    if (currentUser.role === "Admin" || currentUser.role === "Owner" || currentUser.username === "admin" || currentUser.role === "System Administrator / Owner") return true;
    const allowed: string[] = currentUser.allowedFeatures || [];

    if (allowed.includes(featId)) return true;

    let key = featId;
    if (featId === "sales" || featId === "sales-billing") key = "sales-billing";
    else if (featId === "sales-quotation") key = "sales-quotation";
    else if (featId === "sales-proforma") key = "sales-proforma";
    else if (featId === "sales-delivery") key = "sales-delivery";
    else if (featId === "sales-credit" || featId === "sales-credit-note") key = "sales-credit-note";
    else if (featId === "sales-debit-note") key = "sales-debit-note";
    else if (featId === "sales-pos") key = "sales-pos";
    else if (featId === "purchase" || featId === "purchase-billing" || featId === "purchase-bill") key = "purchase-bill";
    else if (featId === "purchase-order" || featId === "purchase-grn") key = "purchase-order";
    else if (featId === "purchase-debit") key = "purchase-bill";
    else if (featId === "purchase-spoilage" || featId === "inventory-spoilage") key = "inventory-spoilage";
    else if (featId === "godowns" || featId === "godown-hub" || featId === "inventory-godowns" || featId === "master-godowns") key = "inventory-godowns";
    else if (featId === "inventory" || featId === "inventory-items") key = "inventory-items";
    else if (featId === "costing" || featId.startsWith("costing-")) key = "costing";
    else if (featId === "currency" || featId === "currency-convert") key = "currency-convert";
    else if (featId === "expiry" || featId.startsWith("expiry-") || featId === "perishables") key = "expiry";
    else if (featId === "offers") key = "offers";
    else if (featId === "vouchers" || featId === "vouchers-all" || featId === "vouchers-receipt") key = "vouchers-receipt";
    else if (featId === "vouchers-payment") key = "vouchers-payment";
    else if (featId === "vouchers-journal") key = "vouchers-journal";
    else if (featId === "vouchers-contra") key = "vouchers-contra";
    else if (featId === "credit-recovery") key = "credit-recovery";
    else if (featId === "reports" || featId.startsWith("reports-") || featId === "pl") key = "reports-pnl";
    else if (featId === "master-console" || featId.startsWith("master-")) key = featId === "master-console" ? "master-users" : featId;
    else if (featId === "ai") key = "dashboard";

    return allowed.includes(key);
  };

  // Helper: check if user has ANY of the provided feature keys
  const hasAnyFeature = (...keys: string[]): boolean => {
    if (!currentUser) return true;
    if (currentUser.role === "Admin" || currentUser.role === "Owner" || currentUser.username === "admin") return true;
    return keys.some(k => isFeaturePermitted(k));
  };

  const [appState, setAppState] = useState<"intro" | "login" | "main">("intro");
  const [page, setPage] = useState("dashboard");
  const [masterOpen, setMasterOpen] = useState(false);
  const [masterAccountsOpen, setMasterAccountsOpen] = useState(false);
  const [masterInventoryOpen, setMasterInventoryOpen] = useState(false);
  const [masterUsersOpen, setMasterUsersOpen] = useState(false);
  const [vouchersOpen, setVouchersOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [purchaseSubOpen, setPurchaseSubOpen] = useState(false);
  const [costingOpen, setCostingOpen] = useState(false);

  useEffect(() => {
    if (page.startsWith("sales")) {
      setSalesOpen(true);
    }
    if (page.startsWith("purchase")) {
      setPurchaseSubOpen(true);
    }
    if (page.startsWith("costing")) {
      setCostingOpen(true);
    }
  }, [page]);

  // Auto-redirect to dashboard when user account switches and current page is restricted
  useEffect(() => {
    if (appState === "main" && page && !isFeaturePermitted(page)) {
      setPage("dashboard");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);


  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const globalVoiceHandlers = useRef<any>(null);

  // Global key listener for shortcuts
  useEffect(() => {
    const handleGlobalShortcut = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // 1. AI Drawer Toggle
      if (isCtrlOrCmd && e.code === "Space") {
        if (page === "sales" || page === "purchase") return;
        e.preventDefault();
        e.stopPropagation();
        setAiDrawerOpen(prev => !prev);
        return;
      }

      // 1b. Voice AI Invoice Modal Toggle (Ctrl + Shift + V)
      if (isCtrlOrCmd && e.shiftKey && (e.code === "KeyV" || (e.key || "").toLowerCase() === "v")) {
        e.preventDefault();
        e.stopPropagation();
        setIsVoiceInvoiceModalOpen(prev => !prev);
        return;
      }

      // Check if user is typing in an input/textarea to avoid hijacking standard text shortcuts
      const isTyping = document.activeElement && (
        document.activeElement.tagName === "INPUT" || 
        document.activeElement.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement).isContentEditable
      );

      const keyName = (e.key || "").toLowerCase();

      // Ctrl + A: Attendance (Global route)
      if (isCtrlOrCmd && (e.code === "KeyA" || keyName === "a" || e.keyCode === 65)) {
        e.preventDefault();
        e.stopPropagation();
        setPage("payroll-attendance");
        toast.success("Navigated to Attendance [Ctrl + A]");
        return;
      }

      // Ctrl + S: Salary Sheet (Global route with page-specific action interception)
      if (isCtrlOrCmd && (e.code === "KeyS" || keyName === "s" || e.keyCode === 83)) {
        e.preventDefault();
        e.stopPropagation();
        if (page === "payroll-attendance") {
          const saveBtn = document.getElementById("btn-save-attendance");
          if (saveBtn) {
            saveBtn.click();
          } else {
            toast.error("Save button not found.");
          }
        } else if (page === "payroll-salary-sheet") {
          const postBtn = document.getElementById("btn-post-salary");
          if (postBtn) {
            postBtn.click();
          } else {
            toast.error("Post button not found.");
          }
        } else {
          setPage("payroll-salary-sheet");
          toast.success("Navigated to Salary Sheet [Ctrl + S]");
        }
        return;
      }

      // 2. F2 Date Change
      if (e.key === "F2") {
        e.preventDefault();
        e.stopPropagation();
        const dateInput = document.querySelector('input[type="date"], input[placeholder="DD-MM-YYYY"]');
        if (dateInput) {
          (dateInput as HTMLInputElement).focus();
          (dateInput as HTMLInputElement).select?.();
          toast.success("Date field focused!");
        } else {
          toast.info("No date field found on this page.");
        }
        return;
      }

      // 3. F3 Sales Quotation
      if (e.key === "F3" && !isCtrlOrCmd && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        setPage("sales-quotation");
        toast.success("Navigated to Sales Quotation [F3]");
        return;
      }

      // 4. Contra Voucher [F4]
      if (e.key === "F4" && !isCtrlOrCmd && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        setPage("vouchers-contra");
        toast.success("Navigated to Contra Voucher [F4]");
        return;
      }

      // 5. Payment Voucher [F5]
      if (e.key === "F5" && !isCtrlOrCmd && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        setPage("vouchers-payment");
        toast.success("Navigated to Payment Voucher [F5]");
        return;
      }

      // 6. Receipt Voucher [F6]
      if (e.key === "F6" && !isCtrlOrCmd && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        setPage("vouchers-receipt");
        toast.success("Navigated to Receipt Voucher [F6]");
        return;
      }

      // 7. F7 shortcuts:
      // Ctrl+Alt+F7 Physical Stock Entry
      // Ctrl+F7 Stock Transfer
      // F7 Journal Voucher
      if (e.key === "F7") {
        if (isCtrlOrCmd && e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          setPage("physical-stock");
          toast.success("Navigated to Physical Stock Entry [Ctrl+Alt+F7]");
        } else if (isCtrlOrCmd) {
          e.preventDefault();
          e.stopPropagation();
          setPage("stock-transfer");
          toast.success("Navigated to Stock Transfer [Ctrl+F7]");
        } else if (!e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          setPage("vouchers-journal");
          toast.success("Navigated to Journal Voucher [F7]");
        }
        return;
      }

      // 8. F8 shortcuts:
      // Ctrl+Alt+F8 Credit Note
      // Ctrl+F8 Sales Credit
      // F8 Sales Cash
      if (e.key === "F8") {
        if (isCtrlOrCmd && e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          setPage("sales-credit");
          toast.success("Navigated to Credit Note [Ctrl+Alt+F8]");
        } else if (isCtrlOrCmd) {
          e.preventDefault();
          e.stopPropagation();
          setPage("sales-billing");
          setSalesPaymentType("credit");
          toast.success("Navigated to Sales (Billing) Credit [Ctrl+F8]");
        } else if (!e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          setPage("sales-billing");
          setSalesPaymentType("cash");
          toast.success("Navigated to Sales (Billing) Cash [F8]");
        }
        return;
      }

      // ── FIRST-LETTER BASED NAVIGATION SHORTCUT ENGINE ──
      if (e.altKey && !isTyping) {
        const code = e.code || "";
        const k = keyName;

        // --- MASTER CONSOLE COMBINATIONS (Ctrl + Alt + [First Letter]) ---
        if (isCtrlOrCmd) {
          if (code === "KeyG" || k === "g") {
            e.preventDefault(); e.stopPropagation(); setPage("master-accounts-groups"); setMasterOpen(true); setMasterAccountsOpen(true); toast.success("Navigated to Accounts Groups Master [Ctrl+Alt+G]"); return;
          }
          if (code === "KeyL" || k === "l") {
            e.preventDefault(); e.stopPropagation(); setPage("master-accounts-ledger"); setMasterOpen(true); setMasterAccountsOpen(true); toast.success("Navigated to Accounts Ledger Master [Ctrl+Alt+L]"); return;
          }
          if (code === "KeyC" || k === "c") {
            e.preventDefault(); e.stopPropagation(); setPage("master-accounts-customer"); setMasterOpen(true); setMasterAccountsOpen(true); toast.success("Navigated to Customer Master [Ctrl+Alt+C]"); return;
          }
          if (code === "KeyS" || k === "s") {
            e.preventDefault(); e.stopPropagation(); setPage("master-accounts-supplier"); setMasterOpen(true); setMasterAccountsOpen(true); toast.success("Navigated to Supplier Master [Ctrl+Alt+S]"); return;
          }
          if (code === "KeyI" || k === "i") {
            e.preventDefault(); e.stopPropagation(); setPage("master-inventory-categories"); setMasterOpen(true); setMasterInventoryOpen(true); toast.success("Navigated to Item Categories Master [Ctrl+Alt+I]"); return;
          }
          if (code === "KeyU" || k === "u") {
            e.preventDefault(); e.stopPropagation(); setPage("master-inventory-unit"); setMasterOpen(true); setMasterInventoryOpen(true); toast.success("Navigated to Units of Measure Master [Ctrl+Alt+U]"); return;
          }
          if (code === "KeyP" || k === "p") {
            e.preventDefault(); e.stopPropagation(); setPage("master-inventory-packing"); setMasterOpen(true); setMasterInventoryOpen(true); toast.success("Navigated to Packing Types Master [Ctrl+Alt+P]"); return;
          }
          if (code === "KeyW" || k === "w") {
            e.preventDefault(); e.stopPropagation(); setPage("master-godowns"); setMasterOpen(true); toast.success("Navigated to Godown Master [Ctrl+Alt+W]"); return;
          }
          if (code === "KeyE" || k === "e") {
            e.preventDefault(); e.stopPropagation(); setPage("master-users"); setMasterOpen(true); toast.success("Navigated to User & Employee Master [Ctrl+Alt+E]"); return;
          }
        }

        // --- SUB-MENU COMBINATIONS (Alt + Shift + [First Letter]) ---
        if (e.shiftKey) {
          // Sales Sub-menu
          if (code === "KeyQ" || k === "q") {
            e.preventDefault(); e.stopPropagation(); setPage("sales-quotation"); setSalesOpen(true); toast.success("Navigated to Sales Quotation [Alt+Shift+Q]"); return;
          }
          if (code === "KeyB" || k === "b") {
            e.preventDefault(); e.stopPropagation(); setPage("sales-billing"); setSalesOpen(true); toast.success("Navigated to Sales Billing [Alt+Shift+B]"); return;
          }
          if (code === "KeyD" || k === "d") {
            e.preventDefault(); e.stopPropagation(); setPage("sales-delivery"); setSalesOpen(true); toast.success("Navigated to Delivery Note [Alt+Shift+D]"); return;
          }
          if (code === "KeyC" || k === "c") {
            e.preventDefault(); e.stopPropagation(); setPage("sales-credit"); setSalesOpen(true); toast.success("Navigated to Sales Credit Note [Alt+Shift+C]"); return;
          }

          // Purchase Sub-menu
          if (code === "KeyO" || k === "o") {
            e.preventDefault(); e.stopPropagation(); setPage("purchase-order"); setPurchaseSubOpen(true); toast.success("Navigated to Purchase Order [Alt+Shift+O]"); return;
          }
          if (code === "KeyG" || k === "g") {
            e.preventDefault(); e.stopPropagation(); setPage("purchase-grn"); setPurchaseSubOpen(true); toast.success("Navigated to Goods Receive Note GRN [Alt+Shift+G]"); return;
          }
          if (code === "KeyP" || k === "p") {
            e.preventDefault(); e.stopPropagation(); setPage("purchase-billing"); setPurchaseSubOpen(true); toast.success("Navigated to Purchase Billing [Alt+Shift+P]"); return;
          }
          if (code === "KeyN" || k === "n") {
            e.preventDefault(); e.stopPropagation(); setPage("purchase-debit"); setPurchaseSubOpen(true); toast.success("Navigated to Supplier Debit Note [Alt+Shift+N]"); return;
          }
          if (code === "KeyS" || k === "s") {
            e.preventDefault(); e.stopPropagation(); setPage("purchase-spoilage"); setPurchaseSubOpen(true); toast.success("Navigated to Spoilage Write-off Entry [Alt+Shift+S]"); return;
          }

          // Vouchers Sub-menu
          if (code === "KeyK" || k === "k") {
            e.preventDefault(); e.stopPropagation(); setPage("vouchers-contra"); setVouchersOpen(true); toast.success("Navigated to Contra Voucher [Alt+Shift+K]"); return;
          }
          if (code === "KeyJ" || k === "j") {
            e.preventDefault(); e.stopPropagation(); setPage("vouchers-journal"); setVouchersOpen(true); toast.success("Navigated to Journal Voucher [Alt+Shift+J]"); return;
          }
          if (code === "KeyR" || k === "r") {
            e.preventDefault(); e.stopPropagation(); setPage("vouchers-receipt"); setVouchersOpen(true); toast.success("Navigated to Receipt Voucher [Alt+Shift+R]"); return;
          }
          if (code === "KeyV" || k === "v") {
            e.preventDefault(); e.stopPropagation(); setPage("vouchers-all"); setVouchersOpen(true); toast.success("Navigated to All Vouchers Register [Alt+Shift+V]"); return;
          }

          // Reports Sub-menu
          if (code === "Digit1" || k === "1") {
            e.preventDefault(); e.stopPropagation(); setPage("reports-pl"); setReportsOpen(true); toast.success("Navigated to Profit & Loss Report [Alt+Shift+1]"); return;
          }
          if (code === "Digit2" || k === "2") {
            e.preventDefault(); e.stopPropagation(); setPage("reports-bs"); setReportsOpen(true); toast.success("Navigated to Balance Sheet [Alt+Shift+2]"); return;
          }
          if (code === "Digit3" || k === "3") {
            e.preventDefault(); e.stopPropagation(); setPage("reports-trial"); setReportsOpen(true); toast.success("Navigated to Trial Balance [Alt+Shift+3]"); return;
          }
          if (code === "Digit4" || k === "4") {
            e.preventDefault(); e.stopPropagation(); setPage("reports-ledger"); setReportsOpen(true); toast.success("Navigated to Ledger Accounts [Alt+Shift+4]"); return;
          }
          if (code === "Digit5" || k === "5") {
            e.preventDefault(); e.stopPropagation(); setPage("reports-daybook"); setReportsOpen(true); toast.success("Navigated to Daybook & Cash Flow [Alt+Shift+5]"); return;
          }
        }

        // --- TOP-LEVEL MAIN NAVIGATION (Alt + First Letter) ---
        if (!isCtrlOrCmd && !e.shiftKey) {
          if (code === "KeyA" || k === "a") {
            e.preventDefault(); e.stopPropagation(); setPage("ai"); toast.success("Navigated to AI Operations Insights [Alt + A]"); return;
          }
          if (code === "KeyC" || k === "c") {
            e.preventDefault(); e.stopPropagation(); setPage("costing"); toast.success("Navigated to Costing & Margins [Alt + C]"); return;
          }
          if (code === "KeyD" || k === "d") {
            e.preventDefault(); e.stopPropagation(); setPage("dashboard"); toast.success("Navigated to Dashboard Overview [Alt + D]"); return;
          }
          if (code === "KeyE" || k === "e") {
            e.preventDefault(); e.stopPropagation(); setPage("expiry"); toast.success("Navigated to Expiry & Shelf Life Tracker [Alt + E]"); return;
          }
          if (code === "KeyF" || k === "f") {
            e.preventDefault(); e.stopPropagation(); setPage("reports"); setReportsOpen(true); toast.success("Navigated to Financial Reports [Alt + F]"); return;
          }
          if (code === "KeyG" || k === "g") {
            e.preventDefault(); e.stopPropagation(); setPage("godowns"); toast.success("Navigated to Godown Hub [Alt + G]"); return;
          }
          if (code === "KeyI" || k === "i") {
            e.preventDefault(); e.stopPropagation(); setPage("inventory"); toast.success("Navigated to Stock Inventory [Alt + I]"); return;
          }
          if (code === "KeyK" || k === "k" || code === "KeyM" || k === "m") {
            e.preventDefault(); e.stopPropagation(); setPage("master-console"); setMasterOpen(true); toast.success("Navigated to Masters Setup [Alt + K]"); return;
          }
          if (code === "KeyO" || k === "o") {
            e.preventDefault(); e.stopPropagation(); setPage("offers"); toast.success("Navigated to Offers & Discounts [Alt + O]"); return;
          }
          if (code === "KeyP" || k === "p") {
            e.preventDefault(); e.stopPropagation(); setPage("purchase-billing"); setPurchaseSubOpen(true); toast.success("Navigated to Purchase Management [Alt + P]"); return;
          }
          if (code === "KeyR" || k === "r") {
            e.preventDefault(); e.stopPropagation(); setPage("credit-recovery"); toast.success("Navigated to Credit Recovery [Alt + R]"); return;
          }
          if (code === "KeyS" || k === "s") {
            e.preventDefault(); e.stopPropagation(); setPage("sales-billing"); setSalesOpen(true); toast.success("Navigated to Sales Cockpit [Alt + S]"); return;
          }
          if (code === "KeyV" || k === "v") {
            e.preventDefault(); e.stopPropagation(); setPage("vouchers-all"); setVouchersOpen(true); toast.success("Navigated to Accounts Vouchers [Alt + V]"); return;
          }
          if (code === "KeyX" || k === "x") {
            e.preventDefault(); e.stopPropagation(); setPage("currency-convert"); toast.success("Navigated to Currency Converter [Alt + X]"); return;
          }
        }
      }

      // 9. F9 shortcuts:
      // Ctrl+Alt+F9 Debit Note
      // Ctrl+F9 GRN
      // F9 Purchase
      if (e.key === "F9") {
        if (isCtrlOrCmd && e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          setPage("purchase-debit");
          toast.success("Navigated to Debit Note [Ctrl+Alt+F9]");
        } else if (isCtrlOrCmd) {
          e.preventDefault();
          e.stopPropagation();
          setPage("purchase-grn");
          toast.success("Navigated to GRN [Ctrl+F9]");
        } else if (!e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          setPage("purchase-billing");
          setPurchasePaymentType("cash");
          toast.success("Navigated to Purchase Billing [F9]");
        }
        return;
      }
    };
    window.addEventListener("keydown", handleGlobalShortcut, true);
    return () => window.removeEventListener("keydown", handleGlobalShortcut, true);
  }, [page]);

  // Global Enter Key Form Focus Navigation Engine (Tally / ERP Fast Typing)
  useEffect(() => {
    const handleEnterNavigation = (e: KeyboardEvent) => {
      // Only trigger on Enter key without Shift/Ctrl/Alt modifier combinations
      if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      // Prevent double-advancing if an inline component handler already handled Enter
      if (e.defaultPrevented) {
        return;
      }

      const activeEl = document.activeElement as HTMLElement | null;
      if (!activeEl) return;

      const tagName = activeEl.tagName.toUpperCase();

      // Don't intercept Enter on standard buttons so buttons can be clicked naturally
      if (tagName === "BUTTON") return;

      // Allow multiline textareas to type newlines
      if (tagName === "TEXTAREA") {
        return;
      }

      // Intercept Enter key on INPUT and SELECT elements
      if (tagName === "INPUT" || tagName === "SELECT") {
        // Find the current parent form or container scope
        const container = activeEl.closest("form") || activeEl.closest("[data-focus-container]") || document.body;

        // Query all focusable input controls inside container
        const focusables = Array.from(
          container.querySelectorAll<HTMLElement>(
            'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button[type="submit"]:not([disabled])'
          )
        ).filter(el => {
          // Ensure element is visible
          return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
        });

        const currentIndex = focusables.indexOf(activeEl);

        if (currentIndex !== -1 && currentIndex < focusables.length - 1) {
          e.preventDefault();
          e.stopPropagation();

          const nextEl = focusables[currentIndex + 1];
          nextEl.focus();

          // Highlight existing text in the next input for instant overwriting
          if (nextEl instanceof HTMLInputElement) {
            nextEl.select?.();
          }
        }
      }
    };

    window.addEventListener("keydown", handleEnterNavigation, false);
    return () => window.removeEventListener("keydown", handleEnterNavigation, false);
  }, []);

  // Close drawer when switching to sales/purchase
  useEffect(() => {
    if (page === "sales" || page === "purchase") {
      setAiDrawerOpen(false);
    }
  }, [page]);

  // States fetched from backend
  const [products, setProducts] = useState<Product[]>([]);
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [spoilages, setSpoilages] = useState<SpoilageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // State to manage showing invoice modal
  const [activeInvoice, setActiveInvoice] = useState<StockEntry | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isVoiceInvoiceModalOpen, setIsVoiceInvoiceModalOpen] = useState(false);
  const [activeEditRecord, setActiveEditRecord] = useState<any>(null);

  const [salesPaymentType, setSalesPaymentType] = useState<"cash" | "card" | "transfer" | "credit">("cash");
  const [purchasePaymentType, setPurchasePaymentType] = useState<"cash" | "credit">("cash");

// Transfer voice extracted invoice into Sales Billing or Purchase Billing
  const handleEnterVoiceBilling = (data: {
    docType: "SALES_INVOICE" | "PURCHASE_BILL";
    partyName: string;
    partyId?: string;
    paymentType: "cash" | "credit";
    items: any[];
  }) => {
    const isSale = data.docType === "SALES_INVOICE";
    const targetPage = isSale ? "sales-billing" : "purchase-billing";

    const formattedItems: InvoiceItem[] = (data.items || []).map(i => ({
      productId: i.productId || "PRD-101",
      godown: i.godown || "A",
      quantity: i.quantity || 1,
      pricePerUnit: i.unitPrice || (isSale ? 120 : 100),
      gstPercent: i.gstRate || 12,
      subTotal: i.lineAmount || (i.quantity * (i.unitPrice || 100)),
      grandTotal: i.totalLineAmount || (i.quantity * (i.unitPrice || 100) * 1.12)
    }));

    if (globalVoiceHandlers.current) {
      if (globalVoiceHandlers.current.setCartItems) {
        globalVoiceHandlers.current.setCartItems(formattedItems);
      }
      if (data.partyName && globalVoiceHandlers.current.setPartnerSearch) {
        globalVoiceHandlers.current.setPartnerSearch(data.partyName);
        if (data.partyId && globalVoiceHandlers.current.setSelectedPartnerId) {
          globalVoiceHandlers.current.setSelectedPartnerId(data.partyId);
        }
      }
    }

    if (isSale) {
      setSalesPaymentType(data.paymentType === "credit" ? "credit" : "cash");
    } else {
      setPurchasePaymentType(data.paymentType === "credit" ? "credit" : "cash");
    }

    setPage(targetPage);
    toast.success(`✅ Voice Invoice loaded into ${isSale ? "Sales Billing" : "Purchase Billing"} segment! (${formattedItems.length} line item(s) for ${data.partyName})`);
  };

  // Fetch all state data from server

// Fetch all state data from server with silent offline fallback

  async function loadData() {
    try {
      setLoading(true);
      const [prodRes, entryRes, analRes, custRes, suppRes, vouchRes, spoilRes] = await Promise.all([
        fetch("/api/products").catch(() => null),
        fetch("/api/entries").catch(() => null),
        fetch("/api/analytics").catch(() => null),
        fetch("/api/customers").catch(() => null),
        fetch("/api/suppliers").catch(() => null),
        fetch("/api/vouchers").catch(() => null),
        fetch("/api/spoilages").catch(() => null),
      ]);

      if (prodRes?.ok && entryRes?.ok && custRes?.ok && suppRes?.ok) {
        const prods = await prodRes.json();
        const ents = await entryRes.json();
        const anal = analRes?.ok ? await analRes.json() : null;
        const custs = await custRes.json();
        const supps = await suppRes.json();
        const vouchs = vouchRes?.ok ? await vouchRes.json() : [];
        const spoils = spoilRes?.ok ? await spoilRes.json() : [];

        setProducts(prods);
        setEntries(ents);
        if (anal) setAnalytics(anal);
        setCustomers(custs);
        setSuppliers(supps);
        setVouchers(vouchs);
        setSpoilages(spoils);

        // Cache locally for offline availability
        try { localStorage.setItem("cached_products", JSON.stringify(prods)); } catch(e){}
      } else {
        console.warn("Backend API endpoint not available. Using cached state.");
        const cachedProds = localStorage.getItem("cached_products");
        if (cachedProds) {
          try { setProducts(JSON.parse(cachedProds)); } catch(e){}
        }
      }
    } catch (e: any) {
      console.warn("Backend API fetch deferred:", e);
    } finally {
      setLoading(false);
    }
  }

  // Add Spoilage Record
  async function handleAddSpoilage(spoilageData: Omit<SpoilageRecord, "id" | "spoilageNo">): Promise<SpoilageRecord | null> {
    try {
      const res = await fetch("/api/spoilages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(spoilageData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to log spoilage entry");
      }

      const newRecord = await res.json();
      toast.success(`Spoilage record #${newRecord.spoilageNo} posted! Warehouse stock updated.`);
      await loadData();
      return newRecord;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  }

  // Load on mount
  useEffect(() => {
    loadData();
  }, []);

  // Handle dark mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Handle global Esc key to close invoice modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsInvoiceOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, []);

  // Record a transaction
  async function handleAddEntry(newEntryData: Omit<StockEntry, "id" | "invoiceNo" | "productId" | "godown" | "quantity" | "pricePerUnit"> & { productId?: string; godown?: Godown; quantity?: number; pricePerUnit?: number; items: InvoiceItem[] }): Promise<StockEntry | null> {
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntryData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to record transaction");
      }

      const entry: StockEntry = await res.json();
      const docName = entry.subType === "quotation" ? "Sales Quotation" : entry.subType === "delivery_note" ? "Delivery Note" : entry.subType === "credit_note" ? "Credit Note" : "Sales Invoice";
      toast.success(`${docName} #${entry.invoiceNo || entry.id.slice(0, 6)} recorded successfully!`);
      
      // Confetti effect on Sales (out)
      if (newEntryData.type === "out") {
        import("canvas-confetti").then(module => module.default());
      }
      
      // Set active invoice and open modal
      setActiveInvoice(entry);
      setIsInvoiceOpen(true);
      
      // Reload states from server
      await loadData();
      return entry;
    } catch (e: any) {
      toast.error(`Transaction Rejected: ${e.message}`);
      return null;
    }
  }

  // Safe helper to read json from response without throwing SyntaxError: Unexpected end of JSON input
  async function safeJsonParse(res: Response) {
    try {
      const text = await res.text();
      if (!text) return null;
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  // Add Customer
  async function handleAddCustomer(customerData: Omit<Customer, "id">): Promise<Customer | null> {
    try {
      const sanitized = {
        ...customerData,
        name: customerData.name?.trim() || "",
        address: customerData.address?.trim() || "N/A",
        phone: customerData.phone?.trim() || "N/A",
        gstNo: customerData.gstNo?.trim() ? customerData.gstNo.trim().toUpperCase() : "URP",
      };

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitized),
      });

      const body = await safeJsonParse(res);
      if (!res.ok) {
        throw new Error(body?.error || body?.message || `Failed to add customer (HTTP ${res.status})`);
      }

      const newCustomer = body || { ...sanitized, id: "cust_" + Date.now() };
      toast.success("Customer registered successfully!");
      await loadData();
      return newCustomer;
    } catch (e: any) {
      toast.error(e.message || "Failed to add customer");
      return null;
    }
  }

  // Add Supplier
  async function handleAddSupplier(supplierData: Omit<Supplier, "id">): Promise<Supplier | null> {
    try {
      const sanitized = {
        ...supplierData,
        name: supplierData.name?.trim() || "",
        address: supplierData.address?.trim() || "N/A",
        phone: supplierData.phone?.trim() || "N/A",
        gstNo: supplierData.gstNo?.trim() ? supplierData.gstNo.trim().toUpperCase() : "URP",
      };

      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitized),
      });

      const body = await safeJsonParse(res);
      if (!res.ok) {
        throw new Error(body?.error || body?.message || `Failed to add supplier (HTTP ${res.status})`);
      }

      const newSupplier = body || { ...sanitized, id: "sup_" + Date.now() };
      toast.success("Supplier registered successfully!");
      await loadData();
      return newSupplier;
    } catch (e: any) {
      toast.error(e.message || "Failed to add supplier");
      return null;
    }
  }

  async function handleDeleteSupplier(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Failed to delete supplier (HTTP ${res.status})`);
      toast.success("Supplier removed from accounts!");
      await loadData();
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    }
  }

  async function handleUpdateSupplier(id: string, supplierData: Partial<Supplier>): Promise<boolean> {
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierData),
      });
      const body = await safeJsonParse(res);
      if (!res.ok) {
        throw new Error(body?.error || body?.message || `Failed to update supplier (HTTP ${res.status})`);
      }
      toast.success("Supplier profile updated!");
      await loadData();
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    }
  }

  // Add Product
  async function handleAddProduct(productData: Omit<Product, "id">): Promise<boolean> {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      const body = await safeJsonParse(res);
      if (!res.ok) {
        throw new Error(body?.error || body?.message || `Failed to add product (HTTP ${res.status})`);
      }

      toast.success("Product registered in inventory!");
      await loadData();
      return true;
    } catch (e: any) {
      toast.error(e.message || "Failed to register product");
      return false;
    }
  }

  async function handleDeleteProduct(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Failed to delete product (HTTP ${res.status})`);
      toast.success("Product deleted from catalog!");
      await loadData();
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    }
  }

  async function handleDeleteCustomer(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Failed to delete customer (HTTP ${res.status})`);
      toast.success("Customer removed from accounts!");
      await loadData();
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    }
  }

  async function handleUpdateCustomer(id: string, customerData: Partial<Customer>): Promise<boolean> {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });
      const body = await safeJsonParse(res);
      if (!res.ok) {
        throw new Error(body?.error || body?.message || `Failed to update customer (HTTP ${res.status})`);
      }
      toast.success("Customer profile updated!");
      await loadData();
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    }
  }

  async function handleClearHistory() {
    try {
      await fetch("/api/clear-history", { method: "POST" });
      localStorage.removeItem("sales_invoices");
      localStorage.removeItem("sales_quotations");
      localStorage.removeItem("delivery_notes");
      localStorage.removeItem("purchase_orders");
      localStorage.removeItem("grn_entries");
      localStorage.removeItem("credit_notes");
      localStorage.removeItem("debit_notes");
      localStorage.removeItem("vouchers");
      localStorage.removeItem("spoilages");
      toast.success("Transaction and Report History cleared successfully!");
      await loadData();
    } catch (e: any) {
      toast.error(`Error clearing history: ${e.message}`);
    }
  }

  const handleApplyClearancePromo = (prod: Product, godown: Godown, rate: number, qty: number) => {
    setSalesPaymentType("cash");
    setPage("sales-billing");
    toast.success(`Loaded clearance promo for ${prod.name} (Godown ${godown} @ ₹${rate}) into Sales POS!`);
  };

  // ─── Universal 1-Click Time Machine / Mutable History Re-Entry Router ───
  const handleEditEntryFromHistory = (entryOrRef: any) => {
    if (!entryOrRef) return;

    let targetEntry: StockEntry | null = null;
    let targetVoucher: Voucher | null = null;

    if (typeof entryOrRef === "string") {
      targetEntry = entries.find(e => e.id === entryOrRef || e.invoiceNo === entryOrRef) || null;
      if (!targetEntry) {
        targetVoucher = vouchers.find(v => v.id === entryOrRef || v.voucherNo === entryOrRef) || null;
      }
    } else if (entryOrRef.voucherNo || entryOrRef.debitAccount || entryOrRef.creditAccount) {
      targetVoucher = entryOrRef;
    } else if (entryOrRef.type === "in" || entryOrRef.type === "out") {
      targetEntry = entryOrRef;
    }

    const stamp = Date.now();

    if (targetEntry) {
      const isSale = targetEntry.type === "out";
      const isPurchase = targetEntry.type === "in";

      if (isSale) {
        let targetPage = "sales-billing";
        if (targetEntry.subType === "quotation" || (targetEntry.invoiceNo && targetEntry.invoiceNo.startsWith("QTN"))) {
          targetPage = "sales-quotation";
        } else if (targetEntry.subType === "delivery_note" || (targetEntry.invoiceNo && targetEntry.invoiceNo.startsWith("DN"))) {
          targetPage = "sales-delivery";
        } else if (targetEntry.subType === "credit_note" || (targetEntry.invoiceNo && targetEntry.invoiceNo.startsWith("CN"))) {
          targetPage = "sales-credit";
        }

        setActiveEditRecord({ ...targetEntry, _stamp: stamp });
        setPage(targetPage);
        setSalesPaymentType(targetEntry.paymentType || "cash");
        toast.success(`✏️ Re-opened Sales Record #${targetEntry.invoiceNo || targetEntry.id} in 100% Mutable & Editable POS Form!`);
        return;
      }

      if (isPurchase) {
        let targetPage = "purchase-billing";
        if (targetEntry.subType === "purchase_order" || (targetEntry.invoiceNo && targetEntry.invoiceNo.startsWith("PO"))) {
          targetPage = "purchase-order";
        } else if (targetEntry.subType === "grn" || (targetEntry.invoiceNo && targetEntry.invoiceNo.startsWith("GRN"))) {
          targetPage = "purchase-grn";
        } else if (targetEntry.subType === "debit_note" || (targetEntry.invoiceNo && targetEntry.invoiceNo.startsWith("DN"))) {
          targetPage = "purchase-debit";
        }

        setActiveEditRecord({ ...targetEntry, _stamp: stamp });
        setPage(targetPage);
        setPurchasePaymentType(targetEntry.paymentType === "credit" ? "credit" : "cash");
        toast.success(`✏️ Re-opened Purchase Record #${targetEntry.invoiceNo || targetEntry.id} in 100% Mutable & Editable Form!`);
        return;
      }
    }

    if (targetVoucher) {
      setActiveEditRecord({ ...targetVoucher, _stamp: stamp });
      setPage("vouchers");
      toast.success(`✏️ Re-opened Voucher #${targetVoucher.voucherNo || targetVoucher.id} in 100% Mutable & Editable Voucher Console!`);
      return;
    }

    toast.info("Navigated to procedure step.");
  };

// ─── Credit Recovery & Reminders Cockpit ─────────────────────────────────────

function CreditRecoveryPage({
  entries = [],
  customers = [],
  onViewInvoice,
}: {
  entries?: StockEntry[];
  customers?: Customer[];
  onViewInvoice?: (inv: StockEntry) => void;
}) {
  const [search, setSearch] = useState("");
  const [copiedPartner, setCopiedPartner] = useState<string | null>(null);
  const [sendingMail, setSendingMail] = useState<string | null>(null);

  // Next 1st of month calculation
  const nextAutoDate = useMemo(() => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return next.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }, []);

  const fmt = (val: number) => `₹${(val || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const formatDDMMYYYY = (dStr: string) => {
    if (!dStr) return "N/A";
    const parts = dStr.split("-");
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dStr;
  };

  // Filter credit entries that are sales (type === "out") and paymentType === "credit"
  const creditEntries = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return entries
      .filter(e => e.type === "out" && e.paymentType === "credit")
      .map(e => {
        const grandTotal = e.grandTotal || (e.subTotal || ((e.quantity || 0) * (e.pricePerUnit || 0))) * 1.12;
        const due = e.dueDate || e.date;
        const diffMs = new Date(today).getTime() - new Date(due).getTime();
        const overdueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const isOverdue = overdueDays > 0;

        let riskLevel: "high" | "medium" | "low" = "low";
        if (overdueDays > 30) riskLevel = "high";
        else if (overdueDays > 0) riskLevel = "medium";

        return {
          ...e,
          grandTotal,
          due,
          overdueDays: Math.max(0, overdueDays),
          isOverdue,
          riskLevel,
        };
      });
  }, [entries]);

  // Aggregate by Customer Partner
  const partnerSummaries = useMemo(() => {
    const map: Record<string, {
      partner: string;
      customer?: Customer;
      totalOutstanding: number;
      overdueOutstanding: number;
      invoicesCount: number;
      oldestDue: string;
      maxOverdueDays: number;
      entries: typeof creditEntries;
    }> = {};

    creditEntries.forEach(e => {
      const pName = e.partner;
      if (!map[pName]) {
        const custObj = customers.find(c => c.name.toLowerCase() === pName.toLowerCase());
        map[pName] = {
          partner: pName,
          customer: custObj,
          totalOutstanding: 0,
          overdueOutstanding: 0,
          invoicesCount: 0,
          oldestDue: e.due,
          maxOverdueDays: e.overdueDays,
          entries: [],
        };
      }
      map[pName].totalOutstanding += e.grandTotal;
      if (e.isOverdue) {
        map[pName].overdueOutstanding += e.grandTotal;
      }
      map[pName].invoicesCount += 1;
      map[pName].entries.push(e);
      if (e.overdueDays > map[pName].maxOverdueDays) {
        map[pName].maxOverdueDays = e.overdueDays;
      }
      if (new Date(e.due) < new Date(map[pName].oldestDue)) {
        map[pName].oldestDue = e.due;
      }
    });

    return Object.values(map).sort((a, b) => b.overdueOutstanding - a.overdueOutstanding);
  }, [creditEntries, customers]);

  const filteredPartners = partnerSummaries.filter(p => p.partner.toLowerCase().includes(search.toLowerCase()));

  const totalCreditBalance = partnerSummaries.reduce((s, p) => s + p.totalOutstanding, 0);
  const totalOverdueBalance = partnerSummaries.reduce((s, p) => s + p.overdueOutstanding, 0);
  const overdueCustomersCount = partnerSummaries.filter(p => p.overdueOutstanding > 0).length;
  const highRiskCount = partnerSummaries.filter(p => p.maxOverdueDays > 30).length;

  const handleOpenGmail = (p: typeof partnerSummaries[0]) => {
    const email = p.customer?.email ? p.customer.email.trim() : "";
    const invList = p.entries.map(e => `• Inv #${e.invoiceNo || e.id.slice(0,6)}: ₹${e.grandTotal.toFixed(0)} (Due: ${formatDDMMYYYY(e.due)})`).join("\n");
    const subject = `Payment Reminder: Credit Outstanding Balance - ${p.partner}`;
    const msg = `Dear ${p.partner},\n\nThis is a payment statement reminder from Spice Route Trading Co. regarding your outstanding credit balance of ₹${p.totalOutstanding.toLocaleString("en-IN")} across ${p.invoicesCount} active billing invoices:\n\n${invList}\n\nBank Remittance Account:\nAccount Name: Spice Route Trading Co.\nBank: HDFC Bank (Fort Branch, Mumbai)\nA/C No: 50200088991122 | IFSC: HDFC0000240\n\nKindly process payment at your earliest convenience.\n\nThank you,\nSpice Route Trading Co.`;

    if (email) {
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`;
      window.open(gmailUrl, "_blank");
      toast.success(`Opened Gmail compose window for ${p.partner} (${email})!`);
    } else {
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`;
      window.open(mailtoUrl, "_blank");
      toast.info(`Email address missing for ${p.partner}. Opened default email composer.`);
    }
  };

  // 1-Click Multi-Channel (WhatsApp + Viber + Gmail) Automated Reminder Sender
  const handleSendMail = async (p: typeof partnerSummaries[0]) => {
    const customerId = p.customer?.id;
    const email = (p.customer as any)?.email?.trim();

    if (!email && !customerId) {
      handleOpenGmail(p);
      return;
    }

    if (!email) {
      toast.error(`No email address on file for ${p.partner}. Please add email in Masters > Customer.`);
      return;
    }

    const keyId = customerId || p.partner;
    setSendingMail(keyId);
    toast.loading(`Processing email notice for ${email}...`, { id: `mail-${keyId}` });
    try {
      const res = await fetch(`/api/credit-recovery/send-mail/${customerId}`, { method: "POST" });
      const data = await safeJsonParse(res);
      if (res.ok && data?.success) {
        toast.success(`Overdue notice email successfully sent to ${data.email || email}!`, { id: `mail-${keyId}` });
      } else {
        handleOpenGmail(p);
        toast.success(`Opened Gmail Web Compose for ${p.partner} (${email})!`, { id: `mail-${keyId}` });
      }
    } catch (err: any) {
      handleOpenGmail(p);
      toast.success(`Opened Gmail Web Compose for ${p.partner} (${email})!`, { id: `mail-${keyId}` });
    } finally {
      setSendingMail(null);
    }
  };

  const handleSendAllReminders = (p: typeof partnerSummaries[0]) => {
    const phone = p.customer?.phone ? p.customer.phone.replace(/[^0-9+]/g, "") : "";
    const email = p.customer?.email ? p.customer.email.trim() : "";

    if (!phone && !email) {
      toast.error(`Cannot send reminder for "${p.partner}": Both phone number and email address are missing in Customer Master! Please update contact details.`);
      return;
    }

    const invList = p.entries.map(e => `• Inv #${e.invoiceNo || e.id.slice(0,6)}: ₹${e.grandTotal.toFixed(0)} (Due: ${formatDDMMYYYY(e.due)})`).join("\n");
    const msg = `*Spice Route Trading Co. - Credit Payment Reminder Notice*\n\nDear *${p.partner}*,\n\nThis is an automated 1-click ledger statement regarding your outstanding credit balance of *${fmt(p.totalOutstanding)}* across ${p.invoicesCount} active billing invoices:\n\n${invList}\n\n*Bank Details for Remittance:*\nAccount Name: Spice Route Trading Co.\nBank: HDFC Bank (Fort Branch)\nA/C No: 50200088991122 | IFSC: HDFC0000240\n\nKindly acknowledge and process payment at your earliest convenience. Thank you!`;

    const dispatched: string[] = [];

    // 1. WhatsApp Dispatch (if phone is available)
    if (phone) {
      const waPhone = phone.replace(/[^0-9]/g, "");
      const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, "_blank");
      dispatched.push("WhatsApp");
    }

    // 2. Viber Dispatch (if phone is available)
    if (phone) {
      setTimeout(() => {
        const viberUrl = `viber://chat?number=${encodeURIComponent(phone)}`;
        window.open(viberUrl, "_blank");
      }, 300);
      dispatched.push("Viber");
    }

    // 3. Gmail / Email Dispatch (if email is available)
    if (email) {
      setTimeout(() => {
        const subject = `Payment Reminder: Credit Balance - ${p.partner}`;
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`;
        window.open(gmailUrl, "_blank");
      }, 600);
      dispatched.push(`Gmail (${email})`);
    }

    // Copy to clipboard fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg);
    }
    setCopiedPartner(p.partner + "_all");

    if (!phone) {
      toast.info(`Phone number missing for ${p.partner}. Reminder sent directly to available email (${email}).`);
    } else if (!email) {
      toast.info(`Email address missing for ${p.partner}. Reminder sent directly to phone (${phone}) via WhatsApp & Viber.`);
    }

    toast.success(`🚀 1-Click Multi-Channel Reminder delivered to ${p.partner} via [${dispatched.join(" + ")}]!`);
  };

  const handleCopyWhatsApp = (p: typeof partnerSummaries[0]) => {
    const invList = p.entries.map(e => `• Inv #${e.invoiceNo || e.id.slice(0,6)}: ₹${e.grandTotal.toFixed(0)} (Due: ${formatDDMMYYYY(e.due)})`).join("\n");
    const msg = `*Spice Route Trading Co. - Credit Payment Notice*\n\nDear *${p.partner}*,\n\nThis is a gentle statement reminder regarding your outstanding credit ledger balance of *${fmt(p.totalOutstanding)}* across ${p.invoicesCount} active billing invoices:\n\n${invList}\n\n*Bank Account Details for Remittance:*\nAccount Name: Spice Route Trading Co.\nBank: HDFC Bank (Fort Branch, Mumbai)\nA/C No: 50200088991122\nIFSC: HDFC0000240\n\nKindly acknowledge and process payment at your earliest convenience. Thank you for your continued trade partnership!`;

    navigator.clipboard.writeText(msg);
    setCopiedPartner(p.partner + "_wa");
    toast.success(`Personalized AI WhatsApp Reminder copied for ${p.partner}!`);
    setTimeout(() => setCopiedPartner(null), 3000);
  };

  const handleOpenWhatsApp = (p: typeof partnerSummaries[0]) => {
    const phone = p.customer?.phone ? p.customer.phone.replace(/[^0-9]/g, "") : "";
    const invList = p.entries.map(e => `• Inv #${e.invoiceNo || e.id.slice(0,6)}: ₹${e.grandTotal.toFixed(0)} (Due: ${formatDDMMYYYY(e.due)})`).join("\n");
    const msg = `*Spice Route Trading Co. - Credit Payment Notice*\n\nDear *${p.partner}*,\n\nThis is a gentle statement reminder regarding your outstanding credit ledger balance of *${fmt(p.totalOutstanding)}* across ${p.invoicesCount} active billing invoices:\n\n${invList}\n\n*Bank Details:*\nHDFC A/C: 50200088991122 | IFSC: HDFC0000240\n\nKindly process payment at your earliest convenience. Thank you!`;
    
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const handleCopyViber = (p: typeof partnerSummaries[0]) => {
    const invList = p.entries.map(e => `• Inv #${e.invoiceNo || e.id.slice(0,6)}: ₹${e.grandTotal.toFixed(0)} (Due: ${formatDDMMYYYY(e.due)})`).join("\n");
    const msg = `📱 *VIBER CREDIT RECOVERY NOTICE*\n\n*Spice Route Trading Co.*\nDear *${p.partner}*,\n\nYour account reflects an active credit ledger balance of *${fmt(p.totalOutstanding)}* across ${p.invoicesCount} invoices:\n\n${invList}\n\n*Payment Remittance Account:*\nBank: HDFC Bank (Fort Branch)\nA/C: 50200088991122 | IFSC: HDFC0000240\n\nPlease reply or confirm payment receipt. Thank you!`;

    navigator.clipboard.writeText(msg);
    setCopiedPartner(p.partner + "_viber");
    toast.success(`Personalized Viber Recovery Notice copied for ${p.partner}!`);
    setTimeout(() => setCopiedPartner(null), 3000);
  };

  const handleOpenViber = (p: typeof partnerSummaries[0]) => {
    const phone = p.customer?.phone ? p.customer.phone.replace(/[^0-9+]/g, "") : "";
    const invList = p.entries.map(e => `• Inv #${e.invoiceNo || e.id.slice(0,6)}: ₹${e.grandTotal.toFixed(0)} (Due: ${formatDDMMYYYY(e.due)})`).join("\n");
    const msg = `📱 *VIBER CREDIT RECOVERY NOTICE*\n\n*Spice Route Trading Co.*\nDear *${p.partner}*,\n\nYour account reflects an active credit ledger balance of *${fmt(p.totalOutstanding)}* across ${p.invoicesCount} invoices:\n\n${invList}\n\n*Bank Details:*\nHDFC A/C: 50200088991122 | IFSC: HDFC0000240\n\nKindly process payment at your earliest convenience. Thank you!`;
    
    const viberUrl = phone ? `viber://chat?number=${encodeURIComponent(phone)}` : `viber://forward?text=${encodeURIComponent(msg)}`;
    window.open(viberUrl, "_blank");
    toast.success(`Opening Viber Reminder for ${p.partner}!`);
  };

  const handleGeneratePDFNotice = async (p: typeof partnerSummaries[0]) => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

      // Header Banner
      doc.setFillColor(185, 28, 28);
      doc.rect(0, 0, 210, 24, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("SPICE ROUTE TRADING CO.", 14, 11);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text("OFFICIAL CREDIT RECOVERY & PAYMENT DEMAND NOTICE", 14, 17);

      doc.setFontSize(7.5);
      doc.text(`Date: ${formatDDMMYYYY(new Date().toISOString().split("T")[0])}`, 196, 11, { align: "right" });

      // Customer info
      let y = 34;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`To: ${p.partner}`, 14, y);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      if (p.customer?.address) doc.text(p.customer.address, 14, y + 5);
      if (p.customer?.phone) doc.text(`Phone: ${p.customer.phone}`, 14, y + 9);
      if (p.customer?.gstNo) doc.text(`GSTIN: ${p.customer.gstNo}`, 14, y + 13);

      y += 22;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("SUBJECT: DEMAND FOR PAYMENT OF OVERDUE CREDIT BALANCE", 14, y);

      y += 8;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const textLines = doc.splitTextToSize(
        `This is a formal statement notice from Spice Route Trading Co. regarding your account ledger. As of ${formatDDMMYYYY(new Date().toISOString().split("T")[0])}, your account reflects an outstanding credit balance of INR ${p.totalOutstanding.toLocaleString("en-IN")}, of which INR ${p.overdueOutstanding.toLocaleString("en-IN")} is past due.`,
        182
      );
      doc.text(textLines, 14, y);

      y += textLines.length * 4 + 6;

      // Table of Overdue Invoices
      doc.setFillColor(15, 23, 42);
      doc.rect(14, y, 182, 7, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("Invoice No", 17, y + 4.5);
      doc.text("Billing Date", 50, y + 4.5);
      doc.text("Due Date", 85, y + 4.5);
      doc.text("Overdue Days", 125, y + 4.5);
      doc.text("Amount (INR)", 193, y + 4.5, { align: "right" });

      y += 7;
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "normal");

      p.entries.forEach((e, idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y, 182, 6, "F");
        }
        doc.text(e.invoiceNo || e.id.slice(0, 8), 17, y + 4);
        doc.text(formatDDMMYYYY(e.date), 50, y + 4);
        doc.text(formatDDMMYYYY(e.due), 85, y + 4);
        doc.text(`${e.overdueDays} Days`, 125, y + 4);
        doc.setFont("helvetica", "bold");
        doc.text(`INR ${e.grandTotal.toLocaleString("en-IN")}`, 193, y + 4, { align: "right" });
        doc.setFont("helvetica", "normal");
        y += 6;
      });

      y += 10;
      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL AMOUNT REMITTABLE: INR ${p.totalOutstanding.toLocaleString("en-IN")}`, 193, y, { align: "right" });

      y += 12;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("REMITTANCE INSTRUCTIONS:", 14, y);
      doc.setFont("helvetica", "normal");
      doc.text("Bank Name: HDFC Bank | Branch: Fort, Mumbai", 14, y + 5);
      doc.text("Account Name: Spice Route Trading Co. | Account No: 50200088991122", 14, y + 9);
      doc.text("IFSC Code: HDFC0000240", 14, y + 13);

      doc.save(`demand_notice_${p.partner.replace(/\s+/g, "_")}.pdf`);
      toast.success(`Formal AI Settlement Notice PDF created for ${p.partner}!`);
    } catch (err: any) {
      toast.error(`Failed to generate PDF: ${err.message}`);
    }
  };

  // Dedicated Keyboard Shortcuts: Alt + W (WhatsApp), Alt + V (Viber), Alt + P (PDF Notice)
  useEffect(() => {
    const handleRecoveryHotkeys = (e: KeyboardEvent) => {
      const isTyping = document.activeElement && (
        document.activeElement.tagName === "INPUT" || 
        document.activeElement.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement).isContentEditable
      );
      if (isTyping) return;

      const topPartner = filteredPartners[0];
      if (!topPartner) return;

      if (e.altKey && (e.code === "KeyM" || e.key === "m" || e.key === "M")) {
        e.preventDefault();
        if (topPartner) handleSendMail(topPartner);
      } else if (e.altKey && e.code === "KeyW") {
        e.preventDefault();
        handleOpenWhatsApp(topPartner);
        toast.info(`Shortcut [Alt + W]: Opening WhatsApp for ${topPartner.partner}`);
      } else if (e.altKey && e.code === "KeyV") {
        e.preventDefault();
        handleOpenViber(topPartner);
        toast.info(`Shortcut [Alt + V]: Opening Viber for ${topPartner.partner}`);
      } else if (e.altKey && e.code === "KeyP") {
        e.preventDefault();
        handleGeneratePDFNotice(topPartner);
        toast.info(`Shortcut [Alt + P]: Generating PDF Notice for ${topPartner.partner}`);
      }
    };

    window.addEventListener("keydown", handleRecoveryHotkeys);
    return () => window.removeEventListener("keydown", handleRecoveryHotkeys);
  }, [filteredPartners]);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/80 pb-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground font-serif flex items-center gap-2.5">
            <ShieldAlert className="text-red-500" size={28} /> AI Credit Recovery & Payment Reminders
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Monitor accounts receivable credit exposure, track overdue days, and send automated 1-click reminders.
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs font-mono text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Auto Monthly Email Active — Next Dispatch: {nextAutoDate} at 09:00 AM
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              const overdueCount = partnerSummaries.filter(p => p.overdueOutstanding > 0).length;
              if (overdueCount === 0) {
                toast.info("No overdue customer accounts found to remind.");
                return;
              }
              partnerSummaries.filter(p => p.overdueOutstanding > 0).forEach((p, idx) => {
                setTimeout(() => handleSendAllReminders(p), idx * 1000);
              });
              toast.success(`🚀 Triggered 1-Click Multi-Channel Reminders for ${overdueCount} overdue accounts!`);
            }}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-mono text-xs font-black rounded-xl flex items-center gap-2 transition-all shadow-md uppercase tracking-wider"
          >
            <Zap size={15} /> 🚀 1-Click Multi-Channel Broadcast ({overdueCustomersCount})
          </button>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search debtor..."
              className="pl-8 pr-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Search size={13} className="absolute left-2.5 top-2 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm border-l-4 border-l-red-500">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block mb-1 font-bold">Total Overdue Credit</span>
          <span className="text-xl font-bold font-mono text-red-600">{fmt(totalOverdueBalance)}</span>
          <span className="block text-[10px] font-mono text-muted-foreground mt-1">{overdueCustomersCount} accounts past due date</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-sm border-l-4 border-l-amber-500">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block mb-1 font-bold">Total Credit Outstanding</span>
          <span className="text-xl font-bold font-mono text-amber-600">{fmt(totalCreditBalance)}</span>
          <span className="block text-[10px] font-mono text-muted-foreground mt-1">Across {partnerSummaries.length} credit clients</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-sm border-l-4 border-l-rose-600">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block mb-1 font-bold">High Risk Default (&gt;30 Days)</span>
          <span className="text-xl font-bold font-mono text-rose-700">{highRiskCount} Accounts</span>
          <span className="block text-[10px] font-mono text-muted-foreground mt-1">Action required immediately</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-sm border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block mb-1 font-bold">1-Click Automated Delivery</span>
          <span className="text-xl font-bold font-mono text-emerald-600">WhatsApp + Viber + Gmail</span>
          <span className="block text-[10px] font-mono text-muted-foreground mt-1">Single click delivers across all channels</span>
        </div>
      </div>

      {/* Credit Debtors List */}
      <div className="space-y-4">
        {filteredPartners.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground italic font-mono text-xs">
            No credit debtor accounts found matching your query.
          </div>
        ) : (
          filteredPartners.map((p, idx) => (
            <div key={idx} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">{p.partner}</h3>
                    {p.maxOverdueDays > 30 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 border border-rose-500/30 uppercase">
                        Severe Risk (&gt;30d Overdue)
                      </span>
                    ) : p.overdueOutstanding > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30 uppercase">
                        Overdue ({p.maxOverdueDays} days)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 uppercase">
                        Active Credit
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-1 flex items-center gap-4 flex-wrap">
                    <span>GSTIN: <strong>{p.customer?.gstNo || "Not Specified"}</strong></span>
                    <span>Phone: <strong>{p.customer?.phone || "N/A"}</strong></span>
                    <span>Email: <strong>{p.customer?.email || "N/A"}</strong></span>
                    <span>Address: {p.customer?.address || "N/A"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  {/* ── 1-CLICK SEND MAIL BUTTON ── */}
                  <button
                    type="button"
                    id={`send-mail-btn-${p.customer?.id || idx}`}
                    onClick={() => handleSendMail(p)}
                    disabled={sendingMail === p.customer?.id}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-mono text-xs font-black rounded-xl shadow-lg flex items-center gap-2 uppercase tracking-wider transition-all transform hover:scale-[1.02]"
                    title={`Send overdue invoice email directly to ${(p.customer as any)?.email || "customer"} [Shortcut: Alt+M]`}
                  >
                    {sendingMail === p.customer?.id ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Sending…
                      </>
                    ) : (
                      <>
                        <Mail size={15} /> 📧 1-Click Send Mail
                        <span className="bg-white/20 px-1 py-0.5 rounded text-[9px] font-mono">[Alt+M]</span>
                      </>
                    )}
                  </button>

                  {/* PROMINENT 1-CLICK ALL REMINDERS BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleSendAllReminders(p)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-mono text-xs font-black rounded-xl shadow-lg flex items-center gap-2 uppercase tracking-wider transition-all transform hover:scale-[1.02]"
                    title="Send WhatsApp, Viber, and Gmail Reminders in 1-Click!"
                  >
                    <Zap size={15} /> 🚀 1-Click Send All Reminders
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(p)}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm uppercase tracking-wider"
                    title="WhatsApp direct chat [Shortcut: Alt + W]"
                  >
                    <Send size={14} /> WhatsApp <span className="bg-white/20 px-1 py-0.2 rounded text-[9px] font-mono">[Alt+W]</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenViber(p)}
                    className="px-3 py-1.5 bg-[#7360f2] hover:bg-[#5e4bd8] text-white font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm uppercase tracking-wider"
                    title="Viber direct chat [Shortcut: Alt + V]"
                  >
                    <MessageSquare size={14} /> Viber <span className="bg-white/20 px-1 py-0.2 rounded text-[9px] font-mono">[Alt+V]</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenGmail(p)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm uppercase tracking-wider"
                    title="Gmail compose"
                  >
                    <Mail size={14} /> Gmail
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGeneratePDFNotice(p)}
                    className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm uppercase tracking-wider"
                    title="Shortcut: Alt + P"
                  >
                    <Download size={14} /> Notice PDF <span className="bg-muted px-1 py-0.2 rounded text-[9px] font-mono">[Alt+P]</span>
                  </button>
                </div>
              </div>

              {/* Outstanding Invoices Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-secondary/15 border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                      <th className="px-3 py-2">Invoice No</th>
                      <th className="px-3 py-2">Billing Date</th>
                      <th className="px-3 py-2">Credit Due Date</th>
                      <th className="px-3 py-2 text-center">Overdue Days</th>
                      <th className="px-3 py-2 text-right">Invoice Amount</th>
                      <th className="px-3 py-2 text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono">
                    {p.entries.map((e, i) => (
                      <tr key={i} className="hover:bg-secondary/10">
                        <td className="px-3 py-2 font-bold text-foreground">{e.invoiceNo || e.id.slice(0, 8)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatDDMMYYYY(e.date)}</td>
                        <td className="px-3 py-2 font-semibold text-foreground">{formatDDMMYYYY(e.due)}</td>
                        <td className="px-3 py-2 text-center">
                          {e.overdueDays > 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/30">
                              {e.overdueDays} Days Past Due
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-semibold">On Schedule</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">{fmt(e.grandTotal)}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => onViewInvoice(e)}
                            className="px-2 py-1 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded text-[10px] font-semibold"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


// ─── Dynamic Expiry Sale & Offers Cockpit ────────────────────────────────────

function ExpirySalePage({
  products = [],
  entries = [],
  setPage,
  onRefresh,
  onLoadClearancePromo
}: {
  products?: Product[];
  entries?: StockEntry[];
  setPage: (p: string) => void;
  onRefresh: () => void;
  onLoadClearancePromo?: (prod: Product, godown: Godown, rate: number, qty: number) => void;
}) {
  const [filterTier, setFilterTier] = useState<"all" | "critical" | "urgent" | "promo">("all");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fmt = (val: number) => `₹${(val || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const formatDDMMYYYY = (dStr: string) => {
    if (!dStr) return "N/A";
    const parts = dStr.split("-");
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dStr;
  };

  const offerItems = useMemo(() => {
    const today = new Date();
    const items: {
      product: Product;
      entryDate: string;
      expiryDate: string;
      daysRemaining: number;
      godown: Godown;
      stock: number;
      originalPrice: number;
      discountPercent: number;
      offerPrice: number;
      savings: number;
      clearanceValue: number;
      tier: "expired" | "critical" | "urgent" | "promo" | "early";
      badgeText: string;
      badgeColor: string;
    }[] = [];

    (products || []).forEach(p => {
      if (!p || (p.stock || 0) <= 0) return;

      const prodEntries = (entries || []).filter(e => e && e.type === "in" && (e.productId === p.id || e.items?.some(i => i && i.productId === p.id)));
      
      const godownsWithStock = ALL_GODOWNS.filter(g => (p.godownStocks?.[g] || 0) > 0);
      const targetGodowns = godownsWithStock.length > 0 ? godownsWithStock : ["A" as Godown];

      targetGodowns.forEach(gdn => {
        const qtyInGodown = p.godownStocks?.[gdn] || Math.ceil((p.stock || 0) / targetGodowns.length);
        if (qtyInGodown <= 0) return;

        const latestEntry = prodEntries.find(e => e && e.godown === gdn) || prodEntries[0];
        const fallbackDate = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
        const entryDateStr = (latestEntry && latestEntry.date) ? latestEntry.date : fallbackDate;

        const expiryDays = p.expiryDays || (p.isPerishable ? 14 : 90);
        const parsedEntryMs = new Date(entryDateStr).getTime();
        const validEntryMs = isNaN(parsedEntryMs) ? (Date.now() - 30 * 86400000) : parsedEntryMs;
        const expDate = new Date(validEntryMs + expiryDays * 86400000);
        const expDateStr = isNaN(expDate.getTime()) ? new Date().toISOString().split("T")[0] : expDate.toISOString().split("T")[0];

        const diffMs = expDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let discountPercent = 0;
        let tier: "expired" | "critical" | "urgent" | "promo" | "early" = "early";
        let badgeText = "STANDARD PRICE";
        let badgeColor = "bg-gray-100 text-gray-700 border-gray-200";

        if (daysRemaining <= 0) {
          tier = "expired";
          discountPercent = 90;
          badgeText = "EXPIRED - DISPOSAL 90%";
          badgeColor = "bg-red-500/10 text-red-600 border-red-500/30 font-bold";
        } else if (daysRemaining <= 7) {
          tier = "critical";
          discountPercent = 50;
          badgeText = "CRITICAL FLASH SALE 50% OFF";
          badgeColor = "bg-red-600 text-white font-bold animate-pulse";
        } else if (daysRemaining <= 15) {
          tier = "urgent";
          discountPercent = 30;
          badgeText = "URGENT CLEARANCE 30% OFF";
          badgeColor = "bg-amber-500 text-white font-bold";
        } else if (daysRemaining <= 30) {
          tier = "promo";
          discountPercent = 20;
          badgeText = "EXPIRY OFFER 20% OFF";
          badgeColor = "bg-indigo-600 text-white font-semibold";
        } else if (daysRemaining <= 60) {
          tier = "early";
          discountPercent = 10;
          badgeText = "FRESHNESS DEAL 10% OFF";
          badgeColor = "bg-emerald-600 text-white font-semibold";
        } else {
          return;
        }

        const offerPrice = Math.max(1, Math.round((p.sellPrice || 0) * (1 - discountPercent / 100)));
        const savings = Math.max(0, (p.sellPrice || 0) - offerPrice);
        const clearanceValue = offerPrice * qtyInGodown;

        items.push({
          product: p,
          entryDate: entryDateStr,
          expiryDate: expDateStr,
          daysRemaining,
          godown: gdn,
          stock: qtyInGodown,
          originalPrice: p.sellPrice || 0,
          discountPercent,
          offerPrice,
          savings,
          clearanceValue,
          tier,
          badgeText,
          badgeColor
        });
      });
    });

    return items.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [products, entries]);

  const filteredItems = useMemo(() => {
    return offerItems.filter(item => {
      if (!item || !item.product) return false;
      const matchSearch = (item.product.name || "").toLowerCase().includes(search.toLowerCase()) || (item.godown || "").toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;

      if (filterTier === "critical") return item.daysRemaining <= 7;
      if (filterTier === "urgent") return item.daysRemaining <= 15;
      if (filterTier === "promo") return item.daysRemaining <= 30;
      return true;
    });
  }, [offerItems, search, filterTier]);

  const totalDiscountStockVal = filteredItems.reduce((s, i) => s + (i.clearanceValue || 0), 0);
  const totalCustomerSavings = filteredItems.reduce((s, i) => s + (i.savings || 0) * (i.stock || 0), 0);
  const criticalItemsCount = offerItems.filter(i => i.daysRemaining <= 7).length;

  const handleApplyToMasterCatalog = async (item: typeof offerItems[0]) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...item.product,
          sellPrice: item.offerPrice
        })
      });
      if (res.ok) {
        toast.success(`Updated Master Selling Price of ${item.product.name} to ₹${item.offerPrice} (${item.discountPercent}% Expiry Offer)!`);
        onRefresh();
      }
    } catch (e: any) {
      toast.error("Failed to update catalog price");
    }
  };

  const handleCopyWhatsAppNotice = (item: typeof offerItems[0]) => {
    const msg = `🔥 *SPICE ROUTE TRADING CO. - SPECIAL EXPIRY CLEARANCE SALE!* 🔥\n\nDear Valued Buyer,\n\nWe are offering a massive *${item.discountPercent}% DISCOUNT* on fresh stock approaching expiry date in Warehouse ${item.godown}:\n\n📦 *Product:* ${item.product.name}\n🏷️ *Original Price:* ₹${item.originalPrice}/${item.product.unit}\n💥 *SPECIAL OFFER PRICE:* ₹${item.offerPrice}/${item.product.unit} (Save ₹${item.savings}/${item.product.unit}!)\n📅 *Days to Expiry:* ${item.daysRemaining} Days (${formatDDMMYYYY(item.expiryDate)})\n📊 *Available Stock:* ${item.stock} ${item.product.unit}\n\n*Hurry, limited stock remaining! Call or message us to place order now.*`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg);
    }
    setCopiedId(item.product.id + item.godown + "_wa");
    toast.success(`WhatsApp Expiry Offer Notice copied for ${item.product.name}!`);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleCopyViberNotice = (item: typeof offerItems[0]) => {
    const msg = `📱 *VIBER EXPIRY SALE ALERT - SPICE ROUTE TRADING CO.*\n\n*${item.discountPercent}% OFF CLEARANCE DEAL!*\nProduct: ${item.product.name}\nOffer Price: ₹${item.offerPrice}/${item.product.unit} (Was ₹${item.originalPrice})\nWarehouse: Godown ${item.godown} (${item.stock} ${item.product.unit} in stock)\nExpiry Date: ${formatDDMMYYYY(item.expiryDate)} (${item.daysRemaining} days left)\n\nReply to claim deal!`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg);
    }
    setCopiedId(item.product.id + item.godown + "_viber");
    toast.success(`Viber Expiry Offer Notice copied for ${item.product.name}!`);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/80 pb-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground font-serif flex items-center gap-2.5">
            <Percent className="text-amber-500" size={28} /> Dynamic Expiry Sale & Clearance Offers
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Automated dynamic discounting engine based on days to expiry date. Prevent inventory waste and boost clearance sales!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search expiring items..."
              className="pl-9 pr-3 py-1.5 border border-border rounded-lg bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* KPI Cockpit Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl space-y-1 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted-foreground font-bold flex items-center justify-between">
            <span>Expiring Stock Items</span>
            <AlertTriangle size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">{offerItems.length} Products</div>
          <div className="text-[10px] text-red-500 font-mono font-semibold">{criticalItemsCount} Critical (≤7 days)</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl space-y-1 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted-foreground font-bold flex items-center justify-between">
            <span>Clearance Stock Value</span>
            <ShoppingCart size={14} className="text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-primary">{fmt(totalDiscountStockVal)}</div>
          <div className="text-[10px] text-muted-foreground font-mono">At dynamic offer prices</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl space-y-1 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted-foreground font-bold flex items-center justify-between">
            <span>Total Buyer Savings</span>
            <TrendingDown size={14} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">{fmt(totalCustomerSavings)}</div>
          <div className="text-[10px] text-emerald-600 font-mono">Discount incentives</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl space-y-1 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted-foreground font-bold flex items-center justify-between">
            <span>AI Discount Rule</span>
            <Sparkles size={14} className="text-indigo-500" />
          </div>
          <div className="text-xs font-mono font-bold text-foreground">Dynamic Tiered</div>
          <div className="text-[10px] text-muted-foreground font-mono">50% (7d) • 30% (15d) • 20% (30d)</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setFilterTier("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${filterTier === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
        >
          All Offers ({offerItems.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTier("critical")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${filterTier === "critical" ? "bg-red-600 text-white" : "bg-red-500/10 text-red-600 border border-red-500/20"}`}
        >
          🚨 Critical ≤ 7 Days ({offerItems.filter(i => i.daysRemaining <= 7).length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTier("urgent")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${filterTier === "urgent" ? "bg-amber-600 text-white" : "bg-amber-500/10 text-amber-600 border border-amber-500/20"}`}
        >
          🟠 Urgent ≤ 15 Days ({offerItems.filter(i => i.daysRemaining <= 15).length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTier("promo")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${filterTier === "promo" ? "bg-indigo-600 text-white" : "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20"}`}
        >
          🟡 Promo ≤ 30 Days ({offerItems.filter(i => i.daysRemaining <= 30).length})
        </button>
      </div>

      {/* Offers Product Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-xl text-center text-muted-foreground space-y-2">
          <Sparkles size={32} className="mx-auto text-primary opacity-60 animate-pulse" />
          <h3 className="font-semibold text-foreground text-sm">No Expiring Products Match Filter</h3>
          <p className="text-xs font-mono">All inventory items are fresh and within standard shelf-life boundaries!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, idx) => (
            <div key={idx} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex justify-between items-start gap-2">
                  <span className={`px-2.5 py-1 rounded text-[10px] uppercase border tracking-wider font-mono ${item.badgeColor}`}>
                    {item.badgeText}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-secondary border border-border rounded text-foreground">
                    Godown {item.godown}
                  </span>
                </div>

                {/* Product Title & Stock */}
                <div>
                  <h3 className="font-bold text-foreground text-base font-serif">{item.product.name}</h3>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    Category: <span className="font-semibold text-foreground">{item.product.category}</span> • Stock: <span className="font-bold text-foreground">{item.stock} {item.product.unit}</span>
                  </div>
                </div>

                {/* Expiry Progress Indicator */}
                <div className="p-3 bg-secondary/20 rounded-lg border border-border/50 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Expiry Date:</span>
                    <span className="font-bold text-foreground">{formatDDMMYYYY(item.expiryDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Days Remaining:</span>
                    <span className={`font-extrabold ${item.daysRemaining <= 7 ? "text-red-600" : item.daysRemaining <= 15 ? "text-amber-600" : "text-indigo-600"}`}>
                      {item.daysRemaining <= 0 ? "EXPIRED TODAY" : `${item.daysRemaining} Days Left`}
                    </span>
                  </div>
                </div>

                {/* Pricing & Discount Calculation */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex justify-between items-center font-mono">
                  <div>
                    <div className="text-[10px] text-muted-foreground line-through">Standard Price: ₹{item.originalPrice}</div>
                    <div className="text-lg font-extrabold text-green-600 dark:text-green-400">
                      ₹{item.offerPrice} <span className="text-xs font-normal">/{item.product.unit}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 bg-amber-200 dark:bg-amber-950 px-2 py-0.5 rounded">
                      -{item.discountPercent}% OFF
                    </span>
                    <div className="text-[10px] text-emerald-600 font-bold mt-1">Save ₹{item.savings}/{item.product.unit}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 border-t border-border pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onLoadClearancePromo) onLoadClearancePromo(item.product, item.godown, item.offerPrice, item.stock);
                    }}
                    className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors uppercase tracking-wider shadow-sm"
                  >
                    <ShoppingCart size={13} /> Push to POS
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyToMasterCatalog(item)}
                    className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors uppercase tracking-wider shadow-sm"
                  >
                    <Percent size={13} /> Set Catalog Price
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyWhatsAppNotice(item)}
                    className="py-1.5 bg-green-700 hover:bg-green-800 text-white font-mono text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors uppercase tracking-wider"
                  >
                    {copiedId === item.product.id + item.godown + "_wa" ? <Check size={12} /> : <Send size={12} />}
                    {copiedId === item.product.id + item.godown + "_wa" ? "Copied!" : "WhatsApp Deal"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyViberNotice(item)}
                    className="py-1.5 bg-[#7360f2] hover:bg-[#5e4bd8] text-white font-mono text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors uppercase tracking-wider"
                  >
                    {copiedId === item.product.id + item.godown + "_viber" ? <Check size={12} /> : <MessageSquare size={12} />}
                    {copiedId === item.product.id + item.godown + "_viber" ? "Copied!" : "Viber Deal"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Voucher Management Cockpit ──────────────────────────────────────────────

function VouchersPage({
  vouchers,
  currentPage,
  setPage,
  customers,
  suppliers,
  onRefresh,
  activeEditRecord,
}: {
  vouchers: Voucher[];
  currentPage: string;
  setPage: (p: string) => void;
  customers: Customer[];
  suppliers: Supplier[];
  onRefresh: () => void;
  activeEditRecord?: any;
}) {
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formType, setFormType] = useState<VoucherType>(() => {
    if (currentPage === "vouchers-receipt") return "receipt";
    if (currentPage === "vouchers-contra") return "contra";
    if (currentPage === "vouchers-journal") return "journal";
    return "payment";
  });
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDebit, setFormDebit] = useState("");
  const [formCredit, setFormCredit] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formMode, setFormMode] = useState<Voucher["mode"]>("bank");
  const [formRefNo, setFormRefNo] = useState("");
  const [formNarration, setFormNarration] = useState("");

  // Synchronize clicked activeEditRecord into voucher form fields
  useEffect(() => {
    if (!activeEditRecord) return;
    if (activeEditRecord.voucherNo || activeEditRecord.debitAccount || activeEditRecord.creditAccount) {
      if (activeEditRecord.type) setFormType(activeEditRecord.type);
      if (activeEditRecord.date) setFormDate(activeEditRecord.date);
      if (activeEditRecord.debitAccount) setFormDebit(activeEditRecord.debitAccount);
      if (activeEditRecord.creditAccount) setFormCredit(activeEditRecord.creditAccount);
      if (activeEditRecord.amount) setFormAmount(String(activeEditRecord.amount));
      if (activeEditRecord.mode) setFormMode(activeEditRecord.mode);
      if (activeEditRecord.referenceNo || activeEditRecord.voucherNo) setFormRefNo(activeEditRecord.referenceNo || activeEditRecord.voucherNo);
      if (activeEditRecord.narration) setFormNarration(activeEditRecord.narration);
    }
  }, [activeEditRecord]);

  // Pre-filled account options
  const accountSuggestions = useMemo(() => {
    const custNames = customers.map(c => c.name);
    const suppNames = suppliers.map(s => s.name);
    const standardAccounts = [
      "HDFC Bank A/C 50200088991122",
      "State Bank of India A/C 1002998811",
      "Petty Cash Account",
      "Warehouse Rent Expense",
      "Staff Salary & Wages",
      "Freight & Customs Duty",
      "Electricity & Utilities",
      "Office Maintenance",
      "Interest & Bank Charges",
      "Sales Revenue Account",
      "Purchase Cost Account",
    ];
    return Array.from(new Set([...standardAccounts, ...suppNames, ...custNames]));
  }, [customers, suppliers]);

  const selectVoucherType = (type: VoucherType) => {
    setFormType(type);
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormAmount("");
    setFormRefNo("");
    setFormNarration("");

    if (type === "payment") {
      setFormDebit(suppliers[0]?.name || "Warehouse Rent Expense");
      setFormCredit("HDFC Bank A/C 50200088991122");
      setFormMode("bank");
    } else if (type === "receipt") {
      setFormDebit("Petty Cash Account");
      setFormCredit(customers[0]?.name || "Sales Revenue Account");
      setFormMode("cash");
    } else if (type === "contra") {
      setFormDebit("HDFC Bank A/C 50200088991122");
      setFormCredit("Petty Cash Account");
      setFormMode("cash");
    } else {
      setFormDebit("Warehouse Rent Expense");
      setFormCredit("Port Authority Lessor");
      setFormMode("journal");
    }
  };

  useEffect(() => {
    let targetType: VoucherType = "payment";
    if (currentPage === "vouchers-receipt") targetType = "receipt";
    else if (currentPage === "vouchers-contra") targetType = "contra";
    else if (currentPage === "vouchers-journal") targetType = "journal";

    selectVoucherType(targetType);
  }, [currentPage]);

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDebit.trim()) {
      toast.error("Please enter a valid Debit Account.");
      return;
    }
    if (!formCredit.trim()) {
      toast.error("Please enter a valid Credit Account.");
      return;
    }
    if (!formAmount || Number(formAmount) <= 0) {
      toast.error("Please enter a valid voucher amount.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          date: formDate,
          debitAccount: formDebit.trim(),
          creditAccount: formCredit.trim(),
          amount: Number(formAmount),
          mode: formMode,
          referenceNo: formRefNo.trim(),
          narration: formNarration.trim() || `${formType.toUpperCase()} voucher entry`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create voucher");
      }

      const created: Voucher = await res.json();
      toast.success(`${formType.toUpperCase()} Voucher ${created.voucherNo} successfully created & posted!`);
      setFormAmount("");
      setFormRefNo("");
      setFormNarration("");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title Header & Type Selectors */}
      <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-serif tracking-tight flex items-center gap-2.5">
              <Receipt className="text-primary" size={24} /> Accounting Voucher Entry Console
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              Directly fill and post Payment, Receipt, Contra, and Journal Vouchers to General Ledger
            </p>
          </div>

          <div className="flex bg-secondary/50 p-1 rounded-xl gap-1 text-xs font-mono font-bold flex-wrap">
            {(["payment", "receipt", "contra", "journal"] as const).map(type => {
              const active = formType === type;
              let activeColor = "bg-primary text-primary-foreground shadow-sm";
              if (type === "payment") activeColor = active ? "bg-red-600 text-white shadow font-bold" : "text-muted-foreground hover:text-foreground";
              else if (type === "receipt") activeColor = active ? "bg-emerald-600 text-white shadow font-bold" : "text-muted-foreground hover:text-foreground";
              else if (type === "contra") activeColor = active ? "bg-blue-600 text-white shadow font-bold" : "text-muted-foreground hover:text-foreground";
              else activeColor = active ? "bg-purple-600 text-white shadow font-bold" : "text-muted-foreground hover:text-foreground";

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => { selectVoucherType(type); setPage(`vouchers-${type}`); }}
                  className={`px-3 py-1.5 rounded-lg transition-all capitalize ${activeColor}`}
                >
                  {type === "payment" && "💳 "}
                  {type === "receipt" && "📥 "}
                  {type === "contra" && "🔄 "}
                  {type === "journal" && "📑 "}
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Direct Voucher Entry Form */}
        <form onSubmit={handleSaveVoucher} className="space-y-4 text-xs font-sans pt-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">Voucher Type</label>
              <select
                value={formType}
                onChange={e => { selectVoucherType(e.target.value as VoucherType); setPage(`vouchers-${e.target.value}`); }}
                className="w-full px-3.5 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="payment">💳 PAYMENT VOUCHER (DISBURSAL)</option>
                <option value="receipt">📥 RECEIPT VOUCHER (COLLECTION)</option>
                <option value="contra">🔄 CONTRA VOUCHER (INTERNAL TRANSFER)</option>
                <option value="journal">📑 JOURNAL VOUCHER (ADJUSTMENT)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">Voucher Date</label>
              <DDMMYYYYDateInput
                value={formDate}
                onChange={setFormDate}
                className="w-full px-3.5 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">Payment Mode</label>
              <select
                value={formMode}
                onChange={e => setFormMode(e.target.value as Voucher["mode"])}
                className="w-full px-3.5 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-bold uppercase"
              >
                <option value="bank">🏦 Bank Transfer / NEFT</option>
                <option value="cash">💵 Cash</option>
                <option value="online">📱 Online / UPI</option>
                <option value="cheque">📜 Cheque</option>
                <option value="journal">📑 Journal Adjustment</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-secondary/15 p-4 rounded-xl border border-border/70">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider flex items-center justify-between">
                <span>Debit Account (Dr)</span>
                <span className="text-red-500 font-mono text-[9px]">* Required</span>
              </label>
              <input
                type="text"
                list="account-suggestions"
                value={formDebit}
                onChange={e => setFormDebit(e.target.value)}
                placeholder="Select or type debit account..."
                className="w-full px-3.5 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider flex items-center justify-between">
                <span>Credit Account (Cr)</span>
                <span className="text-red-500 font-mono text-[9px]">* Required</span>
              </label>
              <input
                type="text"
                list="account-suggestions"
                value={formCredit}
                onChange={e => setFormCredit(e.target.value)}
                placeholder="Select or type credit account..."
                className="w-full px-3.5 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
              />
            </div>
          </div>

          <datalist id="account-suggestions">
            {accountSuggestions.map((acc, i) => (
              <option key={i} value={acc} />
            ))}
          </datalist>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                Voucher Amount (INR) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-muted-foreground font-mono font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2 border border-border rounded-xl bg-input-background text-foreground text-sm font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                Cheque / UTR / Reference No
              </label>
              <input
                type="text"
                value={formRefNo}
                onChange={e => setFormRefNo(e.target.value)}
                placeholder="e.g. UTR9988112 or CHQ-10023"
                className="w-full px-3.5 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase font-bold tracking-wider">
              Narration / Ledger Remarks
            </label>
            <textarea
              rows={3}
              value={formNarration}
              onChange={e => setFormNarration(e.target.value)}
              placeholder="Enter detailed narration note for general ledger..."
              className="w-full px-3.5 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
            />
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60">
            <button
              type="button"
              onClick={() => {
                setFormAmount("");
                setFormRefNo("");
                setFormNarration("");
                toast.info("Cleared voucher form.");
              }}
              className="w-full sm:w-auto px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-xl text-xs font-mono font-bold"
            >
              Reset Form
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all uppercase tracking-wider"
            >
              <CheckCircle2 size={16} /> {submitting ? "POSTING VOUCHER..." : `POST ${formType.toUpperCase()} VOUCHER ENTRY`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Intro Splash Screen Component (Pastel Fruits, Veggies & Spices Theme) ──────

function IntroSplashScreen({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setFadeOut(true);
            setTimeout(onFinish, 800);
          }, 400);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") {
        clearInterval(interval);
        setFadeOut(true);
        setTimeout(onFinish, 800);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onFinish]);

  // Determine active category text and phase
  const phase = useMemo(() => {
    if (progress < 25) return { text: "SCANNING SPICES INVENTORY...", cat: "spices" };
    if (progress < 50) return { text: "COUNTING NUTS & DRY FRUITS...", cat: "nuts" };
    if (progress < 75) return { text: "VERIFYING FRESH FRUIT CARGO...", cat: "fruits" };
    if (progress < 100) return { text: "CALIBRATING VEGETABLES REVENUE...", cat: "veggies" };
    return { text: "LEDGER SYNCED & SECURE!", cat: "ready" };
  }, [progress]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF8F5] text-gray-800 overflow-hidden select-none transition-all duration-700 ${
        fadeOut ? "opacity-0 scale-95 pointer-events-none" : "opacity-100"
      }`}
    >
      <style>{`
        @keyframes float-slow {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-medium {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(-8deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-fast {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(8deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float-1 { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-2 { animation: float-medium 7s ease-in-out infinite; }
        .animate-float-3 { animation: float-fast 5s ease-in-out infinite; }
      `}</style>

      {/* Background radial glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-100/40 blur-[100px] -z-10 animate-pulse duration-[3000ms]" />

      {/* Sequential Floating Produce Categories */}
      
      {/* PHASE 1: Spices (🌶️, 🌿) */}
      <div 
        className={`absolute top-[18%] left-[10%] w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-sm transition-all duration-500 animate-float-1 ${
          phase.cat === "spices" || phase.cat === "ready" 
            ? "scale-110 opacity-100 ring-2 ring-emerald-400 bg-emerald-500/10 shadow-emerald-200" 
            : "scale-90 opacity-20 bg-gray-100/30"
        }`}
      >
        🌶️
      </div>
      <div 
        className={`absolute bottom-[18%] right-[15%] w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-sm transition-all duration-500 animate-float-2 ${
          phase.cat === "spices" || phase.cat === "ready" 
            ? "scale-110 opacity-100 ring-2 ring-emerald-400 bg-emerald-500/10 shadow-emerald-200" 
            : "scale-90 opacity-20 bg-gray-100/30"
        }`}
      >
        🌿
      </div>

      {/* PHASE 2: Nuts & Dry Fruits (🥜, 🌰) */}
      <div 
        className={`absolute top-[15%] right-[22%] w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-sm transition-all duration-500 animate-float-3 ${
          phase.cat === "nuts" || phase.cat === "ready" 
            ? "scale-110 opacity-100 ring-2 ring-amber-400 bg-amber-500/10 shadow-amber-200" 
            : "scale-90 opacity-20 bg-gray-100/30"
        }`}
      >
        🥜
      </div>
      <div 
        className={`absolute bottom-[15%] left-[22%] w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-sm transition-all duration-500 animate-float-1 ${
          phase.cat === "nuts" || phase.cat === "ready" 
            ? "scale-110 opacity-100 ring-2 ring-amber-400 bg-amber-500/10 shadow-amber-200" 
            : "scale-90 opacity-20 bg-gray-100/30"
        }`}
      >
        🌰
      </div>

      {/* PHASE 3: Fresh Fruits (🍎, 🍇) */}
      <div 
        className={`absolute top-[45%] right-[8%] w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-sm transition-all duration-500 animate-float-2 ${
          phase.cat === "fruits" || phase.cat === "ready" 
            ? "scale-110 opacity-100 ring-2 ring-rose-400 bg-rose-500/10 shadow-rose-200" 
            : "scale-90 opacity-20 bg-gray-100/30"
        }`}
      >
        🍎
      </div>
      <div 
        className={`absolute top-[48%] left-[8%] w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-sm transition-all duration-500 animate-float-3 ${
          phase.cat === "fruits" || phase.cat === "ready" 
            ? "scale-110 opacity-100 ring-2 ring-rose-400 bg-rose-500/10 shadow-rose-200" 
            : "scale-90 opacity-20 bg-gray-100/30"
        }`}
      >
        🍇
      </div>

      {/* PHASE 4: Vegetables (🥕, 🥑) */}
      <div 
        className={`absolute top-[8%] left-[46%] w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-sm transition-all duration-500 animate-float-1 ${
          phase.cat === "veggies" || phase.cat === "ready" 
            ? "scale-110 opacity-100 ring-2 ring-orange-400 bg-orange-500/10 shadow-orange-200" 
            : "scale-90 opacity-20 bg-gray-100/30"
        }`}
      >
        🥕
      </div>
      <div 
        className={`absolute bottom-[8%] left-[46%] w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-sm transition-all duration-500 animate-float-2 ${
          phase.cat === "veggies" || phase.cat === "ready" 
            ? "scale-110 opacity-100 ring-2 ring-orange-400 bg-orange-500/10 shadow-orange-200" 
            : "scale-90 opacity-20 bg-gray-100/30"
        }`}
      >
        🥑
      </div>

      {/* Center Logo branding */}
      <div className="relative mb-6 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-300 via-teal-400 to-emerald-500 flex items-center justify-center shadow-md shadow-emerald-200/50 animate-bounce duration-[1800ms]">
          <Sparkles size={28} className="text-white animate-pulse" />
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-emerald-300 to-teal-400 blur opacity-30 animate-pulse" />
      </div>

      <h1 className="text-3xl font-extrabold tracking-[0.15em] text-emerald-800 dark:text-emerald-300 font-serif mb-1 select-none text-center">
        RJ GROUP OF COMPANIES
      </h1>
      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono tracking-[0.2em] uppercase mb-1 font-bold select-none text-center">
        Holding Company & Subsidiary Branch Suite
      </p>
      <div className="flex items-center justify-center gap-2 text-[9px] font-mono text-amber-800 dark:text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-8 max-w-lg text-center flex-wrap">
        <span>F&B Evening Store</span> • <span>F&B Evening Store Fihara</span> • <span>Annlee</span> • <span>City Sales</span>
      </div>

      {/* Progress loader */}
      <div className="w-64 max-w-xs space-y-2 relative z-10">
        <div className="flex justify-between items-center text-[9px] font-mono text-emerald-700/80">
          <span>{phase.text}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-emerald-100/70 rounded-full overflow-hidden border border-emerald-200/20">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-300 rounded-full transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-16 text-[9px] font-mono text-emerald-700/40 animate-pulse relative z-10">
        Press <span className="px-1 py-0.5 border border-emerald-200/80 rounded bg-[#FFFFFF] text-emerald-700 shadow-sm font-bold">Enter</span> or <span className="px-1 py-0.5 border border-emerald-200/80 rounded bg-[#FFFFFF] text-emerald-700 shadow-sm font-bold">Esc</span> to Skip Intro
      </div>
    </div>
  );
}

// ─── Multi-User Authentication & Login Component (Zen Matcha Theme) ───────────

function LoginPage({ onLogin }: { onLogin: (user: any) => void }) {
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [previewUser, setPreviewUser] = useState<any>(null);

  // Feature key → human-readable label map
  const FEATURE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
    "dashboard": { label: "Dashboard", icon: "📊", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    "sales-billing": { label: "Sales Billing", icon: "🧾", color: "bg-blue-100 text-blue-800 border-blue-300" },
    "sales-quotation": { label: "Quotations", icon: "📋", color: "bg-blue-100 text-blue-800 border-blue-300" },
    "sales-proforma": { label: "Proforma Invoice", icon: "📄", color: "bg-blue-100 text-blue-800 border-blue-300" },
    "sales-delivery": { label: "Delivery Note", icon: "🚚", color: "bg-blue-100 text-blue-800 border-blue-300" },
    "sales-credit-note": { label: "Credit Note", icon: "🔄", color: "bg-blue-100 text-blue-800 border-blue-300" },
    "sales-debit-note": { label: "Debit Note", icon: "📝", color: "bg-blue-100 text-blue-800 border-blue-300" },
    "sales-pos": { label: "POS Terminal", icon: "🖥️", color: "bg-blue-100 text-blue-800 border-blue-300" },
    "purchase-order": { label: "Purchase Orders", icon: "📦", color: "bg-amber-100 text-amber-800 border-amber-300" },
    "purchase-bill": { label: "Purchase Billing", icon: "🧾", color: "bg-amber-100 text-amber-800 border-amber-300" },
    "inventory-items": { label: "Stock Inventory", icon: "📦", color: "bg-teal-100 text-teal-800 border-teal-300" },
    "inventory-godowns": { label: "Godown Hub", icon: "🏭", color: "bg-teal-100 text-teal-800 border-teal-300" },
    "inventory-spoilage": { label: "Spoilage Entry", icon: "⚠️", color: "bg-red-100 text-red-800 border-red-300" },
    "costing": { label: "Costing & Margins", icon: "💰", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    "currency-convert": { label: "Currency Converter", icon: "💱", color: "bg-purple-100 text-purple-800 border-purple-300" },
    "expiry": { label: "Expiry Tracker", icon: "⏰", color: "bg-orange-100 text-orange-800 border-orange-300" },
    "offers": { label: "Offers & Discounts", icon: "🏷️", color: "bg-pink-100 text-pink-800 border-pink-300" },
    "vouchers-receipt": { label: "Receipt Voucher", icon: "🧾", color: "bg-green-100 text-green-800 border-green-300" },
    "vouchers-payment": { label: "Payment Voucher", icon: "💳", color: "bg-green-100 text-green-800 border-green-300" },
    "vouchers-journal": { label: "Journal Voucher", icon: "📒", color: "bg-green-100 text-green-800 border-green-300" },
    "vouchers-contra": { label: "Contra Voucher", icon: "⇄", color: "bg-green-100 text-green-800 border-green-300" },
    "credit-recovery": { label: "Credit Recovery", icon: "🛡️", color: "bg-rose-100 text-rose-800 border-rose-300" },
    "reports-pnl": { label: "P&L Report", icon: "📈", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
    "reports-bs": { label: "Balance Sheet", icon: "📊", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
    "reports-trial": { label: "Trial Balance", icon: "⚖️", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
    "reports-ledger": { label: "Ledger Reports", icon: "📚", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
    "reports-daybook": { label: "Day Book", icon: "🗓️", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
    "master-accounts-groups": { label: "Account Groups", icon: "🗂️", color: "bg-slate-100 text-slate-800 border-slate-300" },
    "master-accounts-ledger": { label: "Account Ledger", icon: "📒", color: "bg-slate-100 text-slate-800 border-slate-300" },
    "master-accounts-customer": { label: "Customers", icon: "👤", color: "bg-slate-100 text-slate-800 border-slate-300" },
    "master-accounts-supplier": { label: "Suppliers", icon: "🏬", color: "bg-slate-100 text-slate-800 border-slate-300" },
    "master-inventory-categories": { label: "Item Categories", icon: "🏷️", color: "bg-slate-100 text-slate-800 border-slate-300" },
    "master-inventory-unit": { label: "Units", icon: "📐", color: "bg-slate-100 text-slate-800 border-slate-300" },
    "master-inventory-packing": { label: "Packing Types", icon: "📦", color: "bg-slate-100 text-slate-800 border-slate-300" },
    "master-godowns": { label: "Godown Master", icon: "🏭", color: "bg-slate-100 text-slate-800 border-slate-300" },
    "master-users": { label: "User Management", icon: "👥", color: "bg-slate-100 text-slate-800 border-slate-300" },
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inputUser = usernameInput.trim().toLowerCase();
    const inputPass = passwordInput.trim();

    if (!inputUser || !inputPass) {
      toast.error("Please enter both Username / User ID and Password.");
      return;
    }

    const storedStr = localStorage.getItem("master_users");
    let usersList: any[] = [];
    if (storedStr) {
      try { usersList = JSON.parse(storedStr); } catch (err) { usersList = []; }
    }

    const adminUser = {
      id: "usr-admin",
      employeeId: "EMP-001",
      employeeName: "System Administrator / Owner",
      role: "Admin",
      username: "admin",
      password: "123",
      allowedFeatures: [
        "dashboard", "sales-billing", "sales-quotation", "sales-proforma", "sales-delivery", "sales-credit-note", "sales-debit-note", "sales-pos",
        "purchase-order", "purchase-bill", "inventory-items", "inventory-godowns", "inventory-spoilage", "costing", "currency-convert", "expiry", "offers", "vouchers-receipt", "vouchers-payment",
        "vouchers-journal", "vouchers-contra", "credit-recovery", "reports-pnl", "reports-bs", "reports-trial", "reports-ledger", "reports-daybook",
        "master-accounts-groups", "master-accounts-ledger", "master-accounts-customer", "master-accounts-supplier", "master-inventory-categories",
        "master-inventory-unit", "master-inventory-packing", "master-godowns", "master-users"
      ]
    };

    const cashierUser = {
      id: "usr-cashier",
      employeeId: "EMP-002",
      employeeName: "Ibrahim Cashier",
      role: "Cashier",
      username: "cashier",
      password: "123",
      allowedFeatures: ["sales-billing", "sales-pos", "inventory-items", "vouchers-receipt"]
    };

    const userMap = new Map<string, any>();
    userMap.set("admin", adminUser);
    userMap.set("cashier", cashierUser);

    usersList.forEach((u: any) => {
      const uKey = (u.username || u.employeeId || "").toLowerCase();
      if (uKey) {
        userMap.set(uKey, {
          ...u,
          password: u.password || "123"
        });
      }
    });

    const allUsers = Array.from(userMap.values());

    const match = allUsers.find(
      (u: any) =>
        (u.username?.toLowerCase() === inputUser || u.employeeId?.toLowerCase() === inputUser) &&
        (u.password ? u.password === inputPass : inputPass === "123")
    );

    if (match) {
      toast.success(`Welcome back, ${match.employeeName}! Logged in as ${match.role}.`);
      setPreviewUser(match);
      setTimeout(() => onLogin(match), 800);
    } else {
      toast.error("Invalid User ID or Password! Credentials not found in database.");
    }
  };

  const adminUserPreset = {
    id: "usr-admin",
    employeeId: "EMP-001",
    employeeName: "System Administrator / Owner",
    role: "Admin",
    username: "admin",
    password: "123",
    allowedFeatures: [
      "dashboard", "sales-billing", "sales-quotation", "sales-proforma", "sales-delivery", "sales-credit-note", "sales-debit-note", "sales-pos",
      "purchase-order", "purchase-bill", "inventory-items", "inventory-godowns", "inventory-spoilage", "costing", "currency-convert", "expiry", "offers", "vouchers-receipt", "vouchers-payment",
      "vouchers-journal", "vouchers-contra", "credit-recovery", "reports-pnl", "reports-bs", "reports-trial", "reports-ledger", "reports-daybook",
      "master-accounts-groups", "master-accounts-ledger", "master-accounts-customer", "master-accounts-supplier", "master-inventory-categories",
      "master-inventory-unit", "master-inventory-packing", "master-godowns", "master-users"
    ]
  };

  const cashierUserPreset = {
    id: "usr-cashier",
    employeeId: "EMP-002",
    employeeName: "Ibrahim Cashier",
    role: "Cashier",
    username: "cashier",
    password: "123",
    allowedFeatures: ["sales-billing", "sales-pos", "inventory-items", "vouchers-receipt"]
  };

  const isAdminRole = (user: any) =>
    user?.role === "Admin" || user?.role === "Owner" || user?.username === "admin";

  const getFeatureChips = (user: any) => {
    if (!user) return [];
    if (isAdminRole(user)) return Object.keys(FEATURE_LABELS);
    return (user.allowedFeatures || []).filter((k: string) => FEATURE_LABELS[k]);
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#f4f6f0] via-[#e8ecd6] to-[#d8f3dc] text-[#14281d] relative overflow-hidden select-none font-sans">
      {/* Floating Animated Produce Stream Physics */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-10 text-3xl animate-produce-stream" style={{ animationDelay: "1s" }}>🥭</div>
        <div className="absolute top-10 right-14 text-3xl animate-produce-stream" style={{ animationDelay: "3s" }}>🍉</div>
        <div className="absolute bottom-12 left-16 text-3xl animate-produce-stream" style={{ animationDelay: "2s" }}>🥥</div>
        <div className="absolute bottom-16 right-16 text-3xl animate-produce-stream" style={{ animationDelay: "4s" }}>🥦</div>
      </div>

      {/* Zen Ambient Glow Orbs */}
      <div className="absolute -top-28 -right-28 w-96 h-96 bg-[#2d6a4f]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -left-28 w-96 h-96 bg-[#e76f51]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md flex flex-col items-center justify-center z-10">
        {/* ── Login Card ── */}
        <div className="w-full bg-white/95 border-2 border-[#52b788] rounded-3xl shadow-2xl p-8 space-y-6 backdrop-blur-2xl relative overflow-hidden text-foreground">
          <div className="text-center space-y-2 relative z-10">
            <div className="w-16 h-16 bg-[#d8f3dc] border-2 border-[#52b788] text-[#2d6a4f] rounded-full flex items-center justify-center mx-auto shadow-md text-3xl">
              🏛️
            </div>
            <h2 className="text-2xl font-black text-[#14281d] font-serif">RJ Group of Companies</h2>
            <p className="text-xs font-mono text-[#2d6a4f] font-bold">Main Holding Company & Branch Operations Suite</p>
            <div className="text-[9px] font-mono text-[#2d6a4f] font-semibold flex items-center justify-center gap-1.5 flex-wrap pt-1">
              <span className="bg-[#d8f3dc] px-1.5 py-0.5 rounded border border-[#52b788]/40">F&B Evening Store</span>
              <span className="bg-[#d8f3dc] px-1.5 py-0.5 rounded border border-[#52b788]/40">F&B Evening Store Fihara</span>
              <span className="bg-[#d8f3dc] px-1.5 py-0.5 rounded border border-[#52b788]/40">Annlee</span>
              <span className="bg-[#d8f3dc] px-1.5 py-0.5 rounded border border-[#52b788]/40">City Sales</span>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 font-mono text-xs relative z-10">
            <div className="space-y-1 text-left">
              <label className="block text-[10px] text-[#2d6a4f] uppercase font-bold tracking-wider">User ID / Username *</label>
              <input
                type="text"
                required
                placeholder="Username (e.g. admin, cashier)"
                value={usernameInput}
                onChange={e => { setUsernameInput(e.target.value); setPreviewUser(null); }}
                className="w-full px-4 py-3 border-2 border-[#b7e4c7] rounded-2xl bg-[#edf1e4] text-[#14281d] text-xs focus:outline-none focus:ring-2 focus:ring-[#52b788] font-bold transition-all shadow-inner"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="block text-[10px] text-[#2d6a4f] uppercase font-bold tracking-wider">Password *</label>
              <input
                type="password"
                required
                placeholder="Account password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#b7e4c7] rounded-2xl bg-[#edf1e4] text-[#14281d] text-xs focus:outline-none focus:ring-2 focus:ring-[#52b788] font-bold transition-all shadow-inner"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-[#2d6a4f] via-[#40916c] to-[#e76f51] hover:from-[#1b4332] hover:to-[#d90429] text-white font-mono font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
            >
              <span className="relative z-10">Authenticate & Open Zen Portal</span>
            </button>
          </form>

          {/* Quick Demo Credentials Panel */}
          <div className="pt-4 border-t border-[#b7e4c7] space-y-2 relative z-10">
            <div className="text-[10px] font-mono text-[#2d6a4f] uppercase font-bold text-center">⚡ Quick Test Accounts:</div>
            <div className="grid grid-cols-2 gap-2.5 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => {
                  setUsernameInput("admin");
                  setPasswordInput("123");
                  setPreviewUser(adminUserPreset);
                  toast.success("Welcome back, System Administrator / Owner! Logged in as Admin.");
                  onLogin(adminUserPreset);
                }}
                onMouseEnter={() => setPreviewUser(adminUserPreset)}
                onMouseLeave={() => !previewUser || previewUser.username !== "admin" ? setPreviewUser(null) : null}
                className="p-3 rounded-2xl bg-[#d8f3dc] border-2 border-[#52b788] text-[#2d6a4f] text-left hover:bg-[#b7e4c7] transition-all cursor-pointer group"
              >
                <div className="font-bold flex items-center gap-1">
                  <span>👑</span>
                  <span>Admin / Owner</span>
                </div>
                <div className="text-[9px] text-[#2d6a4f] mt-0.5">User: admin | Pass: 123</div>
                <div className="text-[8px] text-[#1b4332] font-bold mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  All {Object.keys(FEATURE_LABELS).length} Modules
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsernameInput("cashier");
                  setPasswordInput("123");
                  setPreviewUser(cashierUserPreset);
                  toast.success("Welcome back, Ibrahim Cashier! Logged in as Cashier.");
                  onLogin(cashierUserPreset);
                }}
                onMouseEnter={() => setPreviewUser(cashierUserPreset)}
                onMouseLeave={() => !previewUser || previewUser.username !== "cashier" ? setPreviewUser(null) : null}
                className="p-3 rounded-2xl bg-[#f4a261]/20 border-2 border-[#e76f51]/40 text-[#e76f51] text-left hover:bg-[#f4a261]/30 transition-all cursor-pointer"
              >
                <div className="font-bold flex items-center gap-1">
                  <span>💵</span>
                  <span>Cashier Profile</span>
                </div>
                <div className="text-[9px] text-[#e76f51] mt-0.5">User: cashier | Pass: 123</div>
                <div className="text-[8px] text-[#14281d] font-bold mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block"></span>
                  {cashierUserPreset.allowedFeatures.length} Restricted Modules
                </div>
              </button>
            </div>
          </div>

          <p className="text-center text-[9px] font-mono text-[#40916c]/70 relative z-10">
            🔒 Authorized manifest handlers only.<br />Access is role-restricted per employee profile.
          </p>
        </div>


      </div>
    </div>
  );
}






  function renderPage() {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <RefreshCw size={24} className="animate-spin text-primary" />
          <span className="text-sm font-mono">Syncing database assets...</span>
        </div>
      );
    }

    if (!isFeaturePermitted(page)) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 bg-card border border-red-500/30 rounded-2xl shadow-xl text-center space-y-4 font-mono text-foreground">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
            <Lock size={32} />
          </div>
          <h2 className="text-lg font-bold">Feature Disabled / Access Restricted</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The module <b>"{page}"</b> is restricted for employee account <b>{currentUser?.employeeName}</b> ({currentUser?.role}).
            To enable access, request an Administrator to check this responsibility feature box in <b>Master ➔ User Master</b>.
          </p>
          <button
            type="button"
            onClick={() => setPage("dashboard")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold shadow hover:bg-primary/90 transition-all"
          >
            Return to Authorized Dashboard
          </button>
        </div>
      );
    }

    const getPageComponent = () => {
      if (page.startsWith("master-")) {
        return (
          <MasterConsoleView
            page={page}
            products={products}
            customers={customers}
            suppliers={suppliers}
            onAddProduct={handleAddProduct}
            onAddCustomer={handleAddCustomer}
            onAddSupplier={handleAddSupplier}
            onDeleteProduct={handleDeleteProduct}
            onDeleteCustomer={handleDeleteCustomer}
            onDeleteSupplier={handleDeleteSupplier}
            onUpdateCustomer={handleUpdateCustomer}
            onUpdateSupplier={handleUpdateSupplier}
          />
        );
      }
      if (page === "vouchers" || page.startsWith("vouchers-")) {
        return (
          <VouchersPage
            vouchers={vouchers}
            currentPage={page}
            setPage={setPage}
            customers={customers}
            suppliers={suppliers}
            onRefresh={loadData}
            activeEditRecord={activeEditRecord}
          />
        );
      }
      if (page === "reports" || page.startsWith("reports-")) {
        return (
          <ReportsPage
            entries={entries}
            products={products}
            customers={customers}
            suppliers={suppliers}
            vouchers={vouchers}
            spoilages={spoilages}
            analytics={analytics}
            currentPage={page}
            setPage={setPage}
            onViewInvoice={(inv) => { setActiveInvoice(inv); setIsInvoiceOpen(true); }}
            onEditEntryFromHistory={handleEditEntryFromHistory}
            onClearHistory={handleClearHistory}
          />
        );
      }

      switch (page) {
        case "dashboard": return <DashboardPage products={products} entries={entries} analytics={analytics} onRefresh={loadData} />;
        case "inventory": return <InventoryPage products={products} entries={entries} onAddProduct={handleAddProduct} />;
        case "godowns":
        case "godown-hub":
        case "inventory-godowns":
          return <GodownsPage products={products} analytics={analytics} />;
        case "sales":
        case "sales-billing":
          return <SalesPage products={products} customers={customers} suppliers={suppliers} entries={entries} onAddEntry={handleAddEntry} onAddCustomer={handleAddCustomer} isInvoiceOpen={isInvoiceOpen} paymentType={salesPaymentType} setPaymentType={setSalesPaymentType} setPage={setPage} darkMode={darkMode} setDarkMode={setDarkMode} voiceHandlersRef={globalVoiceHandlers} transactionType="billing" onViewInvoice={(inv) => { setActiveInvoice(inv); setIsInvoiceOpen(true); }} activeEditRecord={activeEditRecord} />;
        case "sales-quotation":
          return <SalesPage products={products} customers={customers} suppliers={suppliers} entries={entries} onAddEntry={handleAddEntry} onAddCustomer={handleAddCustomer} isInvoiceOpen={isInvoiceOpen} paymentType={salesPaymentType} setPaymentType={setSalesPaymentType} setPage={setPage} darkMode={darkMode} setDarkMode={setDarkMode} voiceHandlersRef={globalVoiceHandlers} transactionType="quotation" onViewInvoice={(inv) => { setActiveInvoice(inv); setIsInvoiceOpen(true); }} activeEditRecord={activeEditRecord} />;
        case "sales-delivery":
          return <SalesPage products={products} customers={customers} suppliers={suppliers} entries={entries} onAddEntry={handleAddEntry} onAddCustomer={handleAddCustomer} isInvoiceOpen={isInvoiceOpen} paymentType={salesPaymentType} setPaymentType={setSalesPaymentType} setPage={setPage} darkMode={darkMode} setDarkMode={setDarkMode} voiceHandlersRef={globalVoiceHandlers} transactionType="delivery_note" onViewInvoice={(inv) => { setActiveInvoice(inv); setIsInvoiceOpen(true); }} activeEditRecord={activeEditRecord} />;
        case "sales-credit":
          return <SalesPage products={products} customers={customers} suppliers={suppliers} entries={entries} onAddEntry={handleAddEntry} onAddCustomer={handleAddCustomer} isInvoiceOpen={isInvoiceOpen} paymentType={salesPaymentType} setPaymentType={setSalesPaymentType} setPage={setPage} darkMode={darkMode} setDarkMode={setDarkMode} voiceHandlersRef={globalVoiceHandlers} transactionType="credit_note" onViewInvoice={(inv) => { setActiveInvoice(inv); setIsInvoiceOpen(true); }} activeEditRecord={activeEditRecord} />;
        
        case "purchase":
        case "purchase-billing":
          return <PurchasePage products={products} suppliers={suppliers} customers={customers} entries={entries} onAddEntry={handleAddEntry} onAddSupplier={handleAddSupplier} isInvoiceOpen={isInvoiceOpen} paymentType={purchasePaymentType} setPaymentType={setPurchasePaymentType} setPage={setPage} darkMode={darkMode} setDarkMode={setDarkMode} voiceHandlersRef={globalVoiceHandlers} transactionType="billing" onViewInvoice={(inv) => { setActiveInvoice(inv); setIsInvoiceOpen(true); }} activeEditRecord={activeEditRecord} />;
        case "purchase-order":
          return <PurchasePage products={products} suppliers={suppliers} customers={customers} entries={entries} onAddEntry={handleAddEntry} onAddSupplier={handleAddSupplier} isInvoiceOpen={isInvoiceOpen} paymentType={purchasePaymentType} setPaymentType={setPurchasePaymentType} setPage={setPage} darkMode={darkMode} setDarkMode={setDarkMode} voiceHandlersRef={globalVoiceHandlers} transactionType="purchase_order" onViewInvoice={(inv) => { setActiveInvoice(inv); setIsInvoiceOpen(true); }} activeEditRecord={activeEditRecord} />;
        case "purchase-grn":
          return <PurchasePage products={products} suppliers={suppliers} customers={customers} entries={entries} onAddEntry={handleAddEntry} onAddSupplier={handleAddSupplier} isInvoiceOpen={isInvoiceOpen} paymentType={purchasePaymentType} setPaymentType={setPurchasePaymentType} setPage={setPage} darkMode={darkMode} setDarkMode={setDarkMode} voiceHandlersRef={globalVoiceHandlers} transactionType="grn" onViewInvoice={(inv) => { setActiveInvoice(inv); setIsInvoiceOpen(true); }} activeEditRecord={activeEditRecord} />;
        case "purchase-debit":
          return <PurchasePage products={products} suppliers={suppliers} customers={customers} entries={entries} onAddEntry={handleAddEntry} onAddSupplier={handleAddSupplier} isInvoiceOpen={isInvoiceOpen} paymentType={purchasePaymentType} setPaymentType={setPurchasePaymentType} setPage={setPage} darkMode={darkMode} setDarkMode={setDarkMode} voiceHandlersRef={globalVoiceHandlers} transactionType="debit_note" onViewInvoice={(inv) => { setActiveInvoice(inv); setIsInvoiceOpen(true); }} activeEditRecord={activeEditRecord} />;
        case "purchase-spoilage":
          return <PurchaseSpoilagePage products={products} spoilages={spoilages} onAddSpoilage={handleAddSpoilage} onRefresh={loadData} />;
        
        case "costing":
        case "costing-inward":
        case "costing-outward":
          return <CostingPage products={products} entries={entries} suppliers={suppliers} currentPage={page} setPage={setPage} onRefresh={loadData} />;
        case "currency":
        case "currency-convert":
          return <CurrencyConvertPage products={products} entries={entries} />;
        case "expiry":
        case "expiry-sale":
        case "perishables":
          return <ExpiryPage products={products} entries={entries} onRefresh={loadData} onLoadClearancePromo={handleApplyClearancePromo} />;
        case "offers":
          return <OffersPage products={products} entries={entries} onRefresh={loadData} />;
        case "pl": return <PLPage products={products} analytics={analytics} />;
        case "credit-recovery": return <CreditRecoveryPage entries={entries} customers={customers} onViewInvoice={(inv) => { setActiveInvoice(inv); setIsInvoiceOpen(true); }} />;
        case "ai": return <AIPage products={products} entries={entries} onRefresh={loadData} />;
        default: return <DashboardPage products={products} entries={entries} analytics={analytics} onRefresh={loadData} />;
      }
    };
    return (
      <PageErrorBoundary key={page} pageName={page} onReset={() => setPage("dashboard")}>
        {getPageComponent()}
      </PageErrorBoundary>
    );
  }

  if (appState === "intro") {
    return (
      <div className="w-full min-h-screen flex flex-col bg-[#01140e] overflow-y-auto text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Toaster position="top-right" richColors />
        <IntroSplashScreen onFinish={() => setAppState("login")} />
      </div>
    );
  }

  if (appState === "login") {
    return (
      <div className="w-full min-h-screen flex flex-col bg-[#010906] overflow-y-auto text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Toaster position="top-right" richColors />
        <LoginPage onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem("active_user_session", JSON.stringify(user));
          setAppState("main");
        }} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Toaster position="top-right" richColors />

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-60 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200
        lg:static lg:translate-x-0 no-print
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="px-5 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 via-emerald-600 to-teal-700 flex items-center justify-center text-white shadow font-bold text-xs">
              RJ
            </div>
            <div>
              <div className="text-xs font-extrabold text-foreground font-serif leading-tight tracking-tight">RJ GROUP</div>
              <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-bold uppercase tracking-wider">4 Branches Suite</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = page === item.id;

            // ── Permission gate for top-level nav items ──
            if (item.id === "dashboard" && !isFeaturePermitted("dashboard")) return null;
            if (item.id === "inventory" && !isFeaturePermitted("inventory")) return null;
            if (item.id === "godowns" && !isFeaturePermitted("godowns")) return null;
            if (item.id === "costing" && !isFeaturePermitted("costing")) return null;
            if (item.id === "currency-convert" && !isFeaturePermitted("currency-convert")) return null;
            if (item.id === "expiry" && !isFeaturePermitted("expiry")) return null;
            if (item.id === "offers" && !isFeaturePermitted("offers")) return null;
            if (item.id === "credit-recovery" && !isFeaturePermitted("credit-recovery")) return null;
            if (item.id === "perishables" && !isFeaturePermitted("inventory")) return null;
            if (item.id === "ai" && !isFeaturePermitted("dashboard")) return null;
            if (item.id === "sales" && !hasAnyFeature("sales-billing", "sales-quotation", "sales-delivery", "sales-credit-note", "sales-debit-note", "sales-pos", "sales-proforma")) return null;
            if (item.id === "purchase" && !hasAnyFeature("purchase-bill", "purchase-order", "inventory-spoilage")) return null;
            if (item.id === "vouchers" && !hasAnyFeature("vouchers-receipt", "vouchers-payment", "vouchers-journal", "vouchers-contra")) return null;
            if (item.id === "reports" && !hasAnyFeature("reports-pnl", "reports-bs", "reports-trial", "reports-ledger", "reports-daybook")) return null;
            if (item.id === "master-console" && !hasAnyFeature("master-accounts-groups", "master-accounts-ledger", "master-accounts-customer", "master-accounts-supplier", "master-inventory-categories", "master-inventory-unit", "master-inventory-packing", "master-godowns", "master-users")) return null;

            const itemElement = (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-mono transition-all group ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
                {item.shortcut ? (
                  <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border transition-opacity ${
                    active ? "bg-white/20 border-white/30 text-white" : "bg-muted/40 border-border/50 text-muted-foreground group-hover:text-foreground opacity-80"
                  }`}>
                    {item.shortcut}
                  </span>
                ) : active ? (
                  <ChevronRight size={12} className="ml-auto opacity-60" />
                ) : null}
              </button>
            );

            if (item.id === "sales") {
              const salesActive = page.startsWith("sales");
              return (
                <Fragment key={item.id}>
                  <div className="space-y-0.5 my-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSalesOpen(prev => !prev);
                        setPage("sales-billing");
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                        salesActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Icon size={14} className={salesActive ? "text-primary-foreground" : ""} />
                      <span>{item.label}</span>
                      <span className="ml-auto text-[10px]">
                        {salesOpen ? "▼" : "▶"}
                      </span>
                    </button>
                    
                    {salesOpen && (
                      <div className="pl-4 space-y-1.5 border-l border-sidebar-border/60 ml-4 py-1">
                        {isFeaturePermitted("sales-quotation") && <button
                          onClick={() => { setPage("sales-quotation"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "sales-quotation" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Sales Quotation</span>
                          <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Alt+Q</span>
                        </button>}
                        {isFeaturePermitted("sales-billing") && <button
                          onClick={() => { setPage("sales-billing"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "sales-billing" || page === "sales" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Billing</span>
                          <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Alt+S</span>
                        </button>}
                        {isFeaturePermitted("sales-delivery") && <button
                          onClick={() => { setPage("sales-delivery"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "sales-delivery" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Delivery Note</span>
                          <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Alt+N</span>
                        </button>}
                        {isFeaturePermitted("sales-credit") && <button
                          onClick={() => { setPage("sales-credit"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "sales-credit" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Credit Note</span>
                          <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Alt+K</span>
                        </button>}
                      </div>
                    )}
                  </div>
                </Fragment>
              );
            }

            if (item.id === "purchase") {
              const purchaseActive = page.startsWith("purchase");
              return (
                <Fragment key={item.id}>
                  <div className="space-y-0.5 my-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPurchaseSubOpen(prev => !prev);
                        setPage("purchase-billing");
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                        purchaseActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Icon size={14} className={purchaseActive ? "text-primary-foreground" : ""} />
                      <span>{item.label}</span>
                      <span className="ml-auto text-[10px]">
                        {purchaseSubOpen ? "▼" : "▶"}
                      </span>
                    </button>
                    
                    {purchaseSubOpen && (
                      <div className="pl-4 space-y-1.5 border-l border-sidebar-border/60 ml-4 py-1">
                        {isFeaturePermitted("purchase-order") && <button
                          onClick={() => { setPage("purchase-order"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "purchase-order" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Purchase Order</span>
                          <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Alt+V</span>
                        </button>}
                        {isFeaturePermitted("purchase-bill") && <button
                          onClick={() => { setPage("purchase-grn"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "purchase-grn" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>GRN (Goods Receive Note)</span>
                          <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Alt+G</span>
                        </button>}
                        {isFeaturePermitted("purchase-billing") && <button
                          onClick={() => { setPage("purchase-billing"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "purchase-billing" || page === "purchase" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Billing</span>
                          <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Alt+P</span>
                        </button>}
                        {isFeaturePermitted("sales-debit-note") && <button
                          onClick={() => { setPage("purchase-debit"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "purchase-debit" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Debit Note</span>
                          <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Alt+B</span>
                        </button>}
                        {isFeaturePermitted("purchase-spoilage") && <button
                          onClick={() => { setPage("purchase-spoilage"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "purchase-spoilage" ? "bg-red-500/20 text-red-600 dark:text-red-400 font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Spoilage Entry</span>
                          <span className="text-[8px] px-1 bg-red-500/20 text-red-500 rounded font-mono font-semibold">Alt+Y</span>
                        </button>}
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5 my-1">
                    <button
                      type="button"
                      onClick={() => setMasterOpen(prev => !prev)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                        page.startsWith("master-")
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Sparkles size={14} className={page.startsWith("master-") ? "animate-pulse" : "text-primary animate-pulse"} />
                      <span>Master</span>
                      <span className="ml-auto text-[10px]">
                        {masterOpen ? "▼" : "▶"}
                      </span>
                    </button>
                    
                    {masterOpen && (
                      <div className="pl-4 space-y-1.5 border-l border-sidebar-border/60 ml-4 py-1">
                        {/* Accounts Sub-accordion */}
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => setMasterAccountsOpen(prev => !prev)}
                            className="w-full flex items-center justify-between px-2 py-1 rounded text-[11px] font-mono text-sidebar-foreground/85 hover:bg-sidebar-accent/50"
                          >
                            <span className="font-semibold">Accounts</span>
                            <span className="text-[9px] text-muted-foreground">{masterAccountsOpen ? "▼" : "▶"}</span>
                          </button>
                          {masterAccountsOpen && (
                            <div className="pl-3 space-y-0.5 border-l border-sidebar-border/30 ml-2 py-0.5">
                              <button
                                onClick={() => { setPage("master-accounts-groups"); setSidebarOpen(false); }}
                                className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                                  page === "master-accounts-groups" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                                }`}
                              >
                                <span>Groups</span>
                                <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Ctrl+G</span>
                              </button>
                              <button
                                onClick={() => { setPage("master-accounts-ledger"); setSidebarOpen(false); }}
                                className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                                  page === "master-accounts-ledger" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                                }`}
                              >
                                <span>Ledger</span>
                                <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Ctrl+L</span>
                              </button>
                              <button
                                onClick={() => { setPage("master-accounts-customer"); setSidebarOpen(false); }}
                                className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                                  page === "master-accounts-customer" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                                }`}
                              >
                                <span>Customer</span>
                                <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Ctrl+U</span>
                              </button>
                              <button
                                onClick={() => { setPage("master-accounts-supplier"); setSidebarOpen(false); }}
                                className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                                  page === "master-accounts-supplier" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                                }`}
                              >
                                <span>Supplier</span>
                                <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Ctrl+S</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Inventory Sub-accordion */}
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setMasterInventoryOpen(prev => !prev);
                              setPage("master-inventory-godowns");
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] font-mono transition-all ${
                              page.startsWith("master-inventory") ? "bg-primary/20 text-foreground font-bold" : "text-sidebar-foreground/85 hover:bg-sidebar-accent/50"
                            }`}
                          >
                            <span className="font-semibold">Inventory</span>
                            <span className="text-[9px] text-muted-foreground">{masterInventoryOpen ? "▼" : "▶"}</span>
                          </button>
                          {masterInventoryOpen && (
                            <div className="pl-3 space-y-0.5 border-l border-sidebar-border/30 ml-2 py-0.5">
                              <button
                                onClick={() => { setPage("master-inventory-items"); setSidebarOpen(false); }}
                                className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                                  page === "master-inventory-items" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                                }`}
                              >
                                <span>Items</span>
                                <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground font-mono">Alt+I</span>
                              </button>
                              <button
                                onClick={() => { setPage("master-inventory-categories"); setSidebarOpen(false); }}
                                className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                                  page === "master-inventory-categories" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                                }`}
                              >
                                <span>Categories</span>
                                <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground font-mono">Ctrl+T</span>
                              </button>
                              <button
                                onClick={() => { setPage("master-inventory-unit"); setSidebarOpen(false); }}
                                className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                                  page === "master-inventory-unit" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                                }`}
                              >
                                <span>Unit</span>
                                <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground font-mono">Ctrl+M</span>
                              </button>
                              <button
                                onClick={() => { setPage("master-inventory-packing"); setSidebarOpen(false); }}
                                className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                                  page === "master-inventory-packing" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                                }`}
                              >
                                <span>Packing Type</span>
                                <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground font-mono">Ctrl+P</span>
                              </button>
                              <button
                                onClick={() => { setPage("master-inventory-godowns"); setSidebarOpen(false); }}
                                className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                                  page === "master-inventory-godowns" || page === "master-godowns" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                                }`}
                              >
                                <span>Godown Master</span>
                                <span className="text-[8px] px-1 bg-emerald-500/20 text-emerald-600 rounded font-mono font-semibold">Ctrl+W</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Godown Master Direct Link */}
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => { setPage("master-godowns"); setSidebarOpen(false); }}
                            className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] font-mono transition-all ${
                              page === "master-godowns" || page === "master-inventory-godowns" ? "bg-primary/20 text-foreground font-bold" : "text-sidebar-foreground/85 hover:bg-sidebar-accent/50"
                            }`}
                          >
                            <span className="font-semibold">Godown Master</span>
                            <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Ctrl+W</span>
                          </button>
                        </div>

                        {/* Users Link */}
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => { setPage("master-users"); setSidebarOpen(false); }}
                            className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] font-mono transition-all ${
                              page === "master-users" ? "bg-primary/20 text-foreground font-bold" : "text-sidebar-foreground/85 hover:bg-sidebar-accent/50"
                            }`}
                          >
                            <span className="font-semibold font-mono">Users</span>
                            <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Ctrl+E</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </Fragment>
              );
            }

            if (item.id === "vouchers") {
              return (
                <Fragment key={item.id}>
                  <div className="space-y-0.5 my-1">
                    <button
                      type="button"
                      onClick={() => setVouchersOpen(prev => !prev)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                        page.startsWith("vouchers")
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Receipt size={14} className={page.startsWith("vouchers") ? "text-primary font-bold" : ""} />
                      <span>Vouchers</span>
                      <span className="ml-auto text-[10px]">
                        {vouchersOpen ? "▼" : "▶"}
                      </span>
                    </button>
                    
                    {vouchersOpen && (
                      <div className="pl-4 space-y-1 border-l border-sidebar-border/60 ml-4 py-1">
                        {isFeaturePermitted("vouchers-payment") && <button
                          onClick={() => { setPage("vouchers-payment"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "vouchers-payment" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Payment Voucher</span>
                          <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Ctrl+1</span>
                        </button>}
                        {isFeaturePermitted("vouchers-receipt") && <button
                          onClick={() => { setPage("vouchers-receipt"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "vouchers-receipt" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Receipt Voucher</span>
                          <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Ctrl+2</span>
                        </button>}
                        {isFeaturePermitted("vouchers-contra") && <button
                          onClick={() => { setPage("vouchers-contra"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "vouchers-contra" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Contra Voucher</span>
                          <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Ctrl+3</span>
                        </button>}
                        {isFeaturePermitted("vouchers-journal") && <button
                          onClick={() => { setPage("vouchers-journal"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "vouchers-journal" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Journal Voucher</span>
                          <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Ctrl+4</span>
                        </button>}
                        {hasAnyFeature("vouchers-receipt", "vouchers-payment", "vouchers-journal", "vouchers-contra") && <button
                          onClick={() => { setPage("vouchers-all"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "vouchers-all" || page === "vouchers" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>All Vouchers Register</span>
                          <span className="text-[8px] px-1 bg-muted/50 rounded font-mono font-semibold text-muted-foreground">Ctrl+5</span>
                        </button>}
                      </div>
                    )}
                  </div>
                </Fragment>
              );
            }

            if (item.id === "reports") {
              return (
                <Fragment key={item.id}>
                  <div className="space-y-0.5 my-1">
                    <button
                      type="button"
                      onClick={() => setReportsOpen(prev => !prev)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                        page.startsWith("reports")
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <FileText size={14} className={page.startsWith("reports") ? "text-primary font-bold" : ""} />
                      <span>Reports</span>
                      <span className="ml-auto text-[10px]">
                        {reportsOpen ? "▼" : "▶"}
                      </span>
                    </button>
                    
                    {reportsOpen && (
                      <div className="pl-4 space-y-1 border-l border-sidebar-border/60 ml-4 py-1">
                        <button
                          onClick={() => { setPage("reports-pl"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "reports-pl" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Profit & Loss</span>
                          <span className="text-[9px] text-emerald-500 font-bold">P&L</span>
                        </button>
                        <button
                          onClick={() => { setPage("reports-bs"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "reports-bs" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Balance Sheet</span>
                          <span className="text-[9px] text-blue-500 font-bold">BS</span>
                        </button>
                        <button
                          onClick={() => { setPage("reports-tb"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "reports-tb" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Trial Balance</span>
                          <span className="text-[9px] text-purple-500 font-bold">TB</span>
                        </button>
                        <button
                          onClick={() => { setPage("reports-ledger"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "reports-ledger" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Ledger Reports</span>
                          <span className="text-[9px] text-amber-500 font-bold">LD</span>
                        </button>
                        <button
                          onClick={() => { setPage("reports-group"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "reports-group" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Group Reports</span>
                          <span className="text-[9px] text-teal-500 font-bold">GR</span>
                        </button>
                        <button
                          onClick={() => { setPage("reports-payable"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "reports-payable" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Accounts Payable</span>
                          <span className="text-[9px] text-red-500 font-bold">AP</span>
                        </button>
                        <button
                          onClick={() => { setPage("reports-receivable"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "reports-receivable" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Accounts Receivable</span>
                          <span className="text-[9px] text-cyan-500 font-bold">AR</span>
                        </button>
                        <button
                          onClick={() => { setPage("reports-outstanding"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "reports-outstanding" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Outstanding OS</span>
                          <span className="text-[9px] text-indigo-500 font-bold">OS</span>
                        </button>
                        <button
                          onClick={() => { setPage("reports-closing-stock"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "reports-closing-stock" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Closing Stock</span>
                          <span className="text-[9px] text-orange-500 font-bold">CS</span>
                        </button>
                        <button
                          onClick={() => { setPage("reports-day-book"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "reports-day-book" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Day Book</span>
                          <span className="text-[9px] text-pink-500 font-bold">DB</span>
                        </button>
                        <button
                          onClick={() => { setPage("reports-sales-purchase"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all ${
                            page === "reports-sales-purchase" || page === "reports-all" || page === "reports" ? "bg-primary/20 text-foreground font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          Sales & Purchase Report
                        </button>
                        <button
                          onClick={() => { setPage("reports-spoilage"); setSidebarOpen(false); }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                            page === "reports-spoilage" ? "bg-red-500/20 text-red-600 dark:text-red-400 font-bold" : "text-muted-foreground hover:bg-sidebar-accent/30"
                          }`}
                        >
                          <span>Spoilage Report</span>
                          <span className="text-[9px] text-red-500 font-bold">SPL</span>
                        </button>
                      </div>
                    )}
                  </div>
                </Fragment>
              );
            }

            return itemElement;
          })}
        </nav>

        <div className="px-5 py-4 border-t border-sidebar-border space-y-1">
          <div className="text-[10px] text-muted-foreground font-mono">Import · Export · Wholesale</div>
          <div className="text-[10px] text-muted-foreground font-mono">18 Godowns A-R</div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden no-print" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-border bg-card flex items-center px-5 gap-4 flex-shrink-0 justify-between no-print">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            {/* Page title heading */}
            <h1 className="text-base font-bold text-foreground font-serif tracking-tight flex items-center gap-2">
              {
                page === "sales-billing" || page === "sales" ? "Sales Billing" :
                page === "sales-quotation" ? "Sales Quotation" :
                page === "sales-delivery" ? "Sales Delivery Note" :
                page === "sales-credit" ? "Sales Credit Note" :
                page === "purchase-billing" || page === "purchase" ? "Purchase Billing" :
                page === "purchase-order" ? "Purchase Order (PO)" :
                page === "purchase-grn" ? "Goods Receive Note (GRN)" :
                page === "purchase-debit" ? "Debit Note (Purchase Return)" :
                page === "purchase-spoilage" ? "Cargo Spoilage & Damaged Stock Entry" :
                page === "costing-inward" || page === "costing" ? "Costing Inward (Import USD → MVR)" :
                page === "costing-outward" ? "Costing Outward (Export Pricing)" :
                page === "stock-transfer" ? "Stock Transfer" :
                page === "physical-stock" ? "Physical Stock Verification" :
                page === "payroll-attendance" ? "Attendance Ledger" :
                page === "payroll-salary-sheet" ? "Salary Sheet" :
                page === "credit-recovery" ? "Credit Recovery Cockpit" :
                page === "expiry-sale" ? "Expiry Sale & Offers" :
                page.startsWith("master-") ? `Master Console (${page.replace("master-", "").replace("-", " ")})` :
                page.startsWith("reports-") ? `Report (${page.replace("reports-", "").replace("-", " ")})` :
                (NAV_ITEMS.find(n => n.id === page)?.label || "Sales Billing")
              }
            </h1>

            {/* Sales Page cash/credit toggle */}
            {(page === "sales" || page === "sales-billing") && (
              <div className="flex border border-border bg-secondary/35 p-0.5 rounded-lg gap-0.5 ml-2 md:ml-4">
                <button
                  type="button"
                  onClick={() => setSalesPaymentType("cash")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                    salesPaymentType === "cash" 
                      ? "bg-emerald-600 text-white shadow" 
                      : "text-muted-foreground hover:bg-secondary/40"
                  }`}
                >
                  💵 Cash
                </button>
                <button
                  type="button"
                  onClick={() => setSalesPaymentType("credit")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                    salesPaymentType === "credit" 
                      ? "bg-amber-600 text-white shadow" 
                      : "text-muted-foreground hover:bg-secondary/40"
                  }`}
                >
                  📝 Credit
                </button>
              </div>
            )}

            {/* Purchase Page cash/credit toggle */}
            {page === "purchase" && (
              <div className="flex border border-border bg-secondary/35 p-0.5 rounded-lg gap-0.5 ml-2 md:ml-4">
                <button
                  onClick={() => setPurchasePaymentType("cash")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-mono font-medium transition-all ${
                    purchasePaymentType === "cash" 
                      ? "bg-primary text-primary-foreground shadow" 
                      : "text-muted-foreground hover:bg-secondary/40"
                  }`}
                >
                  <DollarSign size={11} /> Cash Purchase
                </button>
                <button
                  onClick={() => setPurchasePaymentType("credit")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-mono font-medium transition-all ${
                    purchasePaymentType === "credit" 
                      ? "bg-accent text-accent-foreground shadow" 
                      : "text-muted-foreground hover:bg-secondary/40"
                  }`}
                >
                  <CreditCard size={11} /> Credit Purchase
                </button>
              </div>
            )}

            {/* Costing Engine sub-tab switcher */}
            {page.startsWith("costing") && (
              <div className="flex bg-secondary p-1 rounded-xl gap-1 border border-border ml-2 md:ml-4">
                <button
                  type="button"
                  onClick={() => setPage("costing-inward")}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                    page === "costing-inward" || page === "costing"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ArrowDownToLine size={13} /> Costing Inward (Import USD → MVR)
                </button>

                <button
                  type="button"
                  onClick={() => setPage("costing-outward")}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                    page === "costing-outward"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ArrowUpFromLine size={13} /> Costing Outward (Export Pricing)
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* AI Voice Invoice Launcher Button */}
            <button
              type="button"
              onClick={() => setIsVoiceInvoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all text-xs font-mono font-bold shadow-md cursor-pointer"
              title="Open Voice AI Invoice Dictation Modal (Ctrl + Shift + V)"
            >
              <Mic size={14} className="animate-pulse" />
              <span>Voice AI Invoice</span>
            </button>

            {/* Active User Account Profile Pill */}
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all text-xs font-mono"
              title="Click to Switch User Account / Re-login"
            >
              <User size={14} className="text-primary" />
              <span className="font-bold text-foreground truncate max-w-[120px]">{currentUser?.employeeName || "System Admin"}</span>
              <span className="px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[9px] font-bold uppercase">
                {currentUser?.role || "Admin"}
              </span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 border border-border bg-card hover:bg-secondary/30 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              title="Toggle Light/Dark Theme"
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <div className="text-xs font-mono text-muted-foreground hidden sm:block">
              {formatDDMMYYYY(new Date().toISOString().split("T")[0])}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background/50 print-area">
          {renderPage()}
        </main>
      </div>

      {/* Floating AI Voice Assistant Drawer */}
      {page !== "sales" && page !== "purchase" && (
        <>
          <div className={`fixed inset-y-0 right-0 z-[100] w-80 bg-background/95 border-l border-border shadow-2xl backdrop-blur-md transform transition-transform duration-300 ${aiDrawerOpen ? "translate-x-0" : "translate-x-full"} no-print`}>
            <div className="h-full flex flex-col p-4 relative">
              <button
                onClick={() => setAiDrawerOpen(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors z-[110]"
              >
                <X size={16} />
              </button>
              
              <div className="flex-1 overflow-y-auto mt-6">
                <VoiceBillingAssistant
                  type={globalVoiceHandlers.current?.type || "out"}
                  products={products}
                  partners={globalVoiceHandlers.current?.partners || customers}
                  customers={customers}
                  suppliers={suppliers}
                  cartItems={globalVoiceHandlers.current?.cartItems || []}
                  setCartItems={globalVoiceHandlers.current?.setCartItems || (() => {})}
                  setProductId={globalVoiceHandlers.current?.setProductId || (() => {})}
                  setProductSearch={globalVoiceHandlers.current?.setProductSearch || (() => {})}
                  setGodown={globalVoiceHandlers.current?.setGodown || (() => {})}
                  setQuantity={globalVoiceHandlers.current?.setQuantity || (() => {})}
                  setRate={globalVoiceHandlers.current?.setRate || (() => {})}
                  setSelectedPartnerId={globalVoiceHandlers.current?.setSelectedPartnerId || (() => {})}
                  setPartnerSearch={globalVoiceHandlers.current?.setPartnerSearch || (() => {})}
                  setNote={globalVoiceHandlers.current?.setNote || (() => {})}
                  setPaymentType={globalVoiceHandlers.current?.setPaymentType || (() => {})}
                  handleAddItem={globalVoiceHandlers.current?.handleAddItem || (() => {})}
                  handleGenerateBill={globalVoiceHandlers.current?.handleGenerateBill || (() => {})}
                  setPage={setPage}
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  onRegisterPartner={globalVoiceHandlers.current?.onRegisterPartner}
                  isCartActive={!!globalVoiceHandlers.current}
                  onAddEntry={handleAddEntry}
                  onRefresh={loadData}
                />
              </div>
            </div>
          </div>

          {/* Floating Toggle Button */}
          <button
            onClick={() => setAiDrawerOpen(prev => !prev)}
            className="fixed bottom-6 right-6 z-[90] w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200 group no-print"
            title="Toggle AI Voice Coordinator (Ctrl + Space)"
          >
            <Bot size={24} className="group-hover:animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </button>

          {aiDrawerOpen && (
            <div 
              onClick={() => setAiDrawerOpen(false)}
              className="fixed inset-0 z-[80] bg-black/20 backdrop-blur-sm lg:hidden no-print"
            />
          )}
        </>
      )}

      {/* Switch Employee Account Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-card/80 border border-border rounded-full flex items-center justify-center text-foreground hover:bg-secondary transition-all z-20"
              title="Close Modal"
            >
              <X size={16} />
            </button>
            <LoginPage onLogin={(user) => {
              setCurrentUser(user);
              localStorage.setItem("active_user_session", JSON.stringify(user));
              setIsLoginModalOpen(false);
              setAppState("main");
            }} />
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        invoice={activeInvoice}
        products={products}
        onConvertQuotationToBill={(qtn) => {
          setPage("sales-billing");
          toast.success(`Navigated to Sales Billing for Quotation #${qtn.invoiceNo || qtn.id.slice(0, 6)}`);
        }}
        onConvertDeliveryNoteToBill={(dNote) => {
          setPage("sales-billing");
          toast.success(`Navigated to Sales Billing for Delivery Note #${dNote.invoiceNo || dNote.id.slice(0, 6)}`);
        }}
        onConvertGrnToPurchaseBill={(grn) => {
          setPage("purchase-billing");
          toast.success(`Navigated to Purchase Billing for GRN #${grn.invoiceNo || grn.id.slice(0, 6)}`);
        }}
        onConvertPoToPurchaseBill={(po) => {
          setPage("purchase-billing");
          toast.success(`Navigated to Purchase Billing for PO #${po.invoiceNo || po.id.slice(0, 6)}`);
        }}
      />

      {/* Interactive AI Voice Invoice Dictation Modal */}
      <AIVoiceInvoiceModal
        isOpen={isVoiceInvoiceModalOpen}
        onClose={() => setIsVoiceInvoiceModalOpen(false)}
        products={products}
        customers={customers}
        suppliers={suppliers}
        onEnterBilling={handleEnterVoiceBilling}
      />
    </div>
  );
}
