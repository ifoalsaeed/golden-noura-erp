from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Expense
from schemas.expenses import ExpenseCreate, ExpenseResponse
from typing import List

router = APIRouter()

@router.get("/", response_model=List[ExpenseResponse])
def read_expenses(db: Session = Depends(get_db)):
    return db.query(Expense).all()

@router.post("/", response_model=ExpenseResponse)
def create_expense(expense_data: ExpenseCreate, db: Session = Depends(get_db)):
    new_expense = Expense(
        category=expense_data.category,
        amount=expense_data.amount,
        description=expense_data.description,
        date=expense_data.date,
        receipt_url=expense_data.receipt_url
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted"}

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, expense_data: ExpenseCreate, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    expense.category = expense_data.category
    expense.amount = expense_data.amount
    expense.description = expense_data.description
    expense.date = expense_data.date
    
    db.commit()
    db.refresh(expense)
    return expense
