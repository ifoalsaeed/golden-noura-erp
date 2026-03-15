
import sqlite3
from datetime import datetime

def migrate_db():
    print("Starting migration...")
    conn = sqlite3.connect('sql_app.db')
    cursor = conn.cursor()
    
    # 1. Create INVOICES table
    print("Creating invoices table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number VARCHAR UNIQUE,
        client_id INTEGER,
        contract_id INTEGER,
        issue_date DATE,
        due_date DATE,
        amount NUMERIC(15, 2),
        tax_amount NUMERIC(15, 2),
        total_amount NUMERIC(15, 2),
        status VARCHAR,
        notes TEXT,
        created_at DATETIME,
        FOREIGN KEY(client_id) REFERENCES clients(id),
        FOREIGN KEY(contract_id) REFERENCES contracts(id)
    )
    """)
    
    # 2. Create PAYROLL_PERIODS table
    print("Creating payroll_periods table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS payroll_periods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        status VARCHAR,
        total_employees INTEGER DEFAULT 0,
        total_payroll_cost NUMERIC(15, 2) DEFAULT 0.0,
        created_at DATETIME,
        calculated_at DATETIME,
        approved_at DATETIME,
        locked_at DATETIME
    )
    """)
    
    # 3. Alter CONTRACTS table
    print("Altering contracts table...")
    try:
        cursor.execute("ALTER TABLE contracts ADD COLUMN contract_file_url VARCHAR")
    except sqlite3.OperationalError: pass # Column likely exists
    
    try:
        cursor.execute("ALTER TABLE contracts ADD COLUMN terms_and_conditions TEXT")
    except sqlite3.OperationalError: pass

    try:
        cursor.execute("ALTER TABLE contracts ADD COLUMN created_at DATETIME")
    except sqlite3.OperationalError: pass
    
    try:
        cursor.execute("ALTER TABLE contracts ADD COLUMN updated_at DATETIME")
    except sqlite3.OperationalError: pass

    # 4. Alter PAYROLLS table
    print("Altering payrolls table...")
    try:
        cursor.execute("ALTER TABLE payrolls ADD COLUMN period_id INTEGER REFERENCES payroll_periods(id)")
    except sqlite3.OperationalError: pass
    
    try:
        cursor.execute("ALTER TABLE payrolls ADD COLUMN status VARCHAR DEFAULT 'DRAFT'")
    except sqlite3.OperationalError: pass
    
    try:
        cursor.execute("ALTER TABLE payrolls ADD COLUMN payment_date DATE")
    except sqlite3.OperationalError: pass
    
    try:
        cursor.execute("ALTER TABLE payrolls ADD COLUMN payment_method VARCHAR")
    except sqlite3.OperationalError: pass
    
    try:
        cursor.execute("ALTER TABLE payrolls ADD COLUMN transaction_reference VARCHAR")
    except sqlite3.OperationalError: pass
    
    try:
        cursor.execute("ALTER TABLE payrolls ADD COLUMN notes TEXT")
    except sqlite3.OperationalError: pass

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate_db()
