"""
Unit and Integration Tests for TALENTRA Recruitment Intelligence Platform Enhancements.

Tests:
1. Safe Boolean Query Parser & AST Evaluation
2. Sourcing Boolean Search API
3. JD Technical Screening & Interview Kit Generation
4. Interview Scheduling, Candidate History, and Debrief Feedback
5. Clients & Accounts Workspace API
"""

import pytest
from datetime import datetime, timezone
from starlette.testclient import TestClient
from backend.app.main import app
from backend.app.services.matching.boolean_search import (
    tokenize_boolean_query,
    parse_boolean_query,
    evaluate_candidate_boolean,
)

client = TestClient(app)


def test_boolean_tokenizer_and_ast():
    tokens = tokenize_boolean_query("(DevOps OR SRE) AND Kubernetes AND NOT Azure")
    assert len(tokens) > 5
    ast = parse_boolean_query("(DevOps OR SRE) AND Kubernetes AND NOT Azure")
    assert ast is not None

    # Candidate 1: matches
    cand_match = {
        "full_name": "Alice Dev",
        "current_title": "DevOps Lead",
        "current_company": "Cloud Corp",
        "location": "Bengaluru",
        "skills_list": ["Kubernetes", "Docker", "Terraform"],
        "summary": "Experienced DevOps engineer managing Kubernetes clusters.",
    }
    is_match, terms, snippet = evaluate_candidate_boolean(cand_match, ast)
    assert is_match is True
    assert "kubernetes" in terms

    # Candidate 2: has Azure, should fail NOT Azure
    cand_not = {
        "full_name": "Bob Azure",
        "current_title": "DevOps Engineer",
        "current_company": "Azure Corp",
        "location": "Hyderabad",
        "skills_list": ["Kubernetes", "Azure"],
        "summary": "DevOps engineer with Azure and Kubernetes.",
    }
    is_match_2, _, _ = evaluate_candidate_boolean(cand_not, ast)
    assert is_match_2 is False


def test_boolean_search_api():
    response = client.post(
        "/api/v1/sourcing/boolean-search",
        json={"query": "Java OR Python", "limit": 10},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "candidates" in data
    assert data["total_internal_pool"] > 0


def test_interview_kit_api():
    # Fetch first JD
    jd_resp = client.get("/api/v1/jds?page=1&page_size=1")
    assert jd_resp.status_code == 200
    jds = jd_resp.json()["items"]
    if jds:
        jd_id = jds[0]["id"]
        kit_resp = client.get(f"/api/v1/jds/{jd_id}/interview-kit")
        assert kit_resp.status_code == 200
        kit_data = kit_resp.json()
        assert kit_data["status"] == "success"
        assert len(kit_data["screening_questions"]) >= 5
        assert len(kit_data["scenarios"]) >= 2
        assert len(kit_data["scorecard_dimensions"]) >= 5
        assert "markdown_kit" in kit_data


def test_interview_scheduling_and_feedback():
    # Get a candidate
    cand_resp = client.get("/api/v1/resumes?page=1&page_size=1")
    assert cand_resp.status_code == 200
    candidates = cand_resp.json()["items"]
    assert len(candidates) > 0
    candidate_id = candidates[0]["id"]

    # Schedule interview
    schedule_payload = {
        "candidate_id": candidate_id,
        "round_number": 1,
        "interview_type": "technical",
        "scheduled_start": datetime.now(timezone.utc).isoformat(),
        "interviewer_names": "Senior Architect John",
        "meeting_link": "https://meet.google.com/abc-defg-hij",
    }
    sched_resp = client.post("/api/v1/interviews/schedule", json=schedule_payload)
    assert sched_resp.status_code == 200
    intv = sched_resp.json()["interview"]
    interview_id = intv["id"]
    assert intv["status"] == "scheduled"

    # List candidate interviews
    list_resp = client.get(f"/api/v1/interviews/candidate/{candidate_id}")
    assert list_resp.status_code == 200
    int_list = list_resp.json()["interviews"]
    assert any(i["id"] == interview_id for i in int_list)

    # Update feedback
    fb_payload = {
        "status": "completed",
        "rating": 5,
        "feedback": "Outstanding candidate. Excellent systems design depth.",
        "recommendation": "strong_hire",
    }
    fb_resp = client.put(f"/api/v1/interviews/{interview_id}", json=fb_payload)
    assert fb_resp.status_code == 200
    updated = fb_resp.json()["interview"]
    assert updated["status"] == "completed"
    assert updated["rating"] == 5
    assert updated["recommendation"] == "strong_hire"


def test_clients_api():
    # List clients
    list_resp = client.get("/api/v1/clients")
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert data["status"] == "success"

    # Create client
    test_client_name = f"Test Client Corp {datetime.now().microsecond}"
    create_resp = client.post(
        "/api/v1/clients",
        json={
            "name": test_client_name,
            "industry": "FinTech & Payments",
            "website": "https://examplefintech.com",
            "contact_name": "Jane Doe",
            "contact_email": "jane@examplefintech.com",
            "status": "active",
        },
    )
    assert create_resp.status_code == 200
    created_id = create_resp.json()["client"]["id"]

    # Detail
    detail_resp = client.get(f"/api/v1/clients/{created_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()["client"]
    assert detail["name"] == test_client_name
    assert "job_requirements" in detail
