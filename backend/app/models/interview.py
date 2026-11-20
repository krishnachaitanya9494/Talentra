"""
Interview Entity Model for TALENTRA.

Represents scheduled and completed evaluation rounds conducted for
a candidate submission under a specific job requirement.
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from backend.app.models.submission import CandidateSubmission


class Interview(Base, TimestampMixin):
    """
    Interview model tracking individual evaluation sessions.
    Belongs to a CandidateSubmission (many-to-1).
    """
    __tablename__ = "interviews"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
        doc="Internal surrogate primary key identifier.",
    )
    interview_code: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        index=True,
        nullable=False,
        doc="Unique business identifier for the interview (e.g., 'INT-2026-0001').",
    )
    submission_id: Mapped[int] = mapped_column(
        ForeignKey("candidate_submissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Foreign key reference to CandidateSubmission.",
    )
    round_number: Mapped[int] = mapped_column(
        Integer,
        default=1,
        server_default="1",
        nullable=False,
        doc="Sequential evaluation round index (e.g., 1 for initial screen, 2 for tech, 3 for final).",
    )
    interview_type: Mapped[str] = mapped_column(
        String(50),
        default="technical",
        server_default="technical",
        nullable=False,
        doc="Interview assessment format ('screening', 'technical', 'behavioral', 'client_final', 'culture_fit').",
    )
    scheduled_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        doc="Planned start timestamp (timezone-aware).",
    )
    scheduled_end: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        doc="Planned conclusion timestamp (timezone-aware).",
    )
    interviewer_names: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        doc="Names or identifiers of the assigned evaluation panel.",
    )
    meeting_link: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="Video conference URL (Google Meet, Teams, Zoom).",
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="scheduled",
        server_default="scheduled",
        nullable=False,
        index=True,
        doc="Current session state ('scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show').",
    )
    feedback: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Structured debrief and qualitative evaluation notes.",
    )
    rating: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        doc="Numerical score on a 1-5 scale (1: Unsatisfactory, 5: Exceptional).",
    )
    recommendation: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="Post-interview hiring recommendation ('strong_hire', 'hire', 'hold', 'no_hire').",
    )

    # Relationships
    submission: Mapped["CandidateSubmission"] = relationship(
        "CandidateSubmission",
        back_populates="interviews",
        doc="Candidate submission associated with this interview round.",
    )

    def __repr__(self) -> str:
        return f"<Interview(id={self.id}, code='{self.interview_code}', round={self.round_number}, status='{self.status}')>"
