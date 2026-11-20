"""
Candidate Entity Model for TALENTRA.

Represents prospective talent, applicants, and passive candidates
tracked within the platform's talent intelligence repository.
"""

from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from backend.app.models.submission import CandidateSubmission


class Candidate(Base, TimestampMixin):
    """
    Candidate model representing individual job seekers and professionals.
    Connects to JobRequirements through CandidateSubmission junction records.
    """
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
        doc="Internal surrogate primary key identifier.",
    )
    candidate_code: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        index=True,
        nullable=False,
        doc="Unique business identifier for the candidate (e.g., 'CAN-2026-0001').",
    )
    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        doc="Legal first name of the candidate.",
    )
    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        doc="Legal last name of the candidate.",
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
        doc="Unique primary email contact address.",
    )
    phone: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="Direct phone contact number.",
    )
    current_title: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True,
        doc="Most recent or active professional job title.",
    )
    current_company: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True,
        doc="Most recent or active employer.",
    )
    total_experience_years: Mapped[Optional[float]] = mapped_column(
        Numeric(4, 1),
        nullable=True,
        doc="Total cumulative years of professional work experience.",
    )
    location: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True,
        doc="Current city, state, or metropolitan area.",
    )
    resume_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="File path or URI pointing to the candidate's parsed resume.",
    )
    skills: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Comma-separated or structured list of verified candidate skills.",
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="available",
        server_default="available",
        nullable=False,
        doc="Current talent status ('available', 'placed', 'interviewing', 'inactive').",
    )

    # 1-to-many relationship: A candidate can be submitted to multiple job requirements
    submissions: Mapped[List["CandidateSubmission"]] = relationship(
        "CandidateSubmission",
        back_populates="candidate",
        cascade="all, delete-orphan",
        doc="All recruitment submissions associated with this candidate.",
    )

    @property
    def full_name(self) -> str:
        """Returns the full display name of the candidate."""
        return f"{self.first_name} {self.last_name}".strip()

    def __repr__(self) -> str:
        return f"<Candidate(id={self.id}, code='{self.candidate_code}', email='{self.email}')>"
