
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import SessionLocal, engine, Base
from db.models import (
    Client, Contract, Worker, Payroll, Expense, 
    ExpenseCategory, ExpenseStatus, Invoice, InvoiceStatus,
    JournalEntry, Account, User
)
from services.payroll_service import PayrollCalculator
from services.accounting_service import AccountingService
from schemas.payroll_schemas import PayrollCreate, SalaryComponents, DeductionComponents, AttendanceData
from decimal import Decimal

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def cleanup(db: Session):
    print("Cleaning up test data...")
    from sqlalchemy import text
    db.execute(text("DELETE FROM allowances"))
    db.execute(text("DELETE FROM deductions"))
    db.execute(text("DELETE FROM journal_entries"))
    db.execute(text("DELETE FROM invoices"))
    db.execute(text("DELETE FROM payrolls"))
    db.execute(text("DELETE FROM payroll_periods"))
    db.execute(text("DELETE FROM expenses"))
    db.execute(text("DELETE FROM contracts"))
    db.execute(text("DELETE FROM workers"))
    db.execute(text("DELETE FROM clients"))
    db.commit()

def verify_accounting_flow():
    db = SessionLocal()
    cleanup(db)
    
    print("\n--- Starting Financial Flow Verification ---\n")

    # 0. Setup User
    print("0. Setting up User...")
    user = db.query(User).filter(User.username == "admin_test").first()
    if not user:
        user = User(username="admin_test", hashed_password="hashed_password", role="ADMIN")
        db.add(user)
        db.commit()
    print(f"   -> User ID: {user.id}")

    # 1. Setup Data
    print("1. Setting up Base Data (Client, Worker, Contract)...")
    client = Client(company_name="Test Client Co", contact_person="John Doe")
    db.add(client)
    
    worker = Worker(name="Test Worker", salary=5000.0, housing_cost=1000.0, transport_cost=500.0)
    db.add(worker)
    db.commit()
    
    contract = Contract(
        client_id=client.id, 
        worker_id=worker.id, 
        monthly_rental_price=8000.0, 
        start_date=date.today(),
        status="ACTIVE"
    )
    db.add(contract)
    db.commit()
    print(f"   -> Created Client ID: {client.id}, Worker ID: {worker.id}, Contract ID: {contract.id}")

    # 2. Invoice Generation (Revenue Recognition)
    print("\n2. Testing Invoice Generation (Revenue)...")
    # Simulate invoice creation logic
    inv_amount = contract.monthly_rental_price
    tax = inv_amount * 0.15
    total = inv_amount + tax
    
    invoice = Invoice(
        invoice_number=f"INV-TEST-{client.id}",
        client_id=client.id,
        contract_id=contract.id,
        issue_date=date.today(),
        due_date=date.today(),
        amount=inv_amount,
        tax_amount=tax,
        total_amount=total,
        status=InvoiceStatus.ISSUED
    )
    db.add(invoice)
    db.commit()
    
    # Manually trigger GL entry (simulating the API endpoint logic)
    acc_service = AccountingService(db)
    entries = [
        {"account_code": "1100", "debit": float(total), "credit": 0}, # AR
        {"account_code": "4010", "debit": 0, "credit": float(inv_amount)}, # Revenue
        {"account_code": "2120", "debit": 0, "credit": float(tax)} # VAT Payable
    ]
    acc_service.create_journal_entry(date.today(), "Test Invoice", entries)
    print(f"   -> Invoice {invoice.invoice_number} Created. GL Entry Posted.")

    # 3. Invoice Payment (Cash In)
    print("\n3. Testing Invoice Payment (Cash In)...")
    invoice.status = InvoiceStatus.PAID
    db.commit()
    
    entries = [
        {"account_code": "1020", "debit": float(total), "credit": 0}, # Bank
        {"account_code": "1100", "debit": 0, "credit": float(total)} # AR
    ]
    acc_service.create_journal_entry(date.today(), "Test Invoice Payment", entries)
    print("   -> Invoice Paid. GL Entry Posted.")

    # 4. Payroll Accrual (Expense Recognition)
    print("\n4. Testing Payroll Accrual (Expense)...")
    # Create Payroll Period
    from db.payroll_models import PayrollPeriod, PayrollStatus
    period = PayrollPeriod(month=date.today().month, year=date.today().year, status=PayrollStatus.DRAFT)
    db.add(period)
    db.commit()

    payroll_calc = PayrollCalculator(db)
    # Simulate data
    payroll_data = PayrollCreate(
        worker_id=worker.id,
        period_id=period.id,
        salary_components=SalaryComponents(
            basic_salary=Decimal(5000),
            housing_allowance=Decimal(1000),
            transportation_allowance=Decimal(500),
            food_allowance=Decimal(0),
            other_allowances=Decimal(0)
        ),
        deduction_components=DeductionComponents(
            absence_deduction=Decimal(0),
            late_deduction=Decimal(0),
            loan_deduction=Decimal(0),
            advance_deduction=Decimal(0),
            penalty_deduction=Decimal(0),
            gosi_deduction=Decimal(450), # 9%
            other_deductions=Decimal(0)
        ),
        attendance_data=AttendanceData(
            working_days=30, present_days=30, absent_days=0, overtime_hours=Decimal(0)
        ),
        allowances=[], deductions=[], expense_allocations=[]
    )
    
    payroll = payroll_calc.calculate_payroll(payroll_data)
    db.add(payroll)
    db.commit()
    
    # Approve & Create GL
    payroll.status = PayrollStatus.CALCULATED
    db.commit()
    res = payroll_calc.approve_payroll([payroll.id], user_id=1) # Mock user ID
    print(f"   -> Approve Result: {res}")
    print(f"   -> Payroll Calculated & Approved. Net Salary: {payroll.net_salary}")

    # 5. Payroll Payment (Cash Out)
    print("\n5. Testing Payroll Payment (Cash Out)...")
    payroll_calc.confirm_payment(payroll.id)
    print("   -> Payroll Paid. GL Entry Posted.")

    # 6. Verify Balances
    print("\n6. Verifying GL Balances...")
    
    def get_balance(code):
        acc = db.query(Account).filter(Account.code == code).first()
        # Recalculate from journals to be sure
        debit = db.query(func.sum(JournalEntry.debit)).filter(JournalEntry.account_id == acc.id).scalar() or 0
        credit = db.query(func.sum(JournalEntry.credit)).filter(JournalEntry.account_id == acc.id).scalar() or 0
        
        if acc.account_type in ["ASSET", "EXPENSE"]:
            return debit - credit
        else:
            return credit - debit

    cash = get_balance("1020") # Bank
    ar = get_balance("1100") # AR
    revenue = get_balance("4010") # Revenue
    sal_exp = get_balance("5010") # Salary Expense
    sal_pay = get_balance("2100") # Salary Payable
    
    print(f"   Bank Balance (Asset): {cash} (Should be Invoice Total - Net Salary)")
    print(f"   AR Balance (Asset): {ar} (Should be 0)")
    print(f"   Revenue (Income): {revenue} (Should be Invoice Amount)")
    print(f"   Salary Expense: {sal_exp} (Should be Basic Salary + Overtime)")
    print(f"   Salaries Payable: {sal_pay} (Should be 0)")

    expected_cash = float(total) - float(payroll.net_salary)
    print(f"   Expected Cash: {expected_cash}")
    
    if abs(cash - expected_cash) < 0.01:
        print("\n✅ SUCCESS: Financial Flow Verification Passed!")
    else:
        print("\n❌ FAILURE: Balances do not match expected values.")

    db.close()

if __name__ == "__main__":
    verify_accounting_flow()
