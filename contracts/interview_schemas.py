"""
Contract Schemas for Module 06 — Advanced Interview Scheduling & Coordination System.
Decoupled, versioned Pydantic schemas.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class PanelMemberCreate(BaseModel):
    interviewer_id: int
    interviewer_name: Optional[str] = None
    interviewer_role: Optional[str] = None
    interviewer_email: Optional[str] = None
    specialization: Optional[str] = None
    is_lead: bool = False


class PanelMemberResponse(BaseModel):
    id: Optional[int] = None
    interviewer_id: int
    interviewer_name: str
    interviewer_role: Optional[str] = None
    interviewer_email: Optional[str] = None
    specialization: Optional[str] = None
    is_lead: bool = False


class InterviewCreateRequest(BaseModel):
    candidate_id: int
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    jd_id: Optional[int] = None
    jd_title: Optional[str] = None
    template_id: Optional[int] = None
    stage_order: int = 1
    round_name: str = "Technical Round 1"
    interview_type: str = "technical"
    interview_date: str = Field(..., description="Format YYYY-MM-DD")
    start_time: str = Field(..., description="Format HH:MM e.g. 10:00")
    end_time: str = Field(..., description="Format HH:MM e.g. 11:00")
    timezone: str = "UTC"
    mode: str = "virtual_google_meet"
    location_or_link: Optional[str] = None
    instructions: Optional[str] = None
    recruiter_notes: Optional[str] = None
    panel_interviewer_ids: List[int] = Field(default_factory=list)


class InterviewUpdateRequest(BaseModel):
    round_name: Optional[str] = None
    interview_type: Optional[str] = None
    interview_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    timezone: Optional[str] = None
    mode: Optional[str] = None
    location_or_link: Optional[str] = None
    instructions: Optional[str] = None
    recruiter_notes: Optional[str] = None
    panel_interviewer_ids: Optional[List[int]] = None
    status: Optional[str] = None
    feedback: Optional[str] = None
    rating: Optional[int] = None
    recommendation: Optional[str] = None


class InterviewRescheduleRequest(BaseModel):
    new_date: str
    new_start_time: str
    new_end_time: str
    reason: str
    changed_by: Optional[str] = "Recruiter"


class InterviewCancelRequest(BaseModel):
    cancellation_reason: str
    cancelled_by: Optional[str] = "Recruiter"


class InterviewResponse(BaseModel):
    id: int
    interview_code: str
    candidate_id: int
    candidate_name: str
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None
    jd_id: Optional[int] = None
    jd_title: Optional[str] = None
    template_id: Optional[int] = None
    stage_order: Optional[int] = 1
    round_name: str
    interview_type: str
    interview_date: str
    start_time: str
    end_time: str
    duration_minutes: int
    timezone: str
    mode: str
    location_or_link: Optional[str] = None
    status: str
    instructions: Optional[str] = None
    recruiter_notes: Optional[str] = None
    feedback: Optional[str] = None
    rating: Optional[int] = None
    panel: List[PanelMemberResponse] = Field(default_factory=list)
    created_at: str
    updated_at: str


class AvailabilityConflict(BaseModel):
    type: str  # 'candidate', 'interviewer', 'busy_block', 'capacity', 'working_hours'
    person_id: Optional[int] = None
    person_name: str
    conflict_time: str
    reason: str


class AvailabilityCheckRequest(BaseModel):
    interview_date: str
    start_time: str
    end_time: str
    candidate_id: Optional[int] = None
    interviewer_ids: List[int] = Field(default_factory=list)
    exclude_interview_id: Optional[int] = None


class AvailabilityCheckResponse(BaseModel):
    is_available: bool
    conflicts: List[AvailabilityConflict] = Field(default_factory=list)


# =========================================================================
# MANDATORY FEATURE 02 & 07: WORKLOAD & WORKING HOURS SCHEMAS
# =========================================================================

class InterviewerWorkloadResponse(BaseModel):
    interviewer_id: int
    interviewer_name: str
    role: str
    specialization: str
    timezone: str
    daily_count: int
    weekly_count: int
    daily_hours: float
    weekly_hours: float
    max_daily_interviews: int
    max_weekly_interviews: int
    max_daily_hours: float
    remaining_daily_capacity: int
    load_status: str  # 'comfortable', 'approaching', 'exceeded', 'unavailable'
    utilization_percentage: float


class WorkingHoursUpdateRequest(BaseModel):
    working_days: Optional[List[int]] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    lunch_start: Optional[str] = None
    lunch_end: Optional[str] = None
    max_daily_interviews: Optional[int] = None
    max_weekly_interviews: Optional[int] = None
    max_daily_hours: Optional[float] = None
    buffer_minutes: Optional[int] = None
    skills: Optional[List[str]] = None
    timezone: Optional[str] = None


# =========================================================================
# MANDATORY FEATURE 01: CANDIDATE AVAILABILITY COLLECTION SCHEMAS
# =========================================================================

class AvailabilityRequestCreate(BaseModel):
    candidate_id: int
    candidate_name: str
    candidate_email: Optional[str] = None
    jd_id: Optional[int] = None
    jd_title: Optional[str] = None
    round_name: str = "Technical Round 1"
    duration_minutes: int = 60
    date_range_start: str
    date_range_end: str
    time_windows: List[str] = Field(default_factory=lambda: ["09:00-12:00", "14:00-18:00"])
    expiration_days: int = 7


class CandidateSlotSubmission(BaseModel):
    preferred_date: str
    start_time: str
    end_time: str
    slot_priority: int = 1


class AvailabilitySubmissionRequest(BaseModel):
    candidate_timezone: str = "UTC"
    candidate_notes: Optional[str] = None
    preferred_slots: List[CandidateSlotSubmission] = Field(default_factory=list)


# =========================================================================
# MANDATORY FEATURE 03: CANDIDATE SELF-BOOKING SCHEMAS
# =========================================================================

class BookingLinkCreateRequest(BaseModel):
    candidate_id: int
    candidate_name: str
    candidate_email: Optional[str] = None
    jd_id: Optional[int] = None
    jd_title: Optional[str] = None
    round_name: str = "Technical Round 1"
    duration_minutes: int = 60
    interviewer_ids: List[int]
    booking_window_start: str
    booking_window_end: str
    expiration_days: int = 7


class CandidateBookingConfirmRequest(BaseModel):
    selected_date: str
    selected_start_time: str
    selected_end_time: str
    candidate_timezone: str = "UTC"
    candidate_phone: Optional[str] = None
    notes: Optional[str] = None


# =========================================================================
# MANDATORY FEATURE 04: AUTOMATIC REPLACEMENT SUGGESTIONS SCHEMAS
# =========================================================================

class ReplacementSuggestion(BaseModel):
    interviewer_id: int
    interviewer_name: str
    role: str
    specialization: str
    match_score: int  # 0 to 100
    is_available_at_slot: bool
    workload_status: str
    daily_count: int
    max_daily: int
    reasons: List[str] = Field(default_factory=list)


class InterviewerReplacementRequest(BaseModel):
    old_interviewer_id: int
    new_interviewer_id: int
    approved_by: str = "Recruiter"
    reason: Optional[str] = "Interviewer schedule adjustment"


# =========================================================================
# MANDATORY FEATURE 05: MULTI-STAGE INTERVIEW TEMPLATES SCHEMAS
# =========================================================================

class TemplateStageDefinition(BaseModel):
    stage_order: int
    stage_name: str
    interview_type: str = "technical"
    duration_minutes: int = 60
    interviewer_role: str = "Technical Evaluator"
    required_specialization: str = "Software Engineering"
    min_panel_size: int = 1
    buffer_minutes: int = 15
    is_mandatory: bool = True


class InterviewTemplateCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    is_global: bool = True
    jd_id: Optional[int] = None
    stages: List[TemplateStageDefinition] = Field(default_factory=list)


# =========================================================================
# MANDATORY FEATURE 08: CANDIDATE RESCHEDULING PORTAL SCHEMAS
# =========================================================================

class ReschedulePortalLinkCreate(BaseModel):
    interview_id: int
    mode: str = "self_service"  # 'self_service' or 'request_based'
    expiration_days: int = 5


class RescheduleSubmitRequest(BaseModel):
    reason: str
    new_date: Optional[str] = None
    new_start_time: Optional[str] = None
    new_end_time: Optional[str] = None
    candidate_notes: Optional[str] = None


class RescheduleResolutionRequest(BaseModel):
    approved: bool
    recruiter_notes: Optional[str] = None
    new_date: Optional[str] = None
    new_start_time: Optional[str] = None
    new_end_time: Optional[str] = None


# =========================================================================
# INVITATION & CALENDAR GRID
# =========================================================================

class InvitationPreviewResponse(BaseModel):
    subject: str
    body_text: str
    body_plain: Optional[str] = None
    body_html: str
    ics_content: str
    candidate_email: Optional[str]
    panel_emails: List[str]
