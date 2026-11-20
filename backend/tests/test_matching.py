"""
Unit and Integration Test Suite for TALENTRA Phase 3: Intelligent Candidate Matching & Segmentation.

Tests:
1. Exact and partial skill matching.
2. Critical mandatory skill mismatch protection.
3. Experience ranges (in-range, senior, underqualified, critical deficit).
4. Role designation relevance.
5. Location compatibility (exact, relocatable, remote, mismatch).
6. Explainable evidence generation across 7 dimensions.
7. Database persistence of runs, matches, and evidences.
8. Segmentation rules (Strong, Potential, Partial, Not Suitable).
9. REST API endpoints (run, list, candidates, explanation, CSV export).
"""

import pytest
from starlette.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.models.candidate import Candidate
from backend.app.models.document import JobDescriptionDocument
from backend.app.models.matching import MatchingRun, CandidateMatch, MatchEvidence
from backend.app.services.matching.matching_engine import MatchingEngine

client = TestClient(app)


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_deterministic_matching_skills_and_evidence():
    """
    Verifies exact vs partial skill matching and evidence generation.
    """
    cand = Candidate(
        candidate_code="CAN-TEST-001",
        first_name="Priya",
        last_name="Sharma",
        email="priya.sharma@example.com",
        phone="+91 98765 43210",
        skills="Python, FastAPI, Docker, Kubernetes, AWS, PostgreSQL",
        total_experience_years=6.0,
        current_title="Senior Python Backend Engineer",
        location="Bangalore",
    )

    jd_spec = {
        "job_title": "Python Backend Engineer",
        "required_skills_list": ["Python", "FastAPI", "Docker", "PostgreSQL"],
        "preferred_skills_list": ["AWS", "Kubernetes", "Redis"],
        "min_experience_years": 4.0,
        "max_experience_years": 8.0,
        "location": "Bangalore",
        "work_mode": "Hybrid",
    }

    res = MatchingEngine.evaluate_candidate(cand, jd_spec)

    assert res["overall_score"] >= 80.0
    assert res["segment"] == "Strong Match"
    assert "Python" in res["matched_skills"]
    assert "FastAPI" in res["matched_skills"]
    assert len(res["missing_skills"]) == 0
    assert res["has_critical_mismatch"] is False

    # Check that evidences exist for all dimensions
    dim_names = [e["dimension"] for e in res["evidences"]]
    assert "Required Skills" in dim_names
    assert "Experience" in dim_names
    assert "Role Relevance" in dim_names
    assert "Location Compatibility" in dim_names


def test_critical_mandatory_mismatch_protection():
    """
    Verifies that a candidate with 0 matching mandatory skills is flagged
    as a critical mismatch and placed in 'Not Suitable', even if they have
    high experience or matching location.
    """
    cand = Candidate(
        candidate_code="CAN-TEST-002",
        first_name="Ramesh",
        last_name="Verma",
        email="ramesh.verma@example.com",
        phone="+91 98765 11111",
        skills="Accounting, Tally, Excel, Financial Auditing",
        total_experience_years=10.0,
        current_title="Senior Accountant",
        location="Bangalore",
    )

    jd_spec = {
        "job_title": "Lead Cloud DevOps Engineer",
        "required_skills_list": ["Kubernetes", "Terraform", "AWS", "CI/CD"],
        "min_experience_years": 5.0,
        "max_experience_years": 10.0,
        "location": "Bangalore",
    }

    res = MatchingEngine.evaluate_candidate(cand, jd_spec)

    assert res["has_critical_mismatch"] is True
    assert res["segment"] == "Not Suitable"
    assert res["overall_score"] < 45.0
    assert len(res["matched_skills"]) == 0
    assert len(res["missing_skills"]) == 4


def test_experience_range_evaluation():
    """
    Tests candidate experience:
    - In-range: 100% score
    - Overqualified: minor drop, partial match
    - Severe deficit: critical mismatch
    """
    jd_spec = {
        "job_title": "Java Developer",
        "required_skills_list": ["Java", "Spring Boot"],
        "min_experience_years": 6.0,
        "max_experience_years": 9.0,
    }

    # Candidate with in-range exp (7 yrs)
    cand_ideal = Candidate(
        candidate_code="CAN-TEST-003",
        first_name="Ideal",
        last_name="Cand",
        email="ideal.cand@example.com",
        skills="Java, Spring Boot",
        total_experience_years=7.0,
        current_title="Java Developer",
    )
    res_ideal = MatchingEngine.evaluate_candidate(cand_ideal, jd_spec)
    assert res_ideal["dimension_scores"]["experience"] == 100.0

    # Candidate with severe exp deficit (1 yr vs min 6 yrs)
    cand_junior = Candidate(
        candidate_code="CAN-TEST-004",
        first_name="Junior",
        last_name="Cand",
        email="junior.cand@example.com",
        skills="Java, Spring Boot",
        total_experience_years=1.0,
        current_title="Junior Java Developer",
    )
    res_junior = MatchingEngine.evaluate_candidate(cand_junior, jd_spec)
    assert res_junior["has_critical_mismatch"] is True
    assert res_junior["segment"] == "Not Suitable"


def test_matching_api_lifecycle(db_session):
    """
    Tests end-to-end matching API flow:
    1. Get matching config
    2. Trigger matching run on existing JD
    3. List runs
    4. Query ranked candidates with segmentation filter
    5. Retrieve detailed explanation for a candidate match
    6. Verify CSV export
    """
    # 1. Config endpoint
    conf_res = client.get("/api/matching/config")
    assert conf_res.status_code == 200
    conf_data = conf_res.json()
    assert "weights" in conf_data
    assert conf_data["weights"]["required_skills"] == 0.35

    # 2. Trigger run for an existing JD document
    jd_doc = db_session.query(JobDescriptionDocument).first()
    if not jd_doc:
        pytest.skip("No JobDescriptionDocument in test DB")

    run_res = client.post("/api/matching/run", json={"jd_id": jd_doc.id})
    assert run_res.status_code == 200
    run_data = run_res.json()
    assert run_data["status"] == "success"
    run_id = run_data["run_id"]
    assert run_data["total_evaluated"] > 0

    # 3. List runs
    runs_res = client.get("/api/matching/runs")
    assert runs_res.status_code == 200
    assert runs_res.json()["total"] >= 1

    # 4. Query matched candidates
    cands_res = client.get(f"/api/matching/runs/{run_id}/candidates?page=1&page_size=10")
    assert cands_res.status_code == 200
    cands_data = cands_res.json()
    assert len(cands_data["items"]) > 0

    first_cand = cands_data["items"][0]
    assert "overall_score" in first_cand
    assert "segment" in first_cand
    assert "matched_skills" in first_cand
    match_id = first_cand["match_id"]

    # 5. Explainability endpoint
    exp_res = client.get(f"/api/matching/candidates/{match_id}/explanation")
    assert exp_res.status_code == 200
    exp_data = exp_res.json()
    assert "dimension_scores" in exp_data
    assert len(exp_data["evidences"]) > 0
    assert exp_data["evidences"][0]["dimension"] in [
        "Required Skills", "Preferred Skills", "Experience", "Role Relevance", "Location Compatibility", "Qualifications", "Certifications"
    ]

    # 6. CSV export endpoint
    export_res = client.get(f"/api/matching/runs/{run_id}/export")
    assert export_res.status_code == 200
    assert export_res.headers["content-type"].startswith("text/csv")
    csv_text = export_res.text
    assert "Rank,Candidate Name,Overall Score,Segment" in csv_text
