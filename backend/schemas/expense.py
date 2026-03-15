from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from db.models import ExpenseCategory, PaymentMethod, ExpenseStatus

# Shared properties
class ExpenseBase(BaseModel):
    title: str
    description: Optional[str] = None
    amount: float
    date: Optional[date] = None
    category: ExpenseCategory = ExpenseCategory.OTHER
    subcategory: Optional[str] = None
    payment_method: PaymentMethod = PaymentMethod.CASH
    reference_number: Optional[str] = None
    is_paid: bool = False
    paid_at: Optional[datetime] = None
    
    # Linking
    worker_id: Optional[int] = None
    client_id: Optional[int] = None
    contract_id: Optional[int] = None
    
    # Tax
    tax_amount: float = 0.0
    amount_before_tax: float = 0.0
    vendor_name: Optional[str] = None
    vendor_tax_number: Optional[str] = None

# Properties to receive on creation
class ExpenseCreate(ExpenseBase):
    pass

# Properties to receive on update
class ExpenseUpdate(ExpenseBase):
    title: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[ExpenseStatus] = None

# Properties shared by models stored in DB
class ExpenseInDBBase(ExpenseBase):
    id: int
    status: ExpenseStatus
    receipt_url: Optional[str] = None
    created_by: Optional[int] = None
    approved_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Properties to return to client
class ExpenseResponse(ExpenseInDBBase):
    worker_name: Optional[str] = None
    created_by_name: Optional[str] = None
    approved_by_name: Optional[str] = None

# Filters for listing
class ExpenseFilter(BaseModel):
    category: Optional[ExpenseCategory] = None
    status: Optional[ExpenseStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    worker_id: Optional[int] = None
