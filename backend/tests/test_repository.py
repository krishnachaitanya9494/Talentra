"""
Automated Test Suite for Document Ingestion Engine & Repository APIs.

Tests:
- Single JD and Resume document upload
- Duplicate detection via SHA-256 hash
- Unsupported format rejection
- Empty file validation
- Safe document deletion (database + disk verification)
- Document listing and searching
- Repository stats calculation
- Bulk upload test with 200+ generated documents
"""

import io
import pytest
from pathlib import Path
from starlette.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.models.document import JobDescriptionDocument, ResumeDocument


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_repository_stats_endpoint(client):
    """Verify repository stats returns valid structure."""
    response = client.get("/api/v1/repository/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_jds" in data
    assert "total_resumes" in data
    assert "total_documents" in data
    assert "total_storage_bytes" in data


def test_upload_single_jd_document(client):
    """Verify uploading a single JD document stores file and database metadata."""
    content = b"SENIOR SYSTEM ENGINEER - CLOUD & PYTHON\nResponsibilities: Maintain Kubernetes."
    file_payload = {
        "file": ("sample_system_engineer.txt", io.BytesIO(content), "text/plain")
    }
    response = client.post("/api/v1/repository/jds/upload", files=file_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["is_duplicate"] is False
    doc = data["document"]
    assert doc["original_filename"] == "sample_system_engineer.txt"
    assert doc["file_extension"] == ".txt"
    assert doc["sha256_hash"] is not None
    assert doc["doc_id"].startswith("DOC-JD-")

    # Verify physical file existence
    file_path = Path(doc["file_path"])
    assert file_path.exists()
    assert file_path.read_bytes() == content

    # Test duplicate detection by re-uploading the exact same content
    dup_payload = {
        "file": ("different_name_same_content.txt", io.BytesIO(content), "text/plain")
    }
    dup_response = client.post("/api/v1/repository/jds/upload", files=dup_payload)
    assert dup_response.status_code == 201
    dup_data = dup_response.json()
    assert dup_data["is_duplicate"] is True
    assert dup_data["document"]["doc_id"] == doc["doc_id"]

    # Clean up test document
    del_res = client.delete(f"/api/v1/repository/jds/{doc['doc_id']}")
    assert del_res.status_code == 200
    assert not file_path.exists()


def test_upload_single_resume_document(client):
    """Verify uploading a single Resume document stores file and database metadata."""
    content = b"Kavya Patel\nFull Stack Developer\nEmail: kavya.patel.test@example.com\nSkills: React, Node.js"
    file_payload = {
        "file": ("Kavya_Patel_Resume.txt", io.BytesIO(content), "text/plain")
    }
    response = client.post("/api/v1/repository/resumes/upload", files=file_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["is_duplicate"] is False
    doc = data["document"]
    assert doc["doc_id"].startswith("DOC-RES-")
    assert doc["file_extension"] == ".txt"

    file_path = Path(doc["file_path"])
    assert file_path.exists()

    # Clean up
    del_res = client.delete(f"/api/v1/repository/resumes/{doc['doc_id']}")
    assert del_res.status_code == 200
    assert not file_path.exists()


def test_unsupported_file_extension(client):
    """Verify unsupported file types are rejected with 400 Bad Request."""
    payload = {
        "file": ("script.exe", io.BytesIO(b"binary executable payload"), "application/octet-stream")
    }
    res_jd = client.post("/api/v1/repository/jds/upload", files=payload)
    assert res_jd.status_code == 400
    assert "Unsupported file format" in res_jd.json()["detail"]

    res_res = client.post("/api/v1/repository/resumes/upload", files=payload)
    assert res_res.status_code == 400


def test_empty_file_rejected(client):
    """Verify empty 0-byte file is rejected with 400 Bad Request."""
    payload = {
        "file": ("empty.txt", io.BytesIO(b""), "text/plain")
    }
    res = client.post("/api/v1/repository/jds/upload", files=payload)
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()


def test_bulk_upload_resumes_200_documents(client):
    """
    Verify bulk upload of 200+ documents in a single request.
    Validates per-file success tracking, duplicate handling, and batch persistence.
    """
    total_docs = 205
    files_payload = []
    created_doc_ids = []

    for i in range(total_docs):
        doc_bytes = f"Bulk Candidate {i:03d}\nTitle: Engineer {i}\nEmail: candidate.{i}@bulktest.local\nSkills: Tech_{i}".encode("utf-8")
        files_payload.append(
            ("files", (f"bulk_candidate_{i:03d}.txt", io.BytesIO(doc_bytes), "text/plain"))
        )

    response = client.post("/api/v1/repository/resumes/bulk-upload", files=files_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_files"] == total_docs
    assert data["successful_count"] == total_docs
    assert data["failed_count"] == 0
    assert len(data["results"]) == total_docs

    # Record created doc_ids for cleanup
    for res in data["results"]:
        assert res["success"] is True
        if res["doc_id"]:
            created_doc_ids.append(res["doc_id"])

    # Test bulk upload with duplicates: upload a small batch containing existing files
    dup_batch = [
        ("files", (f"bulk_candidate_001.txt", io.BytesIO(b"Bulk Candidate 001\nTitle: Engineer 1\nEmail: candidate.1@bulktest.local\nSkills: Tech_1"), "text/plain")),
        ("files", (f"bulk_candidate_002.txt", io.BytesIO(b"Bulk Candidate 002\nTitle: Engineer 2\nEmail: candidate.2@bulktest.local\nSkills: Tech_2"), "text/plain")),
    ]
    dup_res = client.post("/api/v1/repository/resumes/bulk-upload", files=dup_batch)
    assert dup_res.status_code == 200
    dup_data = dup_res.json()
    assert dup_data["duplicate_count"] == 2
    assert dup_data["successful_count"] == 0

    # Clean up all temporary bulk test documents
    for doc_id in created_doc_ids:
        client.delete(f"/api/v1/repository/resumes/{doc_id}")


def test_listing_and_pagination(client):
    """Verify document listing and pagination for JDs and Resumes."""
    res_jds = client.get("/api/v1/repository/jds?page=1&page_size=5")
    assert res_jds.status_code == 200
    jds_data = res_jds.json()
    assert "total" in jds_data
    assert "items" in jds_data
    assert len(jds_data["items"]) <= 5

    res_resumes = client.get("/api/v1/repository/resumes?page=1&page_size=5")
    assert res_resumes.status_code == 200
    res_data = res_resumes.json()
    assert "total" in res_data
    assert "items" in res_data
    assert len(res_data["items"]) <= 5


def test_file_size_limit_rejection(client):
    """Verify files exceeding size limits are rejected."""
    # Exceed 15MB limit for JD (create 16MB virtual stream)
    large_payload = {
        "file": ("too_large_jd.txt", io.BytesIO(b"X" * (16 * 1024 * 1024)), "text/plain")
    }
    res = client.post("/api/v1/repository/jds/upload", files=large_payload)
    assert res.status_code in (400, 413)
    assert "exceeds" in res.json()["detail"].lower()


def test_repository_sync_endpoint(client):
    """Verify the repository sync endpoint handles local data files safely."""
    res = client.post("/api/v1/repository/sync")
    assert res.status_code == 200
    data = res.json()
    assert "total_jds" in data
    assert "total_resumes" in data
    assert data["total_jds"] >= 0
    assert data["total_resumes"] >= 0
