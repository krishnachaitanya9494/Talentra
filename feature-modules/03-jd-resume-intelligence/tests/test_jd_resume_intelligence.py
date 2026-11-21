import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.insert(0, _MOD_ROOT)

"""
Independent Pytest Suite for Module 03: JD & Resume Intelligence Comparison.
"""

import pytest
from starlette.testclient import TestClient
from backend.comparison_app import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_get_comparison_targets():
    res = client.get("/api/v1/jd-resume-intelligence/targets")
    assert res.status_code == 200
    data = res.json()
    assert "jds" in data
    assert "candidates" in data
    assert len(data["candidates"]) >= 4

def test_analyze_comparison():
    payload = {"target_req_id": 1, "candidate_id": 133}
    res = client.post("/api/v1/jd-resume-intelligence/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "match_score" in data
    assert "grounded_evidence" in data
    assert len(data["grounded_evidence"]) >= 1
    assert data["candidate_name"] == "Lavanya Gudibanda"
