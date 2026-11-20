"""
Candidate Assignment & TA Ownership Database Models for TALENTRA Phase 4.

Provides relational models for manual candidate distribution, assignment lifecycle
tracking, historical ownership audit trail, internal notes, and in-app notifications.
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


class AssignmentStatus:
    ASSIGNED = "Assigned"
    CONTACT_PENDING = "Contact Pending"
    CONTACTED = "Contacted"
    FOLLOW_UP_REQUIRED = "Follow-up Required"
    INTERESTED = "Interested"
    NOT_INTERESTED = "Not Interested"
    SHORTLISTED = "Shortlisted"
    REJECTED = "Rejected"
    ON_HOLD = "On Hold"
    COMPLETED = "Completed"

    ALL_STATUSES = [
        ASSIGNED,
        CONTACT_PENDING,
        CONTACTED,
        FOLLOW_UP_REQUIRED,
        INTERESTED,
        NOT_INTERESTED,
        SHORTLISTED,
        REJECTED,
        ON_HOLD,
        COMPLETED,
    ]


class CandidateAssignment(Base):
    """
    Represents an active or historical manual assignment of a candidate
    against a specific Job Description to a Talent Acquisition Specialist.
    """
    __tablename__ = "candidate_assignments"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False, index=True)
    jd_id = Column(Integer, ForeignKey("job_description_documents.id"), nullable=False, index=True)
    ta_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    assigned_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    status = Column(String(50), default=AssignmentStatus.ASSIGNED, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    # Cached snapshot of matching intelligence for fast dashboard querying
    matching_score = Column(Float, nullable=True)
    segment = Column(String(50), nullable=True)

    notes = Column(Text, nullable=True)

    assigned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    candidate = relationship("Candidate")
    jd_document = relationship("JobDescriptionDocument")
    ta_user = relationship("User", foreign_keys=[ta_user_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_user_id])
    history = relationship(
        "AssignmentHistory",
        back_populates="assignment",
        cascade="all, delete-orphan",
        order_by="desc(AssignmentHistory.created_at)",
    )
    assignment_notes = relationship(
        "AssignmentNote",
        back_populates="assignment",
        cascade="all, delete-orphan",
        order_by="desc(AssignmentNote.created_at)",
    )


class AssignmentHistory(Base):
    """
    Tamper-evident audit log recording every reassignment, ownership change,
    or status transition for a candidate assignment.
    """
    __tablename__ = "assignment_history"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("candidate_assignments.id"), nullable=False, index=True)
    previous_ta_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    new_ta_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False)  # assigned, reassigned, unassigned, status_changed
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    assignment = relationship("CandidateAssignment", back_populates="history")
    previous_ta = relationship("User", foreign_keys=[previous_ta_id])
    new_ta = relationship("User", foreign_keys=[new_ta_id])
    changed_by = relationship("User", foreign_keys=[changed_by_user_id])


class AssignmentNote(Base):
    """
    Internal recruiter notes attached to a candidate assignment.
    """
    __tablename__ = "assignment_notes"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("candidate_assignments.id"), nullable=False, index=True)
    author_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    assignment = relationship("CandidateAssignment", back_populates="assignment_notes")
    author = relationship("User")


class AssignmentNotification(Base):
    """
    In-app notifications for TA candidate distribution, follow-ups, and reassignment.
    """
    __tablename__ = "assignment_notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="assignment", nullable=False)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    recipient = relationship("User")
