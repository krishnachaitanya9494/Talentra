"""
System Health and Diagnostics Router for TALENTRA.

Provides standardized endpoints for infrastructure monitoring, container health checks,
and frontend connectivity verification.
"""

from fastapi import APIRouter, status
from backend.app.core.config import settings
from backend.app.database.session import verify_database_connection
from backend.app.schemas.health import HealthResponse, DatabaseStatus

router = APIRouter(tags=["System Diagnostics"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="System Health & Database Verification",
    description="Probes database connectivity and returns the current operational status of TALENTRA backend.",
)
async def check_health() -> HealthResponse:
    """
    Executes an active probe of the SQLite database connection,
    aggregates environment configuration, and returns full health status.
    """
    db_result = verify_database_connection()
    is_healthy = db_result.get("verified", False)

    return HealthResponse(
        status="operational" if is_healthy else "degraded",
        app_name=settings.PROJECT_NAME,
        environment=settings.ENVIRONMENT,
        version=settings.VERSION,
        database=DatabaseStatus(**db_result),
    )
