import pandas as pd
from sqlalchemy.orm import Session
from db.models import Worker

def process_worker_excel(file_path: str, db: Session):
    try:
        df = pd.read_excel(file_path)
        workers_to_add = []
        for index, row in df.iterrows():
            worker = Worker(
                name=row.get("Name"),
                nationality=row.get("Nationality"),
                passport_number=row.get("Passport"),
                profession=row.get("Profession"),
                salary=row.get("Salary")
            )
            workers_to_add.append(worker)
        
        db.add_all(workers_to_add)
        db.commit()
        return {"success": True, "count": len(workers_to_add)}
    except Exception as e:
        return {"success": False, "error": str(e)}
