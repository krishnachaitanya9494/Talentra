from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ComparisonTargetJD(BaseModel):
    id: int
    req_code: str
    title: str

class ComparisonTargetCandidate(BaseModel):
    id: int
    name: str
    current_role: Optional[str] = None
    experience_years: Optional[float] = 0.0

class ComparisonTargetsResponse(BaseModel):
    jds: List[ComparisonTargetJD]
    candidates: List[ComparisonTargetCandidate]

class ComparisonAnalyzeRequest(BaseModel):
    target_req_id: Optional[int] = None
    candidate_id: Optional[int] = None
    raw_jd_text: Optional[str] = None
    raw_resume_text: Optional[str] = None

class DimensionScores(BaseModel):
    mandatory_stack_fit: float
    semantic_cosine_fit: float
    experience_alignment: float
    location_compatibility: str

class GroundedEvidenceItem(BaseModel):
    category: str
    requirement: str
    evidence_text: str
    is_matched: bool

class ComparisonAnalyzeResponse(BaseModel):
    match_score: int
    verdict: str
    candidate_name: str
    candidate_title: str
    experience_years: float
    dimensions: DimensionScores
    grounded_evidence: List[GroundedEvidenceItem]
    missing_mandatory_skills: List[str]
