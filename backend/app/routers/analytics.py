"""
Recruitment Analytics & Turnaround Time (TAT) Intelligence API Router for TALENTRA Phase 6.

Provides secure HTTP endpoints for:
- Executive recruitment overview metrics
- 9-stage conversion recruitment funnel
- 30-minute operational TAT monitoring & statistics
- TA productivity and workload distribution
- JD-level requisition pipeline status
- Campaign automation performance
- Audit-compliant CSV exports
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.services.analytics.analytics_service import AnalyticsService
from backend.app.core.security import get_current_user_optional

router = APIRouter(prefix="/api/v1/analytics", tags=["Phase 6: Recruitment Analytics & TAT Intelligence"])


@router.get("/overview")
def get_recruitment_overview(db: Session = Depends(get_db)):
    """
    Returns executive recruitment overview KPIs across all talent entities.
    """
    data = AnalyticsService.get_recruitment_overview(db)
    return {"status": "success", "data": data}


@router.get("/funnel")
def get_recruitment_funnel(
    jd_id: Optional[int] = Query(None, description="Optional JD filter"),
    db: Session = Depends(get_db),
):
    """
    Returns sequential 9-stage conversion recruitment funnel.
    """
    funnel = AnalyticsService.get_recruitment_funnel(db, jd_id=jd_id)
    return {"status": "success", "stages": funnel, "total_stages": len(funnel)}


@router.get("/tat")
def get_turnaround_time_intelligence(
    jd_id: Optional[int] = Query(None, description="Optional JD filter"),
    db: Session = Depends(get_db),
):
    """
    Returns operational TAT metrics evaluated against the 30-minute target.
    """
    tat_data = AnalyticsService.get_turnaround_time_intelligence(db, jd_id=jd_id)
    return {"status": "success", "data": tat_data}


@router.get("/ta-performance")
def get_ta_performance_analytics(db: Session = Depends(get_db)):
    """
    Returns TA recruiter workload and candidate progression analytics.
    """
    performance = AnalyticsService.get_ta_performance_analytics(db)
    return {"status": "success", "items": performance, "total": len(performance)}


@router.get("/jd-pipelines")
def get_jd_pipelines(db: Session = Depends(get_db)):
    """
    Returns per-requisition pipeline statuses and candidate matching counts.
    """
    pipelines = AnalyticsService.get_jd_pipelines(db)
    return {"status": "success", "items": pipelines, "total": len(pipelines)}


@router.get("/campaigns")
def get_campaign_analytics(db: Session = Depends(get_db)):
    """
    Returns outreach campaign automation summary metrics and response rates.
    """
    campaign_data = AnalyticsService.get_campaign_analytics(db)
    return {"status": "success", "data": campaign_data}


@router.get("/export/csv")
def export_analytics_csv(
    export_type: str = Query("overview", description="Type: overview, funnel, tat, ta_performance"),
    db: Session = Depends(get_db),
):
    """
    Streams CSV export file for audits and management reporting.
    """
    csv_content = AnalyticsService.export_analytics_csv(db, export_type=export_type)
    filename = f"talentra_analytics_{export_type}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
