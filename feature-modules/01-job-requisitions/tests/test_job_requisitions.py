import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.insert(0, _MOD_ROOT)

"""
Independent Pytest Suite for Module 01: Job Requisitions.
Tests run completely isolated without dependencies on external database or TALENTRA shell.
"""

import pytest
from starlette.testclient import TestClient
from backend.requisitions_app import app
from backend.requisitions_service import JobRequisitionService

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_list_requisitions():
    res = client.get("/api/v1/job-requisitions")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 2

def test_structured_specs_generation():
    res = client.get("/api/v1/job-requisitions/1/structured")
    assert res.status_code == 200
    data = res.json()
    assert "sections" in data
    assert "overview" in data["sections"]
    assert "technical_skills" in data["sections"]
    assert len(data["sections"]["responsibilities"]) >= 1

def test_deterministic_validation_logic():
    service = JobRequisitionService()
    # Test valid JD
    valid_jd = {
        "title": "Cloud Architect",
        "description": "Lead design and deployment of secure enterprise multi-cloud platforms.",
        "skills": "AWS, GCP, Kubernetes, Terraform",
    }
    result = service.validate_requisition(valid_jd)
    assert result.is_publishable is True
    assert result.critical_count == 0
    assert result.completeness_percentage >= 90

    # Test invalid JD (missing title and skills)
    invalid_jd = {"title": "", "description": "Short", "skills": ""}
    bad_result = service.validate_requisition(invalid_jd)
    assert bad_result.is_publishable is False
    assert bad_result.critical_count >= 2
