from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PayrollBase(BaseModel):
    worker_id: int
    month: int
    year: int
    bonuses: Optional[float] = 0
    deductions: Optional[float] = 0
    overtime: Optional[float] = 0

class PayrollCreate(PayrollBase):
    pass

class PayrollResponse(BaseModel):
    id: int
    worker_id: int
    month: int
    year: int
    net_salary: float
    is_paid: bool
    
    class Config:
        from_attributes = True
