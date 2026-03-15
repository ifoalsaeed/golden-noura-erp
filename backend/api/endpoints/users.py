from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
import os
from uuid import uuid4
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import User, RoleEnum
from core.security import get_password_hash, create_access_token
from schemas.user import UserCreate, UserResponse, UserUpdate
from jose import jwt, JWTError
from core.config import settings
from fastapi.security import OAuth2PasswordBearer
from api.deps import get_current_user

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def get_current_user_role(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        role = payload.get("role")
        if role is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return role
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

def admin_required(role: str = Depends(get_current_user_role)):
    if role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not enough permissions")

@router.get("/", response_model=List[UserResponse])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    _: str = Depends(admin_required)
):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=UserResponse)
def create_user(
    user: UserCreate, 
    role: RoleEnum = RoleEnum.DATA_ENTRY,
    db: Session = Depends(get_db),
    _: str = Depends(admin_required)
):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=role,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}/profile", response_model=UserResponse)
def update_user_profile(
    user_id: int,
    update: UserUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(admin_required)
):
    print(f"Updating user {user_id} with data: {update}")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        print(f"User {user_id} not found")
        raise HTTPException(status_code=404, detail="User not found")
    if update.full_name is not None:
        user.full_name = update.full_name
        print(f"Updated full_name to: {update.full_name}")
    if update.role is not None:
        user.role = update.role
        print(f"Updated role to: {update.role}")
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"Successfully updated user {user_id}")
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user_role(
    user_id: int, 
    role: RoleEnum, 
    db: Session = Depends(get_db),
    _: str = Depends(admin_required)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role
    db.commit()
    db.refresh(user)
    return user

@router.put("/me", response_model=UserResponse)
def update_me(
    update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if update.full_name is not None:
        current_user.full_name = update.full_name
    if update.role is not None:
        current_user.role = update.role
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(admin_required)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user)
    db.commit()
    return {"ok": True}

@router.post("/{user_id}/avatar", response_model=UserResponse)
def upload_user_avatar(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: str = Depends(admin_required)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ensure static directory exists
    media_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "avatars")
    os.makedirs(media_dir, exist_ok=True)
    
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
        raise HTTPException(status_code=400, detail="Unsupported image type")
    
    filename = f"{user_id}_{uuid4().hex}{ext}"
    filepath = os.path.join(media_dir, filename)
    
    with open(filepath, "wb") as f:
        f.write(file.file.read())
    
    user.avatar_url = f"/static/avatars/{filename}"
    db.commit()
    db.refresh(user)
    return user

@router.post("/me/avatar", response_model=UserResponse)
def upload_my_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure static directory exists
    media_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "avatars")
    os.makedirs(media_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    filename = f"{current_user.id}_{uuid4().hex}{ext}"
    filepath = os.path.join(media_dir, filename)

    with open(filepath, "wb") as f:
        f.write(file.file.read())

    current_user.avatar_url = f"/static/avatars/{filename}"
    db.commit()
    db.refresh(current_user)
    return current_user
