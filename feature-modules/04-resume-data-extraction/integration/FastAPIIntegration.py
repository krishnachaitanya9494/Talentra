# Host Application Integration Snippet (FastAPI)
from fastapi import FastAPI
from feature_modules.resume_data_extraction.backend.router import router as extraction_router

app = FastAPI()

app.include_router(
    extraction_router,
    prefix="/api/v1/scraper",
    tags=["Resume Extraction"]
)
