# TALENTRA — ROOT MODULE INTEGRATION GUIDE
## Step-by-Step Production Integration Blueprint for Team Leads & Engineers

### 1. Architectural Philosophy
Each feature module inside `feature-modules/` is designed as an autonomous, self-contained business domain unit:
1. **01-job-requisitions**: Requisition management, parsing, 10-section canonical breakdown, and quality validation.
2. **02-candidate-resumes**: Candidate repository, bulk resume ingestion, document validation, and duplicate detection.
3. **03-jd-resume-intelligence**: 3-mode intelligence comparison workspace (1-on-1, Multi-Matrix, On-the-Fly Text Paste).
4. **04-resume-data-extraction**: Deterministic resume parsing with field provenance and Excel/CSV export.
5. **05-jd-candidate-sourcing-excel**: Internal candidate sourcing, Boolean filtering, and multi-sheet Excel generation.

---

### 2. Standalone Verification Before Migration
You can run any module completely independently before copying it:

#### Example: Running Module 01 Standalone
```bash
# Terminal 1: Run isolated backend service on port 8011
python -m uvicorn feature-modules.01-job-requisitions.backend.standalone_app:app --port 8011

# Terminal 2: Run isolated pytest suite
pytest feature-modules/01-job-requisitions/tests/
```

#### Example: Running Module 04 Standalone
```bash
# Run isolated resume data extraction test suite
pytest feature-modules/04-resume-data-extraction/tests/
```

---

### 3. Migration Checklist for Each Feature
1. **Choose Feature**: Identify which of the 5 features your team lead requested (e.g. `04-resume-data-extraction`).
2. **Copy Folder**: Copy `feature-modules/<selected-feature>/` into your corporate repository.
3. **Frontend Integration**: Import the `<FeatureModule />` component inside your corporate React routing.
4. **Backend Integration**: Mount the FastAPI `router` under your API version prefix (e.g. `/api/v1/...`).
5. **Database Mapping**: Supply your database session to the module's repository interface.
6. **Verify Isolation**: Run the module's dedicated pytest suite to confirm 100% test passing.
