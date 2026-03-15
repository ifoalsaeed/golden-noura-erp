from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from db.rbac_models import User, Role, Permission, RolePermission, UserRole, AuditLog
from schemas.rbac_schemas import PermissionLevel, ModuleType, RoleLevel
from datetime import datetime
import json

class RBACService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_permissions(self, user_id: int) -> List[Permission]:
        """Get all permissions for a user through their roles"""
        # Get active roles for user
        user_roles = self.db.query(UserRole).filter(
            and_(
                UserRole.user_id == user_id,
                UserRole.is_active == True,
                or_(
                    UserRole.expires_at.is_(None),
                    UserRole.expires_at > datetime.utcnow()
                )
            )
        ).all()
        
        role_ids = [ur.role_id for ur in user_roles]
        
        if not role_ids:
            return []
        
        # Get permissions for these roles
        permissions = self.db.query(Permission).join(RolePermission).filter(
            and_(
                RolePermission.role_id.in_(role_ids),
                RolePermission.is_granted == True,
                Permission.is_active == True
            )
        ).distinct().all()
        
        return permissions
    
    def has_permission(self, user_id: int, module: ModuleType, level: PermissionLevel) -> bool:
        """Check if user has specific permission"""
        # Super admin has all permissions
        user = self.db.query(User).filter(User.id == user_id).first()
        if user and user.is_superuser:
            return True
        
        # Check through roles
        permissions = self.get_user_permissions(user_id)
        
        for permission in permissions:
            if permission.module == module and permission.level == level:
                return True
        
        return False
    
    def check_permissions(self, user_id: int, required_permissions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Check multiple permissions at once"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"has_access": False, "message": "User not found"}
        
        # Super admin bypass
        if user.is_superuser:
            return {"has_access": True, "message": "Super admin access"}
        
        user_permissions = self.get_user_permissions(user_id)
        permission_dict = {(p.module, p.level): True for p in user_permissions}
        
        missing_permissions = []
        for req in required_permissions:
            module = req.get("module")
            level = req.get("level")
            if (module, level) not in permission_dict:
                missing_permissions.append(f"{module.value}.{level.value}")
        
        if missing_permissions:
            return {
                "has_access": False,
                "message": f"Missing permissions: {', '.join(missing_permissions)}",
                "missing_permissions": missing_permissions
            }
        
        return {"has_access": True, "message": "All permissions granted"}
    
    def get_user_role_permissions(self, user_id: int) -> Dict[str, Any]:
        """Get comprehensive permission summary for user"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}
        
        permissions = self.get_user_permissions(user_id)
        
        # Group permissions by module
        module_permissions = {}
        for permission in permissions:
            module = permission.module.value
            level = permission.level.value
            
            if module not in module_permissions:
                module_permissions[module] = []
            module_permissions[module].append(level)
        
        # Get user roles
        user_roles = self.db.query(UserRole).filter(
            and_(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            )
        ).all()
        
        roles = []
        for ur in user_roles:
            role = self.db.query(Role).filter(Role.id == ur.role_id).first()
            if role:
                roles.append({
                    "id": role.id,
                    "name": role.name,
                    "level": role.level.value,
                    "assigned_at": ur.assigned_at,
                    "expires_at": ur.expires_at
                })
        
        return {
            "user_id": user_id,
            "username": user.username,
            "is_superuser": user.is_superuser,
            "roles": roles,
            "permissions": module_permissions,
            "total_permissions": len(permissions)
        }
    
    def create_role(self, name: str, description: str, level: RoleLevel, created_by: int) -> Role:
        """Create a new role"""
        role = Role(
            name=name,
            description=description,
            level=level,
            created_by=created_by
        )
        self.db.add(role)
        self.db.commit()
        self.db.refresh(role)
        
        # Log the action
        self.log_action(
            user_id=created_by,
            action="CREATE_ROLE",
            module=ModuleType.ROLES,
            resource_type="Role",
            resource_id=role.id,
            new_values={"name": name, "description": description, "level": level.value}
        )
        
        return role
    
    def assign_role_to_user(self, user_id: int, role_id: int, assigned_by: int, expires_at: Optional[datetime] = None) -> UserRole:
        """Assign a role to a user"""
        # Check if role exists
        role = self.db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise ValueError("Role not found")
        
        # Check if user exists
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        # Deactivate existing roles if this is a primary role
        if user.role_id:
            self.db.query(UserRole).filter(
                and_(
                    UserRole.user_id == user_id,
                    UserRole.role_id == user.role_id
                )
            ).update({"is_active": False})
        
        # Create new user role
        user_role = UserRole(
            user_id=user_id,
            role_id=role_id,
            assigned_by=assigned_by,
            expires_at=expires_at
        )
        
        # Update user's primary role
        user.role_id = role_id
        
        self.db.add(user_role)
        self.db.commit()
        self.db.refresh(user_role)
        
        # Log the action
        self.log_action(
            user_id=assigned_by,
            action="ASSIGN_ROLE",
            module=ModuleType.USERS,
            resource_type="User",
            resource_id=user_id,
            new_values={"role_id": role_id, "role_name": role.name}
        )
        
        return user_role
    
    def grant_permission_to_role(self, role_id: int, permission_id: int, granted_by: int) -> RolePermission:
        """Grant a permission to a role"""
        # Check if role and permission exist
        role = self.db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise ValueError("Role not found")
        
        permission = self.db.query(Permission).filter(Permission.id == permission_id).first()
        if not permission:
            raise ValueError("Permission not found")
        
        # Check if permission already exists
        existing = self.db.query(RolePermission).filter(
            and_(
                RolePermission.role_id == role_id,
                RolePermission.permission_id == permission_id
            )
        ).first()
        
        if existing:
            existing.is_granted = True
            existing.created_by = granted_by
            role_permission = existing
        else:
            role_permission = RolePermission(
                role_id=role_id,
                permission_id=permission_id,
                is_granted=True,
                created_by=granted_by
            )
            self.db.add(role_permission)
        
        self.db.commit()
        self.db.refresh(role_permission)
        
        # Log the action
        self.log_action(
            user_id=granted_by,
            action="GRANT_PERMISSION",
            module=ModuleType.ROLES,
            resource_type="Role",
            resource_id=role_id,
            new_values={
                "permission_id": permission_id,
                "permission_name": permission.name,
                "module": permission.module.value,
                "level": permission.level.value
            }
        )
        
        return role_permission
    
    def revoke_permission_from_role(self, role_id: int, permission_id: int, revoked_by: int) -> bool:
        """Revoke a permission from a role"""
        role_permission = self.db.query(RolePermission).filter(
            and_(
                RolePermission.role_id == role_id,
                RolePermission.permission_id == permission_id
            )
        ).first()
        
        if role_permission:
            role_permission.is_granted = False
            role_permission.created_by = revoked_by
            self.db.commit()
            
            # Log the action
            permission = self.db.query(Permission).filter(Permission.id == permission_id).first()
            self.log_action(
                user_id=revoked_by,
                action="REVOKE_PERMISSION",
                module=ModuleType.ROLES,
                resource_type="Role",
                resource_id=role_id,
                new_values={
                    "permission_id": permission_id,
                    "permission_name": permission.name if permission else "Unknown"
                }
            )
            
            return True
        
        return False
    
    def log_action(self, user_id: int, action: str, module: ModuleType, resource_type: str, 
                    resource_id: Optional[int] = None, old_values: Optional[Dict] = None, 
                    new_values: Optional[Dict] = None, ip_address: str = "127.0.0.1", 
                    user_agent: str = "System", status: str = "SUCCESS", error_message: Optional[str] = None):
        """Log user action for audit trail"""
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            module=module,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=json.dumps(old_values) if old_values else None,
            new_values=json.dumps(new_values) if new_values else None,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status,
            error_message=error_message
        )
        
        self.db.add(audit_log)
        self.db.commit()
    
    def get_audit_logs(self, user_id: Optional[int] = None, module: Optional[ModuleType] = None, 
                      action: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[AuditLog]:
        """Get audit logs with filters"""
        query = self.db.query(AuditLog)
        
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if module:
            query = query.filter(AuditLog.module == module)
        if action:
            query = query.filter(AuditLog.action == action)
        
        return query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()
    
    def initialize_default_permissions(self):
        """Initialize default permissions for the system"""
        default_permissions = [
            # Dashboard permissions
            {"module": ModuleType.DASHBOARD, "level": PermissionLevel.VIEW, "name": "dashboard.view", "description": "View dashboard"},
            
            # Employee permissions
            {"module": ModuleType.EMPLOYEES, "level": PermissionLevel.VIEW, "name": "employees.view", "description": "View employees"},
            {"module": ModuleType.EMPLOYEES, "level": PermissionLevel.CREATE, "name": "employees.create", "description": "Create employees"},
            {"module": ModuleType.EMPLOYEES, "level": PermissionLevel.EDIT, "name": "employees.edit", "description": "Edit employees"},
            {"module": ModuleType.EMPLOYEES, "level": PermissionLevel.DELETE, "name": "employees.delete", "description": "Delete employees"},
            {"module": ModuleType.EMPLOYEES, "level": PermissionLevel.EXPORT, "name": "employees.export", "description": "Export employees"},
            {"module": ModuleType.EMPLOYEES, "level": PermissionLevel.PRINT, "name": "employees.print", "description": "Print employee data"},
            
            # Payroll permissions
            {"module": ModuleType.PAYROLL, "level": PermissionLevel.VIEW, "name": "payroll.view", "description": "View payroll"},
            {"module": ModuleType.PAYROLL, "level": PermissionLevel.CREATE, "name": "payroll.create", "description": "Create payroll"},
            {"module": ModuleType.PAYROLL, "level": PermissionLevel.EDIT, "name": "payroll.edit", "description": "Edit payroll"},
            {"module": ModuleType.PAYROLL, "level": PermissionLevel.DELETE, "name": "payroll.delete", "description": "Delete payroll"},
            {"module": ModuleType.PAYROLL, "level": PermissionLevel.APPROVE, "name": "payroll.approve", "description": "Approve payroll"},
            {"module": ModuleType.PAYROLL, "level": PermissionLevel.EXPORT, "name": "payroll.export", "description": "Export payroll"},
            {"module": ModuleType.PAYROLL, "level": PermissionLevel.PRINT, "name": "payroll.print", "description": "Print payroll"},
            
            # Attendance permissions
            {"module": ModuleType.ATTENDANCE, "level": PermissionLevel.VIEW, "name": "attendance.view", "description": "View attendance"},
            {"module": ModuleType.ATTENDANCE, "level": PermissionLevel.CREATE, "name": "attendance.create", "description": "Create attendance"},
            {"module": ModuleType.ATTENDANCE, "level": PermissionLevel.EDIT, "name": "attendance.edit", "description": "Edit attendance"},
            {"module": ModuleType.ATTENDANCE, "level": PermissionLevel.DELETE, "name": "attendance.delete", "description": "Delete attendance"},
            {"module": ModuleType.ATTENDANCE, "level": PermissionLevel.EXPORT, "name": "attendance.export", "description": "Export attendance"},
            
            # Expense permissions
            {"module": ModuleType.EXPENSES, "level": PermissionLevel.VIEW, "name": "expenses.view", "description": "View expenses"},
            {"module": ModuleType.EXPENSES, "level": PermissionLevel.CREATE, "name": "expenses.create", "description": "Create expenses"},
            {"module": ModuleType.EXPENSES, "level": PermissionLevel.EDIT, "name": "expenses.edit", "description": "Edit expenses"},
            {"module": ModuleType.EXPENSES, "level": PermissionLevel.DELETE, "name": "expenses.delete", "description": "Delete expenses"},
            {"module": ModuleType.EXPENSES, "level": PermissionLevel.APPROVE, "name": "expenses.approve", "description": "Approve expenses"},
            {"module": ModuleType.EXPENSES, "level": PermissionLevel.EXPORT, "name": "expenses.export", "description": "Export expenses"},
            
            # Report permissions
            {"module": ModuleType.REPORTS, "level": PermissionLevel.VIEW, "name": "reports.view", "description": "View reports"},
            {"module": ModuleType.REPORTS, "level": PermissionLevel.EXPORT, "name": "reports.export", "description": "Export reports"},
            {"module": ModuleType.REPORTS, "level": PermissionLevel.PRINT, "name": "reports.print", "description": "Print reports"},
            
            # Settings permissions
            {"module": ModuleType.SETTINGS, "level": PermissionLevel.VIEW, "name": "settings.view", "description": "View settings"},
            {"module": ModuleType.SETTINGS, "level": PermissionLevel.EDIT, "name": "settings.edit", "description": "Edit settings"},
            
            # User permissions
            {"module": ModuleType.USERS, "level": PermissionLevel.VIEW, "name": "users.view", "description": "View users"},
            {"module": ModuleType.USERS, "level": PermissionLevel.CREATE, "name": "users.create", "description": "Create users"},
            {"module": ModuleType.USERS, "level": PermissionLevel.EDIT, "name": "users.edit", "description": "Edit users"},
            {"module": ModuleType.USERS, "level": PermissionLevel.DELETE, "name": "users.delete", "description": "Delete users"},
            
            # Role permissions
            {"module": ModuleType.ROLES, "level": PermissionLevel.VIEW, "name": "roles.view", "description": "View roles"},
            {"module": ModuleType.ROLES, "level": PermissionLevel.CREATE, "name": "roles.create", "description": "Create roles"},
            {"module": ModuleType.ROLES, "level": PermissionLevel.EDIT, "name": "roles.edit", "description": "Edit roles"},
            {"module": ModuleType.ROLES, "level": PermissionLevel.DELETE, "name": "roles.delete", "description": "Delete roles"},
        ]
        
        created_count = 0
        for perm_data in default_permissions:
            # Check if permission already exists
            existing = self.db.query(Permission).filter(
                and_(
                    Permission.module == perm_data["module"],
                    Permission.level == perm_data["level"]
                )
            ).first()
            
            if not existing:
                permission = Permission(**perm_data)
                self.db.add(permission)
                created_count += 1
        
        if created_count > 0:
            self.db.commit()
        
        return created_count
    
    def initialize_default_roles(self, created_by: int):
        """Initialize default roles with their permissions"""
        default_roles = [
            {
                "name": "Super Admin",
                "description": "Full system access with all permissions",
                "level": RoleLevel.SUPER_ADMIN,
                "is_system_role": True
            },
            {
                "name": "Admin",
                "description": "Operational administrator with management permissions",
                "level": RoleLevel.ADMIN,
                "is_system_role": True
            },
            {
                "name": "Accountant",
                "description": "Accounting staff with financial permissions",
                "level": RoleLevel.ACCOUNTANT,
                "is_system_role": True
            },
            {
                "name": "Manager",
                "description": "Management role with view permissions",
                "level": RoleLevel.MANAGER,
                "is_system_role": True
            },
            {
                "name": "HR",
                "description": "Human resources role with employee management",
                "level": RoleLevel.HR,
                "is_system_role": True
            },
            {
                "name": "Viewer",
                "description": "Read-only access to system",
                "level": RoleLevel.VIEWER,
                "is_system_role": True
            }
        ]
        
        created_roles = []
        for role_data in default_roles:
            # Check if role already exists
            existing = self.db.query(Role).filter(Role.name == role_data["name"]).first()
            
            if not existing:
                role = Role(**role_data, created_by=created_by)
                self.db.add(role)
                created_roles.append(role)
            else:
                created_roles.append(existing)
        
        self.db.commit()
        
        # Assign permissions to roles (except Super Admin which gets all permissions via is_superuser)
        role_permissions = {
            "Admin": [
                (ModuleType.DASHBOARD, PermissionLevel.VIEW),
                (ModuleType.EMPLOYEES, PermissionLevel.VIEW), (ModuleType.EMPLOYEES, PermissionLevel.CREATE), 
                (ModuleType.EMPLOYEES, PermissionLevel.EDIT), (ModuleType.EMPLOYEES, PermissionLevel.DELETE),
                (ModuleType.EMPLOYEES, PermissionLevel.EXPORT), (ModuleType.EMPLOYEES, PermissionLevel.PRINT),
                (ModuleType.PAYROLL, PermissionLevel.VIEW), (ModuleType.PAYROLL, PermissionLevel.CREATE),
                (ModuleType.PAYROLL, PermissionLevel.EDIT), (ModuleType.PAYROLL, PermissionLevel.APPROVE),
                (ModuleType.PAYROLL, PermissionLevel.EXPORT), (ModuleType.PAYROLL, PermissionLevel.PRINT),
                (ModuleType.ATTENDANCE, PermissionLevel.VIEW), (ModuleType.ATTENDANCE, PermissionLevel.CREATE),
                (ModuleType.ATTENDANCE, PermissionLevel.EDIT), (ModuleType.ATTENDANCE, PermissionLevel.EXPORT),
                (ModuleType.EXPENSES, PermissionLevel.VIEW), (ModuleType.EXPENSES, PermissionLevel.CREATE),
                (ModuleType.EXPENSES, PermissionLevel.EDIT), (ModuleType.EXPENSES, PermissionLevel.APPROVE),
                (ModuleType.EXPENSES, PermissionLevel.EXPORT),
                (ModuleType.REPORTS, PermissionLevel.VIEW), (ModuleType.REPORTS, PermissionLevel.EXPORT),
                (ModuleType.REPORTS, PermissionLevel.PRINT),
                (ModuleType.SETTINGS, PermissionLevel.VIEW)
            ],
            "Accountant": [
                (ModuleType.DASHBOARD, PermissionLevel.VIEW),
                (ModuleType.EMPLOYEES, PermissionLevel.VIEW), (ModuleType.EMPLOYEES, PermissionLevel.EXPORT),
                (ModuleType.PAYROLL, PermissionLevel.VIEW), (ModuleType.PAYROLL, PermissionLevel.CREATE),
                (ModuleType.PAYROLL, PermissionLevel.EDIT), (ModuleType.PAYROLL, PermissionLevel.EXPORT),
                (ModuleType.PAYROLL, PermissionLevel.PRINT),
                (ModuleType.ATTENDANCE, PermissionLevel.VIEW), (ModuleType.ATTENDANCE, PermissionLevel.EXPORT),
                (ModuleType.EXPENSES, PermissionLevel.VIEW), (ModuleType.EXPENSES, PermissionLevel.CREATE),
                (ModuleType.EXPENSES, PermissionLevel.EDIT), (ModuleType.EXPENSES, PermissionLevel.EXPORT),
                (ModuleType.REPORTS, PermissionLevel.VIEW), (ModuleType.REPORTS, PermissionLevel.EXPORT),
                (ModuleType.REPORTS, PermissionLevel.PRINT)
            ],
            "Manager": [
                (ModuleType.DASHBOARD, PermissionLevel.VIEW),
                (ModuleType.EMPLOYEES, PermissionLevel.VIEW), (ModuleType.EMPLOYEES, PermissionLevel.EXPORT),
                (ModuleType.PAYROLL, PermissionLevel.VIEW), (ModuleType.PAYROLL, PermissionLevel.EXPORT),
                (ModuleType.PAYROLL, PermissionLevel.PRINT),
                (ModuleType.ATTENDANCE, PermissionLevel.VIEW), (ModuleType.ATTENDANCE, PermissionLevel.EXPORT),
                (ModuleType.EXPENSES, PermissionLevel.VIEW), (ModuleType.EXPENSES, PermissionLevel.EXPORT),
                (ModuleType.REPORTS, PermissionLevel.VIEW), (ModuleType.REPORTS, PermissionLevel.EXPORT),
                (ModuleType.REPORTS, PermissionLevel.PRINT)
            ],
            "HR": [
                (ModuleType.DASHBOARD, PermissionLevel.VIEW),
                (ModuleType.EMPLOYEES, PermissionLevel.VIEW), (ModuleType.EMPLOYEES, PermissionLevel.CREATE),
                (ModuleType.EMPLOYEES, PermissionLevel.EDIT), (ModuleType.EMPLOYEES, PermissionLevel.EXPORT),
                (ModuleType.PAYROLL, PermissionLevel.VIEW), (ModuleType.PAYROLL, PermissionLevel.EXPORT),
                (ModuleType.ATTENDANCE, PermissionLevel.VIEW), (ModuleType.ATTENDANCE, PermissionLevel.EXPORT),
                (ModuleType.REPORTS, PermissionLevel.VIEW), (ModuleType.REPORTS, PermissionLevel.EXPORT)
            ],
            "Viewer": [
                (ModuleType.DASHBOARD, PermissionLevel.VIEW),
                (ModuleType.EMPLOYEES, PermissionLevel.VIEW),
                (ModuleType.PAYROLL, PermissionLevel.VIEW),
                (ModuleType.ATTENDANCE, PermissionLevel.VIEW),
                (ModuleType.EXPENSES, PermissionLevel.VIEW),
                (ModuleType.REPORTS, PermissionLevel.VIEW)
            ]
        }
        
        # Grant permissions to roles
        for role_name, permissions in role_permissions.items():
            role = self.db.query(Role).filter(Role.name == role_name).first()
            if role:
                for module, level in permissions:
                    permission = self.db.query(Permission).filter(
                        and_(
                            Permission.module == module,
                            Permission.level == level
                        )
                    ).first()
                    
                    if permission:
                        self.grant_permission_to_role(role.id, permission.id, created_by)
        
        return len(created_roles)