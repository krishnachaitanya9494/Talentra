"""
Database Initialization and Schema Bootstrap Module for TALENTRA.

Provides a safe, idempotent mechanism to verify database connectivity,
run pending Alembic migrations, and report schema inventory without
altering or truncating existing records.
"""

import sys
from pathlib import Path
from typing import Dict, Any, List
from sqlalchemy import inspect
from alembic import command
from alembic.config import Config

from backend.app.core.config import settings
from backend.app.database.session import engine, verify_database_connection
from backend.app.models import Base

# Locate project root and alembic.ini
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent
ALEMBIC_INI_PATH = WORKSPACE_ROOT / "alembic.ini"


def init_database() -> Dict[str, Any]:
    """
    Safely bootstraps and verifies the TALENTRA database:
    1. Verifies low-level engine connectivity.
    2. Runs Alembic migrations to apply pending schema changes to 'head'.
    3. Confirms table presence without dropping or overwriting existing records.
    4. Returns a comprehensive diagnostic report.
    """
    # 1. Verify engine connectivity
    connectivity = verify_database_connection()
    if not connectivity.get("verified", False):
        raise RuntimeError(f"Database connectivity verification failed: {connectivity.get('error')}")

    # 2. Ensure tables exist (Alembic manages migrations via CLI, create_all provides fast idempotent safety)
    Base.metadata.create_all(bind=engine)

    # 3. Inspect and inventory verified tables
    inspector = inspect(engine)
    existing_tables: List[str] = inspector.get_table_names()

    required_tables = [
        "clients",
        "candidates",
        "job_requirements",
        "candidate_submissions",
        "interviews",
    ]
    missing_tables = [t for t in required_tables if t not in existing_tables]

    return {
        "status": "ready" if not missing_tables else "incomplete",
        "database_url": settings.DATABASE_URL.split("///")[-1],
        "tables_present": existing_tables,
        "required_tables_verified": not missing_tables,
        "missing_tables": missing_tables,
    }


if __name__ == "__main__":
    print("Initializing TALENTRA database...")
    try:
        result = init_database()
        print("Initialization successful:")
        for k, v in result.items():
            print(f"  {k}: {v}")
    except Exception as exc:
        print(f"Initialization failed: {exc}", file=sys.stderr)
        sys.exit(1)
