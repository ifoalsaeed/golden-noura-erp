from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date

class JournalLine(BaseModel):
    account_code: str = Field(..., description="Chart of account code")
    debit: float = 0.0
    credit: float = 0.0

class JournalCreate(BaseModel):
    date: date
    description: str
    source_type: Optional[str] = None
    source_id: Optional[int] = None
    entries: List[JournalLine]

class AccountCreate(BaseModel):
    code: str
    name: str
    account_type: str  # ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE

class JournalHeaderUpdate(BaseModel):
    date: Optional[date] = None
    description: Optional[str] = None
    reference: Optional[str] = None

class JournalLineCreate(BaseModel):
    account_code: str
    debit: float = 0.0
    credit: float = 0.0

class JournalLineUpdate(BaseModel):
    account_code: Optional[str] = None
    debit: Optional[float] = None
    credit: Optional[float] = None
