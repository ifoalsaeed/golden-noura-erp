from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from api.routes import api_router
from core.config import settings
from db.database import engine, Base
from sqlalchemy import text
from core.security import get_password_hash
from sqlalchemy.exc import OperationalError

# Create DB tables (In production use Alembic)
Base.metadata.create_all(bind=engine)

def ensure_schema():
    # Lightweight migration for SQLite to support journal headers and new columns
    try:
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS journal_headers (
                    id INTEGER PRIMARY KEY,
                    date DATE,
                    description TEXT,
                    source_type TEXT,
                    source_id INTEGER,
                    reference TEXT,
                    created_at DATETIME
                )
            """))
            # Add columns to journal_entries if missing
            cols = conn.execute(text("PRAGMA table_info('journal_entries')")).fetchall()
            names = {c[1] for c in cols}
            if 'header_id' not in names:
                conn.execute(text("ALTER TABLE journal_entries ADD COLUMN header_id INTEGER NULL"))
            if 'line_number' not in names:
                conn.execute(text("ALTER TABLE journal_entries ADD COLUMN line_number INTEGER NULL"))
            # Ensure users table has new columns
            cols_u = conn.execute(text("PRAGMA table_info('users')")).fetchall()
            names_u = {c[1] for c in cols_u}
            if 'full_name' not in names_u:
                conn.execute(text("ALTER TABLE users ADD COLUMN full_name TEXT NULL"))
            if 'avatar_url' not in names_u:
                conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url TEXT NULL"))
            # Ensure admin user exists and has ADMIN role
            conn.execute(text("""
                INSERT OR IGNORE INTO users (id, username, full_name, hashed_password, role, is_active)
                VALUES (1, 'admin', 'السعيد الوزان', '', 'ADMIN', 1)
            """))
            # Update admin user to have full name if missing
            conn.execute(text("""
                UPDATE users SET full_name = 'السعيد الوزان' 
                WHERE username = 'admin' AND (full_name IS NULL OR full_name = '')
            """))
            # Update any existing users without full names (except admin which we set specifically)
            conn.execute(text("""
                UPDATE users SET full_name = username 
                WHERE full_name IS NULL OR full_name = '' AND username != 'admin'
            """))
            # Set default admin password if empty
            row = conn.execute(text("SELECT hashed_password FROM users WHERE username='admin'")).fetchone()
            if row and (row[0] is None or row[0] == ''):
                conn.execute(
                    text("UPDATE users SET hashed_password = :hp, is_active = 1, role = 'ADMIN' WHERE username = 'admin'"),
                    {"hp": get_password_hash("admin123")}
                )
    except OperationalError:
        pass

ensure_schema()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Golden Noura Manpower Supply ERP",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount static for serving uploaded avatars and files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def root():
    return {"message": "Welcome to Golden Noura ERP API"}

@app.get("/test")
def test():
    return {"status": "working", "auth_endpoint": "/api/v1/auth/me"}
