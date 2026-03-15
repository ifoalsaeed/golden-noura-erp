from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# Worker Base Schema
class WorkerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    passport_number: Optional[str] = Field(None, max_length=20)
    nationality: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=200)
    basic_salary: Decimal = Field(default=0.0, ge=0)
    allowance: Decimal = Field(default=0.0, ge=0)
    is_active: bool = True
    join_date: Optional[datetime] = None
    contract_start: Optional[datetime] = None
    contract_end: Optional[datetime] = None

# Worker Create Schema
class WorkerCreate(WorkerBase):
    pass

# Worker Update Schema
class WorkerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    passport_number: Optional[str] = Field(None, max_length=20)
    nationality: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=200)
    basic_salary: Optional[Decimal] = Field(None, ge=0)
    allowance: Optional[Decimal] = Field(None, ge=0)
    is_active: Optional[bool] = None
    join_date: Optional[datetime] = None
    contract_start: Optional[datetime] = None
    contract_end: Optional[datetime] = None

# Worker Response Schema
class WorkerResponse(WorkerBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Worker List Response
class WorkerListResponse(BaseModel):
    total: int
    workers: List[WorkerResponse]
    skip: int
    limit: int