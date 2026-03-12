from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import get_db
from db.models import Payroll, Expense, Contract
from schemas.reports import FinancialSummary, TimelinePoint
from datetime import date
from typing import List

router = APIRouter()

@router.get("/summary", response_model=FinancialSummary)
def get_financial_summary(db: Session = Depends(get_db)):
    # Total Payroll (Paid or not, as it's a liability)
    total_payroll = db.query(func.sum(Payroll.net_salary)).scalar() or 0.0
    
    # Total Expenses (General)
    total_general_expenses = db.query(func.sum(Expense.amount)).scalar() or 0.0
    
    # Total Revenue (From Contracts - 1 month estimate)
    total_revenue = db.query(func.sum(Contract.monthly_rental_price)).filter(Contract.status == "ACTIVE").scalar() or 0.0
    
    total_expenses = total_payroll + total_general_expenses
    profit = total_revenue - total_expenses
    
    return {
        "revenue": float(total_revenue),
        "expenses": float(total_expenses),
        "profit": float(profit)
    }

@router.get("/timeline", response_model=List[TimelinePoint])
def get_financial_timeline(db: Session = Depends(get_db)):
    results = []
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    current_year = date.today().year
    
    for i in range(1, 13):
        # Filter payrolls for this month
        month_payroll = db.query(func.sum(Payroll.net_salary)).filter(
            Payroll.month == i, Payroll.year == current_year
        ).scalar() or 0.0
        
        # Filter expenses for this month
        # SQLite's strftime('%m', date) returns 01, 02... so we match with formatted integer
        month_expenses = db.query(func.sum(Expense.amount)).filter(
            func.strftime('%m', Expense.date) == f"{i:02d}",
            func.strftime('%Y', Expense.date) == str(current_year)
        ).scalar() or 0.0

        # Revenue for the month (simplified: active contracts)
        revenue = db.query(func.sum(Contract.monthly_rental_price)).filter(Contract.status == "ACTIVE").scalar() or 0.0
        
        results.append({
            "name": months[i-1],
            "revenue": float(revenue),
            "expenses": float(month_payroll) + float(month_expenses)
        })
        
    return results
