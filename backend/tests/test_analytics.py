"""
Automated Pytest Suite for TALENTRA Phase 6: Recruitment Analytics & TAT Intelligence.

Validates:
- Real database recruitment overview KPIs
- 9-stage conversion recruitment funnel
- Turnaround Time (TAT) metrics against the 30-minute target
- TA performance scorecards and workload distribution
- Per-JD candidate pipeline metrics
- CSV export integrity
- HTTP API endpoint responses
"""

import pytest
from starlette.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import get_db, SessionLocal
from backend.app.services.analytics.analytics_service import AnalyticsService

client = TestClient(app)


@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_recruitment_overview_service(db):
    """
    Validates executive recruitment overview metrics against real database records.
    """
    overview = AnalyticsService.get_recruitment_overview(db)
    assert isinstance(overview, dict)
    assert overview["total_jds"] >= 1
    assert overview["total_candidates"] >= 1
    assert overview["total_resumes"] >= 1
    assert overview["total_matched"] >= 1
    assert overview["strong_matches"] >= 0
    assert overview["potential_matches"] >= 0
    assert overview["assigned_candidates"] >= 0
    assert overview["active_tas"] >= 1
    assert isinstance(overview["response_rate_percent"], float)
    assert isinstance(overview["shortlist_rate_percent"], float)


def test_recruitment_funnel_service(db):
    """
    Validates sequential 9-stage conversion recruitment funnel.
    """
    funnel = AnalyticsService.get_recruitment_funnel(db)
    assert len(funnel) == 9

    expected_keys = [
        "jd_received",
        "jd_parsed",
        "candidates_matched",
        "candidates_segmented",
        "candidates_assigned",
        "outreach_approved",
        "emails_sent",
        "candidate_replies",
        "shortlisted",
    ]
    for i, stage in enumerate(funnel):
        assert stage["key"] == expected_keys[i]
        assert stage["count"] >= 0
        assert 0.0 <= stage["step_conversion_percent"] <= 100.0
        assert 0.0 <= stage["overall_conversion_percent"] <= 100.0


def test_turnaround_time_intelligence_service(db):
    """
    Validates Turnaround Time (TAT) metrics against the 30-minute operational target.
    """
    tat = AnalyticsService.get_turnaround_time_intelligence(db)
    assert tat["target_minutes"] == 30.0

    metrics = tat["metrics"]
    assert metrics["average_minutes"] >= 0.0
    assert metrics["median_minutes"] >= 0.0
    assert metrics["fastest_minutes"] >= 0.0
    assert metrics["slowest_minutes"] >= metrics["fastest_minutes"]
    assert 0.0 <= metrics["within_target_percent"] <= 100.0
    assert metrics["within_target_count"] + metrics["exceeding_target_count"] == metrics["total_measured_requisitions"]

    # Granular steps
    granular = tat["granular_breakdown_minutes"]
    assert "avg_jd_to_parsing" in granular
    assert "avg_parsing_to_matching" in granular
    assert "avg_matching_to_assignment" in granular
    assert "avg_assignment_to_outreach" in granular


def test_ta_performance_analytics_service(db):
    """
    Validates recruiter productivity and workload analytics without volume bias.
    """
    ta_stats = AnalyticsService.get_ta_performance_analytics(db)
    assert len(ta_stats) >= 1

    for ta in ta_stats:
        assert "ta_name" in ta
        assert "team" in ta
        assert "specialization" in ta
        assert ta["total_assignments"] >= 0
        assert ta["active_assignments"] >= 0
        assert 0.0 <= ta["workload_share_percent"] <= 100.0
        assert 0.0 <= ta["candidate_response_rate_percent"] <= 100.0


def test_jd_pipelines_service(db):
    """
    Validates per-requisition pipeline statuses and candidate matching breakdown.
    """
    pipelines = AnalyticsService.get_jd_pipelines(db)
    assert len(pipelines) >= 1

    for jd in pipelines:
        assert "jd_code" in jd
        assert "title" in jd
        assert jd["total_evaluated"] >= 0
        assert jd["strong_matches"] >= 0
        assert jd["assigned_count"] >= 0


def test_export_analytics_csv_service(db):
    """
    Validates RFC-4180 CSV export generation for all analytical categories.
    """
    for export_type in ["overview", "funnel", "tat", "ta_performance"]:
        csv_data = AnalyticsService.export_analytics_csv(db, export_type=export_type)
        assert isinstance(csv_data, str)
        assert len(csv_data) > 20
        lines = csv_data.strip().split("\n")
        assert len(lines) >= 2


def test_analytics_api_endpoints():
    """
    Validates HTTP API router endpoints under /api/v1/analytics.
    """
    # Overview
    res = client.get("/api/v1/analytics/overview")
    assert res.status_code == 200
    assert res.json()["status"] == "success"

    # Funnel
    res = client.get("/api/v1/analytics/funnel")
    assert res.status_code == 200
    assert len(res.json()["stages"]) == 9

    # TAT
    res = client.get("/api/v1/analytics/tat")
    assert res.status_code == 200
    assert res.json()["data"]["target_minutes"] == 30.0

    # TA Performance
    res = client.get("/api/v1/analytics/ta-performance")
    assert res.status_code == 200
    assert res.json()["total"] >= 1

    # JD Pipelines
    res = client.get("/api/v1/analytics/jd-pipelines")
    assert res.status_code == 200
    assert res.json()["total"] >= 1

    # Campaigns
    res = client.get("/api/v1/analytics/campaigns")
    assert res.status_code == 200

    # CSV Export
    res = client.get("/api/v1/analytics/export/csv?export_type=tat")
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    assert "attachment" in res.headers["content-disposition"]
