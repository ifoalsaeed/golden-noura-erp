from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Payroll

router = APIRouter()

@router.get("/")
def get_payrolls(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Payroll).offset(skip).limit(limit).all()

@router.post("/calculate")
def calculate_payroll(worker_id: int, month: int, year: int, db: Session = Depends(get_db)):
    # Engine logic for Payroll deductions and bonuses goes here using Pandas/ORM
    return {"status": "success", "message": "Payroll computed"}
