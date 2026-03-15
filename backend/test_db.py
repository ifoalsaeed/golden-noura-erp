from db.database import engine, Base
import models # ensure models are imported
try:
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")
except Exception as e:
    print(f"Error: {e}")
