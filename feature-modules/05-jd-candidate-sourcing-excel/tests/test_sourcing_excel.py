import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.insert(0, _MOD_ROOT)

"""
Independent Pytest Suite for Module 05: JD-Based Candidate Sourcing & Excel Engine.
"""

from io import BytesIO
import openpyxl
import pytest
from starlette.testclient import TestClient
from backend.sourcing_app import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_internal_candidate_search():
    payload = {"boolean_query": "Oracle EPM AND Hyperion", "experience_min": 5.0}
    res = client.post("/api/v1/sourcing/search", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["matched_count"] >= 1
    assert any("Lavanya" in c["name"] for c in data["candidates"])
    assert data["candidates"][0]["source_type"] == "Internal Candidate Database"

def test_excel_export_generation():
    payload = {"candidate_ids": [133, 41], "export_title": "Test_Sourced_Candidates"}
    res = client.post("/api/v1/sourcing/export-excel", json=payload)
    assert res.status_code == 200
    assert "spreadsheetml" in res.headers["content-type"]

    # Verify openpyxl can read the binary workbook
    wb = openpyxl.load_workbook(BytesIO(res.content))
    assert "Matched Candidates" in wb.sheetnames
    ws = wb["Matched Candidates"]
    assert ws.cell(row=1, column=2).value == "Candidate Name"
