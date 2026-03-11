from sqlalchemy.orm import Session
from db.database import engine, Base, SessionLocal
from db.models import Account, JournalEntry
from datetime import date

def seed_accounting():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if accounts exist
    if db.query(Account).count() > 0:
        db.close()
        return

    # Create basic Chart of Accounts
    accounts = [
        # Assets
        Account(code="1001", name="Main Cash", account_type="ASSET", balance=0),
        Account(code="1002", name="Al Rajhi Bank", account_type="ASSET", balance=0),
        Account(code="1100", name="Accounts Receivable", account_type="ASSET", balance=0),
        
        # Liabilities
        Account(code="2000", name="Accounts Payable", account_type="LIABILITY", balance=0),
        Account(code="2100", name="Accrued Salaries", account_type="LIABILITY", balance=0),
        
        # Equity
        Account(code="3000", name="Capital", account_type="EQUITY", balance=0),
        Account(code="3100", name="Retained Earnings", account_type="EQUITY", balance=0),
        
        # Revenue
        Account(code="4000", name="Service Revenue", account_type="REVENUE", balance=0),
        
        # Expenses
        Account(code="5000", name="Salaries Expense", account_type="EXPENSE", balance=0),
        Account(code="5100", name="Housing Expense", account_type="EXPENSE", balance=0),
        Account(code="5200", name="Transport Expense", account_type="EXPENSE", balance=0),
    ]
    
    db.add_all(accounts)
    db.commit()
    
    # Add some initial transactions
    # 1. Opening balance: Bank 1,000,000 vs Capital 1,000,000
    bank = db.query(Account).filter(Account.code == "1002").first()
    capital = db.query(Account).filter(Account.code == "3000").first()
    
    db.add(JournalEntry(date=date(2026, 1, 1), description="Initial Capital Investment", account_id=bank.id, debit=1000000, credit=0))
    db.add(JournalEntry(date=date(2026, 1, 1), description="Initial Capital Investment", account_id=capital.id, debit=0, credit=1000000))
    
    # 2. Revenue: Accounts Receivable 50,000 vs Service Revenue 50,000
    ar = db.query(Account).filter(Account.code == "1100").first()
    rev = db.query(Account).filter(Account.code == "4000").first()
    db.add(JournalEntry(date=date(2026, 3, 1), description="Monthly Service Invoice", account_id=ar.id, debit=50000, credit=0))
    db.add(JournalEntry(date=date(2026, 3, 1), description="Monthly Service Invoice", account_id=rev.id, debit=0, credit=50000))
    
    # 3. Expense: Salaries Expense 20,000 vs Accrued Salaries 20,000
    sal_exp = db.query(Account).filter(Account.code == "5000").first()
    acc_sal = db.query(Account).filter(Account.code == "2100").first()
    db.add(JournalEntry(date=date(2026, 3, 5), description="March Salaries Accrual", account_id=sal_exp.id, debit=20000, credit=0))
    db.add(JournalEntry(date=date(2026, 3, 5), description="March Salaries Accrual", account_id=acc_sal.id, debit=0, credit=20000))

    db.commit()
    db.close()
    print("Accounting seed completed.")

if __name__ == "__main__":
    seed_accounting()
