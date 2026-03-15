from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from db.models import InvoiceStatus

class InvoiceBase(BaseModel):
    client_id: int
    contract_id: Optional[int] = None
    issue_date: date
    due_date: date
    amount: float
    tax_amount: float
    total_amount: float
    notes: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceUpdate(BaseModel):
    status: Optional[InvoiceStatus] = None
    paid_at: Optional[datetime] = None

class InvoiceResponse(InvoiceBase):
    id: int
    invoice_number: str
    status: InvoiceStatus
    created_at: datetime

    class Config:
        from_attributes = True
