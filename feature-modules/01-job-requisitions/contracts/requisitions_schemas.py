from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class RequisitionCreateSchema(BaseModel):
    title: str = Field(..., description="Job Title")
    department: Optional[str] = "Engineering & Delivery"
    location: Optional[str] = "Hyderabad / Remote"
    experience_level: Optional[str] = "5 - 8 Years"
    skills: Optional[str] = ""
    description: Optional[str] = ""
    status: Optional[str] = "open"

class RequisitionUpdateSchema(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    change_summary: Optional[str] = "Recruiter specification update"

class RequisitionResponseSchema(BaseModel):
    id: int
    req_code: str
    title: str
    department: str
    location: str
    experience_level: str
    skills: str
    description: str
    status: str

class ValidationIssueSchema(BaseModel):
    type: str # 'critical', 'warning', 'suggestion'
    field: str
    message: str
    resolution: str

class ValidationResultSchema(BaseModel):
    completeness_percentage: int
    is_publishable: bool
    critical_count: int
    warning_count: int
    suggestion_count: int
    issues: List[ValidationIssueSchema]
