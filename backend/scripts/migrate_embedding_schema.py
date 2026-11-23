"""
Safe, non-destructive additive migration for embedding tables.
Adds 'is_fallback' and 'provider' columns if missing.
"""
import sqlite3
from pathlib import Path

db_path = Path(__file__).resolve().parent.parent.parent / "data" / "talentra_dev.db"
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

for table in ["resume_embeddings", "job_embeddings"]:
    cursor.execute(f"PRAGMA table_info({table})")
    cols = [c[1] for c in cursor.fetchall()]
    if "is_fallback" not in cols:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN is_fallback BOOLEAN DEFAULT 1")
        print(f"Added is_fallback to {table}")
    if "provider" not in cols:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN provider VARCHAR(50) DEFAULT 'openrouter'")
        print(f"Added provider to {table}")

conn.commit()
conn.close()
print("Additive schema check complete.")
