import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.insert(0, _MOD_ROOT)

"""
Independently runnable FastAPI microservice for Module 03: JD & Resume Intelligence Comparison.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.comparison_router import router

app = FastAPI(
    title="Talentra - JD & Resume Intelligence Standalone Service",
    version="1.0.0",
    description="Independent service performing multi-mode JD and resume intelligence comparison."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1/jd-resume-intelligence", tags=["Intelligence Comparison"])

@app.get("/health")
def health_check():
    return {"status": "ok", "module": "03-jd-resume-intelligence"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("standalone_app:app", host="0.0.0.0", port=8013, reload=True)
