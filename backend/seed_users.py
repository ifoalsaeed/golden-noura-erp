from sqlalchemy.orm import Session
from db.database import engine, Base, SessionLocal
from db.models import User, RoleEnum
from core.security import get_password_hash

def seed_users():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if user adnin exists
    user = db.query(User).filter(User.username == "adnin").first()
    if user:
        print("User 'adnin' already exists. Updating password...")
        user.hashed_password = get_password_hash("123")
        user.role = RoleEnum.ADMIN
    else:
        print("Creating user 'adnin'...")
        new_user = User(
            username="adnin",
            hashed_password=get_password_hash("123"),
            role=RoleEnum.ADMIN,
            is_active=True
        )
        db.add(new_user)
    
    # Also create 'admin' just in case it was a typo
    user_admin = db.query(User).filter(User.username == "admin").first()
    if not user_admin:
        db.add(User(
            username="admin",
            hashed_password=get_password_hash("admin123"),
            role=RoleEnum.ADMIN,
            is_active=True
        ))

    db.commit()
    db.close()
    print("User seed completed.")

if __name__ == "__main__":
    seed_users()
