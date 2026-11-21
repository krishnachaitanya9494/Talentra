import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.insert(0, _MOD_ROOT)

"""
Independently runnable FastAPI microservice for Module 02: Candidate Resumes.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.resumes_router import router

app = FastAPI(
    title="Talentra - Candidate Resumes Standalone Service",
    version="1.0.0",
    description="Independent service managing candidate resume repository, bulk ingestion, and deduplication."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1/candidate-resumes", tags=["Candidate Resumes"])

@app.get("/health")
def health_check():
    return {"status": "ok", "module": "02-candidate-resumes"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("standalone_app:app", host="0.0.0.0", port=8012, reload=True)
