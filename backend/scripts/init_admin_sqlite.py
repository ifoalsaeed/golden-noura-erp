#!/usr/bin/env python3
"""
Script to initialize default admin user for Golden Noura ERP
Username: admin
Password: admin123
Role: Super Admin
"""

import sqlite3
import hashlib
import secrets
from datetime import datetime

def create_default_admin():
    """Create default admin user with Super Admin role"""
    
    # Connect to SQLite database
    conn = sqlite3.connect('golden_noura_erp.db')
    cursor = conn.cursor()
    
    try:
        # Check if admin user already exists
        cursor.execute("SELECT id FROM users WHERE username = 'admin'")
        existing_admin = cursor.fetchone()
        
        if existing_admin:
            print("⚠️  Admin user already exists!")
            return
        
        print("🔄 Creating default roles and permissions...")
        
        # Create Super Admin role
        cursor.execute("""
            INSERT OR IGNORE INTO roles (name, description, level, is_active, is_system_role, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            "Super Admin",
            "Full system administrator with all permissions",
            "SUPER_ADMIN",
            True,
            True,
            datetime.utcnow(),
            datetime.utcnow()
        ))
        
        # Get the Super Admin role ID
        cursor.execute("SELECT id FROM roles WHERE level = 'SUPER_ADMIN'")
        super_admin_role_id = cursor.fetchone()[0]
        
        # Create basic permissions
        permissions = [
            # Dashboard permissions
            ("DASHBOARD", "VIEW", "dashboard.view", "View dashboard"),
            ("DASHBOARD", "CREATE", "dashboard.create", "Create dashboard items"),
            ("DASHBOARD", "EDIT", "dashboard.edit", "Edit dashboard"),
            ("DASHBOARD", "DELETE", "dashboard.delete", "Delete dashboard items"),
            
            # Employee permissions
            ("EMPLOYEES", "VIEW", "employees.view", "View employees"),
            ("EMPLOYEES", "CREATE", "employees.create", "Create employees"),
            ("EMPLOYEES", "EDIT", "employees.edit", "Edit employees"),
            ("EMPLOYEES", "DELETE", "employees.delete", "Delete employees"),
            
            # Payroll permissions
            ("PAYROLL", "VIEW", "payroll.view", "View payroll"),
            ("PAYROLL", "CREATE", "payroll.create", "Create payroll"),
            ("PAYROLL", "EDIT", "payroll.edit", "Edit payroll"),
            ("PAYROLL", "DELETE", "payroll.delete", "Delete payroll"),
            ("PAYROLL", "APPROVE", "payroll.approve", "Approve payroll"),
            
            # Settings permissions
            ("SETTINGS", "VIEW", "settings.view", "View settings"),
            ("SETTINGS", "CREATE", "settings.create", "Create settings"),
            ("SETTINGS", "EDIT", "settings.edit", "Edit settings"),
            ("SETTINGS", "DELETE", "settings.delete", "Delete settings"),
            
            # Users permissions
            ("USERS", "VIEW", "users.view", "View users"),
            ("USERS", "CREATE", "users.create", "Create users"),
            ("USERS", "EDIT", "users.edit", "Edit users"),
            ("USERS", "DELETE", "users.delete", "Delete users"),
            
            # Roles permissions
            ("ROLES", "VIEW", "roles.view", "View roles"),
            ("ROLES", "CREATE", "roles.create", "Create roles"),
            ("ROLES", "EDIT", "roles.edit", "Edit roles"),
            ("ROLES", "DELETE", "roles.delete", "Delete roles"),
        ]
        
        for module, level, name, description in permissions:
            cursor.execute("""
                INSERT OR IGNORE INTO permissions (module, level, name, description, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (module, level, name, description, True, datetime.utcnow()))
        
        # Grant all permissions to Super Admin role
        cursor.execute("SELECT id FROM permissions WHERE is_active = 1")
        permission_ids = cursor.fetchall()
        
        for (permission_id,) in permission_ids:
            cursor.execute("""
                INSERT OR IGNORE INTO role_permissions (role_id, permission_id, is_granted, created_at, created_by)
                VALUES (?, ?, ?, ?, ?)
            """, (super_admin_role_id, permission_id, True, datetime.utcnow(), 1))
        
        # Create admin user
        # Use a simple hash for now (in production, use bcrypt)
        password_hash = hashlib.sha256("admin123".encode()).hexdigest()
        
        cursor.execute("""
            INSERT INTO users (username, email, hashed_password, full_name, is_active, is_superuser, role_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "admin",
            "admin@golden-noura.com",
            password_hash,
            "System Administrator",
            True,
            True,
            super_admin_role_id,
            datetime.utcnow(),
            datetime.utcnow()
        ))
        
        admin_user_id = cursor.lastrowid
        
        # Assign Super Admin role to admin user
        cursor.execute("""
            INSERT INTO user_roles (user_id, role_id, is_active, assigned_at, assigned_by)
            VALUES (?, ?, ?, ?, ?)
        """, (admin_user_id, super_admin_role_id, True, datetime.utcnow(), admin_user_id))
        
        conn.commit()
        
        print("🎉 Default admin user created successfully!")
        print("=" * 50)
        print(f"👤 Username: admin")
        print(f"🔑 Password: admin123")
        print(f"📧 Email: admin@golden-noura.com")
        print(f"👑 Role: Super Admin")
        print(f"🆔 User ID: {admin_user_id}")
        print("=" * 50)
        print("⚠️  IMPORTANT: Please change the default password after first login!")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {str(e)}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Golden Noura ERP - Admin User Initialization")
    print("=" * 50)
    create_default_admin()
    print("=" * 50)