from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SourcingSearchFilter(BaseModel):
    jd_id: Optional[int] = None
    boolean_query: Optional[str] = None
    experience_min: Optional[float] = None
    experience_max: Optional[float] = None
    location: Optional[str] = None
    limit: Optional[int] = 50

class SourcedCandidateItem(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    current_role: Optional[str] = None
    experience_years: float = 0.0
    skills: List[str] = Field(default_factory=list)
    location: Optional[str] = None
    match_score: int
    match_tier: str # 'Top Recommendation', 'Strong Fit', 'Moderate Fit', 'Under Review'
    source_type: str = "Internal Database" # Internal sources only

class SourcingSearchResponse(BaseModel):
    total_candidates_searched: int
    matched_count: int
    candidates: List[SourcedCandidateItem]

class ExcelExportRequest(BaseModel):
    jd_id: Optional[int] = None
    candidate_ids: List[int] = Field(default_factory=list)
    export_title: Optional[str] = "Sourcing_Talent_Export"

class ExportHistoryItem(BaseModel):
    id: int
    filename: str
    record_count: int
    created_at: str
    download_url: str
