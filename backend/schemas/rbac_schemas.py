from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class PermissionLevel(str, Enum):
    VIEW = "VIEW"
    CREATE = "CREATE"
    EDIT = "EDIT"
    DELETE = "DELETE"
    APPROVE = "APPROVE"
    EXPORT = "EXPORT"
    PRINT = "PRINT"

class ModuleType(str, Enum):
    DASHBOARD = "DASHBOARD"
    EMPLOYEES = "EMPLOYEES"
    PAYROLL = "PAYROLL"
    ATTENDANCE = "ATTENDANCE"
    EXPENSES = "EXPENSES"
    PROJECTS = "PROJECTS"
    REPORTS = "REPORTS"
    SETTINGS = "SETTINGS"
    USERS = "USERS"
    ROLES = "ROLES"

class RoleLevel(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    ACCOUNTANT = "ACCOUNTANT"
    MANAGER = "MANAGER"
    VIEWER = "VIEWER"
    HR = "HR"

# Permission Schemas
class PermissionBase(BaseModel):
    module: ModuleType
    level: PermissionLevel
    name: str
    description: Optional[str] = None

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(BaseModel):
    module: Optional[ModuleType] = None
    level: Optional[PermissionLevel] = None
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class PermissionResponse(PermissionBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Role Schemas
class RoleBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=50)
    description: Optional[str] = None
    level: RoleLevel
    is_active: bool = True

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class RoleResponse(RoleBase):
    id: int
    is_system_role: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    
    class Config:
        from_attributes = True

# Role Permission Schemas
class RolePermissionBase(BaseModel):
    role_id: int
    permission_id: int
    is_granted: bool = True

class RolePermissionCreate(RolePermissionBase):
    pass

class RolePermissionUpdate(BaseModel):
    is_granted: bool

class RolePermissionResponse(RolePermissionBase):
    id: int
    created_at: datetime
    created_by: Optional[int] = None
    permission: PermissionResponse
    
    class Config:
        from_attributes = True

# User Role Schemas
class UserRoleBase(BaseModel):
    user_id: int
    role_id: int
    is_active: bool = True
    expires_at: Optional[datetime] = None

class UserRoleCreate(UserRoleBase):
    pass

class UserRoleUpdate(BaseModel):
    is_active: bool
    expires_at: Optional[datetime] = None

class UserRoleResponse(UserRoleBase):
    id: int
    assigned_at: datetime
    assigned_by: Optional[int] = None
    role: RoleResponse
    
    class Config:
        from_attributes = True

# User Schemas (Enhanced)
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    full_name: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role_id: Optional[int] = None

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    role_id: Optional[int] = None

class UserResponse(UserBase):
    id: int
    is_superuser: bool
    role_id: Optional[int] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    role: Optional[RoleResponse] = None
    
    class Config:
        from_attributes = True

class UserWithPermissions(UserResponse):
    permissions: List[PermissionResponse] = []
    roles: List[RoleResponse] = []

# Audit Log Schemas
class AuditLogBase(BaseModel):
    action: str
    module: ModuleType
    resource_type: str
    resource_id: Optional[int] = None
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    ip_address: str
    user_agent: str
    status: str = "SUCCESS"
    error_message: Optional[str] = None

class AuditLogCreate(AuditLogBase):
    user_id: int

class AuditLogResponse(AuditLogBase):
    id: int
    user_id: int
    timestamp: datetime
    user: UserResponse
    
    class Config:
        from_attributes = True

# Permission Check Schemas
class PermissionCheck(BaseModel):
    module: ModuleType
    level: PermissionLevel
    user_id: int

class PermissionCheckResponse(BaseModel):
    has_permission: bool
    message: str
    user_roles: List[str]
    required_permission: str

# Role with Permissions Schema
class RoleWithPermissions(RoleResponse):
    permissions: List[PermissionResponse] = []
    permission_summary: Dict[str, List[str]] = {}

# User Session Schemas
class UserSessionBase(BaseModel):
    session_token: str
    ip_address: str
    user_agent: str
    expires_at: datetime

class UserSessionCreate(UserSessionBase):
    user_id: int

class UserSessionResponse(UserSessionBase):
    id: int
    user_id: int
    login_at: datetime
    last_activity: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

# Bulk Permission Management
class BulkPermissionUpdate(BaseModel):
    role_id: int
    permissions: List[Dict[str, Any]]  # List of {permission_id, is_granted}
    created_by: int

class RolePermissionMatrix(BaseModel):
    role_id: int
    role_name: str
    permissions: Dict[str, List[str]]  # module: [levels]

# Permission Requirements for Frontend
class ModulePermissions(BaseModel):
    module: str
    can_view: bool = False
    can_create: bool = False
    can_edit: bool = False
    can_delete: bool = False
    can_approve: bool = False
    can_export: bool = False
    can_print: bool = False

class UserPermissionsResponse(BaseModel):
    user_id: int
    username: str
    role: str
    modules: List[ModulePermissions]