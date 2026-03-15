from sqlalchemy.orm import Session
from db.database import SessionLocal, engine
from db.models import Base, User, RoleEnum
from core.security import get_password_hash
# Import payroll_models to register Allowance, Deduction, etc. to avoid relationship errors
try:
    from db import payroll_models
except ImportError:
    pass

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    users = [
        {
            "username": "admin",
            "password": "admin123",
            "role": RoleEnum.ADMIN
        },
        {
            "username": "operator",
            "password": "operator123",
            "role": RoleEnum.DATA_ENTRY
        },
        {
            "username": "viewer",
            "password": "viewer123",
            "role": RoleEnum.REPORT_VIEWER
        }
    ]
    
    for user_data in users:
        user = db.query(User).filter(User.username == user_data["username"]).first()
        if not user:
            print(f"Creating user: {user_data['username']} with role {user_data['role']}")
            hashed_password = get_password_hash(user_data["password"])
            db_user = User(
                username=user_data["username"],
                hashed_password=hashed_password,
                role=user_data["role"],
                is_active=True
            )
            db.add(db_user)
        else:
            print(f"Updating role for user: {user_data['username']} to {user_data['role']}")
            user.role = user_data["role"]
            user.hashed_password = get_password_hash(user_data["password"]) # Reset password just in case
            
    db.commit()
    db.close()

if __name__ == "__main__":
    print("Seeding users...")
    init_db()
    print("Users seeded successfully!")
