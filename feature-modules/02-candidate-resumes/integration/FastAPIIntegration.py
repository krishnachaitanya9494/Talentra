# Host Application Integration Snippet (FastAPI)
from fastapi import FastAPI
from feature_modules.candidate_resumes.backend.router import router as resumes_router

app = FastAPI()

app.include_router(
    resumes_router,
    prefix="/api/v1/candidate-resumes",
    tags=["Candidate Resumes"]
)
