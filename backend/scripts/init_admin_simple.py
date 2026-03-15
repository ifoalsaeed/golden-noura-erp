#!/usr/bin/env python3
"""
Script to initialize default admin user for Golden Noura ERP
Username: admin
Password: admin123
Role: Super Admin
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from db.database import Base
from db.rbac_models import User, Role, Permission, RolePermission, UserRole, RoleLevel, ModuleType, PermissionLevel
from datetime import datetime

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password for storing."""
    return pwd_context.hash(password)

def create_default_admin():
    """Create default admin user with Super Admin role"""
    
    # Create database connection
    SQLALCHEMY_DATABASE_URL = "sqlite:///./golden_noura_erp.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        
        # Check if admin user already exists
        result = db.execute(text("SELECT id FROM users WHERE username = 'admin'"))
        existing_admin = result.fetchone()
        
        if existing_admin:
            print("⚠️  Admin user already exists!")
            return
        
        print("🔄 Creating default roles and permissions...")
        
        # Create Super Admin role
        super_admin_role = db.query(Role).filter(Role.level == RoleLevel.SUPER_ADMIN).first()
        if not super_admin_role:
            super_admin_role = Role(
                name="Super Admin",
                description="Full system administrator with all permissions",
                level=RoleLevel.SUPER_ADMIN,
                is_active=True,
                is_system_role=True,
                created_at=datetime.utcnow()
            )
            db.add(super_admin_role)
            db.flush()
        
        # Create basic permissions
        permissions = []
        permission_data = [
            # Dashboard permissions
            (ModuleType.DASHBOARD, PermissionLevel.VIEW, "dashboard.view", "View dashboard"),
            (ModuleType.DASHBOARD, PermissionLevel.CREATE, "dashboard.create", "Create dashboard items"),
            (ModuleType.DASHBOARD, PermissionLevel.EDIT, "dashboard.edit", "Edit dashboard"),
            (ModuleType.DASHBOARD, PermissionLevel.DELETE, "dashboard.delete", "Delete dashboard items"),
            
            # Employee permissions
            (ModuleType.EMPLOYEES, PermissionLevel.VIEW, "employees.view", "View employees"),
            (ModuleType.EMPLOYEES, PermissionLevel.CREATE, "employees.create", "Create employees"),
            (ModuleType.EMPLOYEES, PermissionLevel.EDIT, "employees.edit", "Edit employees"),
            (ModuleType.EMPLOYEES, PermissionLevel.DELETE, "employees.delete", "Delete employees"),
            
            # Payroll permissions
            (ModuleType.PAYROLL, PermissionLevel.VIEW, "payroll.view", "View payroll"),
            (ModuleType.PAYROLL, PermissionLevel.CREATE, "payroll.create", "Create payroll"),
            (ModuleType.PAYROLL, PermissionLevel.EDIT, "payroll.edit", "Edit payroll"),
            (ModuleType.PAYROLL, PermissionLevel.DELETE, "payroll.delete", "Delete payroll"),
            (ModuleType.PAYROLL, PermissionLevel.APPROVE, "payroll.approve", "Approve payroll"),
            
            # Settings permissions
            (ModuleType.SETTINGS, PermissionLevel.VIEW, "settings.view", "View settings"),
            (ModuleType.SETTINGS, PermissionLevel.CREATE, "settings.create", "Create settings"),
            (ModuleType.SETTINGS, PermissionLevel.EDIT, "settings.edit", "Edit settings"),
            (ModuleType.SETTINGS, PermissionLevel.DELETE, "settings.delete", "Delete settings"),
            
            # Users permissions
            (ModuleType.USERS, PermissionLevel.VIEW, "users.view", "View users"),
            (ModuleType.USERS, PermissionLevel.CREATE, "users.create", "Create users"),
            (ModuleType.USERS, PermissionLevel.EDIT, "users.edit", "Edit users"),
            (ModuleType.USERS, PermissionLevel.DELETE, "users.delete", "Delete users"),
            
            # Roles permissions
            (ModuleType.ROLES, PermissionLevel.VIEW, "roles.view", "View roles"),
            (ModuleType.ROLES, PermissionLevel.CREATE, "roles.create", "Create roles"),
            (ModuleType.ROLES, PermissionLevel.EDIT, "roles.edit", "Edit roles"),
            (ModuleType.ROLES, PermissionLevel.DELETE, "roles.delete", "Delete roles"),
        ]
        
        for module, level, name, description in permission_data:
            perm = db.query(Permission).filter(Permission.name == name).first()
            if not perm:
                perm = Permission(
                    module=module,
                    level=level,
                    name=name,
                    description=description,
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                db.add(perm)
                permissions.append(perm)
        
        db.flush()
        
        # Grant all permissions to Super Admin role
        for perm in permissions:
            role_perm = db.query(RolePermission).filter(
                RolePermission.role_id == super_admin_role.id,
                RolePermission.permission_id == perm.id
            ).first()
            
            if not role_perm:
                role_perm = RolePermission(
                    role_id=super_admin_role.id,
                    permission_id=perm.id,
                    is_granted=True,
                    created_at=datetime.utcnow()
                )
                db.add(role_perm)
        
        # Create admin user
        admin_user = User(
            username="admin",
            email="admin@golden-noura.com",
            hashed_password=hash_password("admin123"),
            full_name="System Administrator",
            is_active=True,
            is_superuser=True,
            role_id=super_admin_role.id,
            created_at=datetime.utcnow()
        )
        
        db.add(admin_user)
        db.flush()
        
        # Assign Super Admin role to admin user
        user_role = UserRole(
            user_id=admin_user.id,
            role_id=super_admin_role.id,
            is_active=True,
            assigned_at=datetime.utcnow(),
            assigned_by=admin_user.id
        )
        db.add(user_role)
        
        db.commit()
        
        print("🎉 Default admin user created successfully!")
        print("=" * 50)
        print(f"👤 Username: admin")
        print(f"🔑 Password: admin123")
        print(f"📧 Email: admin@golden-noura.com")
        print(f"👑 Role: Super Admin")
        print(f"🆔 User ID: {admin_user.id}")
        print("=" * 50)
        print("⚠️  IMPORTANT: Please change the default password after first login!")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Golden Noura ERP - Admin User Initialization")
    print("=" * 50)
    create_default_admin()
    print("=" * 50)