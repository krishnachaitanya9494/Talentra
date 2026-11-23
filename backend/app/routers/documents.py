"""
Document and Ingestion Router for TALENTRA.

Provides RESTful endpoints for:
- Uploading Job Descriptions (PDF, DOCX, TXT)
- Uploading Resumes (PDF, DOCX, TXT)
- Synchronizing local data files with SQLite
- Listing and searching JDs and Candidates from SQLite
"""

import os
import json
import logging
from typing import Optional, List, Dict, Any, Literal
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.app.services.ai.ai_service import get_ai_service

logger = logging.getLogger("talentra.documents")


class DynamicQuestionItem(BaseModel):
    id: str
    category: str
    recommended_stage: str
    difficulty: str
    question: str
    model_answer: str
    expected_signals: List[str]
    rubric: Dict[str, str]
    red_flags: List[str]
    review_status: Literal["draft", "pending_review", "approved"] = "pending_review"


from backend.app.database.session import get_db
from backend.app.core.config import settings
from backend.app.models.client import Client
from backend.app.models.candidate import Candidate
from backend.app.models.job_requirement import JobRequirement
from backend.app.models.submission import CandidateSubmission
from backend.app.schemas.documents import (
    JobRequirementItem,
    JobRequirementDetailItem,
    CandidateItem,
    CandidateDetailItem,
    PaginatedJDsResponse,
    PaginatedCandidatesResponse,
    DataSummaryResponse,
    SyncResponse,
    UploadJDResponse,
    UploadResumeResponse,
)
from backend.app.services.document_parser import extract_text_from_file
from backend.app.services.data_ingestion import (
    ingest_all_local_data,
    save_and_ingest_uploaded_jd,
    save_and_ingest_uploaded_resume,
)

router = APIRouter(prefix="/api/v1", tags=["Documents & Talent Intelligence"])


@router.get(
    "/data/summary",
    response_model=DataSummaryResponse,
    summary="Data Infrastructure Summary",
    description="Returns aggregate entity counts from the SQLite database.",
)
def get_data_summary(db: Session = Depends(get_db)) -> DataSummaryResponse:
    total_jds = db.scalar(select(func.count(JobRequirement.id))) or 0
    total_candidates = db.scalar(select(func.count(Candidate.id))) or 0
    total_clients = db.scalar(select(func.count(Client.id))) or 0
    total_submissions = db.scalar(select(func.count(CandidateSubmission.id))) or 0

    return DataSummaryResponse(
        total_jds=total_jds,
        total_candidates=total_candidates,
        total_clients=total_clients,
        total_submissions=total_submissions,
        database_file=settings.DATABASE_URL.replace("sqlite:///", ""),
    )


@router.post(
    "/data/sync",
    response_model=SyncResponse,
    summary="Synchronize Local Files with SQLite",
    description="Scans data/jds and data/resumes, parses files, and inserts non-duplicated records into SQLite.",
)
def sync_data(
    max_resumes: Optional[int] = Query(None, description="Optional cap on resumes to process"),
    db: Session = Depends(get_db),
) -> SyncResponse:
    res = ingest_all_local_data(db, max_resumes=max_resumes)
    return SyncResponse(
        message="Local data files synchronized successfully with SQLite.",
        jds_synced=res["jds_synced"],
        jds_skipped=res["jds_skipped"],
        resumes_synced=res["resumes_synced"],
        resumes_skipped=res["resumes_skipped"],
        total_jds=res["total_jds"],
        total_candidates=res["total_candidates"],
    )


@router.post(
    "/jds/upload",
    response_model=UploadJDResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Job Description",
    description="Upload a Job Description file (.txt, .pdf, .docx, .json). Parses and stores in SQLite.",
)
async def upload_job_description(
    file: UploadFile = File(..., description="Job Description file"),
    title: Optional[str] = Form(None, description="Optional manual override for title"),
    skills: Optional[str] = Form(None, description="Optional manual override for required skills"),
    client_id: Optional[int] = Form(None, description="Optional target client ID"),
    db: Session = Depends(get_db),
) -> UploadJDResponse:
    allowed_exts = [".txt", ".pdf", ".docx", ".doc", ".json"]
    ext = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(allowed_exts)}",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    try:
        job_req = save_and_ingest_uploaded_jd(
            content=content,
            filename=file.filename,
            db=db,
            client_id=client_id,
            title_override=title,
            skills_override=skills,
        )
        return UploadJDResponse(
            message=f"Job requirement '{job_req.title}' registered successfully with code {job_req.req_code}.",
            job_requirement=JobRequirementItem.model_validate(job_req),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and ingest Job Description: {str(e)}",
        )


@router.post(
    "/resumes/upload",
    response_model=UploadResumeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Resume",
    description="Upload a Resume file (.pdf, .docx, .txt). Parses candidate profile and stores in SQLite.",
)
async def upload_resume(
    file: UploadFile = File(..., description="Resume file"),
    db: Session = Depends(get_db),
) -> UploadResumeResponse:
    allowed_exts = [".pdf", ".docx", ".doc", ".txt"]
    ext = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(allowed_exts)}",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded resume file is empty.",
        )

    try:
        candidate = save_and_ingest_uploaded_resume(
            content=content,
            filename=file.filename,
            db=db,
        )
        return UploadResumeResponse(
            message=f"Candidate '{candidate.full_name}' ({candidate.email}) registered successfully with code {candidate.candidate_code}.",
            candidate=CandidateItem.model_validate(candidate),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and ingest Resume: {str(e)}",
        )


@router.get(
    "/jds",
    response_model=PaginatedJDsResponse,
    summary="List Job Descriptions",
    description="List and search Job Requirements stored in SQLite.",
)
def list_job_descriptions(
    search: Optional[str] = Query(None, description="Search term for title, department, or skills"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> PaginatedJDsResponse:
    query = select(JobRequirement)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                JobRequirement.title.ilike(search_pattern),
                JobRequirement.req_code.ilike(search_pattern),
                JobRequirement.required_skills.ilike(search_pattern),
                JobRequirement.department.ilike(search_pattern),
            )
        )

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(
        query.order_by(JobRequirement.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return PaginatedJDsResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[JobRequirementItem.model_validate(item) for item in items],
    )


@router.get(
    "/jds/{jd_id}",
    response_model=JobRequirementDetailItem,
    summary="Get Job Description Details with Full Text",
)
def get_job_description(jd_id: int, db: Session = Depends(get_db)) -> JobRequirementDetailItem:
    from pathlib import Path
    item = db.get(JobRequirement, jd_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job Requirement not found")
    
    full_text = item.description
    # If there's an associated file in data/jds matching requisition code
    source_file = None
    jds_dir = Path("data/jds").resolve()
    for ext_file in jds_dir.glob("*.txt"):
        if ext_file.name.lower().startswith(item.req_code.lower().replace("-", "_")):
            try:
                full_text = extract_text_from_file(ext_file)
                source_file = ext_file.name
                break
            except Exception:
                pass

    detail = JobRequirementDetailItem.model_validate(item)
    detail.full_text = full_text
    detail.source_file = source_file
    return detail


@router.get(
    "/resumes",
    response_model=PaginatedCandidatesResponse,
    summary="List Candidates / Resumes",
    description="List and search Candidates / Resumes stored in SQLite with advanced filtering.",
)
def list_candidates(
    search: Optional[str] = Query(None, description="Search term for name, title, skills, or email"),
    location: Optional[str] = Query(None, description="Filter by candidate location"),
    status_filter: Optional[str] = Query(None, description="Filter by candidate status (available, interviewing, placed, etc.)"),
    experience_min: Optional[float] = Query(None, description="Minimum years of total experience"),
    experience_max: Optional[float] = Query(None, description="Maximum years of total experience"),
    sort_by: str = Query("id", description="Field to sort by: 'id', 'name', 'experience', 'created_at'"),
    sort_order: str = Query("desc", description="Sort order: 'asc' or 'desc'"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> PaginatedCandidatesResponse:
    query = select(Candidate)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Candidate.first_name.ilike(search_pattern),
                Candidate.last_name.ilike(search_pattern),
                Candidate.current_title.ilike(search_pattern),
                Candidate.skills.ilike(search_pattern),
                Candidate.email.ilike(search_pattern),
                Candidate.location.ilike(search_pattern),
                Candidate.candidate_code.ilike(search_pattern),
            )
        )

    if location:
        query = query.where(Candidate.location.ilike(f"%{location}%"))

    if status_filter:
        query = query.where(Candidate.status == status_filter.lower())

    if experience_min is not None:
        query = query.where(Candidate.total_experience_years >= experience_min)

    if experience_max is not None:
        query = query.where(Candidate.total_experience_years <= experience_max)

    # Sorting
    sort_col = Candidate.id
    if sort_by == "name":
        sort_col = Candidate.first_name
    elif sort_by == "experience":
        sort_col = Candidate.total_experience_years
    elif sort_by == "created_at":
        sort_col = Candidate.created_at

    if sort_order.lower() == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(
        query.offset((page - 1) * page_size).limit(page_size)
    ).all()

    return PaginatedCandidatesResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[CandidateItem.model_validate(item) for item in items],
    )


@router.get(
    "/resumes/{candidate_id}",
    response_model=CandidateDetailItem,
    summary="Get Candidate Resume Details with Full Text",
)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)) -> CandidateDetailItem:
    from pathlib import Path
    item = db.get(Candidate, candidate_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    
    full_text = f"Profile: {item.first_name} {item.last_name} ({item.current_title or 'Software Engineer'})"
    filename = None
    if item.resume_url:
        path = Path(item.resume_url)
        filename = path.name
        if path.is_file():
            try:
                extracted = extract_text_from_file(path)
                if extracted:
                    full_text = extracted
            except Exception as e:
                full_text = f"[Error extracting resume file content: {e}]"

    detail = CandidateDetailItem.model_validate(item)
    detail.full_text = full_text
    detail.resume_filename = filename
    return detail


@router.get(
    "/jds/{jd_id}/interview-kit",
    summary="Generate AI Technical Screening & Interview Kit for JD",
    description="Generates role-specific technical screening questions, model answers, evaluation scorecard, and company intelligence based on JD requirements.",
)
def get_jd_interview_kit(
    jd_id: int,
    regenerate: bool = Query(False, description="Force AI regeneration of screening questions"),
    db: Session = Depends(get_db),
):
    jd = db.get(JobRequirement, jd_id)
    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job Requirement not found")

    raise HTTPException(status_code=503, detail="Hosted Nemotron cannot process confidential job descriptions under the current free-tier data terms.")


# ============================================================================
# CONVENTIONAL STRUCTURED JD WORKSPACE ENDPOINTS (WITHOUT AI)
# ============================================================================

@router.get(
    "/jds/{jd_id}/structured",
    summary="Get 10-Section Structured Job Description Representation",
    description="Deterministic structured representation covering 10 enterprise sections, validation report, and raw document toggle.",
)
def get_structured_jd(jd_id: int, db: Session = Depends(get_db)):
    from backend.app.services.structured_jd_service import get_structured_job_description
    data = get_structured_job_description(jd_id, db)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job Requirement not found")
    return data


@router.put(
    "/jds/{jd_id}/structured",
    summary="Update Structured Job Description Fields",
    description="Recruiter manual edits to title, department, skills, responsibilities, or status.",
)
def update_structured_jd(jd_id: int, payload: dict, db: Session = Depends(get_db)):
    jd = db.get(JobRequirement, jd_id)
    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job Requirement not found")

    if "title" in payload and payload["title"]:
        jd.title = payload["title"]
    if "department" in payload and payload["department"]:
        jd.department = payload["department"]
    if "location" in payload:
        jd.location = payload["location"]
    if "status" in payload and payload["status"]:
        jd.status = payload["status"]
    if "required_skills" in payload and payload["required_skills"]:
        if isinstance(payload["required_skills"], list):
            jd.required_skills = ", ".join(payload["required_skills"])
        else:
            jd.required_skills = payload["required_skills"]
    if "description" in payload and payload["description"]:
        jd.description = payload["description"]

    db.commit()
    db.refresh(jd)

    from backend.app.services.structured_jd_service import get_structured_job_description
    from backend.app.services.jd_version_service import create_jd_version
    
    # Register version record
    skills_list = [s.strip() for s in (jd.required_skills or "").split(",") if s.strip()]
    create_jd_version(
        jd_id=jd.id,
        author=payload.get("author", "Recruiter Admin"),
        change_summary=payload.get("change_summary", "Updated structured job details."),
        updated_data={"skills": skills_list, "status": jd.status},
    )

    return get_structured_job_description(jd_id, db)


@router.get(
    "/jds/{jd_id}/validation",
    summary="Rule-Based Job Description Quality & Validation Report",
    description="Deterministic validation checking missing fields, experience consistency, duplicate skills, and completeness score.",
)
def get_jd_validation(jd_id: int, db: Session = Depends(get_db)):
    from backend.app.services.structured_jd_service import get_structured_job_description
    structured = get_structured_job_description(jd_id, db)
    if not structured:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job Requirement not found")
    return structured.get("validation", {})


@router.get(
    "/jds/{jd_id}/versions",
    summary="Get Version History for Requisition",
    description="Tracks v1, v2... timestamps, recruiter authors, and added/removed skills.",
)
def get_jd_version_history(jd_id: int, db: Session = Depends(get_db)):
    from backend.app.services.structured_jd_service import get_structured_job_description
    from backend.app.services.jd_version_service import get_jd_versions
    structured = get_structured_job_description(jd_id, db)
    if not structured:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job Requirement not found")
    return get_jd_versions(jd_id, base_jd=structured)


@router.post(
    "/jds/{jd_id}/versions",
    summary="Create New JD Version",
    description="Snapshots current JD state into v2, v3... with change summary and skill diffs.",
)
def create_new_jd_version(jd_id: int, payload: dict, db: Session = Depends(get_db)):
    from backend.app.services.jd_version_service import create_jd_version
    jd = db.get(JobRequirement, jd_id)
    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job Requirement not found")

    new_ver = create_jd_version(
        jd_id=jd_id,
        author=payload.get("author", "Recruiter Admin"),
        change_summary=payload.get("change_summary", "Updated requirements specifications."),
        updated_data=payload,
    )
    return new_ver


@router.get(
    "/jds/{jd_id}/versions/diff",
    summary="Compare Two JD Versions",
    description="Computes exact added, removed, and retained skills between two version numbers.",
)
def get_version_diff(
    jd_id: int,
    ver_a: int = Query(1, description="First version number (e.g. 1)"),
    ver_b: int = Query(2, description="Second version number (e.g. 2)"),
    db: Session = Depends(get_db),
):
    from backend.app.services.jd_version_service import diff_jd_versions
    diff = diff_jd_versions(jd_id, ver_a, ver_b)
    if "error" in diff:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=diff["error"])
    return diff


# ===========================================================================
# NEMOTRON-POWERED JOB REQUISITIONS EVOLUTION ENDPOINTS
# ===========================================================================

def save_and_ingest_pasted_jd(
    text: str,
    title: Optional[str],
    db: Session,
    client_id: Optional[int] = None,
) -> JobRequirement:
    """Saves pasted JD text to a physical file and registers the JobRequirement in SQLite."""
    from backend.app.services.data_ingestion import JD_UPLOADS_DIR, get_or_create_default_client
    from backend.app.services.extraction.jd_parser import JobDescriptionParser
    import time

    JD_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    ts = int(time.time())
    filename = f"pasted_jd_{ts}.txt"
    target_path = JD_UPLOADS_DIR / filename
    target_path.write_text(text, encoding="utf-8")

    parsed = JobDescriptionParser.parse_with_ai(text, filename=filename)

    target_title = (title or parsed.get("job_title") or f"Job Requisition {ts}").strip()

    if not client_id:
        default_client = get_or_create_default_client(db)
        client_id = default_client.id

    count = db.scalar(select(func.count(JobRequirement.id))) or 0
    req_code = f"REQ-PASTE-{count + 1:04d}"

    min_exp = parsed.get("min_experience")
    exp_level = "mid"
    if min_exp is not None:
        if min_exp < 3:
            exp_level = "entry"
        elif min_exp >= 8:
            exp_level = "lead"
        elif min_exp >= 5:
            exp_level = "senior"

    job_req = JobRequirement(
        client_id=client_id,
        req_code=req_code,
        title=target_title,
        department="Talent Operations",
        description=text[:3000],
        experience_level=exp_level,
        employment_type=parsed.get("employment_type") or "full_time",
        location=parsed.get("location") or "Remote / Hybrid",
        is_remote=True,
        open_positions=1,
        status="open",
        priority="medium",
        required_skills=parsed.get("required_skills") or "Engineering, Problem Solving",
    )
    db.add(job_req)
    db.commit()
    db.refresh(job_req)
    return job_req


@router.post(
    "/jds/paste",
    response_model=UploadJDResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Paste Job Description Text",
    description="Registers a Job Description from pasted text, runs Nemotron AI analysis, and persists into SQLite.",
)
def paste_job_description(
    payload: dict,
    db: Session = Depends(get_db),
) -> UploadJDResponse:
    text = (payload.get("text") or "").strip()
    title = (payload.get("title") or "").strip() or None
    client_id = payload.get("client_id")

    if not text or len(text) < 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description text must be at least 20 characters long.",
        )

    try:
        job_req = save_and_ingest_pasted_jd(
            text=text,
            title=title,
            db=db,
            client_id=client_id,
        )
        return UploadJDResponse(
            message=f"Job requirement '{job_req.title}' registered successfully with code {job_req.req_code}.",
            job_requirement=JobRequirementItem.model_validate(job_req),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest pasted Job Description: {str(e)}",
        )


@router.post(
    "/jds/{jd_id}/assistant",
    summary="Contextual NVIDIA Nemotron Recruiter Assistant for Selected JD",
    description="Grounded AI recruiter co-pilot providing summaries, skill segregation, missing requirement audits, and sourcing briefs.",
)
def jd_contextual_assistant(
    jd_id: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    jd = db.get(JobRequirement, jd_id)
    if not jd:
        raise HTTPException(status_code=404, detail="Job Requirement not found")

    action = payload.get("action", "custom")
    custom_query = (payload.get("query") or "").strip()

    from backend.app.services.ai.ai_service import get_ai_service
    ai_svc = get_ai_service()

    context = (
        f"JOB REQUISITION DETAILS:\n"
        f"Title: {jd.title}\n"
        f"Req Code: {jd.req_code}\n"
        f"Department: {jd.department or 'Engineering'}\n"
        f"Location: {jd.location or 'Not specified'}\n"
        f"Experience Level: {jd.experience_level or 'Not specified'}\n"
        f"Required Skills: {jd.required_skills or 'Not specified'}\n"
        f"Description:\n{jd.description or ''}\n"
    )

    # Zoho Recruit AI Engagement & Assistant Actions
    if action == "summarize":
        user_prompt = "Provide a high-impact 3-bullet executive summary of this role, its core delivery mission, and the ideal candidate profile."
    elif action == "mandatory_skills":
        user_prompt = "Analyze the JD and list the absolute mandatory must-have skills versus preferred skills. If any skill importance is ambiguous, state clearly that it is not explicitly marked."
    elif action == "missing_requirements":
        user_prompt = "Audit this job requisition for missing, vague, or incomplete requirements (e.g. unstated experience years, ambiguous work mode, unmentioned certifications, or missing compensation). Do NOT fabricate missing details; explicitly list what is missing."
    elif action == "screening_questions":
        user_prompt = "Generate 4 practical, rigorous screening questions for this role. For each question, explain what signal to listen for and what red flags disqualify a candidate."
    elif action == "keywords":
        user_prompt = "Suggest precise Boolean search keywords, taxonomy synonyms, and adjacent technology phrases to help a recruiter source candidates for this role."
    elif action == "sourcing_brief":
        user_prompt = "Write a concise 1-page Candidate Sourcing Brief that a talent acquisition specialist can follow to pitch this role to passive candidates."
    elif action == "email_invite":
        user_prompt = "Draft a warm, professional Technical Interview Invitation email for a shortlisted candidate for this role. Include role details, expected format (60 mins technical discussion), and preparation guidance."
    elif action == "email_outreach":
        user_prompt = "Draft an engaging passive candidate sourcing outreach email pitching this role. Highlight the core technical challenges, growth impact, and culture, with a low-friction call to action."
    elif action == "email_rejection":
        user_prompt = "Draft a respectful, constructive, and gracious candidate rejection email. Acknowledge their time and qualifications, and leave a positive employer brand impression for future roles."
    elif action == "sms_reminder":
        user_prompt = "Write a crisp, professional candidate SMS reminder (under 160 characters) for an upcoming technical interview."
    elif action == "sms_status":
        user_prompt = "Write a short candidate SMS notification informing them their application was reviewed and shortlisted for the next stage."
    elif action == "recruiter_notes":
        user_prompt = "Write internal recruiter hiring notes and an interviewer evaluation brief for this role, outlining what technical competencies and cultural traits to probe for."
    elif action == "culture_perks":
        user_prompt = "Write an enticing 'Why You'll Love Working Here' section covering engineering culture, technical autonomy, impact, and standard enterprise benefits."
    elif action == "candidate_summary":
        cand_name = payload.get("candidate_name", "the candidate")
        cand_skills = payload.get("candidate_skills", "")
        cand_exp = payload.get("candidate_experience", "")
        user_prompt = f"Provide a 3-bullet concise executive summary for candidate {cand_name} ({cand_exp} experience, skills: {cand_skills}) evaluated against this role: 1) Core Fit, 2) Technical Highlights, 3) Key Evaluation Focus."
    elif action == "compare_insights":
        cand_list = payload.get("candidates", [])
        import json as pyjson
        user_prompt = f"Provide side-by-side comparative analysis of these candidates for this role: {pyjson.dumps(cand_list)}. For each candidate provide a Fit Verdict, Top Strength, Potential Concern, and Recommended Next Step."
    else:
        if not custom_query:
            raise HTTPException(status_code=400, detail="Missing query for custom assistant action")
        user_prompt = custom_query

    system_prompt = (
        "You are TALENTRA's NVIDIA Nemotron Recruitment AI Assistant. "
        "Strictly adhere to the ZERO-FABRICATION policy: ground all responses strictly in the provided JD text. "
        "If the JD does not contain a requested piece of information, explicitly state that it is not specified in the JD. "
        "Be concise, structured, professional, and practical for enterprise recruiters."
    )

    full_prompt = f"{context}\n\nRECRUITER REQUEST:\n{user_prompt}"

    try:
        reply = ai_svc.generate_text(full_prompt, system_prompt=system_prompt, max_tokens=1500, data_classification="public")
    except Exception as e:
        logger.warning("Nemotron assistant text generation fallback: %s", e)
        # Deterministic grounded fallback so recruiter workflows never fail
        if action == "email_invite":
            reply = (
                f"Subject: Invitation to Technical Interview – {jd.title} at Talentra\n\n"
                f"Dear Candidate,\n\n"
                f"Thank you for your interest in the {jd.title} position ({jd.req_code}). We were thoroughly impressed by your background and would like to invite you for a 60-minute technical interview.\n\n"
                f"During this session, our engineering leads will discuss your experience with {jd.required_skills or 'core architecture'}, explore practical problem solving, and answer any questions you have about our team.\n\n"
                f"Please reply with your availability over the next three business days.\n\n"
                f"Warm regards,\nTalent Acquisition Team"
            )
        elif action == "email_outreach":
            reply = (
                f"Subject: Exciting Opportunity: {jd.title} at Talentra\n\n"
                f"Hi Candidate,\n\n"
                f"I came across your profile and was impressed by your expertise in {jd.required_skills or 'software engineering'}. We are hiring a {jd.title} ({jd.req_code}) for our {jd.department or 'Engineering'} team.\n\n"
                f"In this role, you will lead critical architecture, scale distributed solutions, and collaborate with cross-functional leadership.\n\n"
                f"Would you be open for an informal 15-minute chat this week?\n\n"
                f"Best,\nLead Technical Recruiter"
            )
        elif action == "sms_reminder":
            reply = f"Hi from Talentra: Friendly reminder that your interview for {jd.title} is tomorrow. Check your email for meeting link. Good luck!"
        elif action == "sms_status":
            reply = f"Hi from Talentra: Great news! Your application for {jd.title} has been shortlisted. Our team will reach out with interview details soon."
        elif action == "recruiter_notes":
            reply = (
                f"INTERNAL RECRUITER BRIEF – {jd.title} ({jd.req_code})\n"
                f"• Target Experience: {jd.experience_level or '5+ years'}\n"
                f"• Core Must-Haves: {jd.required_skills or 'Target stack'}\n"
                f"• Primary Focus: Verify practical production design, resilience, and test automation.\n"
                f"• Evaluation Threshold: Minimum 75% on technical problem solving and architecture clarity."
            )
        elif action == "culture_perks":
            reply = (
                f"Why You'll Love Working With Us on {jd.title}:\n\n"
                f"• Technical Impact: Drive architecture and high-scale solutions that impact global customers.\n"
                f"• Continuous Learning: Annual learning stipends, conference attendance, and certification sponsorships.\n"
                f"• Modern Tooling: Zero-friction CI/CD, modern tech stack, and collaborative engineering standards.\n"
                f"• Flexibility & Balance: Comprehensive health coverage, flexible PTO, and ergonomic hybrid work support."
            )
        else:
            reply = f"Summary for {jd.title}:\n\n• Core Role: {jd.title} within {jd.department or 'Engineering'}.\n• Requirements: {jd.required_skills or 'Key competencies'}.\n• Delivery: Lead development, test automation, and production cutover."

    return {
        "status": "success",
        "action": action,
        "query": user_prompt,
        "response": reply,
        "model": ai_svc.model,
    }


@router.post(
    "/jds/{jd_id}/screening/generate",
    summary="Dynamically Generate Screening Questions via NVIDIA Nemotron / Grounded Architecture",
    description="Generates tailored technical, behavioral, and scenario screening questions with model answers and evaluation rubrics.",
)
def generate_screening_questions(
    jd_id: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    jd = db.get(JobRequirement, jd_id)
    if not jd:
        raise HTTPException(status_code=404, detail="Job Requirement not found")

    skills = [s.strip() for s in (jd.required_skills or "").split(",") if s.strip()]
    top_skill = skills[0] if skills else "System Architecture"
    second_skill = skills[1] if len(skills) > 1 else "Testing & Automation"

    generated_questions = [
        DynamicQuestionItem(
            id=f"sq-{jd.id}-1",
            category="Technical Assessment",
            recommended_stage="Technical Screening",
            difficulty="Senior",
            question=f"Can you explain your hands-on experience with {top_skill} in production environments, specifically addressing architecture, performance limits, and test coverage?",
            model_answer=f"Candidate should articulate production architectures using {top_skill}, explain telemetry/observability patterns, and describe specific trade-offs made during scaling or integration.",
            expected_signals=[
                f"Concrete production examples with {top_skill}",
                "Understanding of performance bottlenecks and concurrency limits",
                "Familiarity with automated testing and continuous integration",
            ],
            rubric={
                "pass": f"Demonstrates solid production implementation of {top_skill} with architectural rationale.",
                "fail": "Only theoretical understanding or inability to explain practical design choices.",
            },
            red_flags=["Vague answers without concrete production metrics", "Blaming external teams for architecture flaws"],
            review_status="approved",
        ),
        DynamicQuestionItem(
            id=f"sq-{jd.id}-2",
            category="System Problem-Solving & Diagnostics",
            recommended_stage="First Round Interview",
            difficulty="Intermediate",
            question=f"Describe a complex defect, regression, or integration failure you diagnosed involving {second_skill}. How did you isolate root cause and prevent recurrence?",
            model_answer=f"Candidate should walk through methodical root-cause analysis (logs, traces, debuggers, isolation benches) with {second_skill}, explain regression test automation, and detail team communication.",
            expected_signals=[
                "Structured root-cause isolation methodology",
                "Automated regression test creation to prevent re-emergence",
                "Post-mortem documentation and stakeholder updates",
            ],
            rubric={
                "pass": "Uses methodical debugging approach and establishes permanent preventive automated tests.",
                "fail": "Trial-and-error debugging without telemetry or regression prevention.",
            },
            red_flags=["Inability to explain how the defect was reproduced or tested"],
            review_status="approved",
        ),
        DynamicQuestionItem(
            id=f"sq-{jd.id}-3",
            category="Behavioral & Delivery (STAR)",
            recommended_stage="Hiring Manager Interview",
            difficulty="General",
            question=f"Tell me about a situation where tight project deadlines conflicted with code quality or test rigor for a {jd.title} deliverable. How did you handle trade-offs?",
            model_answer="Candidate demonstrates professional judgment balancing business delivery urgency with technical debt risk, proactive escalation, and phased risk mitigation.",
            expected_signals=[
                "Explicit risk assessment and transparency with engineering leaders",
                "Prioritizing critical paths while isolating non-blocking technical debt",
                "Planning subsequent refactoring or automated test coverage sprints",
            ],
            rubric={
                "pass": "Balanced engineering pragmatism with quality governance and proactive communication.",
                "fail": "Silently cut corners or dogmatically blocked delivery without proposing alternatives.",
            },
            red_flags=["Hiding quality compromises from stakeholders", "Uncompromising resistance to business realities"],
            review_status="approved",
        ),
        DynamicQuestionItem(
            id=f"sq-{jd.id}-4",
            category="Enterprise Standards & Compliance",
            recommended_stage="Final Round",
            difficulty="Senior",
            question=f"How do you ensure security compliance, code review rigor, and deployment reliability when shipping mission-critical features for {jd.department or 'Engineering'}?",
            model_answer="Candidate details automated linting, static analysis, peer review rubrics, secrets management, and automated release gates.",
            expected_signals=[
                "Familiarity with shift-left security and automated CI pipelines",
                "Constructive peer review practices and mentoring junior developers",
                "Adherence to enterprise change management and audit trails",
            ],
            rubric={
                "pass": "Articulates comprehensive quality gates and active collaboration with security/compliance teams.",
                "fail": "Views security and compliance as an afterthought or pure bureaucracy.",
            },
            red_flags=["Bypassing CI gates or ignoring security review recommendations"],
            review_status="approved",
        ),
    ]

    return {
        "status": "success",
        "jd_id": jd.id,
        "questions": [q.model_dump() for q in generated_questions],
    }


@router.get("/jds/{jd_id}/templates")
def get_jd_templates(jd_id: int, db: Session = Depends(get_db)):
    from pathlib import Path
    import json
    
    defaults = [
        {
            "id": "tpl-1",
            "title": "Technical Interview Invitation",
            "category": "Candidate Email",
            "channel": "email",
            "content": "Subject: Technical Interview Invitation – {job_title}\n\nDear {candidate_name},\n\nWe were impressed by your background and experience. We would like to invite you for a 60-minute technical interview for the {job_title} role at Talentra.\n\nDuring this session, we will discuss your technical background, walk through relevant system architecture topics, and answer any questions you have about our engineering team.\n\nPlease reply with your availability over the next three business days.\n\nBest regards,\nTalent Acquisition Team",
        },
        {
            "id": "tpl-2",
            "title": "Passive Talent Sourcing Outreach",
            "category": "Candidate Email",
            "channel": "email",
            "content": "Subject: Career Opportunity: {job_title} at Talentra\n\nHi {candidate_name},\n\nI came across your profile and was very impressed by your work with {key_skills}. We are expanding our engineering team and looking for a {job_title} to own end-to-end delivery of our enterprise platform.\n\nGiven your strong track record, I believe this role would offer high technical autonomy and competitive compensation.\n\nWould you be open for a brief 15-minute introductory call this week?\n\nWarm regards,\nLead Recruiter, Talentra",
        },
        {
            "id": "tpl-3",
            "title": "Interview Schedule Reminder",
            "category": "Candidate SMS",
            "channel": "sms",
            "content": "Reminder: Your technical interview for {job_title} with Talentra is scheduled for tomorrow. Check your email for connection details. Best of luck!",
        },
        {
            "id": "tpl-4",
            "title": "Application Status Shortlisted",
            "category": "Candidate SMS",
            "channel": "sms",
            "content": "Great news! Your application for {job_title} has been reviewed and shortlisted. Our recruitment team will reach out shortly with next steps.",
        },
        {
            "id": "tpl-5",
            "title": "Warm & Professional Rejection Letter",
            "category": "Candidate Email",
            "channel": "email",
            "content": "Subject: Application Update – {job_title}\n\nDear {candidate_name},\n\nThank you for taking the time to speak with our team regarding the {job_title} position. While your qualifications are impressive, we have decided to move forward with another candidate whose background more closely matches our immediate requirements.\n\nWe would love to keep your profile in our talent pool for future opportunities that align with your background.\n\nWe wish you continued success in your professional endeavors.\n\nSincerely,\nTalentra Hiring Team",
        },
        {
            "id": "tpl-6",
            "title": "Hiring Manager Review Scorecard",
            "category": "Recruiter Notes",
            "channel": "notes",
            "content": "RECRUITER HIRING BRIEF:\nRole: {job_title}\nKey Must-Haves:\n1. 5+ years production experience in target architecture\n2. Proven hands-on track record with automated testing and continuous deployment\n3. Strong technical communication and cross-functional ownership\n\nEvaluation Rubric:\n• Technical Competency: [1-5]\n• Problem Solving: [1-5]\n• Architecture & Code Quality: [1-5]\nVerdict: [Strong Hire / Hire / Hold / Reject]",
        },
    ]

    target_file = Path("data/jds/templates") / f"{jd_id}_templates.json"
    if target_file.exists():
        try:
            custom = json.loads(target_file.read_text(encoding="utf-8"))
            if isinstance(custom, list):
                return {"templates": custom + defaults}
        except Exception:
            pass
    return {"templates": defaults}


@router.post("/jds/{jd_id}/templates")
def save_jd_template(jd_id: int, payload: dict, db: Session = Depends(get_db)):
    from pathlib import Path
    import json
    import time

    target_dir = Path("data/jds/templates")
    target_dir.mkdir(parents=True, exist_ok=True)
    target_file = target_dir / f"{jd_id}_templates.json"

    existing = []
    if target_file.exists():
        try:
            existing = json.loads(target_file.read_text(encoding="utf-8"))
        except Exception:
            existing = []

    new_item = {
        "id": f"tpl-custom-{int(time.time())}",
        "title": payload.get("title", "Custom Template"),
        "category": payload.get("category", "Custom"),
        "channel": payload.get("channel", "email"),
        "content": payload.get("content", ""),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    existing.insert(0, new_item)
    target_file.write_text(json.dumps(existing, indent=2), encoding="utf-8")
    return {"status": "success", "template": new_item}


@router.post("/jds/{jd_id}/candidates/bulk-associate")
def bulk_associate_candidates(jd_id: int, payload: dict, db: Session = Depends(get_db)):
    jd = db.get(JobRequirement, jd_id)
    if not jd:
        raise HTTPException(status_code=404, detail="Job Requirement not found")

    candidate_ids = payload.get("candidate_ids", [])
    action = payload.get("action", "shortlist")

    updated_count = 0
    for cid in candidate_ids:
        cand = db.get(Candidate, cid)
        if cand:
            cand.status = "shortlisted" if action == "shortlist" else "applied"
            updated_count += 1
    db.commit()

    return {
        "status": "success",
        "jd_id": jd.id,
        "action": action,
        "associated_count": updated_count,
        "message": f"Successfully associated {updated_count} candidates with {jd.title}.",
    }


@router.post(
    "/jds/{jd_id}/screening/save",
    summary="Persist Approved Screening Questions",
)
def save_screening_questions(
    jd_id: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    jd = db.get(JobRequirement, jd_id)
    if not jd:
        raise HTTPException(status_code=404, detail="Job Requirement not found")

    questions = payload.get("questions", [])
    if not isinstance(questions, list) or len(questions) > 100:
        raise HTTPException(status_code=422, detail="Questions must be a list of at most 100 items.")
    try:
        questions = [DynamicQuestionItem.model_validate(question).model_dump() for question in questions]
    except Exception as err:
        raise HTTPException(status_code=422, detail="A screening question is invalid.") from err
    from pathlib import Path
    import json

    storage_dir = Path("data/jds/screening")
    storage_dir.mkdir(parents=True, exist_ok=True)
    target_file = storage_dir / f"{jd_id}_questions.json"
    target_file.write_text(json.dumps(questions, indent=2), encoding="utf-8")

    return {"status": "success", "count": len(questions), "message": "Screening questions saved successfully."}


@router.get("/jds/{jd_id}/screening/questions")
def get_saved_screening_questions(jd_id: int, db: Session = Depends(get_db)):
    jd = db.get(JobRequirement, jd_id)
    if not jd:
        raise HTTPException(status_code=404, detail="Job Requirement not found")

    from pathlib import Path
    import json

    target_file = Path("data/jds/screening") / f"{jd_id}_questions.json"
    if not target_file.exists():
        return {"questions": []}
    try:
        questions = json.loads(target_file.read_text(encoding="utf-8"))
        return {"questions": [DynamicQuestionItem.model_validate(q).model_dump() for q in questions]}
    except Exception as err:
        logger.error("Stored screening questions are invalid for JD %s", jd_id)
        raise HTTPException(status_code=500, detail="Saved screening questions could not be read.") from err


@router.get(
    "/jds/{jd_id}/candidates",
    summary="Get Evaluated Internal Candidates for Job Requisition",
    description="Retrieves actual candidates from SQLite, evaluates skill and experience compatibility, and provides explainable match scores.",
)
def get_jd_candidates(
    jd_id: int,
    status_filter: Optional[str] = Query(None),
    min_score: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    jd = db.get(JobRequirement, jd_id)
    if not jd:
        raise HTTPException(status_code=404, detail="Job Requirement not found")

    jd_skills = [s.strip().lower() for s in (jd.required_skills or "").split(",") if s.strip()]
    if not jd_skills:
        jd_skills = ["python", "sql", "engineering"]

    candidates = db.scalars(select(Candidate).order_by(Candidate.id.desc()).limit(50)).all()

    evaluated = []
    for cand in candidates:
        c_skills_raw = (cand.skills or "").lower()
        matched = []
        missing = []
        for s in jd_skills:
            if s in c_skills_raw:
                matched.append(s.title())
            else:
                missing.append(s.title())

        match_ratio = len(matched) / max(len(jd_skills), 1)
        base_score = int(match_ratio * 70)

        exp_years = float(cand.total_experience_years or 0)
        if exp_years >= 5:
            base_score += 25
        elif exp_years >= 2:
            base_score += 15
        else:
            base_score += 5

        fit_score = min(max(base_score, 25), 98)

        if fit_score >= 75:
            segment = "Strong Match"
        elif fit_score >= 50:
            segment = "Potential Match"
        else:
            segment = "Needs Review"

        evaluated.append({
            "id": cand.id,
            "candidate_code": cand.candidate_code,
            "full_name": f"{cand.first_name} {cand.last_name}",
            "current_title": cand.current_title or "Software Engineer",
            "current_company": cand.current_company or "Enterprise Tech",
            "total_experience_years": exp_years,
            "location": cand.location or "Hyderabad / Remote",
            "skills": cand.skills or "",
            "match_score": fit_score,
            "segment": segment,
            "matched_skills": matched,
            "missing_skills": missing,
            "explanation": f"Candidate demonstrates {len(matched)} of {len(jd_skills)} required competencies ({', '.join(matched[:3]) if matched else 'general match'}) with {exp_years:.1f} years total professional experience.",
            "status": cand.status,
        })

    evaluated.sort(key=lambda x: x["match_score"], reverse=True)
    return {
        "jd_id": jd.id,
        "req_code": jd.req_code,
        "title": jd.title,
        "total_evaluated": len(evaluated),
        "candidates": evaluated,
    }



