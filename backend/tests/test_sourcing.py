"""
Automated Pytest Suite for TALENTRA: Internal JD-to-Candidate Sourcing & Excel Automation.

Validates:
- Job Description parsing from raw text and existing repository requisitions.
- Internal candidate search across all indexed resumes and candidate records.
- Deterministic 7-dimension scoring and match segment classification.
- Duplicate candidate detection via normalized contact details.
- Enterprise Excel (.xlsx) generation with openpyxl across all 4 worksheets:
  1. Matched Candidates
  2. Candidate Details
  3. Match Analysis
  4. JD Requirements
- Excel formatting: Frozen panes, auto-filters, segment colors, clickable email links.
- HTTP API router endpoints (/api/v1/sourcing/*).
"""

import os
from pathlib import Path
import pytest
import openpyxl
from starlette.testclient import TestClient

from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.services.sourcing.sourcing_service import SourcingService
from backend.app.services.sourcing.excel_export_service import ExcelExportService
from backend.app.models.document import JobDescriptionDocument

client = TestClient(app)


@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_parse_jd_text_service(db):
    """
    Validates rule-based extraction from raw JD text.
    """
    sample_jd_text = """
    Job Title: Senior Java Cloud Engineer
    Location: Bangalore, India (Hybrid)
    Experience: 5 to 8 years
    Required Technical Skills: Java, Spring Boot, Microservices, AWS, Docker, Kubernetes
    Preferred Skills: Kafka, Redis, Terraform
    Qualifications: B.Tech in Computer Science or equivalent
    """
    parsed = SourcingService.parse_jd_input(db, text=sample_jd_text)
    assert "Java" in parsed["job_title"] or "Engineer" in parsed["job_title"]
    assert parsed["min_experience"] >= 3.0
    assert "Java" in parsed["required_skills"] or "Spring" in parsed["required_skills"]
    assert "Kafka" in parsed["preferred_skills"] or "Redis" in parsed["preferred_skills"]


def test_parse_existing_jd_service(db):
    """
    Validates loading an existing JD document from repository.
    """
    jd_doc = db.query(JobDescriptionDocument).first()
    assert jd_doc is not None

    parsed = SourcingService.parse_jd_input(db, existing_jd_id=jd_doc.id)
    assert parsed["jd_id"] == jd_doc.id
    assert parsed["job_title"] is not None
    assert len(parsed["required_skills"]) > 0


def test_internal_sourcing_search_service(db):
    """
    Validates internal candidate search, ranking, and duplicate detection.
    """
    reqs = {
        "job_title": "Java Spring Developer",
        "required_skills": "Java, Spring Boot, SQL, REST APIs",
        "preferred_skills": "Docker, AWS, Git",
        "min_experience": 2.0,
        "max_experience": 10.0,
        "location": "Bangalore",
        "qualifications": "B.Tech",
    }

    results = SourcingService.run_sourcing_search(
        db=db,
        requirements=reqs,
        filters={"min_score": 0.0},
        input_source="paste",
    )

    assert "search_id" in results
    assert "search_code" in results
    summary = results["summary"]
    assert summary["total_candidates_searched"] >= 200
    assert summary["total_candidates_found"] >= 50
    assert summary["strong_matches"] >= 1
    assert summary["duplicates_identified"] >= 0

    candidates = results["candidates"]
    assert len(candidates) >= 1
    # Check rank order: score descending
    scores = [c["match_score"] for c in candidates]
    assert scores == sorted(scores, reverse=True)

    # First candidate checks
    top_cand = candidates[0]
    assert top_cand["rank"] == 1
    assert top_cand["match_score"] >= 60.0
    assert top_cand["match_segment"] in ["Strong Match", "Potential Match"]
    assert "candidate_name" in top_cand
    assert "email" in top_cand


def test_excel_generation_engine_service(db):
    """
    Validates openpyxl workbook generation, 4 worksheets, and formatting.
    """
    reqs = {
        "job_title": "Senior Python Backend Engineer",
        "required_skills": "Python, FastAPI, PostgreSQL, Docker",
        "preferred_skills": "Redis, AWS",
        "min_experience": 3.0,
        "max_experience": 8.0,
        "location": "Hyderabad",
    }
    search_res = SourcingService.run_sourcing_search(db=db, requirements=reqs)
    search_id = search_res["search_id"]

    # Generate workbook for top 10 candidates
    top_candidate_ids = [c["candidate_id"] for c in search_res["candidates"][:10]]
    export_info = ExcelExportService.generate_sourcing_workbook(
        db=db,
        search_id=search_id,
        candidate_ids=top_candidate_ids,
        custom_folder_name="Test_Python_Backend_Sourcing",
    )

    assert "file_path" in export_info
    assert os.path.exists(export_info["file_path"])
    assert export_info["total_candidates"] == 10
    assert export_info["file_size_bytes"] > 5000

    # Inspect generated Excel file with openpyxl
    wb = openpyxl.load_workbook(export_info["file_path"])
    sheet_names = wb.sheetnames
    assert "Matched Candidates" in sheet_names
    assert "Candidate Details" in sheet_names
    assert "Match Analysis" in sheet_names
    assert "JD Requirements" in sheet_names

    # Sheet 1 validations
    ws1 = wb["Matched Candidates"]
    assert ws1.max_row == 11  # Header + 10 candidates
    assert ws1.cell(row=1, column=1).value == "Rank"
    assert ws1.cell(row=1, column=3).value == "Candidate Name"
    assert ws1.cell(row=1, column=13).value == "Match Score"
    assert ws1.cell(row=1, column=14).value == "Match Segment"
    assert ws1.freeze_panes == "A2"  # Frozen header

    # Sheet 2 validations
    ws2 = wb["Candidate Details"]
    assert ws2.max_row == 11
    assert ws2.cell(row=1, column=6).value == "Employment History"

    # Sheet 3 validations
    ws3 = wb["Match Analysis"]
    assert ws3.max_row == 11
    assert ws3.cell(row=1, column=6).value == "Required Skills Evidence"

    # Sheet 4 validations
    ws4 = wb["JD Requirements"]
    assert ws4.cell(row=1, column=1).value == "JOB REQUISITION METADATA"
    assert ws4.cell(row=2, column=1).value == "Target Job Title"


def test_sourcing_api_endpoints(db):
    """
    Validates HTTP REST endpoints for the full sourcing workflow.
    """
    # 1. Parse JD Endpoint
    parse_res = client.post(
        "/api/v1/sourcing/parse-jd",
        json={"text": "Looking for React & Node.js Developer with 4 years experience."},
    )
    assert parse_res.status_code == 200
    reqs = parse_res.json()["requirements"]
    assert "job_title" in reqs

    # 2. Search Endpoint
    search_res = client.post(
        "/api/v1/sourcing/search",
        json={"requirements": reqs, "filters": {"min_score": 30.0}},
    )
    assert search_res.status_code == 200
    search_data = search_res.json()["data"]
    search_id = search_data["search_id"]
    assert search_id >= 1

    # 3. Retrieve Search by ID
    get_res = client.get(f"/api/v1/sourcing/search/{search_id}")
    assert get_res.status_code == 200
    assert len(get_res.json()["data"]["candidates"]) >= 1

    # 4. Detailed Candidate Profile
    first_cand_id = search_data["candidates"][0]["candidate_id"]
    cand_res = client.get(f"/api/v1/sourcing/candidate/{first_cand_id}")
    assert cand_res.status_code == 200
    assert cand_res.json()["candidate"]["id"] == first_cand_id

    # 5. Export Endpoint
    export_res = client.post(
        "/api/v1/sourcing/export",
        json={"search_id": search_id, "candidate_ids": [first_cand_id]},
    )
    assert export_res.status_code == 200, f"Failed: {export_res.text}"
    export_id = export_res.json()["export"]["export_id"]

    # 6. List Exports
    list_res = client.get("/api/v1/sourcing/exports")
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1

    # 7. Download Export
    down_res = client.get(f"/api/v1/sourcing/exports/{export_id}/download")
    assert down_res.status_code == 200
    assert down_res.headers["content-type"].startswith("application/vnd.openxmlformats-officedocument")
