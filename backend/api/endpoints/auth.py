from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import User
from core.security import verify_password, create_access_token, get_password_hash
from core.config import settings
from schemas.user import Token, UserResponse
from datetime import datetime
import logging
from api.deps import get_current_user
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    logger.info(f"Login attempt for user: {form_data.username}")
    print(f"Login attempt for user: {form_data.username}") # Direct print for console visibility
    
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user:
        logger.warning(f"User not found: {form_data.username}")
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    if not verify_password(form_data.password, user.hashed_password):
        logger.warning(f"Invalid password for user: {form_data.username}")
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    if not user.is_active:
        logger.warning(f"Inactive user: {form_data.username}")
        raise HTTPException(status_code=400, detail="Inactive user")
    
    try:
        user.last_login = datetime.utcnow()
        db.commit()
    except Exception as e:
        logger.error(f"Error updating last_login: {e}")
        # Continue even if last_login update fails
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        subject=user.username, 
        role=user.role.value if hasattr(user.role, 'value') else user.role,
        expires_delta=access_token_expires
    )
    
    logger.info(f"Login successful for user: {form_data.username}")
    return {
        "access_token": token,
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify old password
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Old password is incorrect")
    # Update to new password
    current_user.hashed_password = get_password_hash(payload.new_password)
    db.add(current_user)
    db.commit()
    return {"ok": True}
