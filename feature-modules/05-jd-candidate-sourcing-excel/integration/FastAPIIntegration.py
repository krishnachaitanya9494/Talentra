# Host Application Integration Snippet (FastAPI)
from fastapi import FastAPI
from feature_modules.jd_candidate_sourcing_excel.backend.router import router as sourcing_router

app = FastAPI()

app.include_router(
    sourcing_router,
    prefix="/api/v1/sourcing",
    tags=["Sourcing & Excel"]
)
