"""
Automated Backend Infrastructure and Health Verification Tests.

Tests the FastAPI application endpoints and SQLite database connectivity
using the FastAPI TestClient.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import verify_database_connection

client = TestClient(app)


def test_root_endpoint():
    """
    Validates that the root endpoint (GET /) responds with HTTP 200,
    the correct platform identification, and an operational status.
    """
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert data["platform"] == "TALENTRA"
    assert "documentation_url" in data


def test_health_endpoint():
    """
    Validates that the health diagnostic endpoint (GET /health) responds with HTTP 200,
    confirms backend operational status, and verifies that SQLite connectivity is active.
    """
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert data["environment"] == "development"
    assert "database" in data
    assert data["database"]["verified"] is True
    assert data["database"]["status"] == "connected"
    assert data["database"]["engine"] == "sqlite"


def test_database_connection_probe():
    """
    Directly exercises the database verification utility to ensure that
    SQLAlchemy can execute SELECT 1 against the isolated SQLite development database.
    """
    probe_result = verify_database_connection()
    assert probe_result["verified"] is True
    assert probe_result["status"] == "connected"
    assert probe_result["engine"] == "sqlite"
