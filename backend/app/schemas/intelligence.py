"""
Pydantic Schemas for Phase 2: Document Parsing & Candidate Intelligence.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class EducationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    degree: str
    institution: Optional[str] = None
    field_of_study: Optional[str] = None
    graduation_year: Optional[int] = None


class EmployerItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    company_name: str
    role_title: Optional[str] = None
    is_current: bool = False
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class CertificationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    certification_name: str
    issuing_organization: Optional[str] = None
    issue_year: Optional[int] = None


class AuditLogItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    field_name: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by: str
    changed_at: datetime


class ResumeLinkItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    resume_doc_id: str
    is_primary: bool
    linked_at: datetime
    filename: Optional[str] = None
    file_size_bytes: Optional[int] = None


class SkillInventoryItem(BaseModel):
    name: str
    category: str = "General"  # Primary, Secondary, Tools & Frameworks, Domain
    evidence_snippet: Optional[str] = None
    associated_employer: Optional[str] = None
    validation_status: str = "Documented"  # Verified, Documented, Normalized


class VerifiableEvidenceItem(BaseModel):
    field_name: str
    extracted_value: str
    snippet: str
    source_document: str
    page_or_section: Optional[str] = None


class CandidateActivityEvent(BaseModel):
    id: str
    event_type: str  # created, parsed, matched, assigned, outreach, interview, status_changed
    title: str
    description: str
    timestamp: datetime
    badge: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class InterviewDetailItem(BaseModel):
    id: int
    interview_code: str
    round_number: int
    interview_type: str
    scheduled_start: datetime
    scheduled_end: datetime
    interviewer_names: Optional[str] = None
    meeting_link: Optional[str] = None
    status: str
    feedback: Optional[str] = None
    rating: Optional[int] = None
    recommendation: Optional[str] = None
    jd_title: Optional[str] = None
    jd_id: Optional[int] = None


class CandidateIntelligenceDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    candidate_code: str
    first_name: str
    last_name: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    current_title: Optional[str] = None
    current_company: Optional[str] = None
    total_experience_years: Optional[float] = None
    relevant_experience_years: Optional[float] = None
    professional_summary: Optional[str] = None
    location: Optional[str] = None
    preferred_location: Optional[str] = None
    skills: Optional[str] = None
    skills_list: List[str] = []
    primary_skills: List[str] = []
    secondary_skills: List[str] = []
    tools_and_frameworks: List[str] = []
    domain_skills: List[str] = []
    skills_inventory: List[SkillInventoryItem] = []
    status: str
    resume_url: Optional[str] = None
    is_contact_masked: bool = False
    viewer_role: str = "recruiter"

    educations: List[EducationItem] = []
    employers: List[EmployerItem] = []
    certifications: List[CertificationItem] = []
    resumes: List[ResumeLinkItem] = []
    audit_logs: List[AuditLogItem] = []
    verifiable_evidence: List[VerifiableEvidenceItem] = []
    activity_timeline: List[CandidateActivityEvent] = []
    interviews: List[InterviewDetailItem] = []

    extraction_confidence: float = 0.85
    extraction_evidence: Optional[Dict[str, Any]] = None
    is_manually_corrected: bool = False
    created_at: datetime
    updated_at: datetime


class ManualCorrectionRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    current_title: Optional[str] = None
    current_company: Optional[str] = None
    total_experience_years: Optional[float] = None
    location: Optional[str] = None
    preferred_location: Optional[str] = None
    skills: Optional[str] = None
    status: Optional[str] = None
    corrected_by: str = "Recruiter Admin"
    correction_note: Optional[str] = None


class DuplicateCandidatePair(BaseModel):
    candidate_a: Dict[str, Any]
    candidate_b: Dict[str, Any]
    match_type: str
    confidence: float
    matched_field: Optional[str] = None


class MergeCandidatesRequest(BaseModel):
    primary_candidate_id: int
    secondary_candidate_id: int
    keep_field_overrides: Optional[Dict[str, str]] = None  # e.g. {"title": "from_b"}
    merged_by: str = "Recruiter Admin"


class MergeCandidatesResponse(BaseModel):
    success: bool
    message: str
    surviving_candidate_code: str


class CrmHeaderInspectResponse(BaseModel):
    filename: str
    detected_headers: List[str]
    suggested_mappings: Dict[str, str]


class CrmImportExecuteRequest(BaseModel):
    column_mapping: Optional[Dict[str, str]] = None
    source_name: str = "CRM Import"


class CrmImportResponse(BaseModel):
    total_rows: int
    imported_count: int
    duplicate_count: int
    error_count: int
    source_filename: str
    results: List[Dict[str, Any]]


class ParsedJobRequirementDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    jd_doc_id: str
    job_title: str
    required_skills: Optional[str] = None
    preferred_skills: Optional[str] = None
    min_experience_years: Optional[float] = None
    max_experience_years: Optional[float] = None
    required_qualifications: Optional[str] = None
    certifications: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = "Full-time"
    work_mode: Optional[str] = "On-site"
    mandatory_requirements: Optional[str] = None
    preferred_requirements: Optional[str] = None
    extraction_confidence: float = 0.85
    extraction_evidence: Optional[str] = None
    is_manually_corrected: bool = False
    corrected_by: Optional[str] = None
    corrected_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
