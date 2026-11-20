"""
Candidate Intelligence & Document Parsing Router for TALENTRA Phase 2.

Provides endpoints for:
- Viewing candidate intelligence profiles with role-based privacy masking
- Manual correction of candidate profiles with audit logging
- Managing multiple resume documents per candidate
- Duplicate detection scanning and candidate record merging
- CRM file header inspection and CSV/Excel import with custom mapping
- Batch parsing repository resumes into candidate profiles
- Parsed Job Description retrieval and manual correction
"""

import json
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query, Header, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_

from backend.app.database.session import get_db
from backend.app.models.candidate import Candidate
from backend.app.models.document import JobDescriptionDocument, ResumeDocument
from backend.app.models.candidate_intelligence import (
    CandidateResumeLink,
    CandidateEducation,
    CandidateEmployer,
    CandidateCertification,
    CandidateAuditLog,
    ParsedJobRequirement,
)
from backend.app.models.assignment import CandidateAssignment
from backend.app.models.matching import CandidateMatch
from backend.app.models.job_requirement import JobRequirement
from backend.app.models.outreach import CandidateCommunication
from backend.app.models.submission import CandidateSubmission
from backend.app.models.interview import Interview
from backend.app.models.user import User
from backend.app.schemas.intelligence import (
    CandidateIntelligenceDetail,
    EducationItem,
    EmployerItem,
    CertificationItem,
    ResumeLinkItem,
    AuditLogItem,
    ManualCorrectionRequest,
    DuplicateCandidatePair,
    MergeCandidatesRequest,
    MergeCandidatesResponse,
    CrmHeaderInspectResponse,
    CrmImportResponse,
    ParsedJobRequirementDetail,
    SkillInventoryItem,
    VerifiableEvidenceItem,
    CandidateActivityEvent,
    InterviewDetailItem,
)
from backend.app.services.extraction.normalizer import (
    mask_contact_info,
    normalize_email,
    normalize_phone,
)
from backend.app.services.extraction.resume_parser import ResumeParser
from backend.app.services.extraction.jd_parser import JobDescriptionParser
from backend.app.services.extraction.duplicate_detector import (
    detect_candidate_duplicate,
    scan_all_duplicates,
)
from backend.app.services.extraction.crm_importer import (
    inspect_headers,
    suggest_mappings,
    import_candidates_from_file,
    parse_repository_resumes_batch,
)

router = APIRouter(prefix="/api/v1/intelligence", tags=["Candidate Intelligence & Parsing"])


# ============================================================================
# CANDIDATE INTELLIGENCE PROFILES & PRIVACY MASKING
# ============================================================================

@router.get(
    "/candidates/{candidate_id}",
    response_model=CandidateIntelligenceDetail,
    summary="Get Detailed Candidate Intelligence Profile",
    description="Returns complete candidate intelligence profile with role-based contact masking.",
)
def get_candidate_intelligence(
    candidate_id: int,
    role: str = Query("recruiter", description="Viewer role: 'recruiter', 'admin', or 'viewer'/'guest'"),
    x_user_role: Optional[str] = Header(None, description="Optional role header override"),
    db: Session = Depends(get_db),
) -> CandidateIntelligenceDetail:
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        # Check if candidate_id was passed as a ResumeDocument id from repository explorer
        doc = db.get(ResumeDocument, candidate_id)
        if doc:
            candidate = db.query(Candidate).filter(
                or_(
                    Candidate.resume_url.ilike(f"%{doc.original_filename}%"),
                    Candidate.resume_url.ilike(f"%{doc.stored_filename}%"),
                )
            ).first()
        if not candidate:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Candidate with ID {candidate_id} not found.")

    effective_role = x_user_role if isinstance(x_user_role, str) else role
    is_masked = str(effective_role).lower() in ("viewer", "guest", "readonly")
    masked_email, masked_phone = mask_contact_info(candidate.email, candidate.phone, user_role=effective_role)

    # Fetch related collections
    educations = db.scalars(
        select(CandidateEducation).where(CandidateEducation.candidate_id == candidate.id)
    ).all()
    employers = db.scalars(
        select(CandidateEmployer).where(CandidateEmployer.candidate_id == candidate.id)
    ).all()
    certifications = db.scalars(
        select(CandidateCertification).where(CandidateCertification.candidate_id == candidate.id)
    ).all()
    resumes = db.scalars(
        select(CandidateResumeLink).where(CandidateResumeLink.candidate_id == candidate.id)
    ).all()
    audit_logs = db.scalars(
        select(CandidateAuditLog).where(CandidateAuditLog.candidate_id == candidate.id).order_by(CandidateAuditLog.changed_at.desc())
    ).all()

    # Enrich resume links with document metadata
    resume_items = []
    primary_raw_text = ""
    primary_doc_name = candidate.resume_url or "uploaded_resume.pdf"
    for r in resumes:
        doc = db.scalar(select(ResumeDocument).where(ResumeDocument.doc_id == r.resume_doc_id))
        doc_filename = doc.original_filename if doc else r.resume_doc_id
        doc_size = doc.file_size_bytes if doc else None
        if doc and doc.raw_text and not primary_raw_text:
            primary_raw_text = doc.raw_text
            primary_doc_name = doc.original_filename
        resume_items.append(
            ResumeLinkItem(
                id=r.id,
                resume_doc_id=r.resume_doc_id,
                is_primary=r.is_primary,
                linked_at=r.linked_at,
                filename=doc_filename,
                file_size_bytes=doc_size,
            )
        )

    # Categorize skills into Primary, Secondary, Tools & Frameworks, and Domain
    skills_list = [s.strip() for s in (candidate.skills or "").split(",") if s.strip()]
    primary_skills = []
    secondary_skills = []
    tools_and_frameworks = []
    domain_skills = []
    skills_inventory = []

    primary_keywords = {"python", "java", "c++", "c#", "golang", "go", "react", "angular", "node.js", "aws", "azure", "gcp", "docker", "kubernetes", "sql", "spring boot", "catia", "solidworks", "verilog", "vhdl"}
    tool_keywords = {"git", "github", "gitlab", "jira", "jenkins", "terraform", "ansible", "postman", "prometheus", "grafana", "linux", "visual studio", "intellij"}
    domain_keywords = {"cloud", "microservices", "machine learning", "ai", "deep learning", "embedded", "semiconductor", "automotive", "finance", "healthcare", "supply chain", "devops", "sre", "plastic design"}

    for sk in skills_list:
        sk_lower = sk.lower()
        cat = "General"
        if any(pk in sk_lower for pk in primary_keywords):
            cat = "Primary Technical Skills"
            primary_skills.append(sk)
        elif any(tk in sk_lower for tk in tool_keywords):
            cat = "Tools & Frameworks"
            tools_and_frameworks.append(sk)
        elif any(dk in sk_lower for dk in domain_keywords):
            cat = "Domain Competencies"
            domain_skills.append(sk)
        else:
            cat = "Secondary Technical Skills"
            secondary_skills.append(sk)

        # Check evidence snippet
        evidence_snippet = None
        if primary_raw_text and sk_lower in primary_raw_text.lower():
            for line in primary_raw_text.splitlines():
                if sk_lower in line.lower() and len(line.strip()) > 3:
                    evidence_snippet = line.strip()[:160]
                    break

        skills_inventory.append(
            SkillInventoryItem(
                name=sk,
                category=cat,
                evidence_snippet=evidence_snippet,
                associated_employer=candidate.current_company if candidate.current_company else None,
                validation_status="Verified" if evidence_snippet else "Documented",
            )
        )

    # Build verifiable evidence for key attributes
    verifiable_evidence = []
    doc_ref_name = primary_doc_name.split("/")[-1].split("\\")[-1]

    if candidate.first_name:
        verifiable_evidence.append(
            VerifiableEvidenceItem(
                field_name="Candidate Name",
                extracted_value=f"{candidate.first_name} {candidate.last_name}",
                snippet=f"Document Header: {candidate.first_name} {candidate.last_name}",
                source_document=doc_ref_name,
                page_or_section="Header / Page 1",
            )
        )
    if candidate.current_title:
        verifiable_evidence.append(
            VerifiableEvidenceItem(
                field_name="Current Designation",
                extracted_value=candidate.current_title,
                snippet=f"Role: {candidate.current_title}",
                source_document=doc_ref_name,
                page_or_section="Experience Section",
            )
        )
    if candidate.current_company:
        verifiable_evidence.append(
            VerifiableEvidenceItem(
                field_name="Current Company",
                extracted_value=candidate.current_company,
                snippet=f"Employer: {candidate.current_company}",
                source_document=doc_ref_name,
                page_or_section="Employment History",
            )
        )
    if candidate.total_experience_years:
        verifiable_evidence.append(
            VerifiableEvidenceItem(
                field_name="Total Experience",
                extracted_value=f"{float(candidate.total_experience_years)} Years",
                snippet=f"Experience Timeline: {float(candidate.total_experience_years)} cumulative years documented",
                source_document=doc_ref_name,
                page_or_section="Summary / Career Chronology",
            )
        )
    for edu in educations[:2]:
        verifiable_evidence.append(
            VerifiableEvidenceItem(
                field_name="Academic Qualification",
                extracted_value=f"{edu.degree}" + (f" ({edu.institution})" if edu.institution else ""),
                snippet=f"Degree: {edu.degree}" + (f" from {edu.institution}" if edu.institution else ""),
                source_document=doc_ref_name,
                page_or_section="Education Credentials",
            )
        )

    # Activity Timeline from real records
    activity_timeline = []
    # 1. Profile Created
    if candidate.created_at:
        activity_timeline.append(
            CandidateActivityEvent(
                id=f"act-create-{candidate.id}",
                event_type="created",
                title="Candidate Profile Ingested",
                description=f"Candidate {candidate.first_name} {candidate.last_name} indexed into TALENTRA internal repository.",
                timestamp=candidate.created_at,
                badge="Ingestion",
            )
        )

    # 2. Resumes Linked
    for r in resumes:
        activity_timeline.append(
            CandidateActivityEvent(
                id=f"act-res-{r.id}",
                event_type="parsed",
                title="Resume Document Linked",
                description=f"Resume {r.resume_doc_id} associated as {'Primary' if r.is_primary else 'Secondary'} document.",
                timestamp=r.linked_at,
                badge="Resume Link",
            )
        )

    # 3. Audit Logs (Manual Corrections)
    for a in audit_logs:
        activity_timeline.append(
            CandidateActivityEvent(
                id=f"act-audit-{a.id}",
                event_type="status_changed",
                title="Profile Manually Corrected",
                description=f"Field '{a.field_name}' adjusted by {a.changed_by}: '{a.old_value or ''}' → '{a.new_value or ''}'.",
                timestamp=a.changed_at,
                badge="Audit Trail",
            )
        )

    # 4. TA Assignments
    assignments = db.scalars(
        select(CandidateAssignment).where(CandidateAssignment.candidate_id == candidate.id)
    ).all()
    for asn in assignments:
        ta_user = db.get(User, asn.ta_user_id)
        ta_name = ta_user.full_name if ta_user else f"TA #{asn.ta_user_id}"
        activity_timeline.append(
            CandidateActivityEvent(
                id=f"act-asn-{asn.id}",
                event_type="assigned",
                title="Assigned to TA Recruiter",
                description=f"Assigned to {ta_name} with status '{asn.status.value if hasattr(asn.status, 'value') else asn.status}'.",
                timestamp=asn.assigned_at,
                badge="TA Assignment",
            )
        )

    # 5. Candidate Matches
    matches = db.scalars(
        select(CandidateMatch).where(CandidateMatch.candidate_id == candidate.id).limit(5)
    ).all()
    for m in matches:
        jd_req = db.get(JobRequirement, m.job_requirement_id)
        jd_title = jd_req.title if jd_req else f"Requisition #{m.job_requirement_id}"
        activity_timeline.append(
            CandidateActivityEvent(
                id=f"act-match-{m.id}",
                event_type="matched",
                title="Evaluated Against Job Requirement",
                description=f"Matched for '{jd_title}' — Compatibility: {round(float(m.match_score), 1)}% ({m.status}).",
                timestamp=m.created_at,
                badge="AI Matching",
            )
        )

    # 6. Outreach Communications
    comms = db.scalars(
        select(CandidateCommunication).where(CandidateCommunication.candidate_id == candidate.id).limit(5)
    ).all()
    for c in comms:
        activity_timeline.append(
            CandidateActivityEvent(
                id=f"act-comm-{c.id}",
                event_type="outreach",
                title="Outreach Communication Dispatched",
                description=f"Subject: {c.subject or 'Recruitment Inquiry'} via {c.channel} ({c.status}).",
                timestamp=c.sent_at or c.created_at,
                badge="Outreach",
            )
        )

    # 7. Scheduled Interviews
    submissions = db.scalars(
        select(CandidateSubmission).where(CandidateSubmission.candidate_id == candidate.id)
    ).all()
    interview_items = []
    if submissions:
        sub_ids = [s.id for s in submissions]
        sub_jd_map = {s.id: s.job_requirement_id for s in submissions}
        interviews_db = db.scalars(
            select(Interview).where(Interview.submission_id.in_(sub_ids))
        ).all()

        for itw in interviews_db:
            jd_id = sub_jd_map.get(itw.submission_id)
            jd_obj = db.get(JobRequirement, jd_id) if jd_id else None
            jd_title = jd_obj.title if jd_obj else "Direct Requisition"
            itw_item = InterviewDetailItem(
                id=itw.id,
                interview_code=itw.interview_code,
                round_number=itw.round_number,
                interview_type=itw.interview_type,
                scheduled_start=itw.scheduled_start,
                scheduled_end=itw.scheduled_end,
                interviewer_names=itw.interviewer_names,
                meeting_link=itw.meeting_link,
                status=itw.status,
                feedback=itw.feedback,
                rating=itw.rating,
                recommendation=itw.recommendation,
                jd_title=jd_title,
                jd_id=jd_id,
            )
            interview_items.append(itw_item)
            activity_timeline.append(
                CandidateActivityEvent(
                    id=f"act-itw-{itw.id}",
                    event_type="interview",
                    title=f"Interview Round {itw.round_number} ({itw.interview_type.title()})",
                    description=f"Session with {itw.interviewer_names or 'Hiring Panel'} for '{jd_title}' ({itw.status}).",
                    timestamp=itw.scheduled_start,
                    badge="Interview",
                )
            )

    # Sort activity timeline descending
    activity_timeline.sort(key=lambda x: x.timestamp, reverse=True)

    # Professional Summary (derive from title, company, experience)
    prof_summary = f"{candidate.current_title or 'Professional'} with {candidate.total_experience_years or 0} years of documented experience"
    if candidate.current_company:
        prof_summary += f" currently working at {candidate.current_company}."
    else:
        prof_summary += "."

    return CandidateIntelligenceDetail(
        id=candidate.id,
        candidate_code=candidate.candidate_code,
        first_name=candidate.first_name,
        last_name=candidate.last_name,
        full_name=f"{candidate.first_name} {candidate.last_name}",
        email=masked_email if is_masked else candidate.email,
        phone=masked_phone if is_masked else candidate.phone,
        current_title=candidate.current_title,
        current_company=candidate.current_company,
        total_experience_years=float(candidate.total_experience_years) if candidate.total_experience_years else None,
        relevant_experience_years=float(candidate.total_experience_years) if candidate.total_experience_years else None,
        professional_summary=prof_summary,
        location=candidate.location,
        preferred_location=getattr(candidate, "preferred_location", None),
        skills=candidate.skills,
        skills_list=skills_list,
        primary_skills=primary_skills,
        secondary_skills=secondary_skills,
        tools_and_frameworks=tools_and_frameworks,
        domain_skills=domain_skills,
        skills_inventory=skills_inventory,
        status=candidate.status,
        resume_url=candidate.resume_url,
        is_contact_masked=is_masked,
        viewer_role=effective_role,
        educations=[EducationItem.model_validate(e) for e in educations],
        employers=[EmployerItem.model_validate(emp) for emp in employers],
        certifications=[CertificationItem.model_validate(c) for c in certifications],
        resumes=resume_items,
        audit_logs=[AuditLogItem.model_validate(a) for a in audit_logs],
        verifiable_evidence=verifiable_evidence,
        activity_timeline=activity_timeline,
        interviews=interview_items,
        extraction_confidence=0.88,
        extraction_evidence={"status": "Parsed and indexed in TALENTRA repository"},
        is_manually_corrected=len(audit_logs) > 0,
        created_at=candidate.created_at,
        updated_at=candidate.updated_at,
    )


@router.put(
    "/candidates/{candidate_id}/correct",
    response_model=CandidateIntelligenceDetail,
    summary="Manual Correction of Candidate Profile",
    description="Updates candidate attributes and records each field alteration in the CandidateAuditLog.",
)
def manually_correct_candidate(
    candidate_id: int,
    payload: ManualCorrectionRequest,
    db: Session = Depends(get_db),
) -> CandidateIntelligenceDetail:
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        # Check if candidate_id was passed as a ResumeDocument id from repository explorer
        doc = db.get(ResumeDocument, candidate_id)
        if doc:
            candidate = db.query(Candidate).filter(
                or_(
                    Candidate.resume_url.ilike(f"%{doc.original_filename}%"),
                    Candidate.resume_url.ilike(f"%{doc.stored_filename}%"),
                )
            ).first()
        if not candidate:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Candidate with ID {candidate_id} not found.")

    corrections_made = 0

    def record_change(field: str, old_val: Any, new_val: Any):
        nonlocal corrections_made
        if new_val is not None and str(old_val or "") != str(new_val):
            log_entry = CandidateAuditLog(
                candidate_id=candidate.id,
                field_name=field,
                old_value=str(old_val) if old_val is not None else None,
                new_value=str(new_val),
                changed_by=payload.corrected_by,
                changed_at=datetime.utcnow(),
            )
            db.add(log_entry)
            corrections_made += 1

    if payload.first_name is not None:
        record_change("first_name", candidate.first_name, payload.first_name.strip())
        candidate.first_name = payload.first_name.strip()

    if payload.last_name is not None:
        record_change("last_name", candidate.last_name, payload.last_name.strip())
        candidate.last_name = payload.last_name.strip()

    if payload.email is not None:
        norm_email = normalize_email(payload.email)
        if norm_email:
            record_change("email", candidate.email, norm_email)
            candidate.email = norm_email

    if payload.phone is not None:
        norm_phone = normalize_phone(payload.phone)
        record_change("phone", candidate.phone, norm_phone)
        candidate.phone = norm_phone

    if payload.current_title is not None:
        record_change("current_title", candidate.current_title, payload.current_title.strip())
        candidate.current_title = payload.current_title.strip()

    if payload.current_company is not None:
        record_change("current_company", candidate.current_company, payload.current_company.strip())
        candidate.current_company = payload.current_company.strip()

    if payload.total_experience_years is not None:
        record_change("total_experience_years", candidate.total_experience_years, payload.total_experience_years)
        candidate.total_experience_years = payload.total_experience_years

    if payload.location is not None:
        record_change("location", candidate.location, payload.location.strip())
        candidate.location = payload.location.strip()

    if payload.skills is not None:
        record_change("skills", candidate.skills, payload.skills.strip())
        candidate.skills = payload.skills.strip()

    if payload.status is not None:
        record_change("status", candidate.status, payload.status.strip())
        candidate.status = payload.status.strip()

    candidate.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(candidate)

    return get_candidate_intelligence(candidate.id, role="recruiter", db=db)


# ============================================================================
# MULTI-RESUME LINKING PER CANDIDATE
# ============================================================================

@router.post(
    "/candidates/{candidate_id}/resumes/link",
    summary="Link Resume Document to Candidate",
    description="Associates an existing or newly uploaded ResumeDocument to a candidate profile.",
)
def link_resume_to_candidate(
    candidate_id: int,
    resume_doc_id: str = Query(..., description="Target ResumeDocument doc_id"),
    is_primary: bool = Query(False, description="Set as primary active resume"),
    db: Session = Depends(get_db),
):
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")

    doc = db.scalar(select(ResumeDocument).where(ResumeDocument.doc_id == resume_doc_id))
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"ResumeDocument '{resume_doc_id}' not found.")

    if is_primary:
        # Demote existing primary links
        existing_links = db.scalars(
            select(CandidateResumeLink).where(CandidateResumeLink.candidate_id == candidate.id)
        ).all()
        for link in existing_links:
            link.is_primary = False

    new_link = CandidateResumeLink(
        candidate_id=candidate.id,
        resume_doc_id=resume_doc_id,
        is_primary=is_primary,
    )
    db.add(new_link)
    db.commit()

    return {
        "success": True,
        "message": f"Resume '{resume_doc_id}' linked to candidate '{candidate.candidate_code}' successfully.",
    }


# ============================================================================
# DUPLICATE DETECTION & REVIEW
# ============================================================================

@router.get(
    "/duplicates",
    response_model=List[DuplicateCandidatePair],
    summary="Scan Candidate Duplicates",
    description="Detects candidates with matching email, phone number, or high-similarity names.",
)
def list_candidate_duplicates(db: Session = Depends(get_db)) -> List[DuplicateCandidatePair]:
    raw_duplicates = scan_all_duplicates(db)
    return [DuplicateCandidatePair(**item) for item in raw_duplicates]


@router.post(
    "/candidates/merge",
    response_model=MergeCandidatesResponse,
    summary="Merge Duplicate Candidate Profiles",
    description="Merges secondary candidate into primary candidate, transferring resume links and recording audit trail.",
)
def merge_candidates(
    payload: MergeCandidatesRequest,
    db: Session = Depends(get_db),
) -> MergeCandidatesResponse:
    c_primary = db.get(Candidate, payload.primary_candidate_id)
    c_secondary = db.get(Candidate, payload.secondary_candidate_id)

    if not c_primary or not c_secondary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or both candidates not found.")

    if c_primary.id == c_secondary.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot merge a candidate into themselves.")

    # 1. Re-link secondary candidate's resumes to primary
    sec_links = db.scalars(
        select(CandidateResumeLink).where(CandidateResumeLink.candidate_id == c_secondary.id)
    ).all()
    for link in sec_links:
        link.candidate_id = c_primary.id
        link.is_primary = False

    # 2. Re-link educations, employers, certifications
    sec_ed = db.scalars(select(CandidateEducation).where(CandidateEducation.candidate_id == c_secondary.id)).all()
    for item in sec_ed:
        item.candidate_id = c_primary.id

    sec_emp = db.scalars(select(CandidateEmployer).where(CandidateEmployer.candidate_id == c_secondary.id)).all()
    for item in sec_emp:
        item.candidate_id = c_primary.id

    # 3. Create Audit Log for Merge
    merge_log = CandidateAuditLog(
        candidate_id=c_primary.id,
        field_name="PROFILE_MERGE",
        old_value=f"Merged with duplicate candidate: {c_secondary.candidate_code} ({c_secondary.email})",
        new_value="Profile consolidated",
        changed_by=payload.merged_by,
        changed_at=datetime.utcnow(),
    )
    db.add(merge_log)

    # 4. Mark secondary as inactive/merged
    c_secondary.status = "merged"
    c_secondary.candidate_code = f"{c_secondary.candidate_code}_MERGED"

    db.commit()

    return MergeCandidatesResponse(
        success=True,
        message=f"Candidate {c_secondary.id} merged into {c_primary.candidate_code} successfully.",
        surviving_candidate_code=c_primary.candidate_code,
    )


# ============================================================================
# CRM & EXTERNAL INTEGRATION
# ============================================================================

@router.post(
    "/crm/inspect",
    response_model=CrmHeaderInspectResponse,
    summary="Inspect External CRM File Headers",
    description="Reads uploaded CSV or Excel file and returns detected column headers and suggested mappings.",
)
async def inspect_crm_file_headers(
    file: UploadFile = File(..., description="CRM CSV or Excel (.xlsx, .xls) file"),
) -> CrmHeaderInspectResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing.")

    content = await file.read()
    headers = inspect_headers(content, file.filename)
    mappings = suggest_mappings(headers)

    return CrmHeaderInspectResponse(
        filename=file.filename,
        detected_headers=headers,
        suggested_mappings=mappings,
    )


@router.post(
    "/crm/import",
    response_model=CrmImportResponse,
    summary="Import Candidates from CRM File",
    description="Imports candidates from CSV or Excel with customizable column mapping and duplicate detection.",
)
async def import_candidates_crm(
    file: UploadFile = File(..., description="CRM CSV or Excel file"),
    column_mapping_json: Optional[str] = Form(None, description="Optional JSON string of column mappings"),
    source_name: str = Form("CRM Import", description="External CRM source name (e.g. 'Salesforce', 'HubSpot')"),
    db: Session = Depends(get_db),
) -> CrmImportResponse:
    content = await file.read()

    mapping = None
    if column_mapping_json:
        try:
            mapping = json.loads(column_mapping_json)
        except Exception:
            mapping = None

    result = import_candidates_from_file(
        db=db,
        file_bytes=content,
        filename=file.filename,
        column_mapping=mapping,
        source_name=source_name,
    )

    return CrmImportResponse(**result)


@router.post(
    "/repository/batch-parse",
    summary="Batch Parse Repository Resumes into Candidates",
    description="Processes raw ResumeDocuments from Phase 1 repository and extracts candidate profiles.",
)
def batch_parse_repository(
    limit: Optional[int] = Query(None, description="Optional limit of resumes to parse"),
    db: Session = Depends(get_db),
):
    res = parse_repository_resumes_batch(db, limit=limit)
    return res


# ============================================================================
# JOB DESCRIPTION PARSING & RETRIEVAL
# ============================================================================

@router.get(
    "/jds/{jd_doc_id}/parsed",
    response_model=ParsedJobRequirementDetail,
    summary="Get Parsed Job Description Requirements",
    description="Returns structured extracted requirements for a JobDescriptionDocument, parsing on-the-fly if needed.",
)
def get_parsed_jd(jd_doc_id: str, db: Session = Depends(get_db)) -> ParsedJobRequirementDetail:
    # Check if already parsed
    existing = db.scalar(
        select(ParsedJobRequirement).where(ParsedJobRequirement.jd_doc_id == jd_doc_id)
    )
    if existing:
        return ParsedJobRequirementDetail.model_validate(existing)

    # Find the document
    doc = db.scalar(select(JobDescriptionDocument).where(JobDescriptionDocument.doc_id == jd_doc_id))
    if not doc:
        raise HTTPException(status_code=404, detail=f"JobDescriptionDocument '{jd_doc_id}' not found.")

    # Parse document
    parsed = JobDescriptionParser.parse(
        text=doc.raw_text or "",
        filename=doc.original_filename,
        jd_doc_id=doc.doc_id,
    )

    # Persist parsed requirement separately from original document
    new_record = ParsedJobRequirement(
        jd_doc_id=doc.doc_id,
        job_title=parsed.get("job_title") or doc.original_filename.replace(".txt", "").replace(".pdf", ""),
        required_skills=parsed.get("required_skills"),
        preferred_skills=parsed.get("preferred_skills"),
        min_experience_years=parsed.get("min_experience_years"),
        max_experience_years=parsed.get("max_experience_years"),
        required_qualifications=parsed.get("required_qualifications"),
        certifications=parsed.get("certifications"),
        location=parsed.get("location"),
        employment_type=parsed.get("employment_type", "Full-time"),
        work_mode=parsed.get("work_mode", "On-site"),
        mandatory_requirements=parsed.get("mandatory_requirements"),
        preferred_requirements=parsed.get("preferred_requirements"),
        extraction_confidence=parsed.get("extraction_confidence", 0.85),
        extraction_evidence=json.dumps(parsed.get("extraction_evidence", {})),
        is_manually_corrected=False,
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return ParsedJobRequirementDetail.model_validate(new_record)
