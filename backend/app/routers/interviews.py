"""
Interview Management Router for TALENTRA.

Provides HTTP endpoints for:
- Scheduling interview rounds (Screening, Tech 1, Tech 2, Managerial, HR, Final)
- Retrieving interview schedules for a candidate
- Submitting interview feedback, ratings (1-5), and hiring recommendations
- Linking interviews with CandidateSubmission entities ensuring full referential integrity
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.candidate import Candidate
from backend.app.models.job_requirement import JobRequirement
from backend.app.models.submission import CandidateSubmission
from backend.app.models.interview import Interview

router = APIRouter(prefix="/api/v1/interviews", tags=["Interview Operations"])


class ScheduleInterviewRequest(BaseModel):
    candidate_id: int = Field(..., description="Internal candidate surrogate ID.")
    job_requirement_id: Optional[int] = Field(None, description="Target job requirement ID.")
    round_number: int = Field(1, ge=1, le=10, description="Sequential round index (1, 2, 3...).")
    interview_type: str = Field("technical", description="Round type (screening, technical, behavioral, client_final).")
    scheduled_start: str = Field(..., description="ISO 8601 start timestamp.")
    scheduled_end: Optional[str] = Field(None, description="ISO 8601 end timestamp.")
    interviewer_names: Optional[str] = Field(None, description="Names of assigned interviewers.")
    meeting_link: Optional[str] = Field(None, description="Meeting video conference link.")


class UpdateInterviewFeedbackRequest(BaseModel):
    status: Optional[str] = Field(None, description="New status (scheduled, completed, cancelled, rescheduled).")
    feedback: Optional[str] = Field(None, description="Debrief evaluation notes.")
    rating: Optional[int] = Field(None, ge=1, le=5, description="Numerical score 1 to 5.")
    recommendation: Optional[str] = Field(None, description="Recommendation (strong_hire, hire, hold, no_hire).")


@router.post("/schedule")
def schedule_interview(
    payload: ScheduleInterviewRequest,
    db: Session = Depends(get_db),
):
    """
    Schedules an evaluation interview session for a candidate.
    Automatically links or creates CandidateSubmission for relational integrity.
    """
    cand = db.query(Candidate).filter(Candidate.id == payload.candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    # Determine or find JobRequirement
    target_jd = None
    if payload.job_requirement_id:
        target_jd = db.query(JobRequirement).filter(JobRequirement.id == payload.job_requirement_id).first()
    if not target_jd:
        # Fall back to first available job requirement if not specified
        target_jd = db.query(JobRequirement).first()
        if not target_jd:
            raise HTTPException(status_code=400, detail="No active Job Requirement available in repository to associate with.")

    # Find or create CandidateSubmission
    submission = (
        db.query(CandidateSubmission)
        .filter(
            CandidateSubmission.candidate_id == cand.id,
            CandidateSubmission.job_requirement_id == target_jd.id,
        )
        .first()
    )

    if not submission:
        sub_code = f"SUB-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        submission = CandidateSubmission(
            submission_code=sub_code,
            candidate_id=cand.id,
            job_requirement_id=target_jd.id,
            status="interviewing",
            submitted_by="Recruiter Console",
            submission_notes="Created via Interview Stage Manager",
        )
        db.add(submission)
        db.flush()
    else:
        submission.status = "interviewing"

    # Parse timestamps
    try:
        start_dt = datetime.fromisoformat(payload.scheduled_start.replace("Z", "+00:00"))
    except Exception:
        start_dt = datetime.now(timezone.utc)

    if payload.scheduled_end:
        try:
            end_dt = datetime.fromisoformat(payload.scheduled_end.replace("Z", "+00:00"))
        except Exception:
            end_dt = start_dt
    else:
        end_dt = start_dt

    int_code = f"INT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    interview = Interview(
        interview_code=int_code,
        submission_id=submission.id,
        round_number=payload.round_number,
        interview_type=payload.interview_type,
        scheduled_start=start_dt,
        scheduled_end=end_dt,
        interviewer_names=payload.interviewer_names,
        meeting_link=payload.meeting_link,
        status="scheduled",
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)

    return {
        "status": "success",
        "interview": {
            "id": interview.id,
            "interview_code": interview.interview_code,
            "submission_id": interview.submission_id,
            "candidate_id": cand.id,
            "candidate_name": cand.full_name,
            "job_title": target_jd.title,
            "round_number": interview.round_number,
            "interview_type": interview.interview_type,
            "scheduled_start": interview.scheduled_start.isoformat(),
            "scheduled_end": interview.scheduled_end.isoformat(),
            "interviewer_names": interview.interviewer_names,
            "meeting_link": interview.meeting_link,
            "status": interview.status,
        },
    }


@router.get("/candidate/{candidate_id}")
def get_candidate_interviews(
    candidate_id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieves all interview rounds scheduled or completed for a specific candidate.
    """
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    submissions = (
        db.query(CandidateSubmission)
        .filter(CandidateSubmission.candidate_id == candidate_id)
        .all()
    )
    submission_ids = [s.id for s in submissions]

    if not submission_ids:
        return {"status": "success", "interviews": []}

    interviews = (
        db.query(Interview)
        .filter(Interview.submission_id.in_(submission_ids))
        .order_by(Interview.scheduled_start.desc())
        .all()
    )

    sub_map = {s.id: s for s in submissions}

    items = []
    for intv in interviews:
        sub = sub_map.get(intv.submission_id)
        jd_title = sub.job_requirement.title if (sub and sub.job_requirement) else "General Requirement"
        items.append({
            "id": intv.id,
            "interview_code": intv.interview_code,
            "round_number": intv.round_number,
            "interview_type": intv.interview_type,
            "job_title": jd_title,
            "scheduled_start": intv.scheduled_start.isoformat() if intv.scheduled_start else None,
            "scheduled_end": intv.scheduled_end.isoformat() if intv.scheduled_end else None,
            "interviewer_names": intv.interviewer_names,
            "meeting_link": intv.meeting_link,
            "status": intv.status,
            "feedback": intv.feedback,
            "rating": intv.rating,
            "recommendation": intv.recommendation,
        })

    return {"status": "success", "interviews": items}


@router.put("/{interview_id}")
def update_interview_feedback(
    interview_id: int,
    payload: UpdateInterviewFeedbackRequest,
    db: Session = Depends(get_db),
):
    """
    Updates the evaluation status, feedback notes, rating (1-5), and hiring recommendation.
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")

    if payload.status:
        interview.status = payload.status
    if payload.feedback is not None:
        interview.feedback = payload.feedback
    if payload.rating is not None:
        interview.rating = payload.rating
    if payload.recommendation is not None:
        interview.recommendation = payload.recommendation

    # If interview completed with strong_hire / hire, also advance submission status
    if interview.status == "completed" and interview.recommendation in ("strong_hire", "hire"):
        if interview.submission:
            interview.submission.status = "shortlisted"

    db.commit()
    db.refresh(interview)

    return {
        "status": "success",
        "message": "Interview evaluation updated successfully.",
        "interview": {
            "id": interview.id,
            "interview_code": interview.interview_code,
            "status": interview.status,
            "rating": interview.rating,
            "feedback": interview.feedback,
            "recommendation": interview.recommendation,
        },
    }
