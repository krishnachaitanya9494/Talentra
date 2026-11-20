"""
Candidate Assignment & TA Ownership API Router for TALENTRA Phase 4.

Provides secure HTTP endpoints for manual TA distribution, scoped TA views,
manager oversight, status transitions, audit history, and CSV exports.
"""

import csv
import io
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from backend.app.database.session import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.candidate import Candidate
from backend.app.models.document import JobDescriptionDocument
from backend.app.models.assignment import (
    CandidateAssignment,
    AssignmentStatus,
    AssignmentHistory,
    AssignmentNote,
    AssignmentNotification,
)
from backend.app.services.assignment.assignment_service import AssignmentService
from backend.app.core.security import get_current_user_optional, require_role
from backend.app.services.extraction.normalizer import mask_contact_info

router = APIRouter(prefix="/api/v1/assignments", tags=["Phase 4: TA Distribution & Ownership"])


@router.get("/tas")
def get_ta_directory(db: Session = Depends(get_db)):
    """
    Returns the active Talent Acquisition Specialist directory with live assignment counts.
    """
    directory = AssignmentService.get_ta_directory(db)
    return {"items": directory, "total": len(directory)}


@router.get("/manager-overview")
def get_manager_overview(db: Session = Depends(get_db)):
    """
    Returns comprehensive recruitment manager workload analytics and pipeline health metrics.
    """
    summary = AssignmentService.get_manager_dashboard_summary(db)
    return summary


@router.post("/assign")
def assign_candidates(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    """
    Manually assigns a list of candidates against a Job Description to a selected TA.
    Enforces duplicate prevention and records assignment audit history.
    """
    candidate_ids = payload.get("candidate_ids", [])
    jd_id = payload.get("jd_id")
    ta_user_id = payload.get("ta_user_id")
    notes = payload.get("notes")

    if not candidate_ids or not jd_id or not ta_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload must include 'candidate_ids' (list), 'jd_id' (int), and 'ta_user_id' (int).",
        )

    try:
        res = AssignmentService.assign_candidates_to_ta(
            db=db,
            candidate_ids=candidate_ids,
            jd_id=jd_id,
            ta_user_id=ta_user_id,
            assigned_by_user_id=current_user.id if current_user else None,
            notes=notes,
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assignment failed: {str(e)}")


@router.get("/list")
def list_assignments(
    ta_id: Optional[int] = Query(None, description="Filter by assigned TA user ID"),
    jd_id: Optional[int] = Query(None, description="Filter by Job Description ID"),
    status: Optional[str] = Query(None, description="Filter by assignment status"),
    segment: Optional[str] = Query(None, description="Filter by candidate segment"),
    search: Optional[str] = Query(None, description="Search candidate name or title"),
    is_active: bool = Query(True, description="Filter active assignments"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    x_user_role: Optional[str] = Header(None),
    role: str = Query("recruiter"),
    db: Session = Depends(get_db),
):
    """
    Lists assignments with multi-attribute filtering, candidate profile details,
    and role-based contact masking.
    """
    effective_role = x_user_role if isinstance(x_user_role, str) else role

    query = db.query(CandidateAssignment).filter(CandidateAssignment.is_active == is_active)

    if ta_id:
        query = query.filter(CandidateAssignment.ta_user_id == ta_id)
    if jd_id:
        query = query.filter(CandidateAssignment.jd_id == jd_id)
    if status:
        query = query.filter(CandidateAssignment.status == status)
    if segment:
        query = query.filter(CandidateAssignment.segment == segment)

    query = query.join(Candidate, CandidateAssignment.candidate_id == Candidate.id)

    if search:
        s_term = f"%{search.strip()}%"
        query = query.filter(
            (Candidate.first_name.ilike(s_term)) |
            (Candidate.last_name.ilike(s_term)) |
            (Candidate.current_title.ilike(s_term)) |
            (Candidate.skills.ilike(s_term))
        )

    total = query.count()
    items = query.order_by(desc(CandidateAssignment.assigned_at)).offset((page - 1) * page_size).limit(page_size).all()

    results = []
    for a in items:
        cand = a.candidate
        jd = a.jd_document
        ta = a.ta_user
        masked_email, masked_phone = mask_contact_info(cand.email, cand.phone, user_role=effective_role)

        results.append({
            "assignment_id": a.id,
            "candidate_id": cand.id,
            "candidate_name": cand.full_name or f"{cand.first_name} {cand.last_name}",
            "current_title": cand.current_title or "Software Professional",
            "current_company": cand.current_company,
            "experience": cand.total_experience_years,
            "location": cand.location or "Not specified",
            "skills": cand.skills,
            "email": masked_email,
            "phone": masked_phone,
            "jd_id": jd.id if jd else None,
            "jd_code": jd.doc_id if jd else "JD-UNKNOWN",
            "jd_title": jd.original_filename if jd else "Unknown Requisition",
            "ta_id": ta.id if ta else None,
            "ta_name": ta.full_name if ta else "Unassigned",
            "ta_email": ta.email if ta else None,
            "status": a.status,
            "matching_score": a.matching_score,
            "segment": a.segment,
            "notes": a.notes,
            "assigned_at": a.assigned_at.isoformat() if a.assigned_at else None,
            "updated_at": a.updated_at.isoformat() if a.updated_at else None,
        })

    return {
        "items": results,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if page_size else 1,
    }


@router.post("/{assignment_id}/reassign")
def reassign_candidate(
    assignment_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    """
    Transfers candidate ownership to another TA with audit history tracking.
    """
    new_ta_id = payload.get("new_ta_id")
    note = payload.get("note")

    if not new_ta_id:
        raise HTTPException(status_code=400, detail="Missing required 'new_ta_id' in payload.")

    assignment = db.query(CandidateAssignment).filter(CandidateAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Candidate assignment record not found.")

    new_ta = db.query(User).filter(User.id == new_ta_id, User.is_active == True).first()
    if not new_ta:
        raise HTTPException(status_code=404, detail=f"Target TA with id {new_ta_id} not found.")

    prev_ta_id = assignment.ta_user_id
    assignment.ta_user_id = new_ta_id
    assignment.updated_at = datetime.now(timezone.utc)
    if note:
        assignment.notes = (assignment.notes or "") + f"\n[{datetime.now(timezone.utc).strftime('%Y-%m-%d')}] Reassigned: {note}"

    hist = AssignmentHistory(
        assignment_id=assignment.id,
        previous_ta_id=prev_ta_id,
        new_ta_id=new_ta_id,
        previous_status=assignment.status,
        new_status=assignment.status,
        action="reassigned",
        changed_by_user_id=current_user.id if current_user else None,
        note=note or f"Reassigned to {new_ta.full_name}",
    )
    db.add(hist)

    # In-app notification to new TA
    db.add(AssignmentNotification(
        recipient_user_id=new_ta_id,
        title="Candidate Transferred to You",
        message=f"Candidate {assignment.candidate.full_name} has been transferred to your active queue.",
        notification_type="reassignment",
    ))

    db.commit()

    return {
        "status": "success",
        "message": f"Candidate successfully reassigned to {new_ta.full_name}",
        "assignment_id": assignment.id,
        "new_ta_id": new_ta.id,
        "new_ta_name": new_ta.full_name,
    }


@router.post("/{assignment_id}/unassign")
def unassign_candidate(
    assignment_id: int,
    payload: Dict[str, Any] = {},
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    """
    Deactivates an assignment and returns the candidate to the unassigned matching pool.
    """
    note = payload.get("note")
    ok = AssignmentService.unassign_candidate(
        db=db,
        assignment_id=assignment_id,
        changed_by_user_id=current_user.id if current_user else None,
        note=note,
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Candidate assignment not found.")
    return {"status": "success", "message": "Candidate unassigned successfully."}


@router.patch("/{assignment_id}/status")
def update_assignment_status(
    assignment_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    """
    Updates the candidate assignment status (e.g. Contacted, Shortlisted, Rejected).
    """
    new_status = payload.get("status")
    note = payload.get("note")
    if not new_status:
        raise HTTPException(status_code=400, detail="Missing required 'status' in payload.")

    try:
        ok = AssignmentService.update_status(
            db=db,
            assignment_id=assignment_id,
            new_status=new_status,
            changed_by_user_id=current_user.id if current_user else None,
            note=note,
        )
        if not ok:
            raise HTTPException(status_code=404, detail="Candidate assignment not found.")
        return {"status": "success", "message": f"Status updated to '{new_status}'."}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


@router.post("/{assignment_id}/notes")
def add_assignment_note(
    assignment_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    """
    Appends an internal recruiter note to the candidate assignment.
    """
    content = payload.get("content")
    if not content or not content.strip():
        raise HTTPException(status_code=400, detail="Note content cannot be empty.")

    note = AssignmentService.add_note(
        db=db,
        assignment_id=assignment_id,
        author_user_id=current_user.id if current_user else 1,
        content=content,
    )
    return {
        "status": "success",
        "note_id": note.id,
        "content": note.content,
        "author_id": note.author_user_id,
        "created_at": note.created_at.isoformat(),
    }


@router.get("/{assignment_id}/history")
def get_assignment_history(assignment_id: int, db: Session = Depends(get_db)):
    """
    Returns full ownership history and status transition logs for an assignment.
    """
    assignment = db.query(CandidateAssignment).filter(CandidateAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Candidate assignment not found.")

    histories = db.query(AssignmentHistory).filter(
        AssignmentHistory.assignment_id == assignment_id,
    ).order_by(desc(AssignmentHistory.created_at)).all()

    notes = db.query(AssignmentNote).filter(
        AssignmentNote.assignment_id == assignment_id,
    ).order_by(desc(AssignmentNote.created_at)).all()

    return {
        "assignment_id": assignment.id,
        "candidate_id": assignment.candidate_id,
        "candidate_name": assignment.candidate.full_name,
        "current_ta": assignment.ta_user.full_name if assignment.ta_user else "Unassigned",
        "current_status": assignment.status,
        "history": [
            {
                "id": h.id,
                "action": h.action,
                "previous_ta": h.previous_ta.full_name if h.previous_ta else None,
                "new_ta": h.new_ta.full_name if h.new_ta else None,
                "previous_status": h.previous_status,
                "new_status": h.new_status,
                "changed_by": h.changed_by.full_name if h.changed_by else "System",
                "note": h.note,
                "created_at": h.created_at.isoformat(),
            }
            for h in histories
        ],
        "notes": [
            {
                "id": n.id,
                "author": n.author.full_name if n.author else "Recruiter",
                "content": n.content,
                "created_at": n.created_at.isoformat(),
            }
            for n in notes
        ],
    }


@router.get("/export")
def export_assignments_csv(
    ta_id: Optional[int] = Query(None),
    jd_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    role: str = Query("recruiter"),
    x_user_role: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Secure CSV export of candidate assignments with role-based contact masking.
    """
    effective_role = x_user_role if isinstance(x_user_role, str) else role

    query = db.query(CandidateAssignment).filter(CandidateAssignment.is_active == True)
    if ta_id:
        query = query.filter(CandidateAssignment.ta_user_id == ta_id)
    if jd_id:
        query = query.filter(CandidateAssignment.jd_id == jd_id)
    if status:
        query = query.filter(CandidateAssignment.status == status)

    assignments = query.join(Candidate).order_by(desc(CandidateAssignment.assigned_at)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Assignment ID",
        "Candidate Name",
        "Assigned TA",
        "Job Description",
        "Status",
        "Matching Score",
        "Segment",
        "Experience (Yrs)",
        "Location",
        "Email",
        "Phone",
        "Assigned At",
    ])

    for a in assignments:
        c = a.candidate
        jd = a.jd_document
        ta = a.ta_user
        masked_email, masked_phone = mask_contact_info(c.email, c.phone, user_role=effective_role)

        writer.writerow([
            a.id,
            c.full_name or f"{c.first_name} {c.last_name}",
            ta.full_name if ta else "Unassigned",
            jd.original_filename if jd else "Unknown JD",
            a.status,
            a.matching_score or "—",
            a.segment or "—",
            c.total_experience_years or 0,
            c.location or "—",
            masked_email,
            masked_phone,
            a.assigned_at.strftime("%Y-%m-%d %H:%M:%S") if a.assigned_at else "—",
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=candidate_assignments_export.csv"},
    )
