import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.insert(0, _MOD_ROOT)

"""
Independent Pytest Suite for Module 04: Resume Data Extraction.
"""

import io
import pytest
from starlette.testclient import TestClient
from backend.extraction_app import app
from backend.extraction_service import ResumeExtractionService

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_deterministic_text_extraction():
    service = ResumeExtractionService()
    sample_text = """
    Rohan Sharma
    Senior Cloud Architect
    Email: rohan.sharma@example.com | Phone: +91 98450 11223
    Total Experience: 8.5 years of experience in enterprise systems.
    Core Skills: Python, AWS, Kubernetes, Terraform, Docker.
    Notice Period: 30 days notice period
    """
    record = service.parse_resume_text("rohan_sharma_resume.pdf", sample_text)
    assert record.name == "Rohan Sharma"
    assert record.email == "rohan.sharma@example.com"
    assert "98450" in record.phone
    assert record.total_experience_years == 8.5
    assert "AWS" in record.skills
    assert "Kubernetes" in record.skills
    assert "30 days" in record.notice_period
    # Compensation was not mentioned -> MUST be empty!
    assert record.compensation == ""
    assert "email" in record.provenance

def test_batch_upload_and_export():
    sample_file = io.BytesIO(b"Aarav Patel\nEmail: aarav@corp.com\nPhone: 9876543210\n5 years of experience\nSkills: React, Python")
    files = [("files", ("aarav_resume.txt", sample_file, "text/plain"))]
    res = client.post("/api/v1/scraper/upload-batch", files=files)
    assert res.status_code == 200
    data = res.json()
    job_id = data["job_id"]
    assert len(data["records"]) == 1

    # Test export
    exp_res = client.get(f"/api/v1/scraper/export/{job_id}?format=csv")
    assert exp_res.status_code == 200
    assert "text/csv" in exp_res.headers["content-type"]
    assert "aarav@corp.com" in exp_res.text
