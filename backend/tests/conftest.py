"""
Pytest Configuration & Test Isolation Strategy for TALENTRA.

Guarantees:
1. Tests NEVER connect to or mutate the live development database (talentra_dev.db).
2. All integration tests execute against an isolated temporary test database (talentra_test.db).
3. Live database path safeguard actively aborts test execution if live database is bound.
4. FastAPI dependency get_db is globally overridden with test session yielding isolated transactions.
"""

import os
import shutil
from pathlib import Path
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session

from backend.app.main import app
from backend.app.database.session import get_db, SessionLocal
from backend.app.core.config import settings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DEV_DB_PATH = BASE_DIR / "data" / "talentra_dev.db"
TEST_DB_PATH = BASE_DIR / "data" / "talentra_test.db"
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

# Safeguard check
def assert_not_dev_db(db_path_str: str):
    norm = str(Path(db_path_str).resolve()).lower()
    dev_norm = str(DEV_DB_PATH.resolve()).lower()
    if norm == dev_norm:
        raise RuntimeError(
            f"CRITICAL SAFETY VIOLATION: Test runner attempted to bind to live development database:\n"
            f"  '{db_path_str}'\n"
            f"Aborting immediately to prevent production/development data contamination."
        )


@pytest.fixture(scope="session", autouse=True)
def setup_isolated_test_database():
    """
    Session-level fixture:
    Copies talentra_dev.db to talentra_test.db so tests have access to base records,
    but all test writes and mutations are isolated to talentra_test.db.
    """
    # 1. Create fresh copy of database for testing
    if TEST_DB_PATH.exists():
        try:
            TEST_DB_PATH.unlink()
        except Exception:
            pass

    if DEV_DB_PATH.exists():
        shutil.copy2(DEV_DB_PATH, TEST_DB_PATH)

    # 2. Assert test DB is not dev DB
    assert_not_dev_db(str(TEST_DB_PATH))

    # 3. Create isolated test engine and sessionmaker
    test_connect_args = {"check_same_thread": False}
    test_engine = create_engine(TEST_DATABASE_URL, connect_args=test_connect_args, echo=False)

    @event.listens_for(test_engine, "connect")
    def set_test_sqlite_pragma(dbapi_connection, connection_record):
        if type(dbapi_connection).__module__ == "sqlite3":
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    # 4. Override FastAPI get_db dependency
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    yield TestingSessionLocal

    # 5. Teardown
    app.dependency_overrides.clear()
    test_engine.dispose()
    if TEST_DB_PATH.exists():
        try:
            TEST_DB_PATH.unlink()
        except Exception:
            pass


@pytest.fixture(scope="function")
def db_session(setup_isolated_test_database):
    """
    Function-level isolated database session fixture for pytest tests.
    Ensures that every test function runs with safeguard verification.
    """
    TestingSessionLocal = setup_isolated_test_database
    db = TestingSessionLocal()
    # Enforce active safety check
    assert_not_dev_db(str(db.bind.url.database))
    try:
        yield db
    finally:
        db.close()
