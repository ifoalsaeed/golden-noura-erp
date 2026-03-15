from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from db.database import get_db
from db import models
from schemas.approval import ApprovalCreate, ApprovalResponse, ApprovalDecision
from api.deps import get_current_user
import json
from datetime import datetime

router = APIRouter()

MODEL_MAP = {
    "workers": models.Worker,
    "clients": models.Client,
    "contracts": models.Contract,
    "invoices": models.Invoice,
    "expenses": models.Expense,
}

@router.post("/", response_model=ApprovalResponse)
def create_approval(req: ApprovalCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if req.target_table not in MODEL_MAP:
        raise HTTPException(status_code=400, detail="Unsupported target table")
    payload_str = json.dumps(req.payload or {}, ensure_ascii=False)
    approval = models.ApprovalRequest(
        target_table=req.target_table,
        target_id=req.target_id,
        action=models.ApprovalAction(req.action),
        payload=payload_str,
        created_by=current_user.id if current_user else None
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)
    return approval

@router.get("/pending", response_model=list[ApprovalResponse])
def list_pending(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    items = db.query(models.ApprovalRequest).filter(models.ApprovalRequest.status == models.ApprovalStatus.PENDING).order_by(models.ApprovalRequest.created_at.desc()).all()
    return items

def _apply_update(db: Session, model_cls, target_id: int, changes: dict):
    obj = db.query(model_cls).get(target_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Target not found")
    mapper = inspect(model_cls)
    cols = {c.key for c in mapper.attrs}
    for k, v in changes.items():
        if k in cols:
            setattr(obj, k, v)
    db.commit()

def _apply_delete(db: Session, model_cls, target_id: int):
    obj = db.query(model_cls).get(target_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Target not found")
    db.delete(obj)
    db.commit()

@router.post("/{approval_id}/approve", response_model=ApprovalResponse)
def approve(approval_id: int, payload: ApprovalDecision, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    ap = db.query(models.ApprovalRequest).get(approval_id)
    if not ap or ap.status != models.ApprovalStatus.PENDING:
        raise HTTPException(status_code=404, detail="Approval not found or already processed")
    model_cls = MODEL_MAP.get(ap.target_table)
    if not model_cls:
        raise HTTPException(status_code=400, detail="Unsupported target table")
    changes = json.loads(ap.payload) if ap.payload else {}
    if ap.action == models.ApprovalAction.UPDATE:
        _apply_update(db, model_cls, ap.target_id, changes)
    elif ap.action == models.ApprovalAction.DELETE:
        _apply_delete(db, model_cls, ap.target_id)
    ap.status = models.ApprovalStatus.APPROVED
    ap.reviewed_by = current_user.id
    ap.reviewed_at = datetime.utcnow()
    ap.decision_note = (payload.note or "")
    db.commit()
    db.refresh(ap)
    return ap

@router.post("/{approval_id}/reject", response_model=ApprovalResponse)
def reject(approval_id: int, payload: ApprovalDecision, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    ap = db.query(models.ApprovalRequest).get(approval_id)
    if not ap or ap.status != models.ApprovalStatus.PENDING:
        raise HTTPException(status_code=404, detail="Approval not found or already processed")
    ap.status = models.ApprovalStatus.REJECTED
    ap.reviewed_by = current_user.id
    ap.reviewed_at = datetime.utcnow()
    ap.decision_note = (payload.note or "")
    db.commit()
    db.refresh(ap)
    return ap

