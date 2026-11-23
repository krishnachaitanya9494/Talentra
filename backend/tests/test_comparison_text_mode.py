from fastapi import HTTPException

from backend.app.routers.comparison import analyze_comparison


def test_text_mode_compares_pasted_jd_and_resume_without_database_records():
    result = analyze_comparison(
        {
            "mode": "text",
            "jd_text": "Role: Python Developer\nRequired skills: Python, SQL\nMinimum 5 years experience. Remote.",
            "resume_text": "Python Developer\n5 years of experience building Python services and SQL databases. Remote.",
        },
        db=None,
    )

    comparison = result["comparison"]
    assert result["mode"] == "text"
    assert comparison["skills_alignment"]["matched_core_skills"]
    assert "Python" in comparison["skills_alignment"]["matched_core_skills"]
    assert comparison["total_experience_years"] == 5
    assert result["jd"]["title"] == "Python Developer"


def test_text_mode_requires_both_pasted_documents():
    try:
        analyze_comparison({"mode": "text", "jd_text": "", "resume_text": ""}, db=None)
    except HTTPException as exc:
        assert exc.status_code == 422
        assert "both" in exc.detail.lower()
    else:
        raise AssertionError("Text comparison should reject empty JD and resume text")


def test_text_mode_marks_unmentioned_skill_as_unknown_not_a_gap():
    result = analyze_comparison(
        {
            "mode": "text",
            "jd_text": "Role: Python Developer\nRequired skills: Python, SQL",
            "resume_text": "Python Developer\nExperienced building Python services.",
        },
        db=None,
    )

    comparison = result["comparison"]
    sql_requirement = next(item for item in comparison["grounded_specs"] if item["title"] == "SQL")
    assert sql_requirement["status"] == "not_mentioned"
    assert comparison["has_critical_gaps"] is False
    assert "Sql" not in comparison["skills_alignment"]["missing_skills_gaps"]
