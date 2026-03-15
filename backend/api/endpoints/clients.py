from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Client

router = APIRouter()

@router.get("/")
def read_clients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Client).offset(skip).limit(limit).all()

@router.post("/")
def create_client(client_data: dict, db: Session = Depends(get_db)):
    new_client = Client(**client_data)
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client
