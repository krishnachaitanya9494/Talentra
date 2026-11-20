"""
Database Engine and Session Management Module for TALENTRA.

Establishes an isolated SQLAlchemy connection to the local SQLite database,
enforces SQLite foreign key integrity constraints, manages session lifecycles,
and provides connectivity diagnostics.
"""

from typing import Generator, Dict, Any
from sqlalchemy import create_engine, text, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session
from backend.app.core.config import settings
from backend.app.models.base import Base

# In SQLite, multiple threads (FastAPI request handlers) can share the connection
# safely only when check_same_thread is disabled.
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

# SQLAlchemy Engine: the core interface to the database dialect and connection pool
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    # echo=False prevents verbose SQL logging from cluttering development output
    echo=False,
)


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """
    Ensures SQLite enforces foreign key referential integrity constraints (PRAGMA foreign_keys=ON)
    for every newly opened DBAPI connection in SQLite.
    """
    if type(dbapi_connection).__module__ == "sqlite3":
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


# SessionLocal: factory for generating independent database sessions per request
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields an independent database session per request
    and guarantees its closure upon request completion, preventing connection leaks.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        # Guarantee session closure regardless of exceptions during request handling
        db.close()


def verify_database_connection() -> Dict[str, Any]:
    """
    Executes a low-overhead diagnostic query (SELECT 1) against the SQLite engine
    to verify connectivity, dialect health, and file access without touching business data.
    """
    try:
        # Open an explicit raw connection from the engine pool
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1")).scalar()
            is_connected = result == 1
            return {
                "status": "connected" if is_connected else "unexpected_result",
                "engine": engine.name,
                "database_url": settings.DATABASE_URL.split("///")[-1],  # Show relative path only
                "verified": is_connected,
            }
    except Exception as exc:
        # Return structured failure details instead of crashing the application
        return {
            "status": "disconnected",
            "engine": engine.name,
            "error": str(exc),
            "verified": False,
        }
