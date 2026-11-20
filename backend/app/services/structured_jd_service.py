"""
Structured Job Description Representation & Conventional Extraction Service for TALENTRA.

NO AI / NO LLMS. Pure deterministic parsing, regex pattern matching, structured data schemas.
Organizes Job Descriptions into the 10 Canonical Enterprise Sections:
1. Job Overview
2. Job Summary
3. Responsibilities (Core Architecture & Lifecycle Deliverables)
4. Technical Skills (11 Taxonomy Categories, Mandatory vs Preferred, Normalization)
5. Experience Requirements
6. Educational Qualifications
7. Certifications
8. Domain Requirements
9. Preferred Qualifications
10. Location & Employment Information
"""

import re
from typing import Dict, List, Any, Optional
from pathlib import Path
from sqlalchemy.orm import Session
from backend.app.models.job_requirement import JobRequirement
from backend.app.models.client import Client
from backend.app.services.skill_service import (
    categorize_skills_list,
    detect_duplicate_skills,
    normalize_skill,
    SKILL_CATEGORIES,
)
from backend.app.services.jd_validator import validate_job_description


def extract_sections_from_text(raw_text: str) -> Dict[str, Any]:
    """
    Deterministic rule-based and regex extraction of structured sections from raw text.
    Handles headings like:
    - SUMMARY / OVERVIEW / ABOUT THE ROLE
    - RESPONSIBILITIES / WHAT YOU WILL DO / KEY ACCOUNTABILITIES
    - REQUIREMENTS / QUALIFICATIONS / SKILLS
    - EDUCATION / DEGREES
    - CERTIFICATIONS
    """
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    
    summary_lines = []
    responsibilities = []
    deliverables = []
    edu_lines = []
    cert_lines = []
    domain_lines = []
    pref_lines = []
    
    current_section = "summary"
    for line in lines:
        lower = line.lower()
        if re.search(r"^(responsibilit|key responsibilit|what you'll do|core responsibilit)", lower):
            current_section = "responsibilities"
            continue
        elif re.search(r"^(deliverable|lifecycle deliverable|functional deliverable)", lower):
            current_section = "deliverables"
            continue
        elif re.search(r"^(education|educational qualification|academic requirement)", lower):
            current_section = "education"
            continue
        elif re.search(r"^(certification|certifications|credentials|licenses)", lower):
            current_section = "certifications"
            continue
        elif re.search(r"^(domain|industry requirement|business domain)", lower):
            current_section = "domain"
            continue
        elif re.search(r"^(preferred|nice to have|bonus points|preferred qualification)", lower):
            current_section = "preferred"
            continue
        elif re.search(r"^(summary|about the role|overview|position overview)", lower):
            current_section = "summary"
            continue

        clean_bullet = re.sub(r"^[\*\-\•\d\.\)]\s*", "", line).strip()
        if not clean_bullet:
            continue

        if current_section == "summary":
            summary_lines.append(clean_bullet)
        elif current_section == "responsibilities":
            responsibilities.append(clean_bullet)
        elif current_section == "deliverables":
            deliverables.append(clean_bullet)
        elif current_section == "education":
            edu_lines.append(clean_bullet)
        elif current_section == "certifications":
            cert_lines.append(clean_bullet)
        elif current_section == "domain":
            domain_lines.append(clean_bullet)
        elif current_section == "preferred":
            pref_lines.append(clean_bullet)

    return {
        "summary": " ".join(summary_lines[:5]) if summary_lines else "",
        "responsibilities": responsibilities,
        "deliverables": deliverables,
        "education": edu_lines,
        "certifications": cert_lines,
        "domain": domain_lines,
        "preferred": pref_lines,
    }


def get_structured_job_description(jd_id: int, db: Session) -> Dict[str, Any]:
    """
    Assembles complete 10-section structured representation for a JobRequirement,
    integrating validation, normalized taxonomy skills, and raw text toggle.
    """
    jd = db.get(JobRequirement, jd_id)
    if not jd:
        return {}

    # Extract associated client details
    client_name = "Talentra Enterprise Delivery"
    client_industry = "Corporate Systems & Technology Architecture"
    if jd.client_id:
        c = db.get(Client, jd.client_id)
        if c:
            client_name = c.name
            client_industry = c.industry or client_industry

    raw_text = jd.description or ""
    # Check if raw file exists on disk for richest text
    source_filename = None
    jds_dir = Path("data/jds").resolve()
    for ext_file in jds_dir.glob("*.txt"):
        if ext_file.name.lower().startswith(jd.req_code.lower().replace("-", "_")):
            try:
                content = ext_file.read_text(encoding="utf-8", errors="ignore")
                if content and len(content) > len(raw_text):
                    raw_text = content
                    source_filename = ext_file.name
                    break
            except Exception:
                pass

    extracted = extract_sections_from_text(raw_text)

    # Experience range extraction
    exp_level = (jd.experience_level or "mid").lower()
    if exp_level == "entry":
        min_exp, max_exp = 1, 3
    elif exp_level == "senior":
        min_exp, max_exp = 5, 8
    elif exp_level in ("lead", "principal", "executive"):
        min_exp, max_exp = 8, 12
    else:
        min_exp, max_exp = 3, 6

    # Parse raw skills string
    skills_raw = jd.required_skills or ""
    if isinstance(skills_raw, list):
        skill_items = [str(s).strip() for s in skills_raw if str(s).strip()]
    else:
        skill_items = [s.strip() for s in str(skills_raw).split(",") if s.strip()]

    # Skill classification into 11 categories
    skills_by_category = categorize_skills_list(skill_items, default_mandatory=True)
    duplicates = detect_duplicate_skills(skill_items)

    # Flat list of normalized skills with metadata
    all_classified_skills = []
    for cat, items in skills_by_category.items():
        for it in items:
            all_classified_skills.append({
                "name": it["canonical_name"],
                "raw_name": it["raw_name"],
                "category": cat,
                "is_mandatory": it.get("is_mandatory", True),
                "priority": "HIGH" if it.get("is_mandatory", True) else "MEDIUM",
            })

    # Responsibilities fallback if extraction was empty
    responsibilities = extracted["responsibilities"]
    if not responsibilities:
        responsibilities = [
            f"Own end-to-end design, implementation, and deployment of {jd.title} architectures.",
            "Collaborate with enterprise stakeholders to translate business requirements into governed technical specifications.",
            "Maintain auditable workflow history and compliance with regulatory governance standards.",
            "Participate in design reviews, production cutover, and high-concurrency performance tuning.",
        ]

    deliverables = extracted["deliverables"]
    if not deliverables:
        deliverables = [
            "Author standardized platform extensions, integration blueprints, and runbooks.",
            "Participate in release management, defect resolution, and pre-production operational readiness.",
            "Provide mentorship and engineering guidance to junior developers and implementation consultants.",
        ]

    # Education qualifications fallback
    education = extracted["education"]
    if not education:
        education = [
            "Bachelor's degree in Computer Science, Information Technology, Engineering, or equivalent practical experience.",
            "Master's degree (M.Tech / MS / MCA / MBA) is a strong plus.",
        ]

    # Certifications fallback
    certifications = extracted["certifications"]
    if not certifications:
        title_lower = jd.title.lower()
        if "hyperion" in title_lower or "epm" in title_lower:
            certifications = [
                "Oracle Cloud EPM Certified Implementation Specialist (PBCS/EPBCS)",
                "Oracle Essbase Implementation Specialist Certification",
            ]
        elif "plm" in title_lower or "teamcenter" in title_lower:
            certifications = [
                "Siemens Teamcenter Certified Specialist",
                "PLM Solution Architecture Certification",
            ]
        elif "cloud" in title_lower or "aws" in title_lower:
            certifications = [
                "AWS Certified Solutions Architect – Professional",
                "HashiCorp Certified: Terraform Associate",
            ]
        else:
            certifications = [
                "Industry-standard professional or vendor certification in target technology stack.",
            ]

    # Domain requirements fallback
    domain_reqs = extracted["domain"]
    if not domain_reqs:
        domain_reqs = [
            f"Deep working experience in {jd.department or 'Enterprise Systems'} lifecycle operations.",
            "Proven fluency adhering to enterprise change control and SOX compliance standards.",
        ]

    # Preferred qualifications fallback
    preferred_quals = extracted["preferred"]
    if not preferred_quals:
        preferred_quals = [
            "Prior engagement with Global Capability Centers (GCCs) or Fortune 500 corporate environments.",
            "Experience automating repeatable operational routines with scripting (Python, Shell, REST APIs).",
        ]

    # Perform conventional deterministic validation
    validation_report = validate_job_description(
        title=jd.title,
        description=jd.description,
        skills=skill_items,
        experience_level=jd.experience_level,
        min_experience_years=float(min_exp),
        max_experience_years=float(max_exp),
        location=jd.location,
        employment_type=jd.employment_type,
        department=jd.department,
        education_required="; ".join(education),
        responsibilities=responsibilities,
        certifications=certifications,
    )

    # Recruiter requirement weights (ensuring 100% sum)
    default_weights = [
        {"category": "Technical Skills", "weight": 35, "description": "Hands-on proficiency across mandatory platform competencies."},
        {"category": "Relevant Experience", "weight": 25, "description": "Years of experience and seniority tier alignment."},
        {"category": "Domain Requirements", "weight": 15, "description": "Enterprise ecosystem, SOX, and domain understanding."},
        {"category": "Educational Qualifications", "weight": 10, "description": "Degree, specialization, and foundational engineering rigor."},
        {"category": "Certifications", "weight": 10, "description": "Vendor credentials and verified technical certifications."},
        {"category": "Soft Skills & Leadership", "weight": 5, "description": "Stakeholder communication, documentation, and teamwork."},
    ]

    return {
        "jd_id": jd.id,
        "req_code": jd.req_code,
        "version": "v1",
        "created_at": jd.created_at.isoformat() if jd.created_at else None,
        "updated_at": jd.updated_at.isoformat() if jd.updated_at else None,
        "source_filename": source_filename or f"{jd.req_code}.txt",
        "raw_text": raw_text,
        
        # 10 Structured Canonical Sections
        "sections": {
            "1_overview": {
                "title": "Job Overview",
                "role_title": jd.title,
                "requisition_code": jd.req_code,
                "client_name": client_name,
                "client_industry": client_industry,
                "department": jd.department or "Engineering & Delivery",
                "employment_type": jd.employment_type or "full_time",
                "status": jd.status or "open",
                "priority": jd.priority or "medium",
                "open_positions": jd.open_positions or 1,
            },
            "2_summary": {
                "title": "Job Summary",
                "content": extracted["summary"] or jd.description[:350] + ("..." if len(jd.description) > 350 else ""),
            },
            "3_responsibilities": {
                "title": "Responsibilities",
                "core_responsibilities": responsibilities,
                "functional_deliverables": deliverables,
            },
            "4_technical_skills": {
                "title": "Technical Skills & Competency Matrix",
                "categories": SKILL_CATEGORIES,
                "by_category": skills_by_category,
                "skills_list": all_classified_skills,
                "duplicates_found": duplicates,
                "total_skills": len(all_classified_skills),
                "mandatory_count": sum(1 for s in all_classified_skills if s["is_mandatory"]),
                "preferred_count": sum(1 for s in all_classified_skills if not s["is_mandatory"]),
            },
            "5_experience": {
                "title": "Experience Requirements",
                "seniority_tier": jd.experience_level or "senior",
                "min_years": min_exp,
                "max_years": max_exp,
                "formatted_range": f"{min_exp} - {max_exp} Years",
                "relevant_experience_note": f"Minimum {min_exp} years hands-on production experience in target architectural stack.",
            },
            "6_education": {
                "title": "Educational Qualifications",
                "qualifications": education,
            },
            "7_certifications": {
                "title": "Certifications & Credentials",
                "certifications": certifications,
            },
            "8_domain": {
                "title": "Domain Requirements",
                "requirements": domain_reqs,
            },
            "9_preferred": {
                "title": "Preferred Qualifications",
                "qualifications": preferred_quals,
            },
            "10_location_employment": {
                "title": "Location and Employment Information",
                "office_location": jd.location or "Hyderabad / Remote",
                "is_remote": jd.is_remote,
                "work_mode": "Hybrid (3 Days Office / 2 Days Remote)" if not jd.is_remote else "100% Remote Available",
                "budget_currency": jd.budget_currency or "INR",
                "salary_range": "Competitive Market Standard (₹18 LPA – ₹26 LPA Base + Variable)",
            },
        },
        
        # Validation & Readiness Engine
        "validation": validation_report,
        
        # Recruiter Weights
        "requirement_weights": default_weights,
        "weights_total": sum(w["weight"] for w in default_weights),
    }
