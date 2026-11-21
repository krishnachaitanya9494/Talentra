# Host Application Integration Snippet (FastAPI)
from fastapi import FastAPI
from feature_modules.jd_resume_intelligence.backend.router import router as comparison_router

app = FastAPI()

app.include_router(
    comparison_router,
    prefix="/api/v1/jd-resume-intelligence",
    tags=["Intelligence Comparison"]
)
