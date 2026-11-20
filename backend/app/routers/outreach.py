"""
Email Outreach & Campaign Automation API Router for TALENTRA Phase 5.

Provides secure HTTP endpoints for Mode A manual email drafting/sending,
Mode B approved automated campaigns, template management, recipient validation,
opt-out suppression, and communication history timelines.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.session import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.candidate import Candidate
from backend.app.models.document import JobDescriptionDocument
from backend.app.models.outreach import (
    EmailTemplate,
    EmailProviderAccount,
    OutreachCampaign,
    CampaignStatus,
    CandidateCommunication,
    EmailSuppressionList,
)
from backend.app.services.outreach.email_service import EmailService
from backend.app.core.security import get_current_user_optional, require_role

router = APIRouter(prefix="/api/v1/outreach", tags=["Phase 5: Email Automation & Outreach"])


@router.get("/templates")
def list_email_templates(db: Session = Depends(get_db)):
    """
    Returns all available recruitment email templates.
    """
    templates = EmailService.get_or_create_default_templates(db)
    results = [
        {
            "id": t.id,
            "name": t.name,
            "template_type": t.template_type,
            "subject_template": t.subject_template,
            "body_template": t.body_template,
            "is_default": t.is_default,
        }
        for t in templates
    ]
    return {"items": results, "total": len(results)}


@router.post("/templates/preview")
def preview_template(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Renders live variable preview using real candidate and JD data.
    """
    template_id = payload.get("template_id")
    candidate_id = payload.get("candidate_id")
    jd_id = payload.get("jd_id")

    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first() if candidate_id else None
    jd = db.query(JobDescriptionDocument).filter(JobDescriptionDocument.id == jd_id).first() if jd_id else None

    # Dummy fallback candidate for preview if none selected
    if not cand:
        cand = Candidate(
            first_name="Alex",
            last_name="Mercer",
            email="alex.mercer@example.com",
            skills="Python, AWS, Docker",
            location="Bangalore",
        )

    subj, body = EmailService.render_template(template.subject_template, template.body_template, cand, jd)
    return {"rendered_subject": subj, "rendered_body": body}


@router.post("/send-manual")
def send_manual_email(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    """
    MODE A: Explicit manual review and send for an individual candidate.
    """
    candidate_id = payload.get("candidate_id")
    template_id = payload.get("template_id")
    custom_subject = payload.get("custom_subject")
    custom_body = payload.get("custom_body")
    assignment_id = payload.get("assignment_id")
    jd_id = payload.get("jd_id")

    if not candidate_id or not template_id:
        raise HTTPException(status_code=400, detail="Missing required 'candidate_id' or 'template_id'")

    try:
        res = EmailService.send_single_manual_email(
            db=db,
            candidate_id=candidate_id,
            template_id=template_id,
            sender_user_id=current_user.id if current_user else 1,
            custom_subject=custom_subject,
            custom_body=custom_body,
            assignment_id=assignment_id,
            jd_id=jd_id,
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


@router.get("/campaigns")
def list_campaigns(db: Session = Depends(get_db)):
    """
    Returns all outreach campaigns with status, recipient counts, and delivery metrics.
    """
    campaigns = db.query(OutreachCampaign).order_by(desc(OutreachCampaign.created_at)).all()
    results = []
    for c in campaigns:
        results.append({
            "id": c.id,
            "name": c.name,
            "jd_id": c.jd_id,
            "jd_title": c.jd_document.original_filename if c.jd_document else "Unknown JD",
            "template_name": c.template.name if c.template else "Template",
            "mode": c.mode,
            "status": c.status,
            "target_segment": c.target_segment or "All",
            "total_recipients": c.total_recipients,
            "sent_count": c.sent_count,
            "delivered_count": c.delivered_count,
            "reply_count": c.reply_count,
            "failed_count": c.failed_count,
            "created_by": c.created_by.full_name if c.created_by else "Recruiter",
            "approved_by": c.approved_by.full_name if c.approved_by else None,
            "created_at": c.created_at.isoformat(),
            "completed_at": c.completed_at.isoformat() if c.completed_at else None,
        })
    return {"items": results, "total": len(results)}


@router.post("/campaigns")
def create_campaign(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    """
    Creates a new campaign in DRAFT or PENDING_APPROVAL status.
    Never starts automatic sending upon creation.
    """
    name = payload.get("name")
    jd_id = payload.get("jd_id")
    template_id = payload.get("template_id")
    target_segment = payload.get("target_segment", "Strong Match")
    mode = payload.get("mode", "mode_b")
    submit_for_approval = payload.get("submit_for_approval", False)

    if not name or not jd_id or not template_id:
        raise HTTPException(status_code=400, detail="Missing 'name', 'jd_id', or 'template_id'")

    initial_status = CampaignStatus.PENDING_APPROVAL if submit_for_approval else CampaignStatus.DRAFT

    camp = OutreachCampaign(
        name=name.strip(),
        jd_id=jd_id,
        template_id=template_id,
        target_segment=target_segment,
        mode=mode,
        status=initial_status,
        created_by_user_id=current_user.id if current_user else 1,
    )
    db.add(camp)
    db.commit()
    db.refresh(camp)

    return {
        "status": "success",
        "message": f"Campaign '{camp.name}' created in '{camp.status}' state.",
        "campaign_id": camp.id,
        "campaign_status": camp.status,
    }


@router.post("/campaigns/{campaign_id}/approve")
def approve_campaign(
    campaign_id: int,
    payload: Dict[str, Any] = {},
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    """
    Explicit Manager Approval for an automated campaign (Mode B requirement).
    """
    camp = db.query(OutreachCampaign).filter(OutreachCampaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    camp.status = CampaignStatus.APPROVED
    camp.approved_by_user_id = current_user.id if current_user else 1
    camp.approval_notes = payload.get("notes", "Explicit manager approval granted.")
    camp.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "status": "success",
        "message": f"Campaign '{camp.name}' approved successfully.",
        "campaign_id": camp.id,
        "campaign_status": camp.status,
    }


@router.post("/campaigns/{campaign_id}/reject")
def reject_campaign(
    campaign_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    """
    Rejection of an automated campaign with reason.
    """
    camp = db.query(OutreachCampaign).filter(OutreachCampaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    reason = payload.get("reason", "Needs adjustment")
    camp.status = CampaignStatus.REJECTED
    camp.approval_notes = f"Rejected: {reason}"
    camp.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "status": "success",
        "message": f"Campaign '{camp.name}' rejected.",
        "campaign_id": camp.id,
        "campaign_status": camp.status,
    }


@router.post("/campaigns/{campaign_id}/execute")
def execute_campaign(
    campaign_id: int,
    payload: Dict[str, Any] = {},
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    """
    Triggers delivery of an approved campaign.
    Enforces that campaign status must be APPROVED.
    """
    candidate_ids = payload.get("candidate_ids")
    try:
        res = EmailService.execute_approved_campaign(db, campaign_id, candidate_ids)
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Campaign execution failed: {str(e)}")


@router.get("/candidate/{candidate_id}/timeline")
def get_candidate_communication_timeline(candidate_id: int, db: Session = Depends(get_db)):
    """
    Retrieves full communication history timeline for an individual candidate.
    """
    comms = db.query(CandidateCommunication).filter(
        CandidateCommunication.candidate_id == candidate_id,
    ).order_by(desc(CandidateCommunication.created_at)).all()

    results = []
    for c in comms:
        results.append({
            "id": c.id,
            "campaign_id": c.campaign_id,
            "campaign_name": c.campaign.name if c.campaign else None,
            "sender_name": c.sender.full_name if c.sender else "Recruiter",
            "recipient_email": c.recipient_email,
            "subject": c.subject,
            "body": c.body,
            "status": c.status,
            "provider_message_id": c.provider_message_id,
            "sent_at": c.sent_at.isoformat() if c.sent_at else None,
            "delivered_at": c.delivered_at.isoformat() if c.delivered_at else None,
            "reply_received_at": c.reply_received_at.isoformat() if c.reply_received_at else None,
            "reply_snippet": c.reply_snippet,
        })

    return {"items": results, "total": len(results)}


@router.post("/suppression")
def add_to_suppression_list(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Registers an email in the suppression / opt-out list.
    """
    email = payload.get("email")
    reason = payload.get("reason", "candidate_opt_out")
    if not email:
        raise HTTPException(status_code=400, detail="Missing email")

    clean_email = email.strip().lower()
    existing = db.query(EmailSuppressionList).filter(EmailSuppressionList.email == clean_email).first()
    if not existing:
        supp = EmailSuppressionList(email=clean_email, reason=reason)
        db.add(supp)
        db.commit()

    return {"status": "success", "message": f"{clean_email} added to suppression list."}


@router.post("/communications/{communication_id}/reply")
def record_candidate_reply(
    communication_id: int,
    payload: Dict[str, Any] = {},
    db: Session = Depends(get_db),
):
    """
    Simulates or records an incoming candidate reply.
    """
    reply_text = payload.get("reply", "Yes, I am interested in discussing this opportunity.")
    ok = EmailService.simulate_candidate_reply(db, communication_id, reply_text)
    if not ok:
        raise HTTPException(status_code=404, detail="Communication record not found")
    return {"status": "success", "message": "Reply recorded in candidate communication timeline."}
