from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import get_db
from db.models import Account, JournalEntry, Account as AccountModel
from datetime import date
from typing import List, Optional

router = APIRouter()

@router.get("/balance-sheet")
def get_balance_sheet(year: int = Query(default=date.today().year), db: Session = Depends(get_db)):
    """
    Generates a Balance Sheet for the specified year.
    Assets = Liabilities + Equity
    """
    # Start and end date for the year
    start_date = date(year, 1, 1)
    end_date = date(year, 12, 31)

    # 1. Assets
    assets = db.query(AccountModel).filter(AccountModel.account_type == "ASSET").all()
    asset_data = []
    total_assets = 0
    for acc in assets:
        # Balance = Summerize journals up to end_date
        debit_sum = db.query(func.sum(JournalEntry.debit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        credit_sum = db.query(func.sum(JournalEntry.credit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        balance = debit_sum - credit_sum
        asset_data.append({"name": acc.name, "code": acc.code, "balance": balance})
        total_assets += balance

    # 2. Liabilities
    liabilities = db.query(AccountModel).filter(AccountModel.account_type == "LIABILITY").all()
    liability_data = []
    total_liabilities = 0
    for acc in liabilities:
        debit_sum = db.query(func.sum(JournalEntry.debit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        credit_sum = db.query(func.sum(JournalEntry.credit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        balance = credit_sum - debit_sum  # Normal balance for liabilities is credit
        liability_data.append({"name": acc.name, "code": acc.code, "balance": balance})
        total_liabilities += balance

    # 3. Equity & Net Income
    # We need to calculate Net Income for the year (Revenue - Expenses)
    revenues = db.query(AccountModel).filter(AccountModel.account_type == "REVENUE").all()
    total_revenue = 0
    for acc in revenues:
        debit_sum = db.query(func.sum(JournalEntry.debit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        credit_sum = db.query(func.sum(JournalEntry.credit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        total_revenue += (credit_sum - debit_sum)

    expenses = db.query(AccountModel).filter(AccountModel.account_type == "EXPENSE").all()
    total_expenses = 0
    for acc in expenses:
        debit_sum = db.query(func.sum(JournalEntry.debit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        credit_sum = db.query(func.sum(JournalEntry.credit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        total_expenses += (debit_sum - credit_sum)

    net_income = total_revenue - total_expenses

    equities = db.query(AccountModel).filter(AccountModel.account_type == "EQUITY").all()
    equity_data = []
    total_equity = 0
    for acc in equities:
        debit_sum = db.query(func.sum(JournalEntry.debit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        credit_sum = db.query(func.sum(JournalEntry.credit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        balance = credit_sum - debit_sum
        equity_data.append({"name": acc.name, "code": acc.code, "balance": balance})
        total_equity += balance

    # Add Net Income to Equity
    equity_data.append({"name": "Net Income (Current Year)", "code": "INC", "balance": net_income})
    total_equity += net_income

    return {
        "year": year,
        "assets": {
            "items": asset_data,
            "total": total_assets
        },
        "liabilities": {
            "items": liability_data,
            "total": total_liabilities
        },
        "equity": {
            "items": equity_data,
            "total": total_equity
        },
        "total_liabilities_and_equity": total_liabilities + total_equity
    }

@router.get("/accounts")
def get_accounts(db: Session = Depends(get_db)):
    return db.query(AccountModel).all()

@router.post("/accounts")
def create_account(account: dict, db: Session = Depends(get_db)):
    new_acc = AccountModel(**account)
    db.add(new_acc)
    db.commit()
    db.refresh(new_acc)
    return new_acc
