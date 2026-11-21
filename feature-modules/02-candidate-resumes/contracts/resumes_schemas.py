from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class CandidateItemSchema(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    current_role: Optional[str] = None
    experience_years: Optional[float] = 0.0
    skills: List[str] = Field(default_factory=list)
    location: Optional[str] = None
    status: Optional[str] = "active"
    resume_file: Optional[str] = None

class UploadResumeResultSchema(BaseModel):
    status: str
    filename: str
    file_hash: str
    is_duplicate: bool
    candidate_id: Optional[int] = None
    message: str

class BulkUploadResultSchema(BaseModel):
    total_files: int
    successful_uploads: int
    duplicates_detected: int
    items: List[UploadResumeResultSchema]
