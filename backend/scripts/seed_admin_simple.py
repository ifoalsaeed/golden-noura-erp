#!/usr/bin/env python3
import sys, os, sqlite3
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from datetime import datetime
from core.security import get_password_hash

def main():
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sql_app.db")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    try:
        cur.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, hashed_password TEXT, role TEXT, is_active INTEGER, last_login DATETIME)")
        cur.execute("SELECT id FROM users WHERE username = ?", ("admin",))
        row = cur.fetchone()
        if row:
            print("Admin user already exists - resetting password to default")
            hashed = get_password_hash("admin123")
            cur.execute("UPDATE users SET hashed_password = ?, role = ?, is_active = 1 WHERE username = ?", (hashed, "ADMIN", "admin"))
            conn.commit()
            print("Admin password reset")
        else:
            hashed = get_password_hash("admin123")
            cur.execute("INSERT INTO users (username, hashed_password, role, is_active, last_login) VALUES (?, ?, ?, ?, ?)", ("admin", hashed, "ADMIN", 1, None))
            conn.commit()
            print("Admin user created")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
