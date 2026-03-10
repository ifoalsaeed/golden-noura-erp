from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Worker

router = APIRouter()

@router.get("/")
def read_workers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    workers = db.query(Worker).offset(skip).limit(limit).all()
    return workers

@router.post("/")
def create_worker(worker_data: dict, db: Session = Depends(get_db)):
    new_worker = Worker(**worker_data)
    db.add(new_worker)
    db.commit()
    db.refresh(new_worker)
    return new_worker

@router.delete("/{worker_id}")
def delete_worker(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    db.delete(worker)
    db.commit()
    return {"message": "Deleted successfully"}
