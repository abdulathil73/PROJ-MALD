"""
CrewAI Tools for Invoice Generation System.
Implements:
- find_product
- find_customer_or_supplier
- check_stock
- create_invoice
"""

import json
from typing import Type, Optional, List, Dict, Any
from pydantic import BaseModel, Field
from crewai.tools import BaseTool

from maldives_project.db import (
    search_products,
    get_product_by_id,
    search_parties,
    save_invoice_draft,
    get_all_products
)

# ----------------------------------------------------
# 1. find_product Tool
# ----------------------------------------------------
class FindProductInput(BaseModel):
    query: str = Field(..., description="Product name, category, or keyword to search in catalog.")

class FindProductTool(BaseTool):
    name: str = "find_product"
    description: str = (
        "Search the product catalog by keyword or name. "
        "Returns matched products with id, name, category, unit_price, gst_rate, and stock_quantity."
    )
    args_schema: Type[BaseModel] = FindProductInput

    def _run(self, query: str) -> str:
        results = search_products(query)
        if not results:
            # Fallback fuzzy attempt: list all product names to help LLM match
            all_prods = get_all_products()
            summary = [{"id": p["id"], "name": p["name"], "unit_price": p["unit_price"]} for p in all_prods]
            return json.dumps({
                "status": "NOT_FOUND",
                "message": f"No product matched query '{query}'.",
                "available_catalog_summary": summary
            }, indent=2)
        return json.dumps({"status": "SUCCESS", "matches": results}, indent=2)


# ----------------------------------------------------
# 2. find_customer_or_supplier Tool
# ----------------------------------------------------
class FindCustomerOrSupplierInput(BaseModel):
    query: str = Field(..., description="Customer or Supplier name, company name, or keyword.")
    party_type: Optional[str] = Field(None, description="Filter by 'customer' for sales invoice or 'supplier' for purchase bill.")

class FindCustomerOrSupplierTool(BaseTool):
    name: str = "find_customer_or_supplier"
    description: str = (
        "Find customer or supplier details from party registry. "
        "Returns matched party with id, name, type (customer/supplier), gstin, and state."
    )
    args_schema: Type[BaseModel] = FindCustomerOrSupplierInput

    def _run(self, query: str, party_type: Optional[str] = None) -> str:
        results = search_parties(query, party_type=party_type)
        if not results and party_type:
            # Try searching without party_type constraint
            results = search_parties(query)

        if not results:
            # Default fallback customer/supplier if exact match not found
            default_state = "Tamil Nadu" # Business Home State
            fallback_party = {
                "id": "CUST-WALKIN" if party_type == "customer" else "SUPP-GENERAL",
                "name": query if query.strip() else ("Walk-in Customer" if party_type == "customer" else "General Supplier"),
                "type": party_type or "customer",
                "gstin": "",
                "state": default_state,
                "note": "Unregistered / new party auto-assigned."
            }
            return json.dumps({
                "status": "FALLBACK",
                "message": f"Exact party match for '{query}' not found. Using fallback party configuration.",
                "party": fallback_party
            }, indent=2)
        
        return json.dumps({"status": "SUCCESS", "matches": results}, indent=2)


# ----------------------------------------------------
# 3. check_stock Tool
# ----------------------------------------------------
class CheckStockInput(BaseModel):
    product_id: str = Field(..., description="The ID of the product (e.g. PRD-101).")
    required_quantity: int = Field(..., description="The quantity required for the order.")

class CheckStockTool(BaseTool):
    name: str = "check_stock"
    description: str = (
        "Checks available inventory stock for a product ID and requested quantity. "
        "Returns whether stock is sufficient, available stock quantity, and warnings if stock is low or exceeded."
    )
    args_schema: Type[BaseModel] = CheckStockInput

    def _run(self, product_id: str, required_quantity: int) -> str:
        product = get_product_by_id(product_id)
        if not product:
            return json.dumps({"status": "ERROR", "message": f"Product ID {product_id} not found."}, indent=2)
        
        current_stock = product["stock_quantity"]
        is_sufficient = current_stock >= required_quantity
        
        warning = None
        if not is_sufficient:
            warning = f"STOCK OUT WARNING: Requested {required_quantity} units of '{product['name']}', but only {current_stock} units available in stock!"
        elif current_stock - required_quantity <= 5:
            warning = f"LOW STOCK WARNING: Stock for '{product['name']}' will drop to {current_stock - required_quantity} units after this order."

        return json.dumps({
            "status": "SUCCESS",
            "product_id": product_id,
            "product_name": product["name"],
            "requested_quantity": required_quantity,
            "current_stock": current_stock,
            "is_sufficient": is_sufficient,
            "warning": warning
        }, indent=2)


# ----------------------------------------------------
# 4. create_invoice Tool
# ----------------------------------------------------
class InvoiceItemInput(BaseModel):
    product_id: str = Field(..., description="ID of the product (e.g. PRD-101)")
    product_name: str = Field(..., description="Name of the product")
    quantity: int = Field(..., description="Quantity ordered")
    unit_price: float = Field(..., description="Price per unit before tax")
    gst_rate: float = Field(..., description="GST rate percentage (e.g. 18.0 or 5.0)")

class CreateInvoiceInput(BaseModel):
    doc_type: str = Field(..., description="'SALES_INVOICE' or 'PURCHASE_BILL'")
    party_name: str = Field(..., description="Name of Customer or Supplier")
    party_id: Optional[str] = Field("", description="ID of Customer or Supplier")
    party_gstin: Optional[str] = Field("", description="GSTIN of party if available")
    party_state: str = Field("Tamil Nadu", description="State of the party (used for Intrastate vs Interstate GST)")
    business_state: str = Field("Tamil Nadu", description="Your business location state for GST determination")
    items: List[InvoiceItemInput] = Field(..., description="List of line items")
    transcription: Optional[str] = Field("", description="Original voice transcription text")

class CreateInvoiceTool(BaseTool):
    name: str = "create_invoice"
    description: str = (
        "Calculates complete taxes (CGST + SGST for intrastate, IGST for interstate), "
        "validates totals, and generates a structured draft invoice or purchase bill saved to DB."
    )
    args_schema: Type[BaseModel] = CreateInvoiceInput

    def _run(
        self,
        doc_type: str,
        party_name: str,
        items: List[Dict[str, Any]],
        party_id: str = "",
        party_gstin: str = "",
        party_state: str = "Tamil Nadu",
        business_state: str = "Tamil Nadu",
        transcription: str = ""
    ) -> str:
        # Determine Intra-state vs Inter-state GST
        is_intrastate = (party_state.strip().lower() == business_state.strip().lower())
        state_type = "INTRA_STATE" if is_intrastate else "INTER_STATE"

        subtotal = 0.0
        total_cgst = 0.0
        total_sgst = 0.0
        total_igst = 0.0
        processed_items = []
        warnings = []

        for item in items:
            if isinstance(item, dict):
                p_id = item.get("product_id", "")
                p_name = item.get("product_name", "Item")
                qty = int(item.get("quantity", 1))
                rate = float(item.get("unit_price", 0.0))
                gst_pct = float(item.get("gst_rate", 18.0))
            else:
                p_id = item.product_id
                p_name = item.product_name
                qty = item.quantity
                rate = item.unit_price
                gst_pct = item.gst_rate

            # Check stock warning if Sales Invoice
            if doc_type == "SALES_INVOICE" and p_id:
                p = get_product_by_id(p_id)
                if p:
                    if p["stock_quantity"] < qty:
                        warnings.append(f"Stock deficit for '{p_name}': requested {qty}, stock has {p['stock_quantity']}.")

            line_amount = round(qty * rate, 2)
            subtotal += line_amount

            line_tax = round((line_amount * gst_pct) / 100.0, 2)
            if is_intrastate:
                line_cgst = round(line_tax / 2.0, 2)
                line_sgst = round(line_tax / 2.0, 2)
                line_igst = 0.0
            else:
                line_cgst = 0.0
                line_sgst = 0.0
                line_igst = line_tax

            total_cgst += line_cgst
            total_sgst += line_sgst
            total_igst += line_igst

            processed_items.append({
                "product_id": p_id,
                "product_name": p_name,
                "quantity": qty,
                "unit_price": rate,
                "line_amount": line_amount,
                "gst_rate": gst_pct,
                "tax_amount": line_tax,
                "cgst": line_cgst,
                "sgst": line_sgst,
                "igst": line_igst,
                "total_line_amount": round(line_amount + line_tax, 2)
            })

        total_tax = round(total_cgst + total_sgst + total_igst, 2)
        subtotal = round(subtotal, 2)
        total_amount = round(subtotal + total_tax, 2)

        draft_payload = {
            "doc_type": doc_type,
            "party_name": party_name,
            "party_id": party_id,
            "party_gstin": party_gstin,
            "state_type": state_type,
            "subtotal": subtotal,
            "cgst": round(total_cgst, 2),
            "sgst": round(total_sgst, 2),
            "igst": round(total_igst, 2),
            "total_tax": total_tax,
            "total_amount": total_amount,
            "status": "DRAFT_PENDING_CONFIRMATION",
            "items": processed_items,
            "transcription": transcription,
            "warnings": warnings
        }

        saved_draft = save_invoice_draft(draft_payload)
        return json.dumps({
            "status": "SUCCESS",
            "message": f"Draft {doc_type} successfully generated and saved with ID {saved_draft['id']}.",
            "draft_invoice": saved_draft
        }, indent=2)
