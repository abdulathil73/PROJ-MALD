"""
FastAPI Server for Voice-to-Invoice System with Deepgram and CrewAI.
"""

import os
from typing import Dict, Any, Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from maldives_project.stt import transcribe_audio_bytes, get_preset_transcripts
from maldives_project.crew import process_voice_to_invoice
from maldives_project.db import (
    get_all_products,
    get_all_parties,
    get_all_invoices,
    save_invoice_draft,
    update_invoice_status
)

app = FastAPI(
    title="Voice-to-Text CrewAI Invoice Agent Platform",
    version="1.0.0",
    description="Deepgram Speech Recognition + Gemini CrewAI Agents for Invoice/Bill Generation"
)

# Static files directory
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

class ProcessInvoiceRequest(BaseModel):
    transcript: str

class ConfirmInvoiceRequest(BaseModel):
    invoice_id: str
    action: str  # "CONFIRM" or "REJECT"
    modified_invoice: Optional[Dict[str, Any]] = None

@app.post("/api/transcribe")
async def api_transcribe(file: UploadFile = File(...)):
    """Transcribe uploaded audio file using Deepgram STT."""
    try:
        content = await file.read()
        content_type = file.content_type or "audio/webm"
        result = transcribe_audio_bytes(content, content_type=content_type)
        return JSONResponse(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/process-invoice")
async def api_process_invoice(req: ProcessInvoiceRequest):
    """Process transcript using CrewAI Agent system to generate Invoice Draft."""
    if not req.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty.")
    
    result = process_voice_to_invoice(req.transcript)
    return JSONResponse(result)

@app.post("/api/confirm-invoice")
async def api_confirm_invoice(req: ConfirmInvoiceRequest):
    """
    Human-in-the-Loop Confirmation Endpoint.
    Saves modified invoice parameters and updates stock inventory on confirmation.
    """
    if req.modified_invoice:
        # Save any user visual edits before status transition
        saved_inv = save_invoice_draft(req.modified_invoice)
        inv_id = saved_inv["id"]
    else:
        inv_id = req.invoice_id

    new_status = "CONFIRMED" if req.action.upper() == "CONFIRM" else "REJECTED"
    updated = update_invoice_status(inv_id, new_status, items_to_update_stock=True)

    if not updated:
        raise HTTPException(status_code=404, detail="Invoice ID not found.")

    return JSONResponse({
        "status": "SUCCESS",
        "action": req.action,
        "invoice": updated
    })

@app.get("/api/products")
async def api_get_products():
    """Retrieve product catalog and stock levels."""
    return JSONResponse(get_all_products())

@app.get("/api/parties")
async def api_get_parties():
    """Retrieve customers and suppliers registry."""
    return JSONResponse(get_all_parties())

@app.get("/api/invoices")
async def api_get_invoices():
    """Retrieve invoice history."""
    return JSONResponse(get_all_invoices())

@app.get("/api/preset-transcripts")
async def api_preset_transcripts():
    """Retrieve sample audio transcript presets for demo testing."""
    return JSONResponse(get_preset_transcripts())

# Serve index.html
@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h1>Voice Invoice Agent API Running</h1>")

# Mount Static Files
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
