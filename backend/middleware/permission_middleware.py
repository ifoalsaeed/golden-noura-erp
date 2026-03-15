from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from db.database import get_db
from db.rbac_models import User, UserSession
from services.rbac_service import RBACService
from schemas.rbac_schemas import ModuleType, PermissionLevel
from datetime import datetime
import jwt
import os

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

class PermissionMiddleware:
    def __init__(self, rbac_service: RBACService):
        self.rbac_service = rbac_service
    
    def get_current_user_from_token(self, token: str, db: Session) -> Optional[User]:
        """Extract and validate user from JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: int = payload.get("sub")
            session_id: int = payload.get("session_id")
            
            if user_id is None or session_id is None:
                return None
            
            # Validate session
            session = db.query(UserSession).filter(
                UserSession.id == session_id,
                UserSession.user_id == user_id,
                UserSession.is_active == True,
                UserSession.expires_at > datetime.utcnow()
            ).first()
            
            if not session:
                return None
            
            # Get user
            user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
            return user
            
        except jwt.PyJWTError:
            return None
    
    def check_permission(
        self, 
        user_id: int, 
        module: ModuleType, 
        level: PermissionLevel,
        resource_id: Optional[int] = None,
        resource_type: Optional[str] = None
    ) -> bool:
        """Check if user has required permission"""
        return self.rbac_service.has_permission(user_id, module, level)
    
    def require_permission(
        self,
        module: ModuleType,
        level: PermissionLevel,
        resource_id: Optional[int] = None,
        resource_type: Optional[str] = None
    ):
        """Decorator to require specific permission for an endpoint"""
        def decorator(func):
            async def wrapper(*args, **kwargs):
                request: Request = kwargs.get("request") or next((arg for arg in args if isinstance(arg, Request)), None)
                
                if not request:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Request object not found"
                    )
                
                # Get database session
                db = next(get_db())
                
                try:
                    # Get authorization header
                    auth_header = request.headers.get("Authorization")
                    if not auth_header or not auth_header.startswith("Bearer "):
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Missing or invalid authorization header"
                        )
                    
                    token = auth_header.split(" ")[1]
                    user = self.get_current_user_from_token(token, db)
                    
                    if not user:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid or expired token"
                        )
                    
                    # Check permission
                    if not self.check_permission(user.id, module, level, resource_id, resource_type):
                        # Log the denied access attempt
                        self.rbac_service.log_action(
                            user_id=user.id,
                            action="ACCESS_DENIED",
                            module=module,
                            resource_type=resource_type or "Unknown",
                            resource_id=resource_id,
                            status="DENIED",
                            error_message=f"Access denied: {module.value}.{level.value}",
                            ip_address=request.client.host,
                            user_agent=request.headers.get("User-Agent", "Unknown")
                        )
                        
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail=f"You don't have permission to {level.value} {module.value}"
                        )
                    
                    # Add user to request state for use in endpoint
                    request.state.user = user
                    
                    return await func(*args, **kwargs)
                    
                finally:
                    db.close()
            
            return wrapper
        return decorator

# Permission decorators for easy endpoint protection
def require_permission(module: ModuleType, level: PermissionLevel):
    """Decorator to require specific permission for an endpoint"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # This will be implemented in the middleware
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Module-specific permission decorators
def require_dashboard_access(level: PermissionLevel):
    return require_permission(ModuleType.DASHBOARD, level)

def require_employee_access(level: PermissionLevel):
    return require_permission(ModuleType.EMPLOYEES, level)

def require_payroll_access(level: PermissionLevel):
    return require_permission(ModuleType.PAYROLL, level)

def require_attendance_access(level: PermissionLevel):
    return require_permission(ModuleType.ATTENDANCE, level)

def require_expense_access(level: PermissionLevel):
    return require_permission(ModuleType.EXPENSES, level)

def require_report_access(level: PermissionLevel):
    return require_permission(ModuleType.REPORTS, level)

def require_settings_access(level: PermissionLevel):
    return require_permission(ModuleType.SETTINGS, level)

def require_user_access(level: PermissionLevel):
    return require_permission(ModuleType.USERS, level)

def require_role_access(level: PermissionLevel):
    return require_permission(ModuleType.ROLES, level)

# Permission checking functions for use in services
def check_user_permission(
    user_id: int,
    module: ModuleType,
    level: PermissionLevel,
    db: Session
) -> bool:
    """Check if user has specific permission"""
    rbac_service = RBACService(db)
    return rbac_service.has_permission(user_id, module, level)

def get_user_permissions_summary(user_id: int, db: Session) -> Dict[str, Any]:
    """Get comprehensive permissions summary for user"""
    rbac_service = RBACService(db)
    return rbac_service.get_user_role_permissions(user_id)

def log_user_action(
    user_id: int,
    action: str,
    module: ModuleType,
    resource_type: str,
    resource_id: Optional[int] = None,
    old_values: Optional[Dict] = None,
    new_values: Optional[Dict] = None,
    ip_address: str = "127.0.0.1",
    user_agent: str = "System",
    status: str = "SUCCESS",
    error_message: Optional[str] = None,
    db: Session = None
):
    """Log user action for audit trail"""
    if db is None:
        db = next(get_db())
        try:
            rbac_service = RBACService(db)
            rbac_service.log_action(
                user_id=user_id,
                action=action,
                module=module,
                resource_type=resource_type,
                resource_id=resource_id,
                old_values=old_values,
                new_values=new_values,
                ip_address=ip_address,
                user_agent=user_agent,
                status=status,
                error_message=error_message
            )
        finally:
            db.close()
    else:
        rbac_service = RBACService(db)
        rbac_service.log_action(
            user_id=user_id,
            action=action,
            module=module,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status,
            error_message=error_message
        )