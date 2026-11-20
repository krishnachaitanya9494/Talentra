"""
Candidate Submission Entity Model for TALENTRA.

Represents the association and application pipeline tracking a candidate
against a specific job requirement sponsored by a client.
"""

from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Numeric, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from backend.app.models.candidate import Candidate
    from backend.app.models.job_requirement import JobRequirement
    from backend.app.models.interview import Interview


class CandidateSubmission(Base, TimestampMixin):
    """
    CandidateSubmission model connecting Candidates to JobRequirements.
    Acts as an association entity containing application status, match metrics,
    and child interview schedules.
    """
    __tablename__ = "candidate_submissions"

    # Enforce uniqueness so a candidate cannot be submitted multiple times to the same requirement
    __table_args__ = (
        UniqueConstraint(
            "candidate_id",
            "job_requirement_id",
            name="uq_candidate_job_requirement",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
        doc="Internal surrogate primary key identifier.",
    )
    submission_code: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        index=True,
        nullable=False,
        doc="Unique business identifier for the submission (e.g., 'SUB-2026-0001').",
    )
    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Foreign key reference to Candidate.",
    )
    job_requirement_id: Mapped[int] = mapped_column(
        ForeignKey("job_requirements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Foreign key reference to JobRequirement.",
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="submitted",
        server_default="submitted",
        nullable=False,
        index=True,
        doc="Workflow pipeline stage ('submitted', 'reviewing', 'shortlisted', 'interviewing', 'offered', 'hired', 'rejected', 'withdrawn').",
    )
    match_score: Mapped[Optional[float]] = mapped_column(
        Numeric(5, 2),
        nullable=True,
        doc="Analytical candidate-to-requirement relevance percentage (e.g., 88.50).",
    )
    submitted_by: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="Recruiter or user who originated this candidate submission.",
    )
    submission_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Internal recruiter screening notes and qualifications summary.",
    )
    proposed_rate: Mapped[Optional[float]] = mapped_column(
        Numeric(12, 2),
        nullable=True,
        doc="Candidate's proposed hourly rate or requested salary for this position.",
    )

    # Relationships
    candidate: Mapped["Candidate"] = relationship(
        "Candidate",
        back_populates="submissions",
        doc="Candidate associated with this submission.",
    )
    job_requirement: Mapped["JobRequirement"] = relationship(
        "JobRequirement",
        back_populates="submissions",
        doc="Target job requirement associated with this submission.",
    )
    interviews: Mapped[List["Interview"]] = relationship(
        "Interview",
        back_populates="submission",
        cascade="all, delete-orphan",
        doc="Interview rounds conducted for this submission.",
    )

    def __repr__(self) -> str:
        return f"<CandidateSubmission(id={self.id}, code='{self.submission_code}', status='{self.status}')>"
