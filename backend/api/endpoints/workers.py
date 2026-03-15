from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from db.database import get_db
from db.models import Worker, WorkerStatus
from schemas.worker_schemas import WorkerCreate, WorkerResponse, WorkerUpdate
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[WorkerResponse])
def read_workers(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[WorkerStatus] = None,
    db: Session = Depends(get_db)
):
    """Get all workers with pagination and optional status filter"""
    query = db.query(Worker)
    
    if status:
        query = query.filter(Worker.status == status)
    
    workers = query.offset(skip).limit(limit).all()
    return workers

@router.post("/", response_model=WorkerResponse)
def create_worker(
    worker_data: WorkerCreate, 
    db: Session = Depends(get_db)
):
    """Create a new worker"""
    # Check if passport number already exists
    if worker_data.passport_number:
        existing = db.query(Worker).filter(
            Worker.passport_number == worker_data.passport_number
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Worker with this passport number already exists"
            )
    
    # Create new worker
    db_worker = Worker(**worker_data.dict())
    db.add(db_worker)
    db.commit()
    db.refresh(db_worker)
    
    return db_worker

@router.get("/{worker_id}", response_model=WorkerResponse)
def read_worker(
    worker_id: int, 
    db: Session = Depends(get_db)
):
    """Get a specific worker by ID"""
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(
            status_code=404, 
            detail="Worker not found"
        )
    return worker

@router.put("/{worker_id}", response_model=WorkerResponse)
def update_worker(
    worker_id: int, 
    worker_data: WorkerUpdate, 
    db: Session = Depends(get_db)
):
    """Update a worker"""
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(
            status_code=404, 
            detail="Worker not found"
        )
    
    # Update only provided fields
    update_data = worker_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(worker, field, value)
    
    worker.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(worker)
    
    return worker

@router.delete("/{worker_id}")
def delete_worker(
    worker_id: int, 
    db: Session = Depends(get_db)
):
    """Delete a worker"""
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(
            status_code=404, 
            detail="Worker not found"
        )
    
    db.delete(worker)
    db.commit()
    
    return {"message": "Worker deleted successfully"}

@router.get("/stats/summary")
def get_worker_stats(db: Session = Depends(get_db)):
    """Get worker statistics"""
    total_workers = db.query(Worker).count()
    active_workers = db.query(Worker).filter(Worker.status == WorkerStatus.ACTIVE).count()
    on_leave_workers = db.query(Worker).filter(Worker.status == WorkerStatus.ON_LEAVE).count()
    
    return {
        "total_workers": total_workers,
        "active_workers": active_workers,
        "on_leave_workers": on_leave_workers,
        "inactive_workers": total_workers - active_workers
    }