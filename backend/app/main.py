"""
Main FastAPI Application Entry Point for TALENTRA.

Initializes the FastAPI application, registers Cross-Origin Resource Sharing (CORS) middleware,
mounts infrastructure routers, and provides the primary root entry endpoint.
"""

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.routers.health import router as health_router
from backend.app.schemas.health import RootResponse

# Initialize the central FastAPI application instance with descriptive metadata
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Development Environment API for TALENTRA Talent Intelligence Platform",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Cross-Origin Resource Sharing (CORS) Configuration:
# Permits the React development server (Vite default: http://localhost:5173) to issue
# asynchronous HTTP requests (via Axios or fetch) to this API without browser origin restrictions.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Mount the system health diagnostics router
app.include_router(health_router)


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
