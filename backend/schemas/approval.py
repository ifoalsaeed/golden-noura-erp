from pydantic import BaseModel
from typing import Optional, Literal, Any

class ApprovalCreate(BaseModel):
    target_table: str
    target_id: int
    action: Literal['UPDATE','DELETE']
    payload: Optional[dict] = None
    reason: Optional[str] = None

class ApprovalResponse(BaseModel):
    id: int
    target_table: str
    target_id: int
    action: str
    payload: Optional[dict] = None
    status: str
    created_at: Any
    class Config:
        from_attributes = True

class ApprovalDecision(BaseModel):
    note: Optional[str] = None
