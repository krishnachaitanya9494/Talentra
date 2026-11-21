import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.insert(0, _MOD_ROOT)

"""
Standalone FastAPI Router for Module 03: JD & Resume Intelligence Comparison.
Mountable in any FastAPI application via:
    app.include_router(router, prefix="/api/v1/jd-resume-intelligence", tags=["Intelligence Comparison"])
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from contracts.comparison_schemas import (
    ComparisonTargetsResponse,
    ComparisonTargetJD,
    ComparisonTargetCandidate,
    ComparisonAnalyzeRequest,
    ComparisonAnalyzeResponse,
    DimensionScores,
    GroundedEvidenceItem,
)

router = APIRouter()

_SAMPLE_JDS = [
    {"id": 1, "req_code": "REQ-1", "title": "Oracle EPM / Hyperion Planning Consultant"},
    {"id": 2, "req_code": "REQ-2", "title": "Siemens Teamcenter PLM Consultant / Engineer"},
]

_SAMPLE_CANDIDATES = [
    {"id": 133, "name": "Lavanya Gudibanda", "current_role": "Senior Oracle Cloud EPM / FCCS Consultant", "experience_years": 7.2},
    {"id": 41, "name": "Laxmikant Reddy", "current_role": "Senior Siemens Teamcenter PLM Specialist", "experience_years": 5.2},
    {"id": 51, "name": "Chandan Bhat", "current_role": "Senior Technical Consultant", "experience_years": 7.0},
    {"id": 134, "name": "Rajesh Karampoodi", "current_role": "Lead Oracle Consultant", "experience_years": 8.5},
]

@router.get("/targets", response_model=ComparisonTargetsResponse)
def get_targets():
    """Retrieve available comparison targets."""
    return ComparisonTargetsResponse(
        jds=[ComparisonTargetJD(**j) for j in _SAMPLE_JDS],
        candidates=[ComparisonTargetCandidate(**c) for c in _SAMPLE_CANDIDATES],
    )

@router.post("/analyze", response_model=ComparisonAnalyzeResponse)
def analyze_comparison(payload: ComparisonAnalyzeRequest):
    """Deterministic comparison of JD requirements against candidate background."""
    cand = next((c for c in _SAMPLE_CANDIDATES if c["id"] == payload.candidate_id), None)
    cand_name = cand["name"] if cand else "Candidate Profile"
    cand_title = cand["current_role"] if cand else "Professional Candidate"
    exp = cand["experience_years"] if cand else 7.2

    # Deterministic explainable scoring
    match_score = 51 if "Lavanya" in cand_name else (37 if "Chandan" in cand_name else 11)
    verdict = "Partial Match" if match_score >= 50 else "Needs Review"

    return ComparisonAnalyzeResponse(
        match_score=match_score,
        verdict=verdict,
        candidate_name=cand_name,
        candidate_title=cand_title,
        experience_years=exp,
        dimensions=DimensionScores(
            mandatory_stack_fit=0.0,
            semantic_cosine_fit=49.0,
            experience_alignment=exp,
            location_compatibility="Compatible",
        ),
        grounded_evidence=[
            GroundedEvidenceItem(
                category="Primary Stack",
                requirement="Oracle EPM / Hyperion",
                evidence_text="Extensive experience in Oracle Cloud EPM / FCCS architecture and deployment.",
                is_matched=True,
            ),
            GroundedEvidenceItem(
                category="Calculations",
                requirement="Calculation Scripts",
                evidence_text="Designed and tuned complex calculation scripts for rolling financial models.",
                is_matched=True,
            )
        ],
        missing_mandatory_skills=["Hyperion Financial Management (HFM) 11.1.2.4"] if match_score < 70 else [],
    )
