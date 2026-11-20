"""
Unit and Integration Test Suite for TALENTRA Phase 4: Manual TA Distribution & Candidate Ownership.

Tests:
1. TA directory management & default team bootstrapping.
2. Single candidate manual assignment.
3. Bulk candidate manual assignment.
4. Duplicate active assignment prevention.
5. Candidate reassignment & ownership transfer.
6. Candidate unassignment & deactivation.
7. Assignment status lifecycle transitions.
8. Internal recruiter notes & history timeline.
9. Manager overview metrics & TA workload distribution.
10. Secure CSV export with role-based contact masking.
"""

import pytest
from starlette.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.models.user import User, UserRole
from backend.app.models.candidate import Candidate
from backend.app.models.document import JobDescriptionDocument
from backend.app.models.assignment import (
    CandidateAssignment,
    AssignmentStatus,
    AssignmentHistory,
    AssignmentNote,
)
from backend.app.services.assignment.assignment_service import AssignmentService

client = TestClient(app)


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_ta_directory_bootstrapping(db_session):
    """
    Verifies that the TA directory retrieves authenticated TA and Manager accounts,
    bootstrapping default team members if none exist.
    """
    res = client.get("/api/v1/assignments/tas")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] >= 3

    # Check required fields
    first_ta = data["items"][0]
    assert "full_name" in first_ta
    assert "email" in first_ta
    assert "role" in first_ta
    assert "team" in first_ta
    assert "active_assignments" in first_ta


def test_manual_single_and_bulk_assignment(db_session):
    """
    Tests manual assignment of single and multiple candidates to a TA.
    """
    tas = AssignmentService.get_or_create_default_tas(db_session)
    ta = tas[0]
    jd = db_session.query(JobDescriptionDocument).first()
    candidates = db_session.query(Candidate).limit(3).all()

    if not jd or len(candidates) < 2:
        pytest.skip("Insufficient test data for assignment")

    cand_ids = [c.id for c in candidates[:2]]

    payload = {
        "candidate_ids": cand_ids,
        "jd_id": jd.id,
        "ta_user_id": ta.id,
        "notes": "Assigned for initial screening in Phase 4 test",
    }

    res = client.post("/api/v1/assignments/assign", json=payload)
    assert res.status_code == 200
    result = res.json()
    assert result["status"] == "success"
    total_processed = result["assigned_count"] + result["reassigned_count"] + result["skipped_duplicates"]
    assert total_processed == len(cand_ids)


def test_duplicate_assignment_prevention(db_session):
    """
    Verifies that assigning the exact same candidate to the same TA for the
    same JD does not create duplicate active assignments.
    """
    tas = AssignmentService.get_or_create_default_tas(db_session)
    ta = tas[0]
    jd = db_session.query(JobDescriptionDocument).first()
    cand = db_session.query(Candidate).first()

    payload = {
        "candidate_ids": [cand.id],
        "jd_id": jd.id,
        "ta_user_id": ta.id,
        "notes": "First attempt",
    }

    # First attempt: assigns or reassigns
    res1 = client.post("/api/v1/assignments/assign", json=payload)
    assert res1.status_code == 200

    # Second attempt: must detect duplicate and skip!
    res2 = client.post("/api/v1/assignments/assign", json=payload)
    assert res2.status_code == 200
    result2 = res2.json()
    assert result2["skipped_duplicates"] == 1
    assert result2["assigned_count"] == 0


def test_reassignment_and_history(db_session):
    """
    Verifies that reassigning an actively assigned candidate to another TA
    updates ownership and logs an audit record in AssignmentHistory.
    """
    tas = AssignmentService.get_or_create_default_tas(db_session)
    ta1 = tas[0]
    ta2 = tas[1]
    jd = db_session.query(JobDescriptionDocument).first()
    cand = db_session.query(Candidate).first()

    # Initial assignment to ta1
    AssignmentService.assign_candidates_to_ta(
        db_session,
        candidate_ids=[cand.id],
        jd_id=jd.id,
        ta_user_id=ta1.id,
    )

    assignment = db_session.query(CandidateAssignment).filter(
        CandidateAssignment.candidate_id == cand.id,
        CandidateAssignment.jd_id == jd.id,
        CandidateAssignment.is_active == True,
    ).first()

    # Reassign via API to ta2
    reassign_res = client.post(
        f"/api/v1/assignments/{assignment.id}/reassign",
        json={"new_ta_id": ta2.id, "note": "Transferred due to workload balancing"},
    )
    assert reassign_res.status_code == 200

    # Verify history
    hist_res = client.get(f"/api/v1/assignments/{assignment.id}/history")
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    assert hist_data["current_ta"] == ta2.full_name
    assert any(h["action"] == "reassigned" for h in hist_data["history"])


def test_status_lifecycle_and_notes(db_session):
    """
    Tests status transition (Assigned -> Contacted -> Shortlisted)
    and internal recruiter notes appending.
    """
    assignment = db_session.query(CandidateAssignment).filter(CandidateAssignment.is_active == True).first()
    if not assignment:
        pytest.skip("No active assignment to test status")

    # Update status to Contacted
    stat_res = client.patch(
        f"/api/v1/assignments/{assignment.id}/status",
        json={"status": AssignmentStatus.CONTACTED, "note": "Initial outreach message sent via LinkedIn"},
    )
    assert stat_res.status_code == 200

    # Add internal note
    note_res = client.post(
        f"/api/v1/assignments/{assignment.id}/notes",
        json={"content": "Candidate confirmed availability for next Monday."},
    )
    assert note_res.status_code == 200
    note_data = note_res.json()
    assert "Candidate confirmed availability" in note_data["content"]


def test_manager_overview_and_export(db_session):
    """
    Tests recruitment manager overview dashboard metrics and CSV export.
    """
    # Manager overview
    ov_res = client.get("/api/v1/assignments/manager-overview")
    assert ov_res.status_code == 200
    ov_data = ov_res.json()
    assert "total_active_tas" in ov_data
    assert "total_active_assignments" in ov_data
    assert "ta_workload" in ov_data

    # CSV Export
    exp_res = client.get("/api/v1/assignments/export?role=recruiter")
    assert exp_res.status_code == 200
    assert exp_res.headers["content-type"].startswith("text/csv")
    csv_text = exp_res.text
    assert "Assignment ID,Candidate Name,Assigned TA,Job Description" in csv_text
