import sqlite3
import os

db_path = r'c:\Users\ا\Desktop\mohsba\golden_noura_erp\backend\sql_app.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT username, full_name, avatar_url FROM users")
    rows = cursor.fetchall()
    for row in rows:
        print(f"Username: {row[0]}, Full Name: {row[1]}, Avatar: {row[2]}")
    conn.close()
else:
    print(f"DB not found at {db_path}")
