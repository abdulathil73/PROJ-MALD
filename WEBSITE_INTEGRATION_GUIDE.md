# Voice AI Invoice Agent - Website Integration Guide

This guide details how to integrate the **Deepgram Speech-to-Text (STT)** and **Gemini CrewAI Invoice Agent** into your existing website or enterprise web application.

---

## System Architecture Overview

```
 ┌────────────────┐      Audio Blob       ┌────────────────────────┐
 │ User Voice     │ ────────────────────► │  Deepgram STT API      │
 │ Microphone / UI│                       │  (Nova-2 Model)        │
 └────────────────┘                       └───────────┬────────────┘
                                                      │ Spoken Transcript
                                                      ▼
 ┌────────────────┐   Save & Stock Update ┌────────────────────────┐
 │ Human Approval │ ◄──────────────────── │  CrewAI Agent System   │
 │ & Edit Window  │   Draft Invoice JSON  │  - find_product        │
 └────────────────┘                       │  - find_party          │
                                          │  - check_stock         │
                                          │  - create_invoice      │
                                          └────────────────────────┘
```

---

## 1. Setup & Environment Variables

Make sure the following keys are set in your `.env` file:

```env
# Deepgram Speech-To-Text Key
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# Google Gemini LLM Key for CrewAI
GEMINI_API_KEY=your_gemini_api_key_here
# or
GOOGLE_API_KEY=your_google_api_key_here
```

---

## 2. API Endpoints Reference

### A. Transcribe Audio (`POST /api/transcribe`)
- **Content-Type**: `multipart/form-data`
- **Body**: `file` (audio file blob: `.webm`, `.wav`, `.mp3`)
- **Response**:
```json
{
  "status": "SUCCESS",
  "transcript": "Sell 2 units of MacBook Pro 16 M3 Max to Oceanic Breeze Resort",
  "confidence": 0.98
}
```

### B. Process Voice to Invoice (`POST /api/process-invoice`)
- **Content-Type**: `application/json`
- **Body**: `{ "transcript": "Sell 2 units of MacBook Pro 16 M3 Max to Oceanic Breeze Resort" }`
- **Response**:
```json
{
  "status": "SUCCESS",
  "engine": "CrewAI (Gemini LLM)",
  "draft": {
    "id": "INV-A1B2C3D4",
    "invoice_number": "INV-2026-0001",
    "doc_type": "SALES_INVOICE",
    "party_name": "Oceanic Breeze Resort",
    "party_gstin": "33AAACO1234A1Z1",
    "state_type": "INTRA_STATE",
    "subtotal": 500000.0,
    "cgst": 45000.0,
    "sgst": 45000.0,
    "igst": 0.0,
    "total_tax": 90000.0,
    "total_amount": 590000.0,
    "status": "DRAFT_PENDING_CONFIRMATION",
    "items": [
      {
        "product_id": "PRD-101",
        "product_name": "MacBook Pro 16 M3 Max",
        "quantity": 2,
        "unit_price": 250000.0,
        "line_amount": 500000.0,
        "gst_rate": 18.0,
        "tax_amount": 90000.0,
        "total_line_amount": 590000.0
      }
    ],
    "warnings": []
  }
}
```

### C. Human Confirmation (`POST /api/confirm-invoice`)
- **Content-Type**: `application/json`
- **Body**:
```json
{
  "invoice_id": "INV-A1B2C3D4",
  "action": "CONFIRM"
}
```
- **Effect**: Updates status to `CONFIRMED` and automatically adjusts inventory stock in database (Sales reduces stock, Purchase increases stock).

---

## 3. Integration Code Examples

### A. React / Next.js Integration Component

```tsx
import React, { useState } from 'react';

export function VoiceInvoiceWidget() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);

  const startVoiceRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      setLoading(true);
      // 1. Transcribe with Deepgram
      const sttRes = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const sttData = await sttRes.json();
      setTranscript(sttData.transcript);

      // 2. Process with CrewAI Agent
      const invRes = await fetch('/api/process-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: sttData.transcript })
      });
      const invData = await invRes.json();
      setDraft(invData.draft);
      setLoading(false);
    };

    mediaRecorder.start();
    setRecording(true);
    setTimeout(() => {
      mediaRecorder.stop();
      setRecording(false);
    }, 5000); // 5 second voice snippet
  };

  const confirmInvoice = async () => {
    if (!draft) return;
    await fetch('/api/confirm-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: draft.id, action: 'CONFIRM' })
    });
    alert('Invoice Confirmed & Stock Deducted!');
    setDraft(null);
  };

  return (
    <div className="voice-invoice-container">
      <button onClick={startVoiceRecording} disabled={loading}>
        {recording ? 'Recording Voice...' : 'Speak Invoice Command'}
      </button>

      {transcript && <p><strong>Transcript:</strong> {transcript}</p>}

      {draft && (
        <div className="draft-preview-modal">
          <h3>Draft {draft.doc_type} ({draft.invoice_number})</h3>
          <p>Party: {draft.party_name}</p>
          <p>Total: ₹ {draft.total_amount}</p>
          <button onClick={confirmInvoice}>Confirm & Save</button>
        </div>
      )}
    </div>
  );
}
```

---

## 4. Business Validation & Calculation Rules

1. **Intrastate vs Interstate Tax**:
   - If Party State == Business State: Intrastate (CGST = Tax / 2, SGST = Tax / 2, IGST = 0).
   - If Party State != Business State: Interstate (IGST = Tax, CGST = 0, SGST = 0).
2. **Sales vs Purchase Detection**:
   - Keywords like `sell`, `sold`, `invoice` flag `SALES_INVOICE`.
   - Keywords like `purchase`, `bought`, `buy`, `supplier` flag `PURCHASE_BILL`.
3. **Inventory Stock Validation**:
   - Checks `stock_quantity` before finalizing sales invoices and issues stock warnings if quantity is insufficient or low.
