"""
Pydantic Schemas for Job Descriptions, Candidates/Resumes, and Document Uploads.
"""

from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class JobRequirementItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    req_code: str
    client_id: int
    title: str
    department: Optional[str] = None
    description: str
    experience_level: Optional[str] = None
    employment_type: str
    location: Optional[str] = None
    is_remote: bool
    open_positions: int
    status: str
    priority: str
    required_skills: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CandidateItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    candidate_code: str
    first_name: str
    last_name: str
    full_name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    current_title: Optional[str] = None
    current_company: Optional[str] = None
    total_experience_years: Optional[float] = None
    location: Optional[str] = None
    resume_url: Optional[str] = None
    skills: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime


class JobRequirementDetailItem(JobRequirementItem):
    full_text: Optional[str] = None
    source_file: Optional[str] = None


class CandidateDetailItem(CandidateItem):
    full_text: Optional[str] = None
    resume_filename: Optional[str] = None


class PaginatedJDsResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[JobRequirementItem]


class PaginatedCandidatesResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[CandidateItem]


class DataSummaryResponse(BaseModel):
    total_jds: int
    total_candidates: int
    total_clients: int
    total_submissions: int
    database_file: str


class SyncResponse(BaseModel):
    message: str
    jds_synced: int
    jds_skipped: int
    resumes_synced: int
    resumes_skipped: int
    total_jds: int
    total_candidates: int


class UploadJDResponse(BaseModel):
    message: str
    job_requirement: JobRequirementItem


class UploadResumeResponse(BaseModel):
    message: str
    candidate: CandidateItem
