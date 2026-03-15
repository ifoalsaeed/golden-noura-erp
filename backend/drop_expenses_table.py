from db.database import engine
from sqlalchemy import text

def drop_expenses_table():
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS expenses"))
        conn.commit()
    print("Expenses table dropped.")

if __name__ == "__main__":
    drop_expenses_table()
