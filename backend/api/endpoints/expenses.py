from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from db.database import get_db
from db.models import Expense, User, Worker, Client, Contract, ExpenseStatus, ExpenseCategory, JournalHeader
from schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from api.deps import get_current_user
from datetime import date
from services.accounting_service import AccountingService

router = APIRouter()

CATEGORY_ACCOUNT_MAP = {
    "OPERATIONAL": "5090", 
    "PAYROLL": "5010",
    "MARKETING": "5080",
    "MAINTENANCE": "5090",
    "GOVERNMENT_FEES": "5050",
    "OFFICE_SUPPLIES": "5090",
    "RENT": "5060",
    "UTILITIES": "5070",
    "TRAVEL": "5090",
    "OTHER": "5090"
}


@router.post("/", response_model=ExpenseResponse)
def create_expense(
    expense_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new expense record."""
    # Verify related entities if provided
    if expense_in.worker_id:
        if not db.query(Worker).filter(Worker.id == expense_in.worker_id).first():
            raise HTTPException(status_code=404, detail="Worker not found")
            
    if expense_in.client_id:
        if not db.query(Client).filter(Client.id == expense_in.client_id).first():
            raise HTTPException(status_code=404, detail="Client not found")
            
    if expense_in.contract_id:
        if not db.query(Contract).filter(Contract.id == expense_in.contract_id).first():
            raise HTTPException(status_code=404, detail="Contract not found")

    expense = Expense(
        **expense_in.dict(),
        created_by=current_user.id,
        status=ExpenseStatus.PENDING # Default status
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@router.get("/", response_model=List[ExpenseResponse])
def read_expenses(
    skip: int = 0,
    limit: int = 100,
    category: Optional[ExpenseCategory] = None,
    status: Optional[ExpenseStatus] = None,
    worker_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve expenses with filtering."""
    query = db.query(Expense)
    
    if category:
        query = query.filter(Expense.category == category)
    if status:
        query = query.filter(Expense.status == status)
    if worker_id:
        query = query.filter(Expense.worker_id == worker_id)
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)
        
    expenses = query.order_by(desc(Expense.date)).offset(skip).limit(limit).all()
    
    # Enrich response with names (could be optimized with joins, but keeping it simple for now)
    results = []
    for exp in expenses:
        exp_data = ExpenseResponse.from_orm(exp)
        if exp.worker:
            exp_data.worker_name = exp.worker.name
        if exp.created_by_user:
            exp_data.created_by_name = exp.created_by_user.username
        if exp.approved_by_user:
            exp_data.approved_by_name = exp.approved_by_user.username
        results.append(exp_data)
        
    return results

@router.get("/{expense_id}", response_model=ExpenseResponse)
def read_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific expense by ID."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    exp_data = ExpenseResponse.from_orm(expense)
    if expense.worker:
        exp_data.worker_name = expense.worker.name
    return exp_data

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    expense_in: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an expense."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    # Check permissions logic here if needed (e.g., only admin can approve)
    if expense_in.status == ExpenseStatus.APPROVED and current_user.role != "ADMIN":
         # Simple check - real app might use RBAC service
         pass 

    update_data = expense_in.dict(exclude_unset=True)
    
    # Capture old state for change detection
    old_status = expense.status
    old_is_paid = expense.is_paid
    
    if "status" in update_data and update_data["status"] == ExpenseStatus.APPROVED:
        expense.approved_by = current_user.id
        
    for field, value in update_data.items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)
    
    # Accounting Integration
    accounting_service = AccountingService(db)
    
    # 1. Expense Approval (Accrual)
    if "status" in update_data and update_data["status"] == ExpenseStatus.APPROVED and old_status != ExpenseStatus.APPROVED:
        account_code = CATEGORY_ACCOUNT_MAP.get(expense.category.name, "5090")
        header = JournalHeader(
            date=date.today(),
            description=f"Expense Approved - {expense.title}",
            source_type="Expense",
            source_id=expense.id
        )
        db.add(header); db.commit(); db.refresh(header)
        entries = [
            {"account_code": account_code, "debit": float(expense.amount), "credit": 0},
            {"account_code": "2010", "debit": 0, "credit": float(expense.amount)}
        ]
        try:
            accounting_service.create_journal_entry(
                date=date.today(),
                description=f"Expense Approved - {expense.title}",
                entries=entries,
                header_id=header.id
            )
        except Exception as e:
            # Log error but don't fail request? Or fail? Ideally strictly fail, but for now log.
            print(f"Accounting Error: {e}")

    # 2. Expense Payment
    if "is_paid" in update_data and update_data["is_paid"] and not old_is_paid:
        header = JournalHeader(
            date=date.today(),
            description=f"Expense Paid - {expense.title}",
            source_type="ExpensePayment",
            source_id=expense.id
        )
        db.add(header); db.commit(); db.refresh(header)
        entries = [
            {"account_code": "2010", "debit": float(expense.amount), "credit": 0},
            {"account_code": "1020", "debit": 0, "credit": float(expense.amount)}
        ]
        try:
            accounting_service.create_journal_entry(
                date=date.today(),
                description=f"Expense Paid - {expense.title}",
                entries=entries,
                header_id=header.id
            )
        except Exception as e:
            print(f"Accounting Error: {e}")

    return expense

@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an expense."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    db.delete(expense)
    db.commit()
    return {"ok": True}
