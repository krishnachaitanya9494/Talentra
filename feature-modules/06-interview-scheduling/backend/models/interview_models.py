"""
SQLAlchemy Database Models for Module 06 — Advanced Interview Scheduling & Coordination System.
Inspired by the Ashby interview scheduling architecture.

Features:
- Interview Schedules and multi-stage panel coordination
- Interviewer working-hour limits, capacities, and availability exceptions
- Candidate availability collection requests and submitted slot preferences (F01)
- Interviewer workload metrics and limits (F02)
- Candidate self-booking requests with secure cryptographic tokens (F03)
- Interviewer replacement auditing and approval tracking (F04)
- Multi-stage interview templates with dependencies (F05)
- Candidate rescheduling portal and audit trail (F08)
"""

from datetime import datetime, timezone
import json
import secrets
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    Float,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

try:
    from backend.app.models.base import Base
except ImportError:
    from sqlalchemy.orm import declarative_base
    Base = declarative_base()


class InterviewSchedule(Base):
    """
    Main interview booking entity tracking candidates, requisition references,
    date-time bounds, multi-stage structure, delivery mode, and status lifecycle.
    """
    __tablename__ = "interview_schedules"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    interview_code = Column(String(32), unique=True, index=True, nullable=False)

    # Candidate reference
    candidate_id = Column(Integer, index=True, nullable=False)
    candidate_name = Column(String(255), nullable=False)
    candidate_email = Column(String(255), nullable=True)
    candidate_phone = Column(String(50), nullable=True)

    # Job requisition reference
    jd_id = Column(Integer, nullable=True, index=True)
    jd_title = Column(String(255), nullable=True)

    # Multi-stage and Template context
    template_id = Column(Integer, nullable=True, index=True)
    stage_order = Column(Integer, default=1, nullable=False)
    stage_id = Column(Integer, nullable=True)

    # Interview Specifications
    round_name = Column(String(100), default="Technical Round 1", nullable=False)
    interview_type = Column(String(50), default="technical", nullable=False)
    interview_date = Column(String(10), index=True, nullable=False)  # YYYY-MM-DD
    start_time = Column(String(5), nullable=False)                   # HH:MM
    end_time = Column(String(5), nullable=False)                     # HH:MM
    duration_minutes = Column(Integer, default=60, nullable=False)
    timezone = Column(String(50), default="UTC", nullable=False)
    mode = Column(String(50), default="virtual_google_meet", nullable=False)
    location_or_link = Column(String(500), nullable=True)

    # Instructions and internal notes
    instructions = Column(Text, nullable=True)
    recruiter_notes = Column(Text, nullable=True)
    feedback = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True)

    # State tracking: scheduled, confirmed, completed, rescheduled, cancelled, no_show
    status = Column(String(50), default="scheduled", index=True, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship to panel members
    panel_members = relationship(
        "InterviewPanelMember",
        back_populates="interview",
        cascade="all, delete-orphan",
        lazy="joined",
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "interview_code": self.interview_code,
            "candidate_id": self.candidate_id,
            "candidate_name": self.candidate_name,
            "candidate_email": self.candidate_email,
            "candidate_phone": self.candidate_phone,
            "jd_id": self.jd_id,
            "jd_title": self.jd_title,
            "template_id": self.template_id,
            "stage_order": self.stage_order,
            "stage_id": self.stage_id,
            "round_name": self.round_name,
            "interview_type": self.interview_type,
            "interview_date": self.interview_date,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration_minutes": self.duration_minutes,
            "timezone": self.timezone,
            "mode": self.mode,
            "location_or_link": self.location_or_link,
            "status": self.status,
            "instructions": self.instructions,
            "recruiter_notes": self.recruiter_notes,
            "feedback": self.feedback,
            "rating": self.rating,
            "created_at": self.created_at.isoformat() if self.created_at else "",
            "updated_at": self.updated_at.isoformat() if self.updated_at else "",
            "panel": [p.to_dict() for p in self.panel_members] if self.panel_members else [],
        }


class InterviewPanelMember(Base):
    """
    Assigned interviewer evaluation panel link for an interview session.
    """
    __tablename__ = "interview_panel_members"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    interview_id = Column(Integer, ForeignKey("interview_schedules.id", ondelete="CASCADE"), nullable=False, index=True)
    interviewer_id = Column(Integer, nullable=False, index=True)
    interviewer_name = Column(String(255), nullable=False)
    interviewer_role = Column(String(100), nullable=True)
    interviewer_email = Column(String(255), nullable=True)
    specialization = Column(String(100), nullable=True)
    is_lead = Column(Boolean, default=False, nullable=False)

    interview = relationship("InterviewSchedule", back_populates="panel_members")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "interview_id": self.interview_id,
            "interviewer_id": self.interviewer_id,
            "interviewer_name": self.interviewer_name,
            "interviewer_role": self.interviewer_role,
            "interviewer_email": self.interviewer_email,
            "specialization": self.specialization,
            "is_lead": self.is_lead,
        }


class InterviewAvailability(Base):
    """
    Recurring or date-specific busy blocks, lunch breaks, and leaves for interviewers.
    """
    __tablename__ = "interview_availabilities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    interviewer_id = Column(Integer, nullable=False, index=True)
    specific_date = Column(String(10), nullable=True, index=True)  # YYYY-MM-DD or None for recurring
    day_of_week = Column(Integer, nullable=True)                   # 0=Monday ... 6=Sunday
    start_time = Column(String(5), nullable=False)                 # HH:MM
    end_time = Column(String(5), nullable=False)                     # HH:MM
    is_busy_block = Column(Boolean, default=True, nullable=False)  # True = busy/unavailable
    label = Column(String(100), default="Unavailable", nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "interviewer_id": self.interviewer_id,
            "specific_date": self.specific_date,
            "day_of_week": self.day_of_week,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "is_busy_block": self.is_busy_block,
            "label": self.label,
        }


class InterviewerWorkingHours(Base):
    """
    MANDATORY FEATURE 07 & 02: Working hour limits, time zones, and capacity constraints.
    Prevents scheduling outside configured working hours or beyond workload capacity.
    """
    __tablename__ = "interviewer_working_hours"

    id = Column(Integer, primary_key=True, autoincrement=True)
    interviewer_id = Column(Integer, unique=True, index=True, nullable=False)
    interviewer_name = Column(String(255), nullable=False)
    role = Column(String(100), default="Technical Evaluator", nullable=False)
    specialization = Column(String(100), default="Full Stack", nullable=False)
    timezone = Column(String(50), default="UTC", nullable=False)

    # Working days (0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun) stored as JSON string
    working_days_json = Column(String(50), default="[0, 1, 2, 3, 4]", nullable=False)
    start_time = Column(String(5), default="09:00", nullable=False)
    end_time = Column(String(5), default="18:00", nullable=False)

    # Lunch break bounds
    lunch_start = Column(String(5), default="12:30", nullable=False)
    lunch_end = Column(String(5), default="13:30", nullable=False)

    # Workload capacity limits (F02)
    max_daily_interviews = Column(Integer, default=5, nullable=False)
    max_weekly_interviews = Column(Integer, default=20, nullable=False)
    max_daily_hours = Column(Float, default=6.0, nullable=False)
    buffer_minutes = Column(Integer, default=15, nullable=False)

    # Interviewer specializations/skills list for replacement matching (F04)
    skills_json = Column(Text, default="[\"General\", \"Technical\"]", nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "interviewer_id": self.interviewer_id,
            "interviewer_name": self.interviewer_name,
            "role": self.role,
            "specialization": self.specialization,
            "timezone": self.timezone,
            "working_days": json.loads(self.working_days_json or "[0,1,2,3,4]"),
            "start_time": self.start_time,
            "end_time": self.end_time,
            "lunch_start": self.lunch_start,
            "lunch_end": self.lunch_end,
            "max_daily_interviews": self.max_daily_interviews,
            "max_weekly_interviews": self.max_weekly_interviews,
            "max_daily_hours": self.max_daily_hours,
            "buffer_minutes": self.buffer_minutes,
            "skills": json.loads(self.skills_json or "[]"),
        }


class CandidateAvailabilityRequest(Base):
    """
    MANDATORY FEATURE 01: Candidate Availability Collection.
    Generates secure tokens allowing candidates to submit preferred dates and times.
    """
    __tablename__ = "candidate_availability_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    token = Column(String(64), unique=True, index=True, nullable=False)
    candidate_id = Column(Integer, index=True, nullable=False)
    candidate_name = Column(String(255), nullable=False)
    candidate_email = Column(String(255), nullable=True)
    jd_id = Column(Integer, nullable=True)
    jd_title = Column(String(255), nullable=True)
    round_name = Column(String(100), default="Technical Round", nullable=False)
    duration_minutes = Column(Integer, default=60, nullable=False)

    # Requested range
    date_range_start = Column(String(10), nullable=False)  # YYYY-MM-DD
    date_range_end = Column(String(10), nullable=False)    # YYYY-MM-DD
    time_windows_json = Column(Text, default="[\"09:00-12:00\", \"14:00-18:00\"]", nullable=False)

    # Submission status: request_sent, awaiting_response, submitted, expired
    status = Column(String(50), default="request_sent", index=True, nullable=False)
    candidate_timezone = Column(String(50), default="UTC", nullable=False)
    candidate_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    submitted_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=False)

    slots = relationship("CandidateAvailabilitySlot", back_populates="request", cascade="all, delete-orphan")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "token": self.token,
            "candidate_id": self.candidate_id,
            "candidate_name": self.candidate_name,
            "candidate_email": self.candidate_email,
            "jd_id": self.jd_id,
            "jd_title": self.jd_title,
            "round_name": self.round_name,
            "duration_minutes": self.duration_minutes,
            "date_range_start": self.date_range_start,
            "date_range_end": self.date_range_end,
            "time_windows": json.loads(self.time_windows_json or "[]"),
            "status": self.status,
            "candidate_timezone": self.candidate_timezone,
            "candidate_notes": self.candidate_notes,
            "created_at": self.created_at.isoformat() if self.created_at else "",
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else "",
            "expires_at": self.expires_at.isoformat() if self.expires_at else "",
            "slots": [s.to_dict() for s in self.slots] if self.slots else [],
        }


class CandidateAvailabilitySlot(Base):
    """
    Candidate preferred slots submitted via the availability collection portal.
    """
    __tablename__ = "candidate_availability_slots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(Integer, ForeignKey("candidate_availability_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    preferred_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    start_time = Column(String(5), nullable=False)                   # HH:MM
    end_time = Column(String(5), nullable=False)                     # HH:MM
    slot_priority = Column(Integer, default=1, nullable=False)       # 1=Primary, 2=Alternative

    request = relationship("CandidateAvailabilityRequest", back_populates="slots")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "request_id": self.request_id,
            "preferred_date": self.preferred_date,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "slot_priority": self.slot_priority,
        }


class CandidateBookingRequest(Base):
    """
    MANDATORY FEATURE 03: Candidate Self-Booking Link.
    Allows candidate to pick an approved time slot and confirm directly.
    """
    __tablename__ = "candidate_booking_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    token = Column(String(64), unique=True, index=True, nullable=False)
    candidate_id = Column(Integer, index=True, nullable=False)
    candidate_name = Column(String(255), nullable=False)
    candidate_email = Column(String(255), nullable=True)
    jd_id = Column(Integer, nullable=True)
    jd_title = Column(String(255), nullable=True)
    round_name = Column(String(100), default="Technical Round", nullable=False)
    duration_minutes = Column(Integer, default=60, nullable=False)

    # Approved interviewer IDs allowed for this booking
    interviewer_ids_json = Column(Text, default="[]", nullable=False)
    booking_window_start = Column(String(10), nullable=False)
    booking_window_end = Column(String(10), nullable=False)

    # Lifecycle: active, booked, expired, revoked
    status = Column(String(50), default="active", index=True, nullable=False)
    booked_interview_id = Column(Integer, nullable=True, index=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(DateTime, nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "token": self.token,
            "candidate_id": self.candidate_id,
            "candidate_name": self.candidate_name,
            "candidate_email": self.candidate_email,
            "jd_id": self.jd_id,
            "jd_title": self.jd_title,
            "round_name": self.round_name,
            "duration_minutes": self.duration_minutes,
            "interviewer_ids": json.loads(self.interviewer_ids_json or "[]"),
            "booking_window_start": self.booking_window_start,
            "booking_window_end": self.booking_window_end,
            "status": self.status,
            "booked_interview_id": self.booked_interview_id,
            "created_at": self.created_at.isoformat() if self.created_at else "",
            "expires_at": self.expires_at.isoformat() if self.expires_at else "",
        }


class InterviewTemplate(Base):
    """
    MANDATORY FEATURE 05: Multi-Stage Interview Templates.
    Defines reusable hiring workflows (e.g. Screening -> Tech 1 -> Tech 2 -> Managerial -> HR).
    """
    __tablename__ = "interview_templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_global = Column(Boolean, default=True, nullable=False)
    jd_id = Column(Integer, nullable=True, index=True)  # Null if global, specific JD if targeted
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    stages = relationship(
        "InterviewTemplateStage",
        back_populates="template",
        cascade="all, delete-orphan",
        order_by="InterviewTemplateStage.stage_order",
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "is_global": self.is_global,
            "jd_id": self.jd_id,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else "",
            "stages": [s.to_dict() for s in self.stages] if self.stages else [],
        }


class InterviewTemplateStage(Base):
    """
    A single evaluation stage inside an InterviewTemplate.
    """
    __tablename__ = "interview_template_stages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    template_id = Column(Integer, ForeignKey("interview_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    stage_order = Column(Integer, default=1, nullable=False)
    stage_name = Column(String(100), nullable=False)
    interview_type = Column(String(50), default="technical", nullable=False)
    duration_minutes = Column(Integer, default=60, nullable=False)
    interviewer_role = Column(String(100), default="Technical Evaluator", nullable=False)
    required_specialization = Column(String(100), default="Software Engineering", nullable=False)
    min_panel_size = Column(Integer, default=1, nullable=False)
    buffer_minutes = Column(Integer, default=15, nullable=False)
    is_mandatory = Column(Boolean, default=True, nullable=False)

    template = relationship("InterviewTemplate", back_populates="stages")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "template_id": self.template_id,
            "stage_order": self.stage_order,
            "stage_name": self.stage_name,
            "interview_type": self.interview_type,
            "duration_minutes": self.duration_minutes,
            "interviewer_role": self.interviewer_role,
            "required_specialization": self.required_specialization,
            "min_panel_size": self.min_panel_size,
            "buffer_minutes": self.buffer_minutes,
            "is_mandatory": self.is_mandatory,
        }


class InterviewRescheduleRequest(Base):
    """
    MANDATORY FEATURE 08: Candidate Rescheduling Portal.
    Allows candidates to request or directly reschedule sessions with safety validation.
    """
    __tablename__ = "interview_reschedule_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    token = Column(String(64), unique=True, index=True, nullable=False)
    interview_id = Column(Integer, ForeignKey("interview_schedules.id", ondelete="CASCADE"), nullable=False, index=True)
    mode = Column(String(50), default="self_service", nullable=False)  # 'self_service' or 'request_based'
    reason = Column(String(255), nullable=False)
    requested_date = Column(String(10), nullable=True)  # YYYY-MM-DD
    requested_start_time = Column(String(5), nullable=True)
    requested_end_time = Column(String(5), nullable=True)

    # Status: pending, approved, rejected, completed, expired
    status = Column(String(50), default="pending", index=True, nullable=False)
    candidate_notes = Column(Text, nullable=True)
    recruiter_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=False)

    interview = relationship("InterviewSchedule")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "token": self.token,
            "interview_id": self.interview_id,
            "mode": self.mode,
            "reason": self.reason,
            "requested_date": self.requested_date,
            "requested_start_time": self.requested_start_time,
            "requested_end_time": self.requested_end_time,
            "status": self.status,
            "candidate_notes": self.candidate_notes,
            "recruiter_notes": self.recruiter_notes,
            "created_at": self.created_at.isoformat() if self.created_at else "",
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else "",
            "expires_at": self.expires_at.isoformat() if self.expires_at else "",
        }


class InterviewHistory(Base):
    """
    Comprehensive audit log trail tracking all lifecycle transitions,
    reschedules, cancellations, capacity overrides, and replacement events.
    """
    __tablename__ = "interview_histories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    interview_id = Column(Integer, index=True, nullable=False)
    action = Column(String(50), nullable=False)  # 'scheduled', 'rescheduled', 'cancelled', 'replaced_interviewer', 'capacity_override', 'updated'
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    changed_by = Column(String(100), default="Recruiter", nullable=False)
    details = Column(Text, nullable=False)
    old_values_json = Column(Text, nullable=True)
    new_values_json = Column(Text, nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "interview_id": self.interview_id,
            "action": self.action,
            "timestamp": self.timestamp.isoformat() if self.timestamp else "",
            "changed_by": self.changed_by,
            "details": self.details,
            "old_values": json.loads(self.old_values_json) if self.old_values_json else None,
            "new_values": json.loads(self.new_values_json) if self.new_values_json else None,
        }
