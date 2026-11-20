"""
Conventional Version Management & Audit History Service for TALENTRA JDs.

NO AI / NO LLMS. Pure deterministic diffing and change tracking.
Tracks version iterations (v1, v2...), author timestamps, added/removed skills,
and modified requirements between versions.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime


# In-memory version registry (persists across runtime turns, seeded per JD)
_JD_VERSIONS: Dict[int, List[Dict[str, Any]]] = {}


def get_jd_versions(jd_id: int, base_jd: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Returns full version history for a requisition.
    If no history exists, initializes with v1 baseline from base_jd.
    """
    if jd_id not in _JD_VERSIONS:
        created_time = base_jd.get("created_at") if base_jd else datetime.now().isoformat()
        skills = []
        if base_jd and "sections" in base_jd and "4_technical_skills" in base_jd["sections"]:
            skills = [s["name"] for s in base_jd["sections"]["4_technical_skills"].get("skills_list", [])]

        _JD_VERSIONS[jd_id] = [
            {
                "version": "v1",
                "version_number": 1,
                "created_at": created_time or datetime.now().isoformat(),
                "author": "Krishna Chaitanya (Recruiter Admin)",
                "change_summary": "Initial requisition baseline creation and document ingestion.",
                "skills_snapshot": skills,
                "experience_range": base_jd.get("sections", {}).get("5_experience", {}).get("formatted_range", "5 - 8 Years") if base_jd else "5 - 8 Years",
                "status": base_jd.get("sections", {}).get("1_overview", {}).get("status", "open") if base_jd else "open",
                "added_skills": skills,
                "removed_skills": [],
                "modified_fields": ["Initial Ingestion"],
            }
        ]
    return _JD_VERSIONS[jd_id]


def create_jd_version(
    jd_id: int,
    author: str,
    change_summary: str,
    updated_data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Creates a new version (v2, v3...), computing deterministic diffs against the previous version.
    """
    history = get_jd_versions(jd_id)
    prev_version = history[-1]
    new_ver_num = len(history) + 1
    new_ver_tag = f"v{new_ver_num}"

    prev_skills = set(prev_version.get("skills_snapshot", []))
    new_skills = set(updated_data.get("skills", prev_version.get("skills_snapshot", [])))

    added_skills = list(new_skills - prev_skills)
    removed_skills = list(prev_skills - new_skills)

    modified_fields = updated_data.get("modified_fields", [])
    if added_skills:
        modified_fields.append(f"Added skills: {', '.join(added_skills)}")
    if removed_skills:
        modified_fields.append(f"Removed skills: {', '.join(removed_skills)}")

    new_version_entry = {
        "version": new_ver_tag,
        "version_number": new_ver_num,
        "created_at": datetime.now().isoformat(),
        "author": author or "Recruiter Admin",
        "change_summary": change_summary or "Updated requirements and specifications.",
        "skills_snapshot": list(new_skills),
        "experience_range": updated_data.get("experience_range", prev_version.get("experience_range", "5 - 8 Years")),
        "status": updated_data.get("status", prev_version.get("status", "open")),
        "added_skills": added_skills,
        "removed_skills": removed_skills,
        "modified_fields": modified_fields or ["General Specifications Update"],
    }

    history.append(new_version_entry)
    _JD_VERSIONS[jd_id] = history
    return new_version_entry


def diff_jd_versions(jd_id: int, ver_a_num: int, ver_b_num: int) -> Dict[str, Any]:
    """
    Computes side-by-side diff between two versions of a JD.
    """
    history = get_jd_versions(jd_id)
    ver_a = next((v for v in history if v["version_number"] == ver_a_num), None)
    ver_b = next((v for v in history if v["version_number"] == ver_b_num), None)

    if not ver_a or not ver_b:
        return {"error": "One or both specified versions do not exist."}

    skills_a = set(ver_a.get("skills_snapshot", []))
    skills_b = set(ver_b.get("skills_snapshot", []))

    return {
        "version_a": ver_a["version"],
        "version_b": ver_b["version"],
        "added_in_b": list(skills_b - skills_a),
        "removed_in_b": list(skills_a - skills_b),
        "retained_skills": list(skills_a.intersection(skills_b)),
        "author_a": ver_a["author"],
        "author_b": ver_b["author"],
        "date_a": ver_a["created_at"],
        "date_b": ver_b["created_at"],
    }
