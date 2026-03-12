from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import get_db
from db.models import Payroll, Expense, Contract, Account, JournalEntry
from schemas.reports import (
    FinancialSummary, TimelinePoint, ProfitLossResponse, 
    ProfitLossItem, BalanceSheetResponse, CashFlowResponse, CashFlowItem
)
from datetime import date
from typing import List, Any
import pandas as pd
import io
from fastapi.responses import StreamingResponse

router = APIRouter()

@router.get("/summary", response_model=FinancialSummary)
def get_financial_summary(db: Session = Depends(get_db)):
    total_payroll = db.query(func.sum(Payroll.net_salary)).scalar() or 0.0
    total_general_expenses = db.query(func.sum(Expense.amount)).scalar() or 0.0
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
        month_payroll = db.query(func.sum(Payroll.net_salary)).filter(
            Payroll.month == i, Payroll.year == current_year
        ).scalar() or 0.0
        
        month_expenses = db.query(func.sum(Expense.amount)).filter(
            func.strftime('%m', Expense.date) == f"{i:02d}",
            func.strftime('%Y', Expense.date) == str(current_year)
        ).scalar() or 0.0

        revenue = db.query(func.sum(Contract.monthly_rental_price)).filter(Contract.status == "ACTIVE").scalar() or 0.0
        
        results.append({
            "name": months[i-1],
            "revenue": float(revenue),
            "expenses": float(month_payroll) + float(month_expenses)
        })
        
    return results

@router.get("/profit-loss", response_model=ProfitLossResponse)
def get_profit_loss(db: Session = Depends(get_db)):
    # Revenue items
    revenue_rental = db.query(func.sum(Contract.monthly_rental_price)).filter(Contract.status == "ACTIVE").scalar() or 0.0
    revenue_items = [ProfitLossItem(category="Manpower Rental", amount=float(revenue_rental))]
    
    # Expense items
    payroll_expense = db.query(func.sum(Payroll.net_salary)).scalar() or 0.0
    
    # Group other expenses by category
    expense_groups = db.query(Expense.category, func.sum(Expense.amount)).group_by(Expense.category).all()
    expense_items = [ProfitLossItem(category="Salaries & Wages", amount=float(payroll_expense))]
    for cat, amt in expense_groups:
        expense_items.append(ProfitLossItem(category=cat, amount=float(amt)))
        
    total_revenue = revenue_rental
    total_expenses = payroll_expense + sum(float(amt) for _, amt in expense_groups)
    
    return {
        "revenue_items": revenue_items,
        "expense_items": expense_items,
        "total_revenue": float(total_revenue),
        "total_expenses": float(total_expenses),
        "net_profit": float(total_revenue - total_expenses)
    }

@router.get("/balance-sheet", response_model=BalanceSheetResponse)
def get_balance_sheet(db: Session = Depends(get_db)):
    end_date = date.today()
    
    def get_balances(acc_type):
        accounts = db.query(Account).filter(Account.account_type == acc_type).all()
        items = []
        total = 0.0
        for acc in accounts:
            debit_sum = db.query(func.sum(JournalEntry.debit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0.0
            credit_sum = db.query(func.sum(JournalEntry.credit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0.0
            
            if acc_type == "ASSET":
                balance = debit_sum - credit_sum
            else:
                balance = credit_sum - debit_sum
                
            items.append({"name": acc.name, "code": acc.code, "balance": float(balance)})
            total += float(balance)
        return {"items": items, "total": total}

    assets_data = get_balances("ASSET")
    liabilities_data = get_balances("LIABILITY")
    
    # Net Income Calculation for Equity
    total_rev = db.query(func.sum(Contract.monthly_rental_price)).filter(Contract.status == "ACTIVE").scalar() or 0.0
    total_exp = (db.query(func.sum(Payroll.net_salary)).scalar() or 0.0) + (db.query(func.sum(Expense.amount)).scalar() or 0.0)
    net_income = float(total_rev) - float(total_exp)
    
    equity_data = get_balances("EQUITY")
    equity_data["items"].append({"name": "Net Income (Retained)", "code": "NI", "balance": float(net_income)})
    equity_data["total"] = float(equity_data["total"]) + float(net_income)
    
    return {
        "assets": assets_data,
        "liabilities": liabilities_data,
        "equity": equity_data,
        "total_liabilities_and_equity": float(liabilities_data["total"]) + float(equity_data["total"])
    }

@router.get("/cash-flow", response_model=CashFlowResponse)
def get_cash_flow(db: Session = Depends(get_db)):
    # For a simplified cash flow, we track movements in Cash/Bank accounts
    cash_accounts = db.query(Account).filter(Account.name.like("%Cash%") | Account.name.like("%Bank%")).all()
    cash_ids = [acc.id for acc in cash_accounts]
    
    inflow_items = []
    outflow_items = []
    
    if cash_ids:
        # Inflows (Cr to Revenue, Dr to Cash)
        inflows = db.query(JournalEntry.description, func.sum(JournalEntry.debit)).filter(
            JournalEntry.account_id.in_(cash_ids),
            JournalEntry.debit > 0
        ).group_by(JournalEntry.description).all()
        
        for desc, amt in inflows:
            inflow_items.append(CashFlowItem(category=desc or "Received Payment", amount=float(amt)))
            
        # Outflows (Dr to Expense, Cr to Cash)
        outflows = db.query(JournalEntry.description, func.sum(JournalEntry.credit)).filter(
            JournalEntry.account_id.in_(cash_ids),
            JournalEntry.credit > 0
        ).group_by(JournalEntry.description).all()
        
        for desc, amt in outflows:
            outflow_items.append(CashFlowItem(category=desc or "General Payment", amount=float(amt)))
            
    # Fallback/Simulation if no journal entries yet (based on operational data)
    if not inflow_items and not outflow_items:
        rev = db.query(func.sum(Contract.monthly_rental_price)).filter(Contract.status == "ACTIVE").scalar() or 0.0
        inflow_items = [CashFlowItem(category="Operational Revenue", amount=float(rev))]
        
        pay = db.query(func.sum(Payroll.net_salary)).scalar() or 0.0
        exp = db.query(func.sum(Expense.amount)).scalar() or 0.0
        outflow_items = [
            CashFlowItem(category="Payroll Payments", amount=float(pay)),
            CashFlowItem(category="Operational Expenses", amount=float(exp))
        ]
        
    total_in = sum(i.amount for i in inflow_items)
    total_out = sum(o.amount for o in outflow_items)
    
    return {
        "inflow": inflow_items,
        "outflow": outflow_items,
        "net_cash_flow": float(total_in - total_out)
    }

@router.get("/profit-per-company")
def get_profit_per_company(db: Session = Depends(get_db)):
    # Calculate profit for each client/company based on all their active contracts
    companies_profit = []
    
    # Get all clients
    from db.models import Client
    clients = db.query(Client).all()
    
    for client in clients:
        # Get active contracts for this client
        contracts = db.query(Contract).filter(Contract.client_id == client.id, Contract.status == "ACTIVE").all()
        
        total_revenue = float(sum(float(c.monthly_rental_price) for c in contracts))
        
        # Calculate total cost of workers Assigned to this client
        total_cost = 0.0
        for contract in contracts:
            latest_payroll = db.query(Payroll).filter(Payroll.worker_id == contract.worker_id).order_by(Payroll.year.desc(), Payroll.month.desc()).first()
            if latest_payroll:
                total_cost += float(latest_payroll.net_salary)
            
        profit = total_revenue - total_cost
        
        companies_profit.append({
            "client_id": int(client.id),
            "company_name": str(client.company_name),
            "revenue": float(total_revenue),
            "cost": float(total_cost),
            "profit": float(profit),
            "active_workers": int(len(contracts))
        })
        
    return companies_profit

@router.get("/profit-per-worker")
def get_profit_per_worker(db: Session = Depends(get_db)):
    # Calculate profit for each worker based on their active contract revenue vs their payroll costs
    workers_profit = []
    
    # Get all active contracts
    active_contracts = db.query(Contract).filter(Contract.status == "ACTIVE").all()
    
    for contract in active_contracts:
        # Worker revenue (monthly rental price)
        revenue = float(contract.monthly_rental_price)
        
        # Worker cost (latest payroll or base salary)
        latest_payroll = db.query(Payroll).filter(Payroll.worker_id == contract.worker_id).order_by(Payroll.year.desc(), Payroll.month.desc()).first()
        
        cost = float(latest_payroll.net_salary) if latest_payroll else 0.0
        profit = revenue - cost
        
        workers_profit.append({
            "worker_id": contract.worker_id,
            "worker_name": contract.worker.name if contract.worker else f"Worker #{contract.worker_id}",
            "revenue": revenue,
            "cost": cost,
            "profit": profit
        })
        
    return workers_profit

@router.get("/export")
def export_financial_data(format: str = "excel", db: Session = Depends(get_db)):
    # 1. Expenses Data
    expenses = db.query(Expense).all()
    exp_df = pd.DataFrame([{
        "Date": e.date,
        "Category": e.category,
        "Description": e.description,
        "Amount": e.amount
    } for e in expenses])
    
    # 2. Payroll Data
    payrolls = db.query(Payroll).all()
    pay_df = pd.DataFrame([{
        "Month": p.month,
        "Year": p.year,
        "Worker ID": p.worker_id,
        "Base": p.base_salary,
        "Bonuses": p.bonuses,
        "Overtime": p.overtime,
        "Deductions": p.deductions,
        "Net": p.net_salary,
        "Paid": p.is_paid
    } for p in payrolls])
    
    # 3. Summary Data
    summary = get_financial_summary(db)
    sum_df = pd.DataFrame([summary])
    
    if format == "csv":
        # Consolidate all into one CSV or return just expenses?
        # Usually CSV is for single sheet. Let's return a zip of CSVs or just a combined one.
        # For simplicity, let's return the combined summary/expenses/payroll in one CSV with a 'Type' column
        sum_df['Type'] = 'Summary'
        exp_df['Type'] = 'Expense'
        pay_df['Type'] = 'Payroll'
        combined_df = pd.concat([sum_df, exp_df, pay_df], sort=False)
        
        content = combined_df.to_csv(index=False)
        return StreamingResponse(
            io.StringIO(content),
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="financial_report.csv"'}
        )
    else:
        # Create Excel in memory
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            sum_df.to_excel(writer, sheet_name='Summary', index=False)
            exp_df.to_excel(writer, sheet_name='Expenses', index=False)
            pay_df.to_excel(writer, sheet_name='Payroll', index=False)
            
        output.seek(0)
        
        headers = {
            'Content-Disposition': 'attachment; filename="financial_report.xlsx"'
        }
        return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
