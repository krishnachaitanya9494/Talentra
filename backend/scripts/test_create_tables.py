from backend.app.database.session import engine
from backend.app.models.base import Base
import backend.app.models

print("Existing tables count:", len(Base.metadata.tables))
Base.metadata.create_all(bind=engine)
print("Create all completed safely.")
