from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Payroll, Worker, Contract
from schemas.payroll import PayrollCreate, PayrollResponse
from typing import List

router = APIRouter()

@router.get("/", response_model=List[PayrollResponse])
def get_payrolls(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Payroll).offset(skip).limit(limit).all()

@router.post("/calculate", response_model=PayrollResponse)
def calculate_payroll(payroll_data: PayrollCreate, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == payroll_data.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    # Check if payroll already exists for this month/year
    existing = db.query(Payroll).filter(
        Payroll.worker_id == payroll_data.worker_id,
        Payroll.month == payroll_data.month,
        Payroll.year == payroll_data.year
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Payroll already exists for this period")

    # Basic Calculation
    base_salary = worker.salary or 0.0
    net_salary = base_salary + payroll_data.bonuses + payroll_data.overtime - payroll_data.deductions
    
    # Calculate Company Profit (Example: Revenue from contract - worker cost)
    contract = db.query(Contract).filter(Contract.worker_id == worker.id, Contract.status == "ACTIVE").first()
    revenue = contract.monthly_rental_price if contract else (base_salary * 1.3) # Fallback to 30% margin
    company_profit = revenue - net_salary

    new_payroll = Payroll(
        worker_id=worker.id,
        month=payroll_data.month,
        year=payroll_data.year,
        base_salary=base_salary,
        bonuses=payroll_data.bonuses,
        overtime=payroll_data.overtime,
        deductions=payroll_data.deductions,
        net_salary=net_salary,
        company_profit=company_profit,
        is_paid=False
    )
    
    db.add(new_payroll)
    db.commit()
    db.refresh(new_payroll)
    return new_payroll

@router.patch("/{payroll_id}/pay", response_model=PayrollResponse)
def mark_as_paid(payroll_id: int, db: Session = Depends(get_db)):
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    payroll.is_paid = True
    db.commit()
    db.refresh(payroll)
    return payroll

@router.delete("/{payroll_id}")
def delete_payroll(payroll_id: int, db: Session = Depends(get_db)):
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    db.delete(payroll)
    db.commit()
    return {"message": "Payroll record deleted"}

@router.put("/{payroll_id}", response_model=PayrollResponse)
def update_payroll(payroll_id: int, payroll_data: PayrollCreate, db: Session = Depends(get_db)):
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    # Recalculate net salary
    payroll.bonuses = payroll_data.bonuses
    payroll.deductions = payroll_data.deductions
    payroll.overtime = payroll_data.overtime
    payroll.net_salary = payroll.base_salary + payroll.bonuses + payroll.overtime - payroll.deductions
    
    db.commit()
    db.refresh(payroll)
    return payroll
