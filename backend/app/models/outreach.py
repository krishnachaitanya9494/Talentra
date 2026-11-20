"""
Email Outreach & Campaign Automation Database Models for TALENTRA Phase 5.

Provides relational models for email templates, automated campaigns,
recipient queues, delivery tracking, suppression/opt-out lists, and provider accounts.
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import relationship
from backend.app.models.base import Base


class CampaignStatus:
    DRAFT = "Draft"
    PENDING_APPROVAL = "Pending Approval"
    APPROVED = "Approved"
    SCHEDULED = "Scheduled"
    SENDING = "Sending"
    PAUSED = "Paused"
    COMPLETED = "Completed"
    FAILED = "Failed"
    CANCELLED = "Cancelled"
    REJECTED = "Rejected"

    ALL_STATUSES = [
        DRAFT,
        PENDING_APPROVAL,
        APPROVED,
        SCHEDULED,
        SENDING,
        PAUSED,
        COMPLETED,
        FAILED,
        CANCELLED,
        REJECTED,
    ]


class EmailTemplate(Base):
    """
    Reusable email template supporting variable personalization.
    """
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    template_type = Column(String(50), nullable=False, index=True)  # initial_outreach, availability, follow_up, interview, status_update
    subject_template = Column(String(255), nullable=False)
    body_template = Column(Text, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class EmailProviderAccount(Base):
    """
    Connected mailbox account (Gmail / Outlook / Mock) with encrypted tokens stored securely.
    """
    __tablename__ = "email_provider_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    provider_name = Column(String(50), default="mock", nullable=False)  # mock, gmail, outlook
    sender_email = Column(String(255), nullable=False)
    sender_name = Column(String(255), nullable=False)
    
    # OAuth Tokens (server-side only, never exposed to frontend)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expiry = Column(DateTime, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User")


class OutreachCampaign(Base):
    """
    Recruitment email campaign supporting Mode A (Manual review) and Mode B (Approved automated).
    """
    __tablename__ = "outreach_campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    jd_id = Column(Integer, ForeignKey("job_description_documents.id"), nullable=False, index=True)
    template_id = Column(Integer, ForeignKey("email_templates.id"), nullable=False)
    provider_account_id = Column(Integer, ForeignKey("email_provider_accounts.id"), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    mode = Column(String(20), default="mode_b", nullable=False)  # mode_a (manual), mode_b (approved automated)
    status = Column(String(50), default=CampaignStatus.DRAFT, nullable=False, index=True)
    target_segment = Column(String(50), nullable=True)  # Strong Match, Potential Match, or All

    total_recipients = Column(Integer, default=0, nullable=False)
    sent_count = Column(Integer, default=0, nullable=False)
    delivered_count = Column(Integer, default=0, nullable=False)
    reply_count = Column(Integer, default=0, nullable=False)
    failed_count = Column(Integer, default=0, nullable=False)

    scheduled_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    approval_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    jd_document = relationship("JobDescriptionDocument")
    template = relationship("EmailTemplate")
    provider_account = relationship("EmailProviderAccount")
    created_by = relationship("User", foreign_keys=[created_by_user_id])
    approved_by = relationship("User", foreign_keys=[approved_by_user_id])
    communications = relationship("CandidateCommunication", back_populates="campaign", cascade="all, delete-orphan")


class CandidateCommunication(Base):
    """
    Audit log of every email drafted, sent, delivered, or replied to for a candidate.
    """
    __tablename__ = "candidate_communications"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False, index=True)
    campaign_id = Column(Integer, ForeignKey("outreach_campaigns.id"), nullable=True, index=True)
    assignment_id = Column(Integer, ForeignKey("candidate_assignments.id"), nullable=True, index=True)
    sender_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    recipient_email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)

    status = Column(String(50), default="queued", nullable=False, index=True)  # queued, sent, delivered, failed, replied
    provider_message_id = Column(String(255), nullable=True, index=True)
    error_message = Column(Text, nullable=True)

    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    reply_received_at = Column(DateTime, nullable=True)
    reply_snippet = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    candidate = relationship("Candidate")
    campaign = relationship("OutreachCampaign", back_populates="communications")
    sender = relationship("User")


class EmailSuppressionList(Base):
    """
    Opt-out and suppression registry preventing unauthorized emails to unsubscribed candidates.
    """
    __tablename__ = "email_suppression_list"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    reason = Column(String(100), default="candidate_opt_out", nullable=False)  # candidate_opt_out, bounce, manual_suppression
    suppressed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
