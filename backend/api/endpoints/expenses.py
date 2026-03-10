from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Expense

router = APIRouter()

@router.get("/")
def read_expenses(db: Session = Depends(get_db)):
    return db.query(Expense).all()
