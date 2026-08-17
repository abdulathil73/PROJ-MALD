"""
Automated Test Suite for Voice AI Invoice & Bill System.
Tests:
1. DB Initialization & Catalog Seeding
2. CrewAI Tools (find_product, find_customer_or_supplier, check_stock, create_invoice)
3. Intrastate vs Interstate Tax Calculations
4. Voice Command Processing (Sales Invoice vs Purchase Bill)
5. Stock Inventory Update on Human Confirmation
"""

import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from maldives_project.db import (
    get_all_products,
    get_all_parties,
    get_product_by_id,
    get_all_invoices
)
from maldives_project.tools import (
    FindProductTool,
    FindCustomerOrSupplierTool,
    CheckStockTool,
    CreateInvoiceTool
)
from maldives_project.crew import process_voice_to_invoice
from maldives_project.db import update_invoice_status

def run_tests():
    print("==================================================")
    print("   RUNNING VOICE INVOICE SYSTEM VERIFICATION     ")
    print("==================================================")

    # 1. Verify Catalog Seeding
    products = get_all_products()
    parties = get_all_parties()
    print(f"[TEST 1] DB Catalog loaded: {len(products)} products, {len(parties)} parties.")
    assert len(products) > 0, "Products catalog is empty!"
    assert len(parties) > 0, "Parties directory is empty!"
    print("  -> PASSED.")

    # 2. Test find_product Tool
    find_prod = FindProductTool()
    prod_res = find_prod._run("MacBook")
    print(f"[TEST 2] find_product tool query 'MacBook':")
    print(f"         Output: {prod_res[:120]}...")
    assert "PRD-101" in prod_res, "find_product tool failed to find MacBook Pro!"
    print("  -> PASSED.")

    # 3. Test find_customer_or_supplier Tool
    find_party = FindCustomerOrSupplierTool()
    party_res = find_party._run("Oceanic Breeze", party_type="customer")
    print(f"[TEST 3] find_customer_or_supplier tool query 'Oceanic Breeze':")
    print(f"         Output: {party_res[:120]}...")
    assert "Oceanic Breeze Resort" in party_res, "find_party tool failed!"
    print("  -> PASSED.")

    # 4. Test check_stock Tool
    check_stock = CheckStockTool()
    stock_res = check_stock._run("PRD-101", 5)
    print(f"[TEST 4] check_stock tool query for 5 units PRD-101:")
    print(f"         Output: {stock_res}")
    assert "is_sufficient" in stock_res, "check_stock tool failed!"
    print("  -> PASSED.")

    # 5. Test create_invoice Tool & Tax Calculation (Intrastate vs Interstate)
    create_inv = CreateInvoiceTool()
    # Intrastate Test (Tamil Nadu -> Tamil Nadu)
    inv_intra = create_inv._run(
        doc_type="SALES_INVOICE",
        party_name="Oceanic Breeze Resort",
        party_id="CUST-001",
        party_state="Tamil Nadu",
        business_state="Tamil Nadu",
        items=[{
            "product_id": "PRD-101",
            "product_name": "MacBook Pro 16 M3 Max",
            "quantity": 2,
            "unit_price": 250000.0,
            "gst_rate": 18.0
        }],
        transcription="Sell 2 MacBooks to Oceanic Breeze"
    )
    print(f"[TEST 5A] Intrastate GST (CGST + SGST) Calculation:")
    print(f"          {inv_intra[:150]}...")
    assert "cgst" in inv_intra and "sgst" in inv_intra, "Intrastate GST calculation failed!"

    # Interstate Test (Karnataka -> Tamil Nadu)
    inv_inter = create_inv._run(
        doc_type="SALES_INVOICE",
        party_name="Island Tech Solutions",
        party_id="CUST-002",
        party_state="Karnataka",
        business_state="Tamil Nadu",
        items=[{
            "product_id": "PRD-102",
            "product_name": "Dell UltraSharp 27 Monitor",
            "quantity": 1,
            "unit_price": 45000.0,
            "gst_rate": 18.0
        }],
        transcription="Sell 1 monitor to Island Tech Solutions"
    )
    print(f"[TEST 5B] Interstate GST (IGST) Calculation:")
    print(f"          {inv_inter[:150]}...")
    assert "igst" in inv_inter, "Interstate IGST calculation failed!"
    print("  -> PASSED.")

    # 6. Test End-to-End Voice Processing Pipeline
    transcript_sales = "Sell 2 units of MacBook Pro 16 M3 Max to Oceanic Breeze Resort"
    res_sales = process_voice_to_invoice(transcript_sales)
    print(f"[TEST 6A] Voice to Sales Invoice Pipeline:")
    print(f"           Draft ID: {res_sales['draft']['id']}, Total: INR {res_sales['draft']['total_amount']}")
    assert res_sales["status"] == "SUCCESS", "Voice sales processing failed!"

    transcript_purchase = "Purchase bill from Global Tech Imports for 5 Dell UltraSharp 27 Monitors"
    res_purchase = process_voice_to_invoice(transcript_purchase)
    print(f"[TEST 6B] Voice to Purchase Bill Pipeline:")
    print(f"           Doc Type: {res_purchase['draft']['doc_type']}, Party: {res_purchase['draft']['party_name']}")
    assert res_purchase["draft"]["doc_type"] == "PURCHASE_BILL", "Purchase bill detection failed!"
    print("  -> PASSED.")

    # 7. Test Human Confirmation & Inventory Stock Update
    p_before = get_product_by_id("PRD-101")
    stock_before = p_before["stock_quantity"]
    
    # Confirm the sales draft generated in Test 6A (qty = 2)
    inv_to_confirm_id = res_sales["draft"]["id"]
    confirmed_inv = update_invoice_status(inv_to_confirm_id, "CONFIRMED", items_to_update_stock=True)

    p_after = get_product_by_id("PRD-101")
    stock_after = p_after["stock_quantity"]

    print(f"[TEST 7] Stock Deduction on Human Confirmation:")
    print(f"         Product PRD-101 Stock Before: {stock_before}, Stock After: {stock_after}")
    assert stock_before - stock_after == 2, f"Stock deduction failed! Expected {stock_before - 2}, got {stock_after}"
    print("  -> PASSED.")

    print("\n==================================================")
    print("   ALL TESTS PASSED SUCCESSFULLY (100% OPERATIONAL)")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
