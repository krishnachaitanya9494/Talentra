import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.insert(0, _MOD_ROOT)

"""
Standalone Service Logic for Module 01: Job Requisitions.
100% deterministic, zero AI dependencies.
"""

from typing import List, Optional, Dict, Any
from contracts.requisitions_schemas import (
    RequisitionCreateSchema,
    RequisitionUpdateSchema,
    ValidationResultSchema,
    ValidationIssueSchema,
)

class JobRequisitionService:
    def __init__(self, repository=None):
        self.repository = repository

    def validate_requisition(self, jd_dict: Dict[str, Any]) -> ValidationResultSchema:
        """Deterministic validation of a job description."""
        issues = []
        score = 100

        title = (jd_dict.get("title") or "").strip()
        description = (jd_dict.get("description") or "").strip()
        skills = (jd_dict.get("skills") or "").strip()

        if not title:
            issues.append(ValidationIssueSchema(
                type="critical", field="title",
                message="Job Title is missing.",
                resolution="Provide an official role title."
            ))
            score -= 25

        if not description or len(description) < 30:
            issues.append(ValidationIssueSchema(
                type="critical", field="description",
                message="Job description is empty or too short (< 30 chars).",
                resolution="Provide complete responsibilities and scope."
            ))
            score -= 25

        if not skills:
            issues.append(ValidationIssueSchema(
                type="critical", field="skills",
                message="Technical skills missing.",
                resolution="Specify at least 2 core required skills."
            ))
            score -= 25

        # Check duplicate skills
        if skills:
            raw_list = [s.strip().lower() for s in skills.split(",") if s.strip()]
            seen = set()
            duplicates = []
            for s in raw_list:
                if s in seen and s not in duplicates:
                    duplicates.append(s)
                seen.add(s)
            if duplicates:
                issues.append(ValidationIssueSchema(
                    type="warning", field="skills",
                    message=f"Duplicate skills detected: {', '.join(duplicates)}",
                    resolution="Remove duplicate skill tags."
                ))
                score -= 10

        final_score = max(0, min(100, score))
        crit_count = sum(1 for i in issues if i.type == "critical")
        warn_count = sum(1 for i in issues if i.type == "warning")
        sugg_count = sum(1 for i in issues if i.type == "suggestion")

        return ValidationResultSchema(
            completeness_percentage=final_score,
            is_publishable=crit_count == 0 and final_score >= 60,
            critical_count=crit_count,
            warning_count=warn_count,
            suggestion_count=sugg_count,
            issues=issues,
        )

    def build_structured_specs(self, jd_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Convert requisition into 10 canonical sections."""
        title = jd_dict.get("title", "")
        desc = jd_dict.get("description", "")
        skills_raw = jd_dict.get("skills", "")
        skills = [s.strip() for s in skills_raw.split(",") if s.strip()]

        return {
            "req_code": jd_dict.get("req_code", "REQ-001"),
            "sections": {
                "overview": {
                    "title": title,
                    "department": jd_dict.get("department", "Engineering & Delivery"),
                    "location": jd_dict.get("location", "Hyderabad / Remote"),
                    "employment_type": "Full-Time Enterprise Permanent",
                },
                "summary": desc or f"Role responsible for {title} execution.",
                "responsibilities": [
                    f"Lead enterprise delivery and technical architecture for {title}.",
                    "Design and configure high-throughput modular workflows.",
                    "Collaborate with multi-functional teams to ensure SLA compliance."
                ],
                "technical_skills": {
                    "mandatory": skills[:4] if skills else ["Enterprise Systems Architecture"],
                    "preferred": skills[4:] if len(skills) > 4 else ["Agile Delivery", "CI/CD"],
                },
                "experience": {
                    "minimum_years": 5.0,
                    "maximum_years": 8.0,
                    "seniority": "Senior / Lead Individual Contributor",
                },
                "education": ["B.Tech / B.E. / M.Tech in Computer Science or Equivalent"],
                "certifications": ["Enterprise Certified Professional"],
                "domain_requirements": ["Enterprise Cloud & Distributed Systems"],
                "preferred_qualifications": ["Strong technical communication skills"],
                "employment_info": {
                    "remote_policy": "Hybrid (3 days on-site / 2 days remote)",
                    "travel_requirement": "Less than 10%",
                }
            },
            "validation": self.validate_requisition(jd_dict).dict(),
        }
