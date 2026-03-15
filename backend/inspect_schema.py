
import sqlite3

def inspect_db():
    conn = sqlite3.connect('sql_app.db')
    cursor = conn.cursor()
    
    tables = ['contracts', 'payrolls', 'expenses']
    for table in tables:
        print(f"\nSchema for {table}:")
        try:
            cursor.execute(f"PRAGMA table_info({table})")
            columns = cursor.fetchall()
            for col in columns:
                print(col)
        except Exception as e:
            print(f"Error inspecting {table}: {e}")
            
    conn.close()

if __name__ == "__main__":
    inspect_db()
