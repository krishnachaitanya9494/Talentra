from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ProvenanceField(BaseModel):
    value: Optional[str] = None
    confidence: float = 1.0
    source_snippet: Optional[str] = None

class ExtractedCandidateRecordSchema(BaseModel):
    id: Optional[str] = None
    filename: str
    name: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    current_role: Optional[str] = ""
    current_company: Optional[str] = ""
    total_experience_years: Optional[float] = None
    skills: List[str] = Field(default_factory=list)
    location: Optional[str] = ""
    education: Optional[str] = ""
    certifications: Optional[str] = ""
    notice_period: Optional[str] = "" # Leave empty if not explicitly mentioned
    compensation: Optional[str] = ""   # Leave empty if not explicitly mentioned
    provenance: Dict[str, ProvenanceField] = Field(default_factory=dict)

class BatchExtractionJobResponse(BaseModel):
    job_id: str
    status: str # 'pending', 'processing', 'completed', 'failed'
    total_files: int
    processed_count: int
    records: List[ExtractedCandidateRecordSchema] = Field(default_factory=list)
