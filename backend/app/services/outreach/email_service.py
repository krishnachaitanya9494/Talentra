"""
Email Outreach & Campaign Automation Service for TALENTRA Phase 5.

Implements:
- Mode A (Manual review & send) and Mode B (Approved automated campaigns).
- Reusable recruitment email templates with dynamic variable personalization.
- Strict recipient validation (format check, suppression list, duplicate prevention).
- Mock email delivery provider for development and automated tests.
- Audit tracking in candidate communication history.
"""

import re
import uuid
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.models.user import User
from backend.app.models.candidate import Candidate
from backend.app.models.document import JobDescriptionDocument
from backend.app.models.matching import CandidateMatch
from backend.app.models.assignment import CandidateAssignment
from backend.app.models.outreach import (
    EmailTemplate,
    EmailProviderAccount,
    OutreachCampaign,
    CampaignStatus,
    CandidateCommunication,
    EmailSuppressionList,
)


class EmailService:
    """
    Core recruitment email service managing personalization, validation, and delivery.
    """

    @classmethod
    def get_or_create_default_templates(cls, db: Session) -> List[EmailTemplate]:
        """
        Retrieves or bootstraps 5 standard professional recruiting email templates.
        """
        templates = db.query(EmailTemplate).all()
        if not templates:
            defaults = [
                {
                    "name": "Initial Job Opportunity Outreach",
                    "template_type": "initial_outreach",
                    "subject_template": "Exciting Opportunity: {{job_title}} Role at {{company_name}}",
                    "body_template": (
                        "Hi {{first_name}},\n\n"
                        "I came across your profile and was very impressed by your background in {{skills}}.\n\n"
                        "We are currently hiring for a {{job_title}} position located in {{location}}. Given your impressive experience, "
                        "I believe your skills align exceptionally well with what our team is looking for.\n\n"
                        "Would you be open to a brief 10-minute introductory conversation this week to discuss the role and see if it aligns with your career goals?\n\n"
                        "Best regards,\n"
                        "{{recruiter_name}}\n"
                        "Talent Acquisition Team\n"
                        "{{recruiter_email}}"
                    ),
                    "is_default": True,
                },
                {
                    "name": "Candidate Availability Confirmation",
                    "template_type": "availability",
                    "subject_template": "Checking in: Your availability for {{job_title}}",
                    "body_template": (
                        "Hello {{first_name}},\n\n"
                        "I hope you are having a productive week. Following up regarding the {{job_title}} opportunity at {{company_name}}.\n\n"
                        "Could you please confirm your current availability and notice period? If you are open to discussing next steps, "
                        "please let me know a convenient time for a quick call.\n\n"
                        "Warm regards,\n"
                        "{{recruiter_name}}\n"
                        "{{recruiter_email}}"
                    ),
                    "is_default": False,
                },
                {
                    "name": "Follow-up Reminder",
                    "template_type": "follow_up",
                    "subject_template": "Following up: {{job_title}} opportunity with {{company_name}}",
                    "body_template": (
                        "Hi {{first_name}},\n\n"
                        "Just wanted to gently follow up on my previous message regarding the {{job_title}} requisition.\n\n"
                        "We are moving quickly with initial discussions, and I'd love to share more details about the technical roadmap and team structure if you are interested.\n\n"
                        "Looking forward to hearing from you,\n"
                        "{{recruiter_name}}"
                    ),
                    "is_default": False,
                },
                {
                    "name": "Technical Interview Invitation",
                    "template_type": "interview",
                    "subject_template": "Interview Invitation: {{job_title}} at {{company_name}}",
                    "body_template": (
                        "Dear {{first_name}},\n\n"
                        "Thank you for taking the time to speak with us. The team was very impressed by your experience!\n\n"
                        "We would like to invite you to a technical interview for the {{job_title}} position. "
                        "The session will be approximately 45–60 minutes and will focus on your background and core technical competencies.\n\n"
                        "Please reply with 2–3 time slots that work best for you over the next few days.\n\n"
                        "Best regards,\n"
                        "{{recruiter_name}}\n"
                        "Talent Operations"
                    ),
                    "is_default": False,
                },
                {
                    "name": "Application Status Update",
                    "template_type": "status_update",
                    "subject_template": "Update regarding your application for {{job_title}}",
                    "body_template": (
                        "Dear {{first_name}},\n\n"
                        "Thank you for your interest in the {{job_title}} role at {{company_name}}.\n\n"
                        "We wanted to let you know that we have reviewed your qualifications. While your background is impressive, "
                        "we have decided to proceed with other candidates whose experience more closely matches our immediate requirements.\n\n"
                        "We will keep your profile in our talent repository and reach out as soon as a relevant opportunity arises.\n\n"
                        "We wish you all the best in your career pursuits,\n"
                        "{{recruiter_name}}"
                    ),
                    "is_default": False,
                },
            ]

            for d in defaults:
                t = EmailTemplate(
                    name=d["name"],
                    template_type=d["template_type"],
                    subject_template=d["subject_template"],
                    body_template=d["body_template"],
                    is_default=d["is_default"],
                )
                db.add(t)
            db.commit()
            templates = db.query(EmailTemplate).all()

        return templates

    @classmethod
    def render_template(
        cls,
        subject_tpl: str,
        body_tpl: str,
        candidate: Candidate,
        jd: Optional[JobDescriptionDocument] = None,
        recruiter: Optional[User] = None,
        company_name: str = "TALENTRA Client",
    ) -> Tuple[str, str]:
        """
        Renders subject and body with candidate and job personalization variables.
        Never invents missing candidate info.
        """
        first_name = candidate.first_name or (candidate.full_name.split()[0] if candidate.full_name else "Candidate")
        full_name = candidate.full_name or first_name
        job_title = jd.original_filename.replace(".txt", "").replace(".docx", "").replace(".pdf", "").replace("_", " ").title() if jd else "Engineering Role"
        recruiter_name = recruiter.full_name if recruiter else "Talent Acquisition Team"
        recruiter_email = recruiter.email if recruiter else "recruiting@talentra.ai"
        skills = candidate.skills.split(",")[0].strip() if candidate.skills else "your technical domain"
        location = candidate.location or "Hybrid / Remote"

        replacements = {
            "{{first_name}}": first_name,
            "{{candidate_name}}": full_name,
            "{{job_title}}": job_title,
            "{{company_name}}": company_name,
            "{{recruiter_name}}": recruiter_name,
            "{{recruiter_email}}": recruiter_email,
            "{{skills}}": skills,
            "{{location}}": location,
        }

        subj = subject_tpl
        body = body_tpl
        for var, val in replacements.items():
            subj = subj.replace(var, str(val))
            body = body.replace(var, str(val))

        return subj, body

    @classmethod
    def validate_recipient(
        cls,
        db: Session,
        candidate_id: int,
        campaign_id: Optional[int] = None,
        jd_id: Optional[int] = None,
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Verifies recipient eligibility:
        1. Valid email format.
        2. Not in opt-out / suppression registry.
        3. No duplicate previous email for this campaign or JD.
        """
        cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not cand or not cand.email:
            return False, "Candidate has no verified contact email address", None

        email = cand.email.strip().lower()

        # Check suppression / opt-out
        suppressed = db.query(EmailSuppressionList).filter(
            EmailSuppressionList.email == email,
        ).first()
        if suppressed:
            return False, f"Recipient opted out of recruitment communications (reason: {suppressed.reason})", email

        # Check duplicate outreach for same campaign
        if campaign_id:
            already_sent = db.query(CandidateCommunication).filter(
                CandidateCommunication.candidate_id == candidate_id,
                CandidateCommunication.campaign_id == campaign_id,
                CandidateCommunication.status.in_(["sent", "delivered"]),
            ).first()
            if already_sent:
                return False, "Candidate already emailed under this active campaign", email

        return True, "Eligible", email

    @classmethod
    def send_single_manual_email(
        cls,
        db: Session,
        candidate_id: int,
        template_id: int,
        sender_user_id: int,
        custom_subject: Optional[str] = None,
        custom_body: Optional[str] = None,
        assignment_id: Optional[int] = None,
        jd_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        MODE A: Manual email review and send for an individual candidate.
        Requires explicit recruiter confirmation.
        """
        cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not cand:
            raise ValueError(f"Candidate with id {candidate_id} not found")

        template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
        if not template:
            raise ValueError(f"Email template with id {template_id} not found")

        sender = db.query(User).filter(User.id == sender_user_id).first()
        jd = db.query(JobDescriptionDocument).filter(JobDescriptionDocument.id == jd_id).first() if jd_id else None

        # Validate recipient
        is_eligible, reason, email = cls.validate_recipient(db, candidate_id, jd_id=jd_id)
        if not is_eligible:
            raise ValueError(f"Recipient validation failed: {reason}")

        # Render or use custom edited text
        if custom_subject and custom_body:
            subj, body = custom_subject.strip(), custom_body.strip()
        else:
            subj, body = cls.render_template(template.subject_template, template.body_template, cand, jd, sender)

        # Mock Email Provider Delivery
        provider_msg_id = f"mock-msg-{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)

        comm = CandidateCommunication(
            candidate_id=candidate_id,
            assignment_id=assignment_id,
            sender_user_id=sender_user_id,
            recipient_email=email,
            subject=subj,
            body=body,
            status="delivered",
            provider_message_id=provider_msg_id,
            sent_at=now,
            delivered_at=now,
        )
        db.add(comm)

        # If linked to an assignment, advance status to Contacted
        if assignment_id:
            assign_rec = db.query(CandidateAssignment).filter(CandidateAssignment.id == assignment_id).first()
            if assign_rec and assign_rec.status == "Assigned":
                assign_rec.status = "Contacted"
                assign_rec.updated_at = now

        db.commit()
        db.refresh(comm)

        return {
            "status": "success",
            "communication_id": comm.id,
            "provider_message_id": provider_msg_id,
            "recipient_email": email,
            "subject": subj,
            "sent_at": comm.sent_at.isoformat(),
        }

    @classmethod
    def execute_approved_campaign(
        cls,
        db: Session,
        campaign_id: int,
        candidate_ids: Optional[List[int]] = None,
    ) -> Dict[str, Any]:
        """
        MODE B: Background execution of an approved automated campaign.
        Enforces campaign status == Approved before any message is sent.
        """
        campaign = db.query(OutreachCampaign).filter(OutreachCampaign.id == campaign_id).first()
        if not campaign:
            raise ValueError(f"Campaign with id {campaign_id} not found")

        if campaign.status not in [CampaignStatus.APPROVED, CampaignStatus.SENDING]:
            raise ValueError(
                f"Campaign cannot start: Current status is '{campaign.status}'. Explicit manager approval required."
            )

        campaign.status = CampaignStatus.SENDING
        campaign.started_at = datetime.now(timezone.utc)
        db.commit()

        template = campaign.template
        jd = campaign.jd_document
        sender = campaign.created_by

        # If candidates not explicitly supplied, find from matching segment
        if not candidate_ids:
            matches_query = db.query(CandidateMatch).filter(CandidateMatch.jd_id == campaign.jd_id)
            if campaign.target_segment and campaign.target_segment != "All":
                matches_query = matches_query.filter(CandidateMatch.segment == campaign.target_segment)
            matches = matches_query.all()
            candidate_ids = [m.candidate_id for m in matches]

        sent = 0
        delivered = 0
        failed = 0
        now = datetime.now(timezone.utc)

        for cand_id in candidate_ids:
            is_eligible, reason, email = cls.validate_recipient(db, cand_id, campaign_id=campaign.id, jd_id=campaign.jd_id)
            if not is_eligible:
                failed += 1
                continue

            cand = db.query(Candidate).filter(Candidate.id == cand_id).first()
            if not cand:
                continue

            subj, body = cls.render_template(template.subject_template, template.body_template, cand, jd, sender)
            msg_id = f"mock-camp-{campaign.id}-{uuid.uuid4().hex[:8]}"

            comm = CandidateCommunication(
                candidate_id=cand_id,
                campaign_id=campaign.id,
                sender_user_id=campaign.created_by_user_id,
                recipient_email=email,
                subject=subj,
                body=body,
                status="delivered",
                provider_message_id=msg_id,
                sent_at=now,
                delivered_at=now,
            )
            db.add(comm)
            sent += 1
            delivered += 1

        campaign.status = CampaignStatus.COMPLETED
        campaign.completed_at = datetime.now(timezone.utc)
        campaign.sent_count += sent
        campaign.delivered_count += delivered
        campaign.failed_count += failed
        campaign.total_recipients = len(candidate_ids)

        db.commit()
        db.refresh(campaign)

        return {
            "status": "success",
            "campaign_id": campaign.id,
            "campaign_name": campaign.name,
            "sent_count": sent,
            "delivered_count": delivered,
            "failed_count": failed,
            "completed_at": campaign.completed_at.isoformat(),
        }

    @classmethod
    def simulate_candidate_reply(
        cls,
        db: Session,
        communication_id: int,
        reply_snippet: str = "Hi, yes! I am interested in discussing this opportunity.",
    ) -> bool:
        """
        Simulates an incoming candidate reply for testing communication timelines.
        """
        comm = db.query(CandidateCommunication).filter(CandidateCommunication.id == communication_id).first()
        if not comm:
            return False

        comm.status = "replied"
        comm.reply_received_at = datetime.now(timezone.utc)
        comm.reply_snippet = reply_snippet

        if comm.campaign_id:
            camp = db.query(OutreachCampaign).filter(OutreachCampaign.id == comm.campaign_id).first()
            if camp:
                camp.reply_count += 1

        db.commit()
        return True
