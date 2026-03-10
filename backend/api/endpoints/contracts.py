from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Contract

router = APIRouter()

@router.get("/")
def read_contracts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Contract).offset(skip).limit(limit).all()

@router.post("/")
def create_contract(data: dict, db: Session = Depends(get_db)):
    contract = Contract(**data)
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract
