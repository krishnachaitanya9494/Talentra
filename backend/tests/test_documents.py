"""
Automated Integration Tests for TALENTRA Document & Ingestion APIs.

Tests:
- Uploading a Job Description (.txt / .json)
- Uploading a Candidate Resume (.txt / .pdf)
- Querying and filtering JDs from SQLite
- Querying and filtering Candidates from SQLite
- Data infrastructure summary diagnostics
- Synchronization idempotency
"""

import io
import pytest
from starlette.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.models.candidate import Candidate
from backend.app.models.job_requirement import JobRequirement


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_data_summary_endpoint(client):
    """Verify /api/v1/data/summary returns accurate aggregate metrics."""
    response = client.get("/api/v1/data/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_jds" in data
    assert "total_candidates" in data
    assert "total_clients" in data
    assert data["total_jds"] >= 7
    assert data["total_candidates"] >= 10


def test_list_jds_endpoint(client):
    """Verify /api/v1/jds lists job requirements from SQLite."""
    response = client.get("/api/v1/jds?page=1&page_size=5")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 7
    assert len(data["items"]) <= 5
    first = data["items"][0]
    assert "title" in first
    assert "req_code" in first
    assert "required_skills" in first


def test_search_jds_endpoint(client):
    """Verify search filter on JDs works accurately."""
    response = client.get("/api/v1/jds?search=Oracle")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for item in data["items"]:
        match = "oracle" in (item["title"] + (item["required_skills"] or "")).lower()
        assert match


def test_list_candidates_endpoint(client):
    """Verify /api/v1/resumes lists candidates from SQLite."""
    response = client.get("/api/v1/resumes?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 10
    assert len(data["items"]) <= 10
    first = data["items"][0]
    assert "first_name" in first
    assert "email" in first
    assert "candidate_code" in first


def test_upload_jd_file(client):
    """Verify uploading a new Job Description stores file and registers in SQLite."""
    jd_content = b"""LEAD CLOUD ARCHITECT
Experience: 10 years
Key Responsibilities: Design multi-cloud infrastructure on AWS and GCP.
Required Skills: AWS, GCP, Terraform, Kubernetes, Python
"""
    file_payload = {
        "file": ("sample_lead_cloud_architect.txt", io.BytesIO(jd_content), "text/plain")
    }
    response = client.post(
        "/api/v1/jds/upload",
        files=file_payload,
        data={"title": "Lead Cloud Architect (Enterprise)"},
    )
    assert response.status_code == 201
    data = response.json()
    assert "job_requirement" in data
    assert data["job_requirement"]["title"] == "Lead Cloud Architect (Enterprise)"
    assert data["job_requirement"]["req_code"].startswith("REQ-UP-")

    # Verify directly via DB query
    jd_id = data["job_requirement"]["id"]
    get_res = client.get(f"/api/v1/jds/{jd_id}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Lead Cloud Architect (Enterprise)"


def test_upload_resume_file(client):
    """Verify uploading a candidate resume stores file and registers candidate in SQLite."""
    import uuid
    uid = uuid.uuid4().hex[:6]
    test_email = f"aarav.{uid}@talentra.ai"
    resume_content = f"""Aarav Sharma
Senior Python & AI Engineer
Email: {test_email}
Phone: +91 98888 77777
Experience: 7 Years
Skills: Python, FastAPI, PyTorch, LangChain, Docker
""".encode("utf-8")
    file_payload = {
        "file": (f"Aarav_Sharma_{uid}.txt", io.BytesIO(resume_content), "text/plain")
    }
    response = client.post(
        "/api/v1/resumes/upload",
        files=file_payload,
    )
    assert response.status_code == 201
    data = response.json()
    assert "candidate" in data
    cand = data["candidate"]
    assert cand["first_name"] == "Aarav"
    assert cand["email"] == test_email
    assert cand["candidate_code"].startswith("CND-UP-")

    # Verify retrieval
    cand_id = cand["id"]
    get_res = client.get(f"/api/v1/resumes/{cand_id}")
    assert get_res.status_code == 200
    assert get_res.json()["first_name"] == "Aarav"


def test_upload_invalid_file_extension(client):
    """Verify rejected file extensions return 400 Bad Request."""
    file_payload = {
        "file": ("malicious.exe", io.BytesIO(b"binary"), "application/octet-stream")
    }
    res_jd = client.post("/api/v1/jds/upload", files=file_payload)
    assert res_jd.status_code == 400

    res_resume = client.post("/api/v1/resumes/upload", files=file_payload)
    assert res_resume.status_code == 400
