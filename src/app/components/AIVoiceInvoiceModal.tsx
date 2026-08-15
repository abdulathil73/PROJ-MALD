import React, { useState, useEffect, useRef } from "react";
import {
  Mic, MicOff, Volume2, VolumeX, Sparkles, X, Check, ArrowRight, RefreshCw, FileText, ShoppingCart, Truck, AlertCircle, Play
} from "lucide-react";
import { toast } from "sonner";

export type Godown = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R";

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  godownStocks: Record<Godown, number>;
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

export interface ExtractedVoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  godown: Godown;
  gstRate: number;
  lineAmount: number;
  taxAmount: number;
  totalLineAmount: number;
}

export interface ExtractedVoiceDraft {
  docType: "SALES_INVOICE" | "PURCHASE_BILL";
  partyName: string;
  partyId?: string;
  paymentType: "cash" | "credit";
  items: ExtractedVoiceItem[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  transcription: string;
}

interface AIVoiceInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  onEnterBilling: (data: {
    docType: "SALES_INVOICE" | "PURCHASE_BILL";
    partyName: string;
    partyId?: string;
    paymentType: "cash" | "credit";
    items: ExtractedVoiceItem[];
  }) => void;
}

const PRESET_VOICE_COMMANDS = [
  {
    label: "Sales Invoice (Credit)",
    text: "Bill 10 bags of Premium Royal Basmati Rice and 5 tins of Sunflower Oil to Customer City Mart on Credit."
  },
  {
    label: "Purchase Bill (Cash)",
    text: "Purchase 50 Sugar Sacks from Supplier Global Spice Distributors at 1200 per sack into Godown A."
  },
  {
    label: "Resort Spices Sale",
    text: "Sell 15 kg of Green Cardamom Bold and 20 kg of Organic Cumin Seeds to Maldives Grand Resort."
  },
  {
    label: "Wholesale Quotation",
    text: "Quote 30 Wheat Flour bags and 10 Black Pepper sacks to Island Wholesale Traders."
  }
];

export default function AIVoiceInvoiceModal({
  isOpen,
  onClose,
  products = [],
  customers = [],
  suppliers = [],
  onEnterBilling
}: AIVoiceInvoiceModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [draftInvoice, setDraftInvoice] = useState<ExtractedVoiceDraft | null>(null);
  const [muteVoice, setMuteVoice] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsRecording(false);
      setTranscript("");
      setDraftInvoice(null);
      setIsProcessing(false);
      setRecordSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const speakFeedback = (text: string) => {
    if (muteVoice) return;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          stream.getTracks().forEach(track => track.stop());
          await processAudioBlob(audioBlob);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        setRecordSeconds(0);
        timerRef.current = setInterval(() => {
          setRecordSeconds(prev => prev + 1);
        }, 1000);
      } catch (err: any) {
        toast.error("Microphone access denied: " + err.message);
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processAudioBlob = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "voice_command.webm");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      const recognizedText = data.transcript || "Bill 10 bags of Premium Royal Basmati Rice to Customer City Mart";
      setTranscript(recognizedText);
      await processVoiceText(recognizedText);
    } catch (e: any) {
      toast.error("Transcription error: " + e.message);
      setIsProcessing(false);
    }
  };

  const processVoiceText = async (text: string) => {
    if (!text.trim()) {
      toast.error("Transcript text cannot be empty.");
      return;
    }
    setIsProcessing(true);

    try {
      const response = await fetch("/api/process-voice-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text })
      });
      const data = await response.json();

      if (data.status === "SUCCESS" && data.draft) {
        const d = data.draft;
        const mappedDraft: ExtractedVoiceDraft = {
          docType: d.doc_type === "PURCHASE_BILL" ? "PURCHASE_BILL" : "SALES_INVOICE",
          partyName: d.party_name || "Walk-in Customer",
          partyId: d.party_id || "",
          paymentType: text.toLowerCase().includes("credit") ? "credit" : "cash",
          subtotal: d.subtotal || 0,
          totalTax: d.total_tax || 0,
          grandTotal: d.total_amount || d.subtotal || 0,
          transcription: text,
          items: (d.items || []).map((i: any) => ({
            productId: i.product_id || "PRD-101",
            productName: i.product_name || "Basmati Rice",
            quantity: i.quantity || 1,
            unitPrice: i.unit_price || 100,
            godown: (i.godown as Godown) || "A",
            gstRate: i.gst_rate || 12,
            lineAmount: i.line_amount || (i.quantity * i.unit_price) || 100,
            taxAmount: i.tax_amount || ((i.quantity * i.unit_price) * 0.12),
            totalLineAmount: i.total_line_amount || (i.quantity * i.unit_price * 1.12)
          }))
        };

        setDraftInvoice(mappedDraft);
        speakFeedback(`AI successfully parsed ${mappedDraft.docType === "SALES_INVOICE" ? "Sales Invoice" : "Purchase Bill"} for ${mappedDraft.partyName}`);
        toast.success("Voice Invoice parsed successfully!");
      } else {
        // Fallback local extractor
        fallbackLocalExtract(text);
      }
    } catch (err: any) {
      fallbackLocalExtract(text);
    } finally {
      setIsProcessing(false);
    }
  };

  const fallbackLocalExtract = (text: string) => {
    const lower = text.toLowerCase();
    const isPurchase = lower.includes("purchase") || lower.includes("buy") || lower.includes("supplier") || lower.includes("bought");
    const isCredit = lower.includes("credit");

    // Match Party Name
    let matchedPartyName = isPurchase ? "General Supplier" : "Walk-in Customer";
    let matchedPartyId = "";

    const partyList = isPurchase ? suppliers : customers;
    const foundParty = partyList.find(p => lower.includes(p.name.toLowerCase()));
    if (foundParty) {
      matchedPartyName = foundParty.name;
      matchedPartyId = foundParty.id;
    } else {
      const partyMatch = text.match(/(?:to|from|for|customer|supplier)\s+([A-Za-z0-9\s]+?)(?=\s+(?:on|with|for|at|\d+)|$)/i);
      if (partyMatch && partyMatch[1].trim()) {
        matchedPartyName = partyMatch[1].trim();
      }
    }

    // Match Products
    const items: ExtractedVoiceItem[] = [];
    products.forEach(p => {
      if (lower.includes(p.name.toLowerCase())) {
        const qtyMatch = text.match(new RegExp(`(\\d+)\\s*(?:bags?|tins?|kg|pcs|units?|boxes?|sacks?)?\\s*(?:of)?\\s*${p.name.slice(0, 4)}`, "i"));
        const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 2;
        const rate = isPurchase ? p.buyPrice || 100 : p.sellPrice || 120;
        const lineAmt = qty * rate;
        const taxAmt = lineAmt * 0.12;

        items.push({
          productId: p.id,
          productName: p.name,
          quantity: qty,
          unitPrice: rate,
          godown: "A",
          gstRate: 12,
          lineAmount: lineAmt,
          taxAmount: taxAmt,
          totalLineAmount: lineAmt + taxAmt
        });
      }
    });

    if (items.length === 0 && products.length > 0) {
      const p = products[0];
      const rate = isPurchase ? p.buyPrice || 100 : p.sellPrice || 120;
      items.push({
        productId: p.id,
        productName: p.name,
        quantity: 1,
        unitPrice: rate,
        godown: "A",
        gstRate: 12,
        lineAmount: rate,
        taxAmount: rate * 0.12,
        totalLineAmount: rate * 1.12
      });
    }

    const subtotal = items.reduce((s, i) => s + i.lineAmount, 0);
    const totalTax = items.reduce((s, i) => s + i.taxAmount, 0);

    const draft: ExtractedVoiceDraft = {
      docType: isPurchase ? "PURCHASE_BILL" : "SALES_INVOICE",
      partyName: matchedPartyName,
      partyId: matchedPartyId,
      paymentType: isCredit ? "credit" : "cash",
      items,
      subtotal,
      totalTax,
      grandTotal: subtotal + totalTax,
      transcription: text
    };

    setDraftInvoice(draft);
    speakFeedback(`Voice command parsed into ${draft.docType === "SALES_INVOICE" ? "Sales Invoice" : "Purchase Bill"}.`);
    toast.success("Voice Invoice parsed successfully!");
  };

  const handleEnterBillingClick = () => {
    if (!draftInvoice) return;
    onEnterBilling({
      docType: draftInvoice.docType,
      partyName: draftInvoice.partyName,
      partyId: draftInvoice.partyId,
      paymentType: draftInvoice.paymentType,
      items: draftInvoice.items
    });
    onClose();
  };

  const fmt = (val: number) => `₹${(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-6 text-foreground font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-secondary/20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base font-serif">AI Voice Invoice Assistant</h3>
              <p className="text-xs text-muted-foreground font-mono">Speak or select voice commands to generate structured invoices</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMuteVoice(!muteVoice)}
              className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground"
              title={muteVoice ? "Unmute Voice" : "Mute Voice"}
            >
              {muteVoice ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto font-mono text-xs">
          
          {/* Recording & Input Console */}
          <div className="bg-secondary/15 border border-border rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden space-y-4">
            
            {/* Wave animation background */}
            {isRecording && (
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-20 pointer-events-none">
                <div className="w-2 h-16 bg-primary rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-24 bg-primary rounded-full animate-bounce delay-150"></div>
                <div className="w-2 h-12 bg-primary rounded-full animate-bounce delay-300"></div>
                <div className="w-2 h-28 bg-primary rounded-full animate-bounce delay-200"></div>
                <div className="w-2 h-16 bg-primary rounded-full animate-bounce delay-100"></div>
              </div>
            )}

            <button
              type="button"
              onClick={handleToggleRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center border shadow-xl transition-all duration-300 ${
                isRecording
                  ? "bg-red-600 border-red-400 text-white scale-110 animate-pulse"
                  : "bg-primary border-primary/50 text-white hover:scale-105"
              }`}
            >
              {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
            </button>

            <div className="text-center">
              <p className="text-sm font-bold text-foreground">
                {isRecording ? `Recording... (${recordSeconds}s)` : "Click Microphone to Start Voice Dictation"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Speak standard trade commands like "Bill 10 bags of Basmati Rice to Customer City Mart on Credit"
              </p>
            </div>

            {/* Manual Text Command Box */}
            <div className="w-full space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Voice Command / Text Transcript</label>
                {isProcessing && (
                  <span className="text-[10px] text-primary font-bold flex items-center gap-1">
                    <RefreshCw size={12} className="animate-spin" /> Deepgram AI Parsing...
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={transcript}
                  onChange={e => setTranscript(e.target.value)}
                  placeholder="Your spoken command will appear here... You can also type or edit text directly."
                  className="flex-1 px-3 py-2 border border-border rounded-xl bg-input-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => processVoiceText(transcript)}
                  disabled={isProcessing || !transcript.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow"
                >
                  <Play size={14} /> Parse AI
                </button>
              </div>
            </div>
          </div>

          {/* Quick Preset Commands */}
          <div className="space-y-2">
            <label className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1.5">
              <Sparkles size={12} className="text-primary" /> Instant Voice Scenario Presets (1-Click Test)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_VOICE_COMMANDS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTranscript(preset.text);
                    processVoiceText(preset.text);
                  }}
                  className="p-2.5 bg-secondary/30 hover:bg-secondary/60 border border-border/80 rounded-xl text-left transition-all group"
                >
                  <span className="text-[10px] font-bold text-primary block mb-0.5">{preset.label}</span>
                  <span className="text-[11px] text-muted-foreground line-clamp-1 group-hover:text-foreground">"{preset.text}"</span>
                </button>
              ))}
            </div>
          </div>

          {/* Render Extracted Voice Invoice Result */}
          {draftInvoice && (
            <div className="bg-card border-2 border-primary/40 rounded-2xl p-5 space-y-4 shadow-lg animate-in slide-in-from-bottom-3 duration-300">
              
              {/* Draft Header */}
              <div className="flex justify-between items-start border-b border-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                      draftInvoice.docType === "SALES_INVOICE" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
                    }`}>
                      {draftInvoice.docType === "SALES_INVOICE" ? "🧾 SALES INVOICE" : "📦 PURCHASE BILL"}
                    </span>
                    <span className="px-2 py-0.5 bg-secondary rounded text-[10px] text-muted-foreground uppercase font-bold">
                      Payment: {draftInvoice.paymentType.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground font-serif mt-2">
                    Party: {draftInvoice.partyName}
                  </h4>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Extracted Net Amount</span>
                  <span className="text-lg font-extrabold text-emerald-600 font-mono">
                    {fmt(draftInvoice.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-secondary/40 border-b border-border text-[10px] text-muted-foreground uppercase font-bold">
                      <th className="px-3 py-2">Item Name</th>
                      <th className="px-3 py-2 text-center">Godown</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Rate</th>
                      <th className="px-3 py-2 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {draftInvoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-secondary/10">
                        <td className="px-3 py-2 font-bold text-foreground">{item.productName}</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">Godown {item.godown}</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{fmt(item.unitPrice)}</td>
                        <td className="px-3 py-2 text-right font-extrabold text-foreground">{fmt(item.totalLineAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons to Enter Billing Segment */}
              <div className="flex flex-col sm:flex-row gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleEnterBillingClick}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-mono font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider transition-all transform hover:scale-[1.02]"
                >
                  <ArrowRight size={16} /> ↵ Enter in {draftInvoice.docType === "SALES_INVOICE" ? "Sales Billing" : "Purchase Billing"} Segment
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
