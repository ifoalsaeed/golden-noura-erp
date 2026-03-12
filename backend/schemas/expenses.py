from pydantic import BaseModel
from typing import Optional
from datetime import date

class ExpenseBase(BaseModel):
    category: str
    amount: float
    description: str
    date: date
    receipt_url: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: int

    class Config:
        from_attributes = True
