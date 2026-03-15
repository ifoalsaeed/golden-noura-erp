from sqlalchemy.orm import Session
from db.database import SessionLocal
# Import all models to ensure they are registered with SQLAlchemy
from db.models import Account
import db.payroll_models 
from services.accounting_service import AccountingService

def seed_accounts():
    db = SessionLocal()
    service = AccountingService(db)

    # Standard Chart of Accounts for Manpower Rental Company
    accounts = [
        # Assets (1000-1999)
        {"code": "1010", "name": "Cash on Hand", "type": "ASSET"},
        {"code": "1020", "name": "Bank Al-Rajhi", "type": "ASSET"},
        {"code": "1100", "name": "Accounts Receivable", "type": "ASSET"},
        {"code": "1200", "name": "Prepaid Expenses", "type": "ASSET"},
        
        # Liabilities (2000-2999)
        {"code": "2010", "name": "Accounts Payable", "type": "LIABILITY"},
        {"code": "2100", "name": "Salaries Payable", "type": "LIABILITY"},
        {"code": "2110", "name": "GOSI Payable", "type": "LIABILITY"},
        {"code": "2120", "name": "VAT Payable", "type": "LIABILITY"},
        
        # Equity (3000-3999)
        {"code": "3010", "name": "Capital", "type": "EQUITY"},
        {"code": "3020", "name": "Retained Earnings", "type": "EQUITY"},
        
        # Revenue (4000-4999)
        {"code": "4010", "name": "Manpower Rental Revenue", "type": "REVENUE"},
        {"code": "4020", "name": "Recruitment Revenue", "type": "REVENUE"},
        
        # Expenses (5000-5999)
        {"code": "5010", "name": "Salaries Expense", "type": "EXPENSE"},
        {"code": "5020", "name": "Housing Allowance Expense", "type": "EXPENSE"},
        {"code": "5030", "name": "Transportation Allowance Expense", "type": "EXPENSE"},
        {"code": "5040", "name": "GOSI Expense (Company Share)", "type": "EXPENSE"},
        {"code": "5050", "name": "Visa & Government Fees", "type": "EXPENSE"},
        {"code": "5060", "name": "Office Rent", "type": "EXPENSE"},
        {"code": "5070", "name": "Utilities", "type": "EXPENSE"},
        {"code": "5080", "name": "Marketing Expense", "type": "EXPENSE"},
        {"code": "5090", "name": "General & Admin Expenses", "type": "EXPENSE"},
    ]

    print("Seeding Chart of Accounts...")
    for acc in accounts:
        existing = db.query(Account).filter(Account.code == acc["code"]).first()
        if not existing:
            new_acc = Account(
                code=acc["code"],
                name=acc["name"],
                account_type=acc["type"]
            )
            db.add(new_acc)
            print(f"Created account: {acc['code']} - {acc['name']}")
        else:
            print(f"Account exists: {acc['code']} - {acc['name']}")
    
    db.commit()
    db.close()
    print("Seeding complete.")

if __name__ == "__main__":
    seed_accounts()
