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
