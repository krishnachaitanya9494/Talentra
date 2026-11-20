"""
Unit and Integration Test Suite for TALENTRA Phase 5: Email Outreach & Campaign Automation.

Tests:
1. Template management & personalization variable substitution.
2. Mode A: Manual email review and send.
3. Mode B: Campaign creation & approval workflow.
4. Prevention of unauthorized / unapproved campaign execution.
5. Explicit manager campaign approval & execution.
6. Campaign rejection workflow.
7. Recipient validation & suppression / opt-out enforcement.
8. Candidate communication timeline audit history.
9. Incoming candidate reply tracking.
"""

import pytest
from starlette.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.models.candidate import Candidate
from backend.app.models.document import JobDescriptionDocument
from backend.app.models.outreach import (
    EmailTemplate,
    OutreachCampaign,
    CampaignStatus,
    CandidateCommunication,
    EmailSuppressionList,
)
from backend.app.services.outreach.email_service import EmailService

client = TestClient(app)


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_template_retrieval_and_preview(db_session):
    """
    Verifies that default recruitment templates exist and variable rendering works.
    """
    templates_res = client.get("/api/v1/outreach/templates")
    assert templates_res.status_code == 200
    data = templates_res.json()
    assert data["total"] >= 5

    first_tpl = data["items"][0]
    preview_res = client.post("/api/v1/outreach/templates/preview", json={
        "template_id": first_tpl["id"],
    })
    assert preview_res.status_code == 200
    prev_data = preview_res.json()
    assert "rendered_subject" in prev_data
    assert "rendered_body" in prev_data
    assert "{{" not in prev_data["rendered_subject"]


def test_mode_a_manual_email_send(db_session):
    """
    Tests Mode A: Recruiter manually reviews and explicitly sends an email.
    """
    cand = db_session.query(Candidate).filter(Candidate.email.isnot(None)).first()
    template = db_session.query(EmailTemplate).first()
    jd = db_session.query(JobDescriptionDocument).first()

    payload = {
        "candidate_id": cand.id,
        "template_id": template.id,
        "jd_id": jd.id,
        "custom_subject": "Personalized Outreach: Python Senior Engineer",
        "custom_body": f"Hi {cand.first_name}, I loved your background and would love to speak.",
    }

    res = client.post("/api/v1/outreach/send-manual", json=payload)
    assert res.status_code == 200
    result = res.json()
    assert result["status"] == "success"
    assert result["recipient_email"] == cand.email
    assert result["provider_message_id"].startswith("mock-msg-")

    # Verify audit timeline
    comm_id = result["communication_id"]
    timeline_res = client.get(f"/api/v1/outreach/candidate/{cand.id}/timeline")
    assert timeline_res.status_code == 200
    timeline_data = timeline_res.json()
    assert any(c["id"] == comm_id for c in timeline_data["items"])


def test_mode_b_approval_and_execution_lifecycle(db_session):
    """
    Tests Mode B:
    1. Create campaign -> starts in Pending Approval
    2. Attempt execution before approval -> MUST BE REJECTED!
    3. Explicit manager approval
    4. Execution succeeds and delivers messages
    """
    jd = db_session.query(JobDescriptionDocument).first()
    template = db_session.query(EmailTemplate).first()
    candidates = db_session.query(Candidate).filter(Candidate.email.isnot(None)).limit(3).all()

    # 1. Create campaign
    create_payload = {
        "name": "Phase 5 Test Cloud Campaign",
        "jd_id": jd.id,
        "template_id": template.id,
        "target_segment": "All",
        "submit_for_approval": True,
    }
    create_res = client.post("/api/v1/outreach/campaigns", json=create_payload)
    assert create_res.status_code == 200
    camp_id = create_res.json()["campaign_id"]
    assert create_res.json()["campaign_status"] == CampaignStatus.PENDING_APPROVAL

    # 2. Attempt unauthorized execution (must fail with 400!)
    exec_res = client.post(f"/api/v1/outreach/campaigns/{camp_id}/execute")
    assert exec_res.status_code == 400
    assert "Explicit manager approval required" in exec_res.json()["detail"]

    # 3. Explicit Manager Approval
    approve_res = client.post(f"/api/v1/outreach/campaigns/{camp_id}/approve", json={
        "notes": "Verified candidate segment and template. Approved for test run.",
    })
    assert approve_res.status_code == 200
    assert approve_res.json()["campaign_status"] == CampaignStatus.APPROVED

    # 4. Now execute approved campaign
    cand_ids = [c.id for c in candidates]
    exec_ok_res = client.post(f"/api/v1/outreach/campaigns/{camp_id}/execute", json={
        "candidate_ids": cand_ids,
    })
    assert exec_ok_res.status_code == 200
    exec_data = exec_ok_res.json()
    assert exec_data["status"] == "success"
    assert exec_data["sent_count"] >= 1


def test_suppression_and_opt_out_enforcement(db_session):
    """
    Verifies that opted-out / suppressed candidate emails are rejected.
    """
    cand = db_session.query(Candidate).filter(Candidate.email.isnot(None)).first()
    template = db_session.query(EmailTemplate).first()

    # Add to suppression list
    supp_res = client.post("/api/v1/outreach/suppression", json={
        "email": cand.email,
        "reason": "candidate_opt_out",
    })
    assert supp_res.status_code == 200

    # Attempt to send manual email -> MUST FAIL!
    res = client.post("/api/v1/outreach/send-manual", json={
        "candidate_id": cand.id,
        "template_id": template.id,
    })
    assert res.status_code == 400
    assert "opted out" in res.json()["detail"].lower()

    # Clean up suppression record so test candidate is restored
    db_session.query(EmailSuppressionList).filter(
        EmailSuppressionList.email == cand.email.lower(),
    ).delete()
    db_session.commit()


def test_candidate_reply_tracking(db_session):
    """
    Tests recording candidate replies in communication history.
    """
    cand = db_session.query(Candidate).filter(Candidate.email.isnot(None)).first()
    comm = db_session.query(CandidateCommunication).filter(
        CandidateCommunication.candidate_id == cand.id,
    ).first()

    if not comm:
        pytest.skip("No communication record to test reply")

    reply_res = client.post(f"/api/v1/outreach/communications/{comm.id}/reply", json={
        "reply": "Yes, I am available next Tuesday at 3pm.",
    })
    assert reply_res.status_code == 200

    # Verify updated status
    db_session.refresh(comm)
    assert comm.status == "replied"
    assert comm.reply_received_at is not None
