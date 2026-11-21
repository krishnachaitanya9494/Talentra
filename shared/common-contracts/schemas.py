"""
Shared Common Contracts: Candidate Profile & Job Requisition.

These Pydantic models define the canonical data schemas shared across
independent feature modules without binding them to any specific database.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CandidateProfileContract(BaseModel):
    """Canonical schema for a candidate profile."""
    id: Optional[int] = None
    candidate_id: Optional[str] = None
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    total_experience_years: Optional[float] = 0.0
    primary_skills: List[str] = Field(default_factory=list)
    secondary_skills: List[str] = Field(default_factory=list)
    current_designation: Optional[str] = None
    current_company: Optional[str] = None
    notice_period_days: Optional[int] = None
    raw_resume_text: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class JobRequisitionContract(BaseModel):
    """Canonical schema for a job requisition."""
    id: Optional[int] = None
    req_code: str
    title: str
    department: Optional[str] = "Engineering & Delivery"
    location: Optional[str] = "Hyderabad / Remote"
    experience_min: Optional[float] = 0.0
    experience_max: Optional[float] = 10.0
    mandatory_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    description: Optional[str] = None
    status: Optional[str] = "open"
    structured_sections: Optional[Dict[str, Any]] = None
