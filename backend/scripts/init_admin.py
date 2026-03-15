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

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from db.database import Base
from db.rbac_models import User, Role, Permission, RolePermission, UserRole, RoleLevel, ModuleType, PermissionLevel
from services.rbac_service import RBACService
from datetime import datetime

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password for storing."""
    return pwd_context.hash(password)

def create_default_admin():
    """Create default admin user with Super Admin role"""
    
    # Create database connection
    # Use SQLite for simplicity (same as your existing setup)
    SQLALCHEMY_DATABASE_URL = "sqlite:///./golden_noura_erp.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    
    # Create all tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Initialize RBAC service
        rbac_service = RBACService(db)
        
        # Check if admin user already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if existing_admin:
            print("⚠️  Admin user already exists!")
            print(f"   Username: {existing_admin.username}")
            print(f"   Email: {existing_admin.email}")
            print(f"   Role: {existing_admin.role.level if existing_admin.role else 'None'}")
            return
        
        # Initialize system with default roles and permissions
        print("🔄 Initializing RBAC system...")
        permissions_created, roles_created = rbac_service.initialize_system()
        print(f"✅ Created {permissions_created} permissions and {roles_created} roles")
        
        # Get Super Admin role
        super_admin_role = db.query(Role).filter(Role.level == RoleLevel.SUPER_ADMIN).first()
        if not super_admin_role:
            print("❌ Super Admin role not found! Creating it...")
            super_admin_role = Role(
                name="Super Admin",
                description="Full system administrator with all permissions",
                level=RoleLevel.SUPER_ADMIN,
                is_active=True,
                is_system_role=True,
                created_at=datetime.utcnow()
            )
            db.add(super_admin_role)
            db.commit()
            db.refresh(super_admin_role)
        
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
        db.commit()
        db.refresh(admin_user)
        
        # Create user-role assignment
        user_role = UserRole(
            user_id=admin_user.id,
            role_id=super_admin_role.id,
            is_active=True,
            created_at=datetime.utcnow()
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