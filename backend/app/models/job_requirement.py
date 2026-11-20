"""
Job Requirement Entity Model for TALENTRA.

Represents open requisitions, job descriptions, and hiring demands
sponsored by clients within the talent platform.
"""

from datetime import date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Integer, Boolean, Numeric, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from backend.app.models.client import Client
    from backend.app.models.submission import CandidateSubmission


class JobRequirement(Base, TimestampMixin):
    """
    JobRequirement model representing hiring positions.
    Belongs to a Client (many-to-1) and has many CandidateSubmissions (1-to-many).
    """
    __tablename__ = "job_requirements"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
        doc="Internal surrogate primary key identifier.",
    )
    req_code: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        index=True,
        nullable=False,
        doc="Unique business identifier for the requirement (e.g., 'REQ-2026-0001').",
    )
    client_id: Mapped[int] = mapped_column(
        ForeignKey("clients.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        doc="Foreign key reference to the sponsoring Client.",
    )
    title: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False,
        doc="Job title or role heading (e.g., 'Senior AI Engineer').",
    )
    department: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="Hiring business unit or engineering department.",
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Comprehensive job specification, responsibilities, and scope.",
    )
    experience_level: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="Seniority level tier ('entry', 'mid', 'senior', 'lead', 'executive').",
    )
    employment_type: Mapped[str] = mapped_column(
        String(50),
        default="full_time",
        server_default="full_time",
        nullable=False,
        doc="Contract terms ('full_time', 'contract', 'part_time').",
    )
    location: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True,
        doc="Primary office location or target territory.",
    )
    is_remote: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="0",
        nullable=False,
        doc="Boolean flag indicating if the role supports remote work.",
    )
    open_positions: Mapped[int] = mapped_column(
        Integer,
        default=1,
        server_default="1",
        nullable=False,
        doc="Target headcount / number of open vacancies for this role.",
    )
    budget_currency: Mapped[str] = mapped_column(
        String(10),
        default="USD",
        server_default="USD",
        nullable=False,
        doc="ISO currency code for budget figures.",
    )
    min_salary: Mapped[Optional[float]] = mapped_column(
        Numeric(12, 2),
        nullable=True,
        doc="Minimum annual compensation or hourly rate boundary.",
    )
    max_salary: Mapped[Optional[float]] = mapped_column(
        Numeric(12, 2),
        nullable=True,
        doc="Maximum annual compensation or hourly rate boundary.",
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="open",
        server_default="open",
        nullable=False,
        index=True,
        doc="Requisition state ('draft', 'open', 'interviewing', 'on_hold', 'filled', 'cancelled').",
    )
    priority: Mapped[str] = mapped_column(
        String(20),
        default="medium",
        server_default="medium",
        nullable=False,
        doc="Hiring priority level ('low', 'medium', 'high', 'urgent').",
    )
    required_skills: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Key required skills and competencies.",
    )
    target_start_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
        doc="Target onboarding or project commencement date.",
    )

    # Relationships
    client: Mapped["Client"] = relationship(
        "Client",
        back_populates="job_requirements",
        doc="Sponsoring client company.",
    )
    submissions: Mapped[List["CandidateSubmission"]] = relationship(
        "CandidateSubmission",
        back_populates="job_requirement",
        cascade="all, delete-orphan",
        doc="Submissions associated with this job requirement.",
    )

    def __repr__(self) -> str:
        return f"<JobRequirement(id={self.id}, code='{self.req_code}', title='{self.title}')>"
