/**
 * Voice AI Invoice & Bill Platform - Application Logic
 */

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordTimerInterval = null;
let recordSeconds = 0;
let currentDraftInvoice = null;

document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initRecorder();
    initPresets();
    initFileUpload();
    initActionButtons();
    loadCatalog();
    loadInvoices();
});

// 1. Navigation Tabs
function initNavigation() {
    const navBtns = document.querySelectorAll(".nav-btn");
    navBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-tab");
            switchTab(targetTab);
        });
    });
}

function switchTab(tabId) {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));

    const btn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    const tab = document.getElementById(`tab-${tabId}`);
    if (btn) btn.classList.add("active");
    if (tab) tab.classList.add("active");

    const titles = {
        "voice-studio": ["Voice Studio", "Speak or upload voice commands to generate automated invoices & purchase bills"],
        "draft-review": ["Human Confirmation Review", "Review, edit, and confirm invoice drafts before stock deduction"],
        "inventory-history": ["Catalog & Invoice Ledger", "Monitor real-time product stock levels and past transaction bills"],
        "integration-guide": ["Website Integration Guide", "Connect this agent to your existing React, Vue, or Python backend"]
    };

    if (titles[tabId]) {
        document.getElementById("page-title").textContent = titles[tabId][0];
        document.getElementById("page-subtitle").textContent = titles[tabId][1];
    }
}

// 2. Microphone Audio Recording
function initRecorder() {
    const micBtn = document.getElementById("mic-btn");
    micBtn.addEventListener("click", toggleRecording);
}

async function toggleRecording() {
    const micBtn = document.getElementById("mic-btn");
    const micIcon = document.getElementById("mic-icon");
    const timerDisplay = document.getElementById("record-timer");
    const instruction = document.getElementById("record-instruction");

    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                await sendAudioForTranscription(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            isRecording = true;
            micBtn.classList.add("recording");
            micIcon.className = "fa-solid fa-stop";
            instruction.textContent = "Recording voice... Click red button to stop.";

            recordSeconds = 0;
            recordTimerInterval = setInterval(() => {
                recordSeconds++;
                const mins = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
                const secs = String(recordSeconds % 60).padStart(2, '0');
                timerDisplay.textContent = `${mins}:${secs}`;
            }, 1000);

        } catch (err) {
            alert("Microphone access permission denied or unavailable: " + err.message);
        }
    } else {
        mediaRecorder.stop();
        isRecording = false;
        micBtn.classList.remove("recording");
        micIcon.className = "fa-solid fa-microphone";
        instruction.textContent = "Click microphone to start recording voice invoice";
        clearInterval(recordTimerInterval);
    }
}

// 3. Audio Transcribe Call
async function sendAudioForTranscription(audioBlob) {
    appendLog("Sending audio stream to Deepgram STT API...", "thought");
    const formData = new FormData();
    formData.append("file", audioBlob, "recorded_voice.webm");

    try {
        const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        if (data.status === "SUCCESS" || data.transcript) {
            document.getElementById("transcript-input").value = data.transcript;
            appendLog(`Deepgram Transcribed: "${data.transcript}"`, "success");
            // Auto trigger agent processing
            processVoiceInvoice(data.transcript);
        } else {
            appendLog(`Transcription Notice: ${data.message || 'Used fallback preset'}`, "tool");
            if (data.transcript) {
                document.getElementById("transcript-input").value = data.transcript;
                processVoiceInvoice(data.transcript);
            }
        }
    } catch (err) {
        appendLog(`Transcription Error: ${err.message}`, "error");
    }
}

// 4. Sample Presets
async function initPresets() {
    try {
        const res = await fetch("/api/preset-transcripts");
        const presets = await res.json();
        const container = document.getElementById("presets-grid");
        container.innerHTML = "";

        Object.entries(presets).forEach(([key, text]) => {
            const btn = document.createElement("button");
            btn.className = "preset-btn";
            btn.innerHTML = `<i class="fa-solid fa-comment-dots"></i> ${text}`;
            btn.onclick = () => {
                document.getElementById("transcript-input").value = text;
                appendLog(`Selected Preset Command: "${text}"`, "thought");
                processVoiceInvoice(text);
            };
            container.appendChild(btn);
        });
    } catch (err) {
        console.error("Failed to load presets", err);
    }
}

function initFileUpload() {
    const fileInput = document.getElementById("audio-file-input");
    fileInput.addEventListener("change", async (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            appendLog(`Uploading file '${file.name}' for Deepgram transcription...`, "thought");
            await sendAudioForTranscription(file);
        }
    });
}

function initActionButtons() {
    document.getElementById("clear-btn").onclick = () => {
        document.getElementById("transcript-input").value = "";
        document.getElementById("terminal-logs").innerHTML = '<div class="log-line text-muted">Cleared terminal.</div>';
    };

    document.getElementById("process-agent-btn").onclick = () => {
        const tx = document.getElementById("transcript-input").value;
        if (!tx.trim()) {
            alert("Please speak or enter a voice transcript first!");
            return;
        }
        processVoiceInvoice(tx);
    };

    document.getElementById("confirm-btn").onclick = () => handleConfirmation("CONFIRM");
    document.getElementById("reject-btn").onclick = () => handleConfirmation("REJECT");
}

// 5. CrewAI Agent Execution
async function processVoiceInvoice(transcriptText) {
    appendLog(`[Agent Task 1] Entity Extraction Agent analyzing: "${transcriptText}"...`, "thought");
    appendLog(`[Tool Call] find_customer_or_supplier searching party registry...`, "tool");
    appendLog(`[Tool Call] find_product searching stock catalog...`, "tool");
    appendLog(`[Tool Call] check_stock evaluating available inventory...`, "tool");

    try {
        const response = await fetch("/api/process-invoice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript: transcriptText })
        });

        const data = await response.json();
        if (data.status === "SUCCESS" && data.draft) {
            appendLog(`[Tool Call] create_invoice generated Draft ID ${data.draft.id}!`, "success");
            appendLog(`[Agent Output] Invoice calculation complete! Switch to 'Draft Review' tab for Human Confirmation.`, "success");

            currentDraftInvoice = data.draft;
            renderDraftInvoice(currentDraftInvoice);

            // Show notification badge
            document.getElementById("pending-badge").style.display = "inline-block";
            
            // Auto switch to review tab after slight delay
            setTimeout(() => switchTab("draft-review"), 1200);
        } else {
            appendLog(`Agent Error: ${data.detail || 'Could not process invoice'}`, "error");
        }
    } catch (err) {
        appendLog(`Server Request Error: ${err.message}`, "error");
    }
}

// 6. Render Human Confirmation Draft
function renderDraftInvoice(draft) {
    document.getElementById("no-draft-notice").style.display = "none";
    document.getElementById("draft-container").style.display = "block";

    document.getElementById("inv-doc-type").textContent = draft.doc_type === "SALES_INVOICE" ? "SALES INVOICE" : "PURCHASE BILL";
    document.getElementById("inv-number").textContent = draft.invoice_number || "DRAFT-2026";
    document.getElementById("inv-status").textContent = draft.status.replace(/_/g, ' ');
    document.getElementById("inv-date").textContent = new Date().toISOString().split("T")[0];
    
    const stateBadge = document.getElementById("inv-state-badge");
    stateBadge.textContent = draft.state_type;
    stateBadge.className = draft.state_type === "INTRA_STATE" ? "pill pill-info" : "pill pill-primary";

    document.getElementById("inv-party-name").textContent = draft.party_name;
    document.getElementById("inv-party-gstin").textContent = draft.party_gstin ? `GSTIN: ${draft.party_gstin}` : "GSTIN: Unregistered / Consumer";
    document.getElementById("inv-transcript-quote").textContent = `"${draft.transcription || 'Voice command'}"`;

    // Warnings
    const warnBanner = document.getElementById("warnings-banner");
    const warnList = document.getElementById("warnings-list");
    if (draft.warnings && draft.warnings.length > 0) {
        warnBanner.style.display = "flex";
        warnList.innerHTML = draft.warnings.map(w => `<div>• ${w}</div>`).join("");
    } else {
        warnBanner.style.display = "none";
    }

    // Line Items Table
    const tbody = document.getElementById("inv-items-body");
    tbody.innerHTML = "";
    draft.items.forEach((item, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <strong>${item.product_name}</strong>
                <div class="text-dim" style="font-size:11px;">ID: ${item.product_id || 'PRD'}</div>
            </td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">₹ ${item.unit_price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td class="text-right">${item.gst_rate}%</td>
            <td class="text-right">₹ ${item.tax_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td class="text-right"><strong>₹ ${item.total_line_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong></td>
        `;
        tbody.appendChild(tr);
    });

    // Totals
    document.getElementById("inv-subtotal").textContent = `₹ ${draft.subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    
    if (draft.state_type === "INTRA_STATE") {
        document.getElementById("cgst-row").style.display = "flex";
        document.getElementById("sgst-row").style.display = "flex";
        document.getElementById("igst-row").style.display = "none";
        document.getElementById("inv-cgst").textContent = `₹ ${draft.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
        document.getElementById("inv-sgst").textContent = `₹ ${draft.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    } else {
        document.getElementById("cgst-row").style.display = "none";
        document.getElementById("sgst-row").style.display = "none";
        document.getElementById("igst-row").style.display = "flex";
        document.getElementById("inv-igst").textContent = `₹ ${draft.igst.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    }

    document.getElementById("inv-total-amount").textContent = `₹ ${draft.total_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
}

// 7. Human Confirmation Action
async function handleConfirmation(action) {
    if (!currentDraftInvoice) return;

    try {
        const response = await fetch("/api/confirm-invoice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                invoice_id: currentDraftInvoice.id,
                action: action,
                modified_invoice: currentDraftInvoice
            })
        });

        const resData = await response.json();
        if (resData.status === "SUCCESS") {
            alert(`Invoice ${resData.invoice.invoice_number} has been ${action === "CONFIRM" ? "CONFIRMED and stock inventory updated!" : "REJECTED."}`);
            document.getElementById("pending-badge").style.display = "none";
            loadCatalog();
            loadInvoices();
            switchTab("inventory-history");
        }
    } catch (err) {
        alert("Failed to confirm invoice: " + err.message);
    }
}

// 8. Load Ledger Data
async function loadCatalog() {
    try {
        const res = await fetch("/api/products");
        const products = await res.json();
        const tbody = document.getElementById("products-table-body");
        tbody.innerHTML = "";

        products.forEach(p => {
            const tr = document.createElement("tr");
            const isLow = p.stock_quantity <= 10;
            tr.innerHTML = `
                <td><code>${p.id}</code></td>
                <td><strong>${p.name}</strong> <span class="text-dim">(${p.category})</span></td>
                <td>₹ ${p.unit_price.toLocaleString('en-IN')}</td>
                <td>
                    <span class="pill ${isLow ? 'pill-info' : 'pill-primary'}" style="${isLow ? 'background:rgba(239,68,68,0.2);color:#ef4444;' : ''}">
                        ${p.stock_quantity} ${p.unit}
                    </span>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Failed to load products", err);
    }
}

async function loadInvoices() {
    try {
        const res = await fetch("/api/invoices");
        const invoices = await res.json();
        const tbody = document.getElementById("invoices-table-body");
        tbody.innerHTML = "";

        invoices.forEach(inv => {
            const tr = document.createElement("tr");
            const statusClass = inv.status === "CONFIRMED" ? "pill-primary" : (inv.status === "REJECTED" ? "pill-info" : "pill-info");
            tr.innerHTML = `
                <td><strong>${inv.invoice_number}</strong></td>
                <td>${inv.party_name}</td>
                <td>₹ ${inv.total_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                <td><span class="pill ${statusClass}">${inv.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Failed to load invoices", err);
    }
}

function appendLog(msg, type = "thought") {
    const logs = document.getElementById("terminal-logs");
    const div = document.createElement("div");
    div.className = `log-line ${type}`;
    const time = new Date().toLocaleTimeString();
    div.textContent = `[${time}] ${msg}`;
    logs.appendChild(div);
    logs.scrollTop = logs.scrollHeight;
}
