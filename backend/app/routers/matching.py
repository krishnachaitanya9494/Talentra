"""
Matching & Candidate Segmentation API Router for TALENTRA Phase 3.

Exposes endpoints for running explainable matching evaluations,
inspecting ranked candidate segments, viewing granular scoring evidence,
configuring weights, and exporting results.
"""

import json
import csv
import io
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from backend.app.database.session import get_db
from backend.app.models.document import JobDescriptionDocument
from backend.app.models.candidate import Candidate
from backend.app.models.matching import (
    MatchingConfiguration,
    MatchingRun,
    CandidateMatch,
    MatchEvidence,
)
from backend.app.services.matching.matching_engine import MatchingEngine
from backend.app.core.security import get_current_user_optional
from backend.app.services.extraction.normalizer import mask_contact_info

router = APIRouter(prefix="/api/matching", tags=["Phase 3: Matching & Segmentation"])


@router.get("/config")
def get_matching_config(db: Session = Depends(get_db)):
    """
    Returns current or default matching scoring weights and segmentation thresholds.
    """
    config = db.query(MatchingConfiguration).first()
    if not config:
        config = MatchingConfiguration()
        db.add(config)
        db.commit()
        db.refresh(config)
    return config.to_dict()


@router.put("/config")
def update_matching_config(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    """
    Updates scoring weights and segmentation thresholds.
    """
    config = db.query(MatchingConfiguration).first()
    if not config:
        config = MatchingConfiguration()
        db.add(config)

    weights = payload.get("weights", {})
    if "required_skills" in weights:
        config.weight_required_skills = float(weights["required_skills"])
    if "preferred_skills" in weights:
        config.weight_preferred_skills = float(weights["preferred_skills"])
    if "experience" in weights:
        config.weight_experience = float(weights["experience"])
    if "role_relevance" in weights:
        config.weight_role_relevance = float(weights["role_relevance"])
    if "qualifications" in weights:
        config.weight_qualifications = float(weights["qualifications"])
    if "certifications" in weights:
        config.weight_certifications = float(weights["certifications"])
    if "location" in weights:
        config.weight_location = float(weights["location"])

    thresholds = payload.get("thresholds", {})
    if "strong" in thresholds:
        config.threshold_strong = float(thresholds["strong"])
    if "potential" in thresholds:
        config.threshold_potential = float(thresholds["potential"])
    if "partial" in thresholds:
        config.threshold_partial = float(thresholds["partial"])

    db.commit()
    db.refresh(config)
    return {
        "status": "success",
        "message": "Matching configuration updated successfully",
        "config": config.to_dict(),
    }


@router.post("/run")
def trigger_matching_run(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    """
    Executes a candidate matching run against a selected Job Description document.
    """
    jd_id = payload.get("jd_id")
    if not jd_id:
        raise HTTPException(status_code=400, detail="Missing required 'jd_id' in payload")

    jd_doc = db.query(JobDescriptionDocument).filter(JobDescriptionDocument.id == jd_id).first()
    if not jd_doc:
        raise HTTPException(status_code=404, detail=f"Job Description document {jd_id} not found")

    # Load custom weights/thresholds if provided
    config = db.query(MatchingConfiguration).first()
    weights = config.to_dict()["weights"] if config else None
    thresholds = config.to_dict()["thresholds"] if config else None

    if "custom_weights" in payload:
        weights = payload["custom_weights"]
    if "custom_thresholds" in payload:
        thresholds = payload["custom_thresholds"]

    try:
        run = MatchingEngine.execute_matching_run(
            db=db,
            jd_id=jd_id,
            user_id=current_user.id if current_user else None,
            custom_weights=weights,
            custom_thresholds=thresholds,
        )
        return {
            "status": "success",
            "message": f"Matching run completed for JD '{jd_doc.original_filename}'",
            "run_id": run.id,
            "jd_id": jd_id,
            "jd_title": jd_doc.original_filename,
            "total_evaluated": run.total_evaluated,
            "strong_matches": run.strong_matches,
            "potential_matches": run.potential_matches,
            "partial_matches": run.partial_matches,
            "not_suitable": run.not_suitable,
            "created_at": run.created_at.isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching run failed: {str(e)}")


@router.get("/runs")
def list_matching_runs(db: Session = Depends(get_db)):
    """
    Lists all previous matching evaluation runs with metadata and breakdown counts.
    """
    runs = db.query(MatchingRun).order_by(desc(MatchingRun.created_at)).all()
    results = []
    for r in runs:
        jd_doc = db.query(JobDescriptionDocument).filter(JobDescriptionDocument.id == r.jd_id).first()
        results.append({
            "id": r.id,
            "jd_id": r.jd_id,
            "jd_code": jd_doc.doc_id if jd_doc else "JD-UNKNOWN",
            "jd_filename": jd_doc.original_filename if jd_doc else "Unknown Requisition",
            "status": r.status,
            "engine_version": r.engine_version,
            "total_evaluated": r.total_evaluated,
            "strong_matches": r.strong_matches,
            "potential_matches": r.potential_matches,
            "partial_matches": r.partial_matches,
            "not_suitable": r.not_suitable,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return {"items": results, "total": len(results)}


@router.get("/runs/{run_id}")
def get_matching_run_details(run_id: int, db: Session = Depends(get_db)):
    """
    Returns high-level statistics and metadata for a specific matching run.
    """
    run = db.query(MatchingRun).filter(MatchingRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Matching run not found")

    jd_doc = db.query(JobDescriptionDocument).filter(JobDescriptionDocument.id == run.jd_id).first()
    return {
        "id": run.id,
        "jd_id": run.jd_id,
        "jd_code": jd_doc.doc_id if jd_doc else "JD-UNKNOWN",
        "jd_filename": jd_doc.original_filename if jd_doc else "Unknown Requisition",
        "status": run.status,
        "engine_version": run.engine_version,
        "total_evaluated": run.total_evaluated,
        "strong_matches": run.strong_matches,
        "potential_matches": run.potential_matches,
        "partial_matches": run.partial_matches,
        "not_suitable": run.not_suitable,
        "created_at": run.created_at.isoformat() if run.created_at else None,
    }


@router.get("/runs/{run_id}/candidates")
def get_matched_candidates(
    run_id: int,
    segment: Optional[str] = Query(None, description="Filter by segment: Strong Match, Potential Match, Partial Match, Not Suitable"),
    search: Optional[str] = Query(None, description="Search by candidate name or skill"),
    min_score: Optional[float] = Query(None, description="Minimum overall score"),
    min_exp: Optional[float] = Query(None, description="Minimum experience years"),
    max_exp: Optional[float] = Query(None, description="Maximum experience years"),
    location: Optional[str] = Query(None, description="Filter by location"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("overall_score", description="Sort by overall_score or experience"),
    order: str = Query("desc", description="asc or desc"),
    x_user_role: Optional[str] = Header(None),
    role: str = Query("recruiter"),
    db: Session = Depends(get_db),
):
    """
    Returns paginated, ranked candidate matches for a run with rich multi-attribute filtering.
    """
    effective_role = x_user_role if isinstance(x_user_role, str) else role

    query = db.query(CandidateMatch).filter(CandidateMatch.run_id == run_id)

    if segment:
        query = query.filter(CandidateMatch.segment == segment)

    if min_score is not None:
        query = query.filter(CandidateMatch.overall_score >= min_score)

    # Join Candidate table for search and candidate-level filters
    query = query.join(Candidate, CandidateMatch.candidate_id == Candidate.id)

    if search:
        s_term = f"%{search.strip()}%"
        query = query.filter(
            (Candidate.first_name.ilike(s_term)) |
            (Candidate.last_name.ilike(s_term)) |
            (Candidate.full_name.ilike(s_term)) |
            (Candidate.current_title.ilike(s_term)) |
            (Candidate.skills.ilike(s_term))
        )

    if min_exp is not None:
        query = query.filter(Candidate.total_experience_years >= min_exp)
    if max_exp is not None:
        query = query.filter(Candidate.total_experience_years <= max_exp)

    if location:
        query = query.filter(Candidate.location.ilike(f"%{location.strip()}%"))

    # Sorting
    if sort_by == "experience":
        sort_col = Candidate.total_experience_years
    else:
        sort_col = CandidateMatch.overall_score

    if order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    results = []
    for rank_idx, m in enumerate(items, start=(page - 1) * page_size + 1):
        cand = m.candidate
        masked_email, masked_phone = mask_contact_info(cand.email, cand.phone, user_role=effective_role)

        try:
            m_skills = json.loads(m.matched_skills or "[]")
        except Exception:
            m_skills = []
        try:
            miss_skills = json.loads(m.missing_skills or "[]")
        except Exception:
            miss_skills = []

        results.append({
            "rank": rank_idx,
            "match_id": m.id,
            "candidate_id": cand.id,
            "candidate_name": cand.full_name or f"{cand.first_name or ''} {cand.last_name or ''}".strip() or "Candidate",
            "email": masked_email,
            "phone": masked_phone,
            "current_title": cand.current_title or "Software Professional",
            "current_company": cand.current_company,
            "total_experience_years": cand.total_experience_years,
            "location": cand.location or "Not specified",
            "overall_score": m.overall_score,
            "segment": m.segment,
            "matched_skills": m_skills,
            "missing_skills": miss_skills,
            "skills_score": m.skills_score,
            "experience_score": m.experience_score,
            "role_score": m.role_score,
            "location_score": m.location_score,
            "has_critical_mismatch": m.has_critical_mismatch,
            "data_completeness": m.data_completeness,
        })

    return {
        "items": results,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if page_size else 1,
    }


@router.get("/candidates/{match_id}/explanation")
def get_match_explanation(match_id: int, db: Session = Depends(get_db)):
    """
    Returns full explainability breakdown and evidence snippets for an individual candidate match.
    """
    m = db.query(CandidateMatch).filter(CandidateMatch.id == match_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Candidate match record not found")

    cand = m.candidate
    evidences = db.query(MatchEvidence).filter(MatchEvidence.candidate_match_id == match_id).all()

    try:
        matched_skills = json.loads(m.matched_skills or "[]")
    except Exception:
        matched_skills = []
    try:
        missing_skills = json.loads(m.missing_skills or "[]")
    except Exception:
        missing_skills = []

    return {
        "match_id": m.id,
        "candidate_id": cand.id,
        "candidate_name": cand.full_name or f"{cand.first_name or ''} {cand.last_name or ''}".strip(),
        "current_title": cand.current_title,
        "experience": cand.total_experience_years,
        "location": cand.location,
        "overall_score": m.overall_score,
        "segment": m.segment,
        "has_critical_mismatch": m.has_critical_mismatch,
        "data_completeness": m.data_completeness,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "dimension_scores": {
            "Required Skills": m.skills_score,
            "Experience": m.experience_score,
            "Role Relevance": m.role_score,
            "Qualifications": m.qualifications_score,
            "Certifications": m.certifications_score,
            "Location Compatibility": m.location_score,
        },
        "evidences": [
            {
                "dimension": ev.dimension,
                "status": ev.status,
                "score": ev.score,
                "weight": ev.weight,
                "evidence_text": ev.evidence_text,
            }
            for ev in evidences
        ],
    }


@router.get("/runs/{run_id}/export")
def export_matches_csv(
    run_id: int,
    segment: Optional[str] = Query(None),
    role: str = Query("recruiter"),
    x_user_role: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Generates a secure CSV export of ranked candidates with role-based contact masking.
    """
    effective_role = x_user_role if isinstance(x_user_role, str) else role

    query = db.query(CandidateMatch).filter(CandidateMatch.run_id == run_id)
    if segment:
        query = query.filter(CandidateMatch.segment == segment)
    query = query.join(Candidate).order_by(desc(CandidateMatch.overall_score))

    matches = query.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Rank",
        "Candidate Name",
        "Overall Score",
        "Segment",
        "Experience (Yrs)",
        "Current Title",
        "Location",
        "Matched Skills",
        "Missing Skills",
        "Email",
        "Phone",
        "Critical Mismatch Flag",
    ])

    for idx, m in enumerate(matches, 1):
        cand = m.candidate
        masked_email, masked_phone = mask_contact_info(cand.email, cand.phone, user_role=effective_role)
        try:
            m_skills = ", ".join(json.loads(m.matched_skills or "[]"))
            miss_skills = ", ".join(json.loads(m.missing_skills or "[]"))
        except Exception:
            m_skills = m.matched_skills or ""
            miss_skills = m.missing_skills or ""

        writer.writerow([
            idx,
            cand.full_name or f"{cand.first_name} {cand.last_name}",
            m.overall_score,
            m.segment,
            cand.total_experience_years or 0,
            cand.current_title or "",
            cand.location or "",
            m_skills,
            miss_skills,
            masked_email,
            masked_phone,
            "YES" if m.has_critical_mismatch else "NO",
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=matching_run_{run_id}_export.csv"},
    )
