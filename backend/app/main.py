"""
Main FastAPI Application Entry Point for TALENTRA.

Initializes the FastAPI application, manages startup lifespan hooks for safe
database initialization and migrations, registers CORS middleware,
and mounts foundational infrastructure routers.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.database.init_db import init_database
from backend.app.routers.health import router as health_router
from backend.app.routers.documents import router as documents_router
from backend.app.routers.repository import router as repository_router
from backend.app.routers.intelligence import router as intelligence_router
from backend.app.routers.matching import router as matching_router
from backend.app.routers.assignments import router as assignments_router
from backend.app.routers.outreach import router as outreach_router
from backend.app.routers.analytics import router as analytics_router
from backend.app.routers.sourcing import router as sourcing_router
from backend.app.routers.scraper import router as scraper_router
from backend.app.routers.interviews import router as interviews_router
from backend.app.routers.clients import router as clients_router
from backend.app.routers.comparison import router as comparison_router
from backend.app.schemas.health import RootResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager that safely verifies database connectivity
    and bootstraps required schema migrations upon server startup.
    """
    init_database()
    yield


# Initialize the central FastAPI application instance with descriptive metadata and lifespan hooks
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Development Environment API for TALENTRA Talent Intelligence Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Cross-Origin Resource Sharing (CORS) Configuration:
# Permits the React development server (Vite default: http://localhost:5173) to issue
# asynchronous HTTP requests (via Axios or fetch) to this API without browser origin restrictions.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the system health diagnostics router
app.include_router(health_router)
# Mount the documents, JDs, resumes, and ingestion router
app.include_router(documents_router)
# Mount the document storage and bulk ingestion repository router
app.include_router(repository_router)
# Mount the Phase 2 document parsing & candidate intelligence router
app.include_router(intelligence_router)
# Mount the Phase 3 candidate matching & segmentation router
app.include_router(matching_router)
# Mount the Phase 4 manual TA distribution & candidate ownership router
app.include_router(assignments_router)
# Mount the Phase 5 email outreach & campaign automation router
app.include_router(outreach_router)
# Mount the Phase 6 recruitment analytics & TAT intelligence router
app.include_router(analytics_router)
# Mount the internal JD-to-candidate sourcing and Excel automation router
app.include_router(sourcing_router)
# Mount the candidate profile web scraper router (Apify reference)
app.include_router(scraper_router)
# Mount the interview scheduling & evaluation stages router
app.include_router(interviews_router)
# Mount the clients & accounts workspace router
app.include_router(clients_router)
# Mount the JD & Resume Intelligence Comparison router
app.include_router(comparison_router)


@app.get(
    "/",
    response_model=RootResponse,
    status_code=status.HTTP_200_OK,
    summary="Platform Landing Endpoint",
    description="Returns foundational platform metadata and confirms server availability.",
)
async def root() -> RootResponse:
    """
    Root landing endpoint returning a friendly confirmation payload
    and pointers to the interactive OpenAPI documentation.
    """
    return RootResponse(
        message="Welcome to TALENTRA - Talent Intelligence Platform API",
        platform="TALENTRA",
        status="operational",
        environment=settings.ENVIRONMENT,
        documentation_url="/docs",
    )
