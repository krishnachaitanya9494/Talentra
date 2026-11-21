# Host Application Integration Snippet (FastAPI)
# Copy the module folder to your project and include the router:

from fastapi import FastAPI
from feature_modules.job_requisitions.backend.router import router as requisitions_router

app = FastAPI()

app.include_router(
    requisitions_router,
    prefix="/api/v1/job-requisitions",
    tags=["Job Requisitions"]
)
