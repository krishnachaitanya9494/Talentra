import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.insert(0, _MOD_ROOT)

"""
Independent Pytest Suite for Module 02: Candidate Resumes.
"""

import io
import pytest
from starlette.testclient import TestClient
from backend.resumes_app import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_list_candidates():
    res = client.get("/api/v1/candidate-resumes")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 2
    assert any("Lavanya" in c["name"] for c in data)

def test_resume_upload_and_deduplication():
    # First upload
    sample_content = b"Candidate Resume for Senior Cloud Engineer with 8 years experience."
    files = {"file": ("test_resume.pdf", io.BytesIO(sample_content), "application/pdf")}
    res1 = client.post("/api/v1/candidate-resumes/upload", files=files)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["status"] == "success"
    assert data1["is_duplicate"] is False

    # Second upload with same content -> should detect duplicate
    files_dup = {"file": ("test_resume.pdf", io.BytesIO(sample_content), "application/pdf")}
    res2 = client.post("/api/v1/candidate-resumes/upload", files=files_dup)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["is_duplicate"] is True
    assert data2["status"] == "duplicate"
