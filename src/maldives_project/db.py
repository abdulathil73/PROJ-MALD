"""
Database and Inventory Management Module for Voice-to-Invoice System.
Uses SQLite for persistent catalog, parties, stock, and generated invoices.
"""

import sqlite3
import json
import os
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "invoice_system.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Products Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        unit_price REAL NOT NULL,
        gst_rate REAL NOT NULL,
        stock_quantity INTEGER NOT NULL,
        unit TEXT DEFAULT 'pcs'
    )
    """)

    # Customers and Suppliers Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS parties (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL, -- 'customer' or 'supplier'
        gstin TEXT,
        state TEXT NOT NULL,
        email TEXT,
        phone TEXT
    )
    """)

    # Invoices & Bills Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        doc_type TEXT NOT NULL, -- 'SALES_INVOICE' or 'PURCHASE_BILL'
        party_name TEXT NOT NULL,
        party_id TEXT,
        party_gstin TEXT,
        state_type TEXT NOT NULL, -- 'INTRA_STATE' or 'INTER_STATE'
        subtotal REAL NOT NULL,
        cgst REAL DEFAULT 0,
        sgst REAL DEFAULT 0,
        igst REAL DEFAULT 0,
        total_tax REAL NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL, -- 'DRAFT_PENDING_CONFIRMATION', 'CONFIRMED', 'REJECTED'
        items_json TEXT NOT NULL,
        transcription TEXT,
        warnings_json TEXT,
        created_at TEXT NOT NULL
    )
    """)

    conn.commit()

    # Seed Initial Data if empty
    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] == 0:
        seed_data(cursor)
        conn.commit()

    conn.close()

def seed_data(cursor):
    # Default Products
    products = [
        ("PRD-101", "MacBook Pro 16 M3 Max", "Electronics", 250000.0, 18.0, 15, "pcs"),
        ("PRD-102", "Dell UltraSharp 27 Monitor", "Electronics", 45000.0, 18.0, 30, "pcs"),
        ("PRD-103", "Ergonomic Office Chair", "Furniture", 15000.0, 18.0, 20, "pcs"),
        ("PRD-104", "Wireless Mechanical Keyboard", "Accessories", 6500.0, 18.0, 50, "pcs"),
        ("PRD-105", "Logitech MX Master 3S Mouse", "Accessories", 8500.0, 18.0, 45, "pcs"),
        ("PRD-106", "Premium Coffee Beans 1kg", "Groceries", 1200.0, 5.0, 100, "bags"),
        ("PRD-107", "Organic Maldivian Tea Box", "Groceries", 450.0, 5.0, 200, "boxes"),
        ("PRD-108", "A4 Copier Paper Bundle (5 Rims)", "Office Supplies", 1500.0, 12.0, 80, "bundles"),
        ("PRD-109", "Resort Beach Towel Set", "Hospitality", 2200.0, 12.0, 150, "sets"),
        ("PRD-110", "Solar Powered Garden Lights", "Hardware", 3500.0, 12.0, 8, "pcs"), # Low stock item
    ]
    cursor.executemany("INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?)", products)

    # Default Customers & Suppliers
    parties = [
        # Customers (Sales)
        ("CUST-001", "Oceanic Breeze Resort", "customer", "33AAACO1234A1Z1", "Tamil Nadu", "purchasing@oceanicbreeze.com", "+91 98765 43210"),
        ("CUST-002", "Island Tech Solutions", "customer", "29BBBIS5678B1Z2", "Karnataka", "accounts@islandtech.io", "+91 98765 43211"),
        ("CUST-003", "Maldives Marine Adventures", "customer", "33CCCCM9012C1Z3", "Tamil Nadu", "info@maldivesmarine.com", "+91 98765 43212"),
        ("CUST-004", "Walk-in Retail Customer", "customer", "", "Tamil Nadu", "cash@retail.com", ""),
        
        # Suppliers (Purchases)
        ("SUPP-001", "Global Tech Imports Ltd", "supplier", "27DDDDG3456D1Z4", "Maharashtra", "sales@globaltechimports.com", "+91 98765 43213"),
        ("SUPP-002", "Sunrise Paper & Stationers", "supplier", "33EEESS7890E1Z5", "Tamil Nadu", "orders@sunrisepaper.com", "+91 98765 43214"),
        ("SUPP-003", "Coral Wholesale Supplies", "supplier", "33FFFFC1234F1Z6", "Tamil Nadu", "supply@coralwholesale.com", "+91 98765 43215"),
    ]
    cursor.executemany("INSERT INTO parties VALUES (?, ?, ?, ?, ?, ?, ?)", parties)

# Product Queries
def search_products(query: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    q = f"%{query.strip()}%"
    cursor.execute("SELECT * FROM products WHERE name LIKE ? OR category LIKE ? OR id LIKE ?", (q, q, q))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_product_by_id(product_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_all_products() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products ORDER BY name ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# Party Queries
def search_parties(query: str, party_type: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    q = f"%{query.strip()}%"
    if party_type:
        cursor.execute("SELECT * FROM parties WHERE (name LIKE ? OR gstin LIKE ? OR id LIKE ?) AND type = ?", (q, q, q, party_type))
    else:
        cursor.execute("SELECT * FROM parties WHERE name LIKE ? OR gstin LIKE ? OR id LIKE ?", (q, q, q))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_all_parties() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM parties ORDER BY name ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# Stock Management
def update_stock(product_id: str, delta_qty: int) -> bool:
    """Positive delta adds stock (purchases), negative delta reduces stock (sales)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT stock_quantity FROM products WHERE id = ?", (product_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return False
    
    new_qty = row["stock_quantity"] + delta_qty
    if new_qty < 0:
        conn.close()
        return False
    
    cursor.execute("UPDATE products SET stock_quantity = ? WHERE id = ?", (new_qty, product_id))
    conn.commit()
    conn.close()
    return True

# Invoice DB Operations
def save_invoice_draft(invoice_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()

    inv_id = invoice_data.get("id") or f"INV-{uuid.uuid4().hex[:8].upper()}"
    inv_num = invoice_data.get("invoice_number") or f"INV-2026-{(cursor.execute('SELECT COUNT(*) FROM invoices').fetchone()[0] + 1):04d}"
    now_str = datetime.now().isoformat()

    items_json = json.dumps(invoice_data.get("items", []))
    warnings_json = json.dumps(invoice_data.get("warnings", []))

    cursor.execute("""
    INSERT OR REPLACE INTO invoices (
        id, invoice_number, doc_type, party_name, party_id, party_gstin, state_type,
        subtotal, cgst, sgst, igst, total_tax, total_amount, status, items_json, transcription, warnings_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        inv_id,
        inv_num,
        invoice_data.get("doc_type", "SALES_INVOICE"),
        invoice_data.get("party_name", "Walk-in Retail Customer"),
        invoice_data.get("party_id", ""),
        invoice_data.get("party_gstin", ""),
        invoice_data.get("state_type", "INTRA_STATE"),
        invoice_data.get("subtotal", 0.0),
        invoice_data.get("cgst", 0.0),
        invoice_data.get("sgst", 0.0),
        invoice_data.get("igst", 0.0),
        invoice_data.get("total_tax", 0.0),
        invoice_data.get("total_amount", 0.0),
        invoice_data.get("status", "DRAFT_PENDING_CONFIRMATION"),
        items_json,
        invoice_data.get("transcription", ""),
        warnings_json,
        now_str
    ))
    conn.commit()
    conn.close()

    invoice_data["id"] = inv_id
    invoice_data["invoice_number"] = inv_num
    invoice_data["created_at"] = now_str
    return invoice_data

def update_invoice_status(invoice_id: str, new_status: str, items_to_update_stock: bool = True) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    inv = dict(row)
    old_status = inv["status"]

    # If confirming invoice for first time, adjust stock
    if new_status == "CONFIRMED" and old_status != "CONFIRMED" and items_to_update_stock:
        items = json.loads(inv["items_json"])
        doc_type = inv["doc_type"]
        for item in items:
            p_id = item.get("product_id")
            qty = item.get("quantity", 0)
            if p_id:
                # Sales reduces stock (-), Purchase increases stock (+)
                delta = -qty if doc_type == "SALES_INVOICE" else qty
                update_stock(p_id, delta)

    cursor.execute("UPDATE invoices SET status = ? WHERE id = ?", (new_status, invoice_id))
    conn.commit()
    conn.close()
    inv["status"] = new_status
    inv["items"] = json.loads(inv["items_json"])
    inv["warnings"] = json.loads(inv["warnings_json"])
    return inv

def get_all_invoices() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM invoices ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["items"] = json.loads(d["items_json"])
        d["warnings"] = json.loads(d["warnings_json"])
        result.append(d)
    return result

# Auto-initialize DB on import
init_db()
