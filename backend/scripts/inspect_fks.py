from backend.app.database.session import SessionLocal
from backend.app.models.base import Base
import backend.app.models  # load all models

db = SessionLocal()

print("Tables in Base.metadata:")
for table_name, table in Base.metadata.tables.items():
    fk_list = [f"{c.name} -> {fk.target_fullname}" for c in table.columns for fk in c.foreign_keys]
    if fk_list:
        print(f"  {table_name}: {fk_list}")

db.close()
