"""
FastAPI Router for Module 06 — Advanced Interview Scheduling & Coordination System.
Inspired by Ashby interview scheduling.

Exposes RESTful endpoints for:
- Core multi-interviewer scheduling, calendar grid aggregation, and .ics export
- Workload metrics & capacity checks (F02)
- Working hours, lunch break, and buffer management (F07)
- Candidate availability collection requests & public submission (F01)
- Candidate self-booking link generation & public slot confirmation (F03)
- Automatic replacement suggestions & recruiter approval (F04)
- Multi-stage interview templates (F05)
- Candidate rescheduling portal (F08)
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

try:
    from ..models.interview_models import (
        InterviewSchedule,
        InterviewPanelMember,
        InterviewAvailability,
        InterviewerWorkingHours,
        CandidateAvailabilityRequest,
        CandidateAvailabilitySlot,
        CandidateBookingRequest,
        InterviewTemplate,
        InterviewTemplateStage,
        InterviewRescheduleRequest as RescheduleRequestModel,
        InterviewHistory,
    )
    from ..services.interview_service import InterviewService, SchedulingConflictException
    from ...contracts.interview_schemas import (
        InterviewCreateRequest,
        InterviewUpdateRequest,
        InterviewRescheduleRequest,
        InterviewCancelRequest,
        InterviewResponse,
        AvailabilityCheckRequest,
        AvailabilityCheckResponse,
        InvitationPreviewResponse,
        InterviewerWorkloadResponse,
        WorkingHoursUpdateRequest,
        AvailabilityRequestCreate,
        AvailabilitySubmissionRequest,
        BookingLinkCreateRequest,
        CandidateBookingConfirmRequest,
        ReplacementSuggestion,
        InterviewerReplacementRequest,
        InterviewTemplateCreateRequest,
        RescheduleSubmitRequest,
        RescheduleResolutionRequest,
    )
except (ImportError, ValueError):
    try:
        from backend.app.models.interview_models import (
            InterviewSchedule,
            InterviewPanelMember,
            InterviewAvailability,
            InterviewerWorkingHours,
            CandidateAvailabilityRequest,
            CandidateAvailabilitySlot,
            CandidateBookingRequest,
            InterviewTemplate,
            InterviewTemplateStage,
            InterviewRescheduleRequest as RescheduleRequestModel,
            InterviewHistory,
        )
        from backend.app.services.interview.interview_service import InterviewService, SchedulingConflictException
        from backend.app.schemas.interview_schemas import (
            InterviewCreateRequest,
            InterviewUpdateRequest,
            InterviewRescheduleRequest,
            InterviewCancelRequest,
            InterviewResponse,
            AvailabilityCheckRequest,
            AvailabilityCheckResponse,
            InvitationPreviewResponse,
            InterviewerWorkloadResponse,
            WorkingHoursUpdateRequest,
            AvailabilityRequestCreate,
            AvailabilitySubmissionRequest,
            BookingLinkCreateRequest,
            CandidateBookingConfirmRequest,
            ReplacementSuggestion,
            InterviewerReplacementRequest,
            InterviewTemplateCreateRequest,
            RescheduleSubmitRequest,
            RescheduleResolutionRequest,
        )
    except (ImportError, ValueError):
        from models.interview_models import (
            InterviewSchedule,
            InterviewPanelMember,
            InterviewAvailability,
            InterviewerWorkingHours,
            CandidateAvailabilityRequest,
            CandidateAvailabilitySlot,
            CandidateBookingRequest,
            InterviewTemplate,
            InterviewTemplateStage,
            InterviewRescheduleRequest as RescheduleRequestModel,
            InterviewHistory,
        )
        from services.interview_service import InterviewService, SchedulingConflictException
        from schemas.interview_schemas import (
            InterviewCreateRequest,
            InterviewUpdateRequest,
            InterviewRescheduleRequest,
            InterviewCancelRequest,
            InterviewResponse,
            AvailabilityCheckRequest,
            AvailabilityCheckResponse,
            InvitationPreviewResponse,
            InterviewerWorkloadResponse,
            WorkingHoursUpdateRequest,
            AvailabilityRequestCreate,
            AvailabilitySubmissionRequest,
            BookingLinkCreateRequest,
            CandidateBookingConfirmRequest,
            ReplacementSuggestion,
            InterviewerReplacementRequest,
            InterviewTemplateCreateRequest,
            RescheduleSubmitRequest,
            RescheduleResolutionRequest,
        )

# Portable DB Session Dependency
try:
    from backend.app.database.session import get_db
except ImportError:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    standalone_engine = create_engine("sqlite:///./interview_standalone.db", connect_args={"check_same_thread": False})
    StandaloneSession = sessionmaker(autocommit=False, autoflush=False, bind=standalone_engine)
    def get_db():
        db = StandaloneSession()
        try:
            yield db
        finally:
            db.close()

router = APIRouter(prefix="/api/v1/interviews", tags=["Interview Scheduling & Coordination"])


def get_all_interviewers(db: Session) -> List[dict]:
    """Returns interviewers from host User table or returns configured evaluators."""
    try:
        from backend.app.models.user import User
        users = db.query(User).filter(User.is_active == True).all()
        if users:
            results = []
            for u in users:
                scheduled_count = db.query(InterviewPanelMember).join(
                    InterviewSchedule, InterviewPanelMember.interview_id == InterviewSchedule.id
                ).filter(
                    InterviewPanelMember.interviewer_id == u.id,
                    InterviewSchedule.status.notin_(["cancelled"]),
                ).count()
                results.append({
                    "id": u.id,
                    "full_name": u.full_name,
                    "email": u.email,
                    "role": u.role.replace("_", " ").title(),
                    "team": u.team or "Engineering Panel",
                    "specialization": u.technical_specialization or "Full Stack, Cloud",
                    "scheduled_count": scheduled_count,
                    "is_available": True,
                })
            return results
    except Exception:
        pass

    # Fallback to configured working hours or defaults
    wh_records = db.query(InterviewerWorkingHours).all()
    if wh_records:
        res = []
        for wh in wh_records:
            cnt = db.query(InterviewPanelMember).join(
                InterviewSchedule, InterviewPanelMember.interview_id == InterviewSchedule.id
            ).filter(
                InterviewPanelMember.interviewer_id == wh.interviewer_id,
                InterviewSchedule.status.notin_(["cancelled"]),
            ).count()
            res.append({
                "id": wh.interviewer_id,
                "full_name": wh.interviewer_name,
                "email": f"{wh.interviewer_name.lower().replace(' ', '.')}@talentra.ai",
                "role": wh.role,
                "team": "Technical Panel",
                "specialization": wh.specialization,
                "scheduled_count": cnt,
                "is_available": True,
            })
        return res

    return [
        {"id": 1, "full_name": "Recruiter 1", "email": "recruiter1@talentra.ai", "role": "Administrator", "specialization": "Full Stack, Cloud", "scheduled_count": 0, "is_available": True},
        {"id": 2, "full_name": "Recruiter 2", "email": "recruiter2@talentra.ai", "role": "Senior TA Lead", "specialization": "Kubernetes, AWS, Docker, Python", "scheduled_count": 0, "is_available": True},
        {"id": 3, "full_name": "Recruiter 3", "email": "recruiter3@talentra.ai", "role": "Principal TA Recruiter", "specialization": "SAP, Oracle, Hyperion, Data Engineering", "scheduled_count": 0, "is_available": True},
        {"id": 4, "full_name": "Recruiter 4", "email": "recruiter4@talentra.ai", "role": "Engineering Manager", "specialization": "React, TypeScript, Java, Spring Boot", "scheduled_count": 0, "is_available": True},
        {"id": 5, "full_name": "Recruiter 5", "role": "Recruitment Manager", "email": "recruiter5@talentra.ai", "specialization": "Engineering Staffing & Requisitions", "scheduled_count": 0, "is_available": True},
    ]


# =========================================================================
# 1. CORE CALENDAR & INTERVIEWS
# =========================================================================

@router.get("/calendar")
def get_calendar(
    start_date: str = Query(..., description="YYYY-MM-DD"),
    end_date: str = Query(..., description="YYYY-MM-DD"),
    interviewer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    catalog = get_all_interviewers(db)
    return InterviewService.get_calendar_grid(db, start_date, end_date, interviewer_id, catalog)


@router.get("/interviewers")
def list_interviewers(db: Session = Depends(get_db)):
    return get_all_interviewers(db)


@router.get("/candidates")
def list_candidates(db: Session = Depends(get_db)):
    try:
        from backend.app.models.candidate import Candidate
        cands = db.query(Candidate).order_by(Candidate.id.desc()).limit(100).all()
        return [
            {
                "id": c.id,
                "full_name": c.full_name,
                "email": c.email,
                "phone": c.phone,
                "current_designation": getattr(c, "current_designation", ""),
                "current_company": getattr(c, "current_company", ""),
                "experience_years": getattr(c, "experience_years", 0),
            }
            for c in cands
        ]
    except Exception:
        # Fallback dummy list for portable standalone mode
        return [
            {"id": 101, "full_name": "Pooja Singh", "email": "pooja.singh@example.com", "current_designation": "Oracle EPM Consultant"},
            {"id": 102, "full_name": "Naresh Kumawat", "email": "naresh.k@example.com", "current_designation": "Senior Hyperion Specialist"},
            {"id": 103, "full_name": "Pallavi V Honagond", "email": "pallavi.h@example.com", "current_designation": "Siemens Teamcenter Engineer"},
        ]


@router.get("/job-requisitions")
def list_job_requisitions(db: Session = Depends(get_db)):
    try:
        from backend.app.models.job_description import JobDescription
        jds = db.query(JobDescription).order_by(JobDescription.id.desc()).limit(50).all()
        return [
            {
                "id": jd.id,
                "title": jd.title or jd.job_title,
                "department": getattr(jd, "department", "Engineering"),
                "status": getattr(jd, "status", "active"),
            }
            for jd in jds
        ]
    except Exception:
        return [
            {"id": 201, "title": "Oracle EPM / Hyperion Planning Consultant"},
            {"id": 202, "title": "Siemens Teamcenter PLM Consultant / Engineer"},
            {"id": 203, "title": "Senior Cloud Infrastructure Architect"},
        ]


@router.post("/check-availability", response_model=AvailabilityCheckResponse)
@router.post("/availability", response_model=AvailabilityCheckResponse)
def check_availability(request: AvailabilityCheckRequest, db: Session = Depends(get_db)):
    catalog = {u["id"]: u["full_name"] for u in get_all_interviewers(db)}
    is_avail, conflicts = InterviewService.check_availability(db, request, catalog)
    return AvailabilityCheckResponse(is_available=is_avail, conflicts=conflicts)


@router.get("")
def list_interviews(
    date: Optional[str] = None,
    candidate_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(InterviewSchedule)
    if date:
        q = q.filter(InterviewSchedule.interview_date == date)
    if candidate_id:
        q = q.filter(InterviewSchedule.candidate_id == candidate_id)
    if status:
        q = q.filter(InterviewSchedule.status == status)
    items = q.order_by(InterviewSchedule.interview_date.desc(), InterviewSchedule.start_time.asc()).all()
    return [i.to_dict() for i in items]


@router.post("", status_code=status.HTTP_201_CREATED)
def schedule_interview(
    request: InterviewCreateRequest,
    force_override: bool = Query(False, description="Override capacity limits with explicit confirmation"),
    db: Session = Depends(get_db),
):
    catalog = {u["id"]: u["full_name"] for u in get_all_interviewers(db)}
    try:
        return InterviewService.schedule_interview(db, request, catalog, force_override=force_override)
    except SchedulingConflictException as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": e.message, "conflicts": e.conflicts},
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{id}")
def get_interview(id: int, db: Session = Depends(get_db)):
    interview = db.query(InterviewSchedule).filter_by(id=id).first()
    if not interview:
        raise HTTPException(status_code=404, detail=f"Interview #{id} not found.")
    return interview.to_dict()


@router.put("/{id}")
def update_interview(id: int, request: InterviewUpdateRequest, db: Session = Depends(get_db)):
    try:
        return InterviewService.update_interview(db, id, request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{id}/reschedule")
def reschedule_interview(id: int, request: InterviewRescheduleRequest, db: Session = Depends(get_db)):
    try:
        return InterviewService.reschedule_interview(db, id, request)
    except SchedulingConflictException as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": e.message, "conflicts": e.conflicts},
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{id}/cancel")
def cancel_interview(id: int, request: InterviewCancelRequest, db: Session = Depends(get_db)):
    try:
        return InterviewService.cancel_interview(db, id, request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{id}/invitation-preview", response_model=InvitationPreviewResponse)
@router.get("/{id}/invitations", response_model=InvitationPreviewResponse)
def get_invitation_preview(id: int, db: Session = Depends(get_db)):
    interview = db.query(InterviewSchedule).filter_by(id=id).first()
    if not interview:
        raise HTTPException(status_code=404, detail=f"Interview #{id} not found.")
    return InterviewService.preview_invitation(interview.to_dict())


@router.get("/{id}/ics")
def download_ics(id: int, db: Session = Depends(get_db)):
    interview = db.query(InterviewSchedule).filter_by(id=id).first()
    if not interview:
        raise HTTPException(status_code=404, detail=f"Interview #{id} not found.")
    ics_text = InterviewService.generate_ics(interview.to_dict())
    return Response(
        content=ics_text,
        media_type="text/calendar",
        headers={"Content-Disposition": f'attachment; filename="interview-{interview.interview_code}.ics"'},
    )


@router.get("/{id}/history")
def get_interview_history(id: int, db: Session = Depends(get_db)):
    records = db.query(InterviewHistory).filter_by(interview_id=id).order_by(InterviewHistory.id.asc()).all()
    return [r.to_dict() for r in records]


# =========================================================================
# 2. MANDATORY FEATURE 02 & 07: WORKLOAD & WORKING HOURS
# =========================================================================

@router.get("/workload")
def get_interviewer_workloads(
    target_date: Optional[str] = None, db: Session = Depends(get_db)
):
    t_date = target_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    interviewers = get_all_interviewers(db)
    workloads = []
    for inv in interviewers:
        w = InterviewService.calculate_interviewer_workload(db, inv["id"], t_date)
        workloads.append(w.model_dump())
    return workloads


@router.get("/interviewers/{id}/working-hours")
def get_interviewer_working_hours(id: int, db: Session = Depends(get_db)):
    wh = InterviewService.get_or_create_working_hours(db, id)
    return wh.to_dict()


@router.put("/interviewers/{id}/working-hours")
def update_interviewer_working_hours(
    id: int, req: WorkingHoursUpdateRequest, db: Session = Depends(get_db)
):
    wh = InterviewService.get_or_create_working_hours(db, id)
    if req.working_days is not None:
        wh.working_days_json = json.dumps(req.working_days)
    if req.start_time is not None:
        wh.start_time = req.start_time
    if req.end_time is not None:
        wh.end_time = req.end_time
    if req.lunch_start is not None:
        wh.lunch_start = req.lunch_start
    if req.lunch_end is not None:
        wh.lunch_end = req.lunch_end
    if req.max_daily_interviews is not None:
        wh.max_daily_interviews = req.max_daily_interviews
    if req.max_weekly_interviews is not None:
        wh.max_weekly_interviews = req.max_weekly_interviews
    if req.max_daily_hours is not None:
        wh.max_daily_hours = req.max_daily_hours
    if req.buffer_minutes is not None:
        wh.buffer_minutes = req.buffer_minutes
    if req.skills is not None:
        wh.skills_json = json.dumps(req.skills)
    if req.timezone is not None:
        wh.timezone = req.timezone

    db.commit()
    db.refresh(wh)
    return wh.to_dict()


# =========================================================================
# 3. MANDATORY FEATURE 01: CANDIDATE AVAILABILITY COLLECTION
# =========================================================================

@router.post("/availability-requests", status_code=status.HTTP_201_CREATED)
def create_availability_request(
    req: AvailabilityRequestCreate, db: Session = Depends(get_db)
):
    return InterviewService.create_availability_request(db, req)


@router.get("/availability-requests")
def list_availability_requests(db: Session = Depends(get_db)):
    reqs = db.query(CandidateAvailabilityRequest).order_by(CandidateAvailabilityRequest.id.desc()).all()
    return [r.to_dict() for r in reqs]


@router.get("/availability-requests/{token}")
def get_availability_request_by_token(token: str, db: Session = Depends(get_db)):
    req = db.query(CandidateAvailabilityRequest).filter_by(token=token).first()
    if not req:
        raise HTTPException(status_code=404, detail="Availability request link not found or invalid.")
    return req.to_dict()


@router.post("/availability-requests/{token}/submit")
def submit_availability(
    token: str, submission: AvailabilitySubmissionRequest, db: Session = Depends(get_db)
):
    try:
        return InterviewService.submit_candidate_availability(db, token, submission)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# =========================================================================
# 4. MANDATORY FEATURE 03: CANDIDATE SELF-BOOKING
# =========================================================================

@router.post("/booking-links", status_code=status.HTTP_201_CREATED)
def create_booking_link(req: BookingLinkCreateRequest, db: Session = Depends(get_db)):
    return InterviewService.create_booking_link(db, req)


@router.get("/booking-links/{token}")
def get_booking_link_details(token: str, db: Session = Depends(get_db)):
    b = db.query(CandidateBookingRequest).filter_by(token=token).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking link not found or invalid.")
    return b.to_dict()


@router.get("/booking-links/{token}/slots")
def get_booking_slots(
    token: str,
    date: str = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    b = db.query(CandidateBookingRequest).filter_by(token=token).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking link not found.")
    interviewer_ids = json.loads(b.interviewer_ids_json or "[]")
    slots = InterviewService.get_available_slots(db, interviewer_ids, date, b.duration_minutes)
    return {"date": date, "duration_minutes": b.duration_minutes, "available_slots": slots}


@router.post("/booking-links/{token}/confirm")
def confirm_booking(
    token: str, req: CandidateBookingConfirmRequest, db: Session = Depends(get_db)
):
    try:
        return InterviewService.confirm_candidate_booking(db, token, req)
    except SchedulingConflictException as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"message": e.message, "conflicts": e.conflicts})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# =========================================================================
# 5. MANDATORY FEATURE 04: AUTOMATIC REPLACEMENT SUGGESTIONS
# =========================================================================

@router.get("/{id}/replacement-suggestions", response_model=List[ReplacementSuggestion])
def get_replacement_suggestions(
    id: int,
    exclude_interviewer_id: int = Query(..., description="Interviewer ID being replaced"),
    db: Session = Depends(get_db),
):
    return InterviewService.find_replacement_suggestions(db, id, exclude_interviewer_id)


@router.post("/{id}/replace-interviewer")
def replace_interviewer(
    id: int, req: InterviewerReplacementRequest, db: Session = Depends(get_db)
):
    try:
        return InterviewService.replace_interviewer(db, id, req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# =========================================================================
# 6. MANDATORY FEATURE 05: MULTI-STAGE INTERVIEW TEMPLATES
# =========================================================================

@router.get("/templates")
def list_interview_templates(db: Session = Depends(get_db)):
    tmpls = db.query(InterviewTemplate).filter_by(is_active=True).all()
    if not tmpls:
        # Seed default Software Developer Template if empty
        seed_req = InterviewTemplateCreateRequest(
            name="Software Engineer Standard Hiring Workflow",
            description="5-stage comprehensive evaluation from initial screening to HR offer discussion.",
            is_global=True,
            stages=[
                {"stage_order": 1, "stage_name": "Initial Screening", "interview_type": "screening", "duration_minutes": 30, "interviewer_role": "Recruiter / TA Lead", "required_specialization": "General", "min_panel_size": 1, "buffer_minutes": 15, "is_mandatory": True},
                {"stage_order": 2, "stage_name": "Technical Round 1", "interview_type": "technical", "duration_minutes": 60, "interviewer_role": "Senior Engineer", "required_specialization": "Backend / Data Structures", "min_panel_size": 1, "buffer_minutes": 15, "is_mandatory": True},
                {"stage_order": 3, "stage_name": "System Design Round", "interview_type": "technical", "duration_minutes": 60, "interviewer_role": "Principal Architect", "required_specialization": "System Architecture", "min_panel_size": 1, "buffer_minutes": 15, "is_mandatory": True},
                {"stage_order": 4, "stage_name": "Managerial Round", "interview_type": "managerial", "duration_minutes": 45, "interviewer_role": "Engineering Manager", "required_specialization": "Leadership & Collaboration", "min_panel_size": 1, "buffer_minutes": 15, "is_mandatory": True},
                {"stage_order": 5, "stage_name": "HR Discussion", "interview_type": "hr", "duration_minutes": 30, "interviewer_role": "HR Business Partner", "required_specialization": "Culture & Compensation", "min_panel_size": 1, "buffer_minutes": 15, "is_mandatory": True},
            ]
        )
        t = InterviewService.create_interview_template(db, seed_req)
        return [t]
    return [t.to_dict() for t in tmpls]


@router.post("/templates", status_code=status.HTTP_201_CREATED)
def create_template(req: InterviewTemplateCreateRequest, db: Session = Depends(get_db)):
    return InterviewService.create_interview_template(db, req)


@router.get("/templates/{id}")
def get_template(id: int, db: Session = Depends(get_db)):
    t = db.query(InterviewTemplate).filter_by(id=id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found.")
    return t.to_dict()


@router.post("/templates/{id}/duplicate")
def duplicate_template(id: int, db: Session = Depends(get_db)):
    try:
        return InterviewService.duplicate_interview_template(db, id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# =========================================================================
# 7. MANDATORY FEATURE 08: CANDIDATE RESCHEDULING PORTAL
# =========================================================================

@router.post("/{id}/reschedule-portal-link")
def create_reschedule_portal_link(
    id: int, mode: str = Query("self_service"), db: Session = Depends(get_db)
):
    try:
        return InterviewService.create_reschedule_portal_link(db, id, mode)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/reschedule-portal/{token}")
def get_reschedule_portal(token: str, db: Session = Depends(get_db)):
    portal = db.query(RescheduleRequestModel).filter_by(token=token).first()
    if not portal:
        raise HTTPException(status_code=404, detail="Reschedule portal link not found.")
    return {
        "token": portal.token,
        "interview": portal.interview.to_dict() if portal.interview else None,
        "mode": portal.mode,
        "reason": portal.reason,
        "status": portal.status,
        "expires_at": portal.expires_at.isoformat(),
    }


@router.post("/reschedule-portal/{token}/confirm")
def confirm_reschedule_portal(
    token: str, req: RescheduleSubmitRequest, db: Session = Depends(get_db)
):
    try:
        return InterviewService.confirm_reschedule_portal(db, token, req)
    except SchedulingConflictException as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"message": e.message, "conflicts": e.conflicts})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/reschedule-requests")
def list_reschedule_requests(db: Session = Depends(get_db)):
    reqs = db.query(RescheduleRequestModel).order_by(RescheduleRequestModel.id.desc()).all()
    return [r.to_dict() for r in reqs]
