"""
Conventional Rule-Based Job Description Validator for TALENTRA.

NO AI / NO LLMS. Pure deterministic rule-based checks:
- Missing critical fields (Title, Skills, Description)
- Experience consistency (min <= max, positive)
- Duplicate skills detection
- Missing responsibilities or domain requirements
- Quality score / completeness percentage calculation

Validation Tiers:
- CRITICAL: Prevents publication or matching; must be resolved.
- WARNING: Potential quality or clarity issues requiring recruiter review.
- SUGGESTION: Best-practice recommendations to improve candidate engagement.
"""

from typing import Dict, List, Any, Optional
import re


def validate_job_description(
    title: Optional[str],
    description: Optional[str],
    skills: Optional[List[str]],
    experience_level: Optional[str] = None,
    min_experience_years: Optional[float] = None,
    max_experience_years: Optional[float] = None,
    location: Optional[str] = None,
    employment_type: Optional[str] = None,
    department: Optional[str] = None,
    education_required: Optional[str] = None,
    responsibilities: Optional[List[str]] = None,
    certifications: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Performs deterministic validation on a Job Description and returns
    structured issues, category breakdown, and completeness percentage.
    """
    issues: List[Dict[str, Any]] = []
    checks_passed = 0
    total_checks = 10

    # 1. Job Title Check
    if not title or not title.strip() or title.strip().lower() in ("untitled", "job title", "n/a"):
        issues.append({
            "id": "val-title-missing",
            "level": "CRITICAL",
            "field": "title",
            "message": "Job title is missing or generic.",
            "fix_suggestion": "Specify an industry-standard role title (e.g. 'Senior Oracle EPM Consultant').",
        })
    elif len(title.strip()) < 4:
        issues.append({
            "id": "val-title-short",
            "level": "WARNING",
            "field": "title",
            "message": f"Job title '{title}' is unusually short.",
            "fix_suggestion": "Expand title to include seniority or specialization.",
        })
    else:
        checks_passed += 1

    # 2. Required Skills Check
    clean_skills = [s.strip() for s in (skills or []) if s and s.strip()]
    if not clean_skills:
        issues.append({
            "id": "val-skills-empty",
            "level": "CRITICAL",
            "field": "skills",
            "message": "No required technical skills are assigned.",
            "fix_suggestion": "Add at least 3 core technical competencies for accurate matching.",
        })
    elif len(clean_skills) < 3:
        issues.append({
            "id": "val-skills-scant",
            "level": "WARNING",
            "field": "skills",
            "message": f"Only {len(clean_skills)} skills listed. Requisitions typically specify 4–8 core skills.",
            "fix_suggestion": "Add secondary skills, tools, or architectural frameworks.",
        })
        checks_passed += 1
    else:
        checks_passed += 1

    # 3. Duplicate Skills Check
    lower_skills = [s.lower() for s in clean_skills]
    duplicates = set([s for s in lower_skills if lower_skills.count(s) > 1])
    if duplicates:
        issues.append({
            "id": "val-skills-duplicate",
            "level": "WARNING",
            "field": "skills",
            "message": f"Duplicate skill entries detected: {', '.join(duplicates)}.",
            "fix_suggestion": "Deduplicate skills using canonical naming.",
        })
    else:
        checks_passed += 1

    # 4. Description Content & Length Check
    desc_clean = (description or "").strip()
    word_count = len(re.findall(r"\b\w+\b", desc_clean))
    if not desc_clean:
        issues.append({
            "id": "val-desc-missing",
            "level": "CRITICAL",
            "field": "description",
            "message": "Job specification description is empty.",
            "fix_suggestion": "Provide a detailed role summary, scope, and objectives.",
        })
    elif word_count < 40:
        issues.append({
            "id": "val-desc-sparse",
            "level": "WARNING",
            "field": "description",
            "message": f"Job description is very brief ({word_count} words). Candidates prefer detailed context.",
            "fix_suggestion": "Elaborate on day-to-day work, engineering deliverables, and project scope.",
        })
        checks_passed += 1
    else:
        checks_passed += 1

    # 5. Experience Consistency Check
    if min_experience_years is not None and max_experience_years is not None:
        if min_experience_years < 0 or max_experience_years < 0:
            issues.append({
                "id": "val-exp-negative",
                "level": "CRITICAL",
                "field": "experience",
                "message": "Experience years cannot be negative.",
                "fix_suggestion": "Set valid non-negative experience values.",
            })
        elif min_experience_years > max_experience_years:
            issues.append({
                "id": "val-exp-inverted",
                "level": "CRITICAL",
                "field": "experience",
                "message": f"Minimum experience ({min_experience_years}y) exceeds maximum ({max_experience_years}y).",
                "fix_suggestion": "Adjust experience range so minimum is less than or equal to maximum.",
            })
        else:
            checks_passed += 1
    elif not experience_level:
        issues.append({
            "id": "val-exp-unspecified",
            "level": "WARNING",
            "field": "experience",
            "message": "Seniority tier and experience range are both unspecified.",
            "fix_suggestion": "Define experience level (e.g. Senior: 5-8 years) for compensation benchmarking.",
        })
    else:
        checks_passed += 1

    # 6. Location & Work Mode Check
    if not location or not location.strip():
        issues.append({
            "id": "val-loc-missing",
            "level": "WARNING",
            "field": "location",
            "message": "Primary location or work arrangement (Remote/Hybrid) is not specified.",
            "fix_suggestion": "Add target city and work model (e.g., 'Bangalore / Hybrid').",
        })
    else:
        checks_passed += 1

    # 7. Employment Type Check
    if not employment_type or employment_type.lower() not in ("full_time", "contract", "part_time", "internship", "full-time"):
        issues.append({
            "id": "val-emptype-missing",
            "level": "SUGGESTION",
            "field": "employment_type",
            "message": "Employment arrangement not explicitly classified.",
            "fix_suggestion": "Confirm whether role is Full-Time Permanent, Contract, or Part-Time.",
        })
    else:
        checks_passed += 1

    # 8. Department / Business Unit Check
    if not department or not department.strip():
        issues.append({
            "id": "val-dept-missing",
            "level": "SUGGESTION",
            "field": "department",
            "message": "No department or business unit assigned.",
            "fix_suggestion": "Assign a hiring department (e.g. 'Engineering & Delivery', 'Enterprise Apps').",
        })
    else:
        checks_passed += 1

    # 9. Responsibilities Check
    clean_resp = [r.strip() for r in (responsibilities or []) if r and r.strip()]
    if not clean_resp:
        # Check if description mentions bullet-like responsibilities
        has_resp_keywords = bool(re.search(r"(responsibilit|deliverable|duties|will do|owns)", desc_clean, re.I))
        if not has_resp_keywords:
            issues.append({
                "id": "val-resp-missing",
                "level": "WARNING",
                "field": "responsibilities",
                "message": "Key responsibilities are not explicitly defined.",
                "fix_suggestion": "Add 3–5 bullet points detailing core deliverables and architectural ownership.",
            })
        else:
            checks_passed += 1
    else:
        checks_passed += 1

    # 10. Educational / Certification Qualifications Check
    has_edu = bool(education_required and education_required.strip())
    has_cert = bool(certifications and len(certifications) > 0)
    if not has_edu and not has_cert:
        issues.append({
            "id": "val-qual-unspecified",
            "level": "SUGGESTION",
            "field": "qualifications",
            "message": "Neither educational degree nor professional certifications are specified.",
            "fix_suggestion": "Add baseline degree (e.g. B.Tech / B.E. / MCA) or relevant vendor certification.",
        })
    else:
        checks_passed += 1

    # Summary counts
    critical_count = sum(1 for i in issues if i["level"] == "CRITICAL")
    warning_count = sum(1 for i in issues if i["level"] == "WARNING")
    suggestion_count = sum(1 for i in issues if i["level"] == "SUGGESTION")

    # Deterministic Completeness Score (0-100%)
    # Base 100 minus weighted penalties for issues
    score = 100
    score -= critical_count * 25
    score -= warning_count * 8
    score -= suggestion_count * 3
    completeness_percentage = max(10, min(100, score))

    is_publishable = critical_count == 0

    return {
        "completeness_percentage": completeness_percentage,
        "is_publishable": is_publishable,
        "checks_passed": checks_passed,
        "total_checks": total_checks,
        "critical_count": critical_count,
        "warning_count": warning_count,
        "suggestion_count": suggestion_count,
        "issues": issues,
    }
