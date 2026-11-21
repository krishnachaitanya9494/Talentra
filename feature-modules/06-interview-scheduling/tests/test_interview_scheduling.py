"""
Unit & Integration Tests for Module 06 — Interview Scheduling & Timetable.

Tests scheduling lifecycle, availability calculations, multi-interviewer conflicts,
double-booking prevention, audit trails, and .ics generation in isolation.
"""

import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.append(_MOD_ROOT)

import pytest
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

try:
    from backend.app.models.interview_models import (
        Base,
        InterviewSchedule,
        InterviewPanelMember,
        InterviewAvailability,
        InterviewHistory,
    )
    from backend.app.routers.interview_timetable import router, get_db
except (ImportError, ModuleNotFoundError):
    from backend.models.interview_models import (
        Base,
        InterviewSchedule,
        InterviewPanelMember,
        InterviewAvailability,
        InterviewHistory,
    )
    from backend.api.interview_router import router, get_db
from fastapi import FastAPI


# Isolated in-memory SQLite database for tests with StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

Base.metadata.create_all(bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


test_app = FastAPI()
test_app.include_router(router)
test_app.dependency_overrides[get_db] = override_get_db
client = TestClient(test_app)


@pytest.fixture(autouse=True)
def clean_db():
    """Cleans tables between test executions."""
    Base.metadata.create_all(bind=test_engine)
    yield
    db = TestingSessionLocal()
    for table in reversed(Base.metadata.sorted_tables):
        if table.name in ["interview_schedules", "interview_panel_members", "interview_availabilities", "interview_histories"]:
            db.execute(table.delete())
    db.commit()
    db.close()


def test_schedule_interview_success():
    """Validates successful interview booking with panel members."""
    payload = {
        "candidate_id": 101,
        "candidate_name": "Pooja Singh",
        "candidate_email": "pooja.singh@example.com",
        "jd_id": 1,
        "jd_title": "Lead Cloud Data Engineer",
        "round_name": "Technical Round 1",
        "interview_type": "technical",
        "interview_date": "2026-11-25",
        "start_time": "10:00",
        "end_time": "11:00",
        "timezone": "UTC",
        "mode": "virtual_google_meet",
        "instructions": "Prepare coding environment",
        "panel_interviewer_ids": [1, 2],
    }
    res = client.post("/api/v1/interviews", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["candidate_name"] == "Pooja Singh"
    assert data["interview_code"].startswith("INT-20261125-")
    assert data["status"] == "scheduled"
    assert len(data["panel"]) == 2
    assert data["panel"][0]["is_lead"] is True


def test_interviewer_double_booking_conflict():
    """Ensures scheduling an overlapping slot with the same interviewer raises HTTP 409."""
    # First interview: 10:00 - 11:00 with Interviewer #1
    client.post("/api/v1/interviews", json={
        "candidate_id": 101,
        "candidate_name": "Candidate A",
        "round_name": "Screening",
        "interview_date": "2026-11-25",
        "start_time": "10:00",
        "end_time": "11:00",
        "panel_interviewer_ids": [1],
    })

    # Second interview: 10:30 - 11:30 with Interviewer #1 (OVERLAPS!)
    res2 = client.post("/api/v1/interviews", json={
        "candidate_id": 102,
        "candidate_name": "Candidate B",
        "round_name": "Technical Round 1",
        "interview_date": "2026-11-25",
        "start_time": "10:30",
        "end_time": "11:30",
        "panel_interviewer_ids": [1],
    })
    assert res2.status_code == 409
    err = res2.json()
    assert "Conflict detected" in str(err)


def test_candidate_double_booking_conflict():
    """Ensures a candidate cannot be scheduled for two concurrent interviews."""
    # Candidate 101 has interview with Interviewer #1 from 14:00 - 15:00
    client.post("/api/v1/interviews", json={
        "candidate_id": 101,
        "candidate_name": "Candidate A",
        "round_name": "Round 1",
        "interview_date": "2026-11-25",
        "start_time": "14:00",
        "end_time": "15:00",
        "panel_interviewer_ids": [1],
    })

    # Candidate 101 attempted with Interviewer #2 from 14:30 - 15:30 (CANDIDATE CONFLICT!)
    res2 = client.post("/api/v1/interviews", json={
        "candidate_id": 101,
        "candidate_name": "Candidate A",
        "round_name": "Round 2",
        "interview_date": "2026-11-25",
        "start_time": "14:30",
        "end_time": "15:30",
        "panel_interviewer_ids": [2],
    })
    assert res2.status_code == 409
    err = res2.json()
    assert "Conflict detected" in str(err)


def test_check_availability_endpoint():
    """Tests the dedicated availability checker endpoint."""
    # Free slot
    res = client.post("/api/v1/interviews/availability", json={
        "interview_date": "2026-11-26",
        "start_time": "09:00",
        "end_time": "10:00",
        "candidate_id": 200,
        "interviewer_ids": [1, 2],
    })
    assert res.status_code == 200
    assert res.json()["is_available"] is True

    # Book slot
    client.post("/api/v1/interviews", json={
        "candidate_id": 200,
        "candidate_name": "Candidate Free",
        "round_name": "Round 1",
        "interview_date": "2026-11-26",
        "start_time": "09:00",
        "end_time": "10:00",
        "panel_interviewer_ids": [1],
    })

    # Now verify slot is occupied
    res_busy = client.post("/api/v1/interviews/availability", json={
        "interview_date": "2026-11-26",
        "start_time": "09:15",
        "end_time": "09:45",
        "interviewer_ids": [1],
    })
    assert res_busy.status_code == 200
    assert res_busy.json()["is_available"] is False
    assert len(res_busy.json()["conflicts"]) >= 1


def test_reschedule_interview_flow():
    """Tests rescheduling and history logging."""
    create_res = client.post("/api/v1/interviews", json={
        "candidate_id": 300,
        "candidate_name": "Reschedule Candidate",
        "round_name": "Managerial Round",
        "interview_date": "2026-11-27",
        "start_time": "10:00",
        "end_time": "11:00",
        "panel_interviewer_ids": [3],
    })
    interview_id = create_res.json()["id"]

    # Reschedule
    resch_res = client.post(f"/api/v1/interviews/{interview_id}/reschedule", json={
        "new_date": "2026-11-28",
        "new_start_time": "15:00",
        "new_end_time": "16:00",
        "reason": "Candidate emergency",
        "changed_by": "Recruiter Jane",
    })
    assert resch_res.status_code == 200
    updated = resch_res.json()
    assert updated["interview_date"] == "2026-11-28"
    assert updated["start_time"] == "15:00"
    assert updated["status"] == "rescheduled"

    # Verify history
    hist_res = client.get(f"/api/v1/interviews/{interview_id}/history")
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) == 2  # 1 scheduled, 1 rescheduled
    assert history[1]["action"] == "rescheduled"
    assert "Candidate emergency" in history[1]["details"]


def test_cancel_interview_flow():
    """Tests cancellation and slot freeing."""
    create_res = client.post("/api/v1/interviews", json={
        "candidate_id": 400,
        "candidate_name": "Cancel Candidate",
        "round_name": "Technical Round",
        "interview_date": "2026-11-29",
        "start_time": "11:00",
        "end_time": "12:00",
        "panel_interviewer_ids": [1],
    })
    interview_id = create_res.json()["id"]

    # Cancel
    cancel_res = client.post(f"/api/v1/interviews/{interview_id}/cancel", json={
        "cancellation_reason": "Role cancelled by client",
    })
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # Slot should now be available again for Interviewer 1
    avail = client.post("/api/v1/interviews/availability", json={
        "interview_date": "2026-11-29",
        "start_time": "11:00",
        "end_time": "12:00",
        "interviewer_ids": [1],
    })
    assert avail.json()["is_available"] is True


def test_calendar_invitation_preview_and_ics():
    """Validates email preview generation and standard RFC 5545 .ics export."""
    create_res = client.post("/api/v1/interviews", json={
        "candidate_id": 500,
        "candidate_name": "Arjun Nair",
        "candidate_email": "arjun.nair@example.com",
        "jd_title": "Full Stack Engineer",
        "round_name": "System Design Round",
        "interview_date": "2026-11-30",
        "start_time": "13:00",
        "end_time": "14:00",
        "location_or_link": "https://meet.google.com/test-meet-link",
        "panel_interviewer_ids": [2],
    })
    interview_id = create_res.json()["id"]

    # Preview
    prev_res = client.get(f"/api/v1/interviews/{interview_id}/invitations")
    assert prev_res.status_code == 200
    p_data = prev_res.json()
    assert "System Design Round" in p_data["subject"]
    assert "https://meet.google.com/test-meet-link" in p_data["body_plain"]
    assert "BEGIN:VCALENDAR" in p_data["ics_content"]
    assert "END:VCALENDAR" in p_data["ics_content"]

    # Download .ics
    ics_res = client.get(f"/api/v1/interviews/{interview_id}/ics")
    assert ics_res.status_code == 200
    assert ics_res.headers["content-type"].startswith("text/calendar")
    assert "BEGIN:VEVENT" in ics_res.text
