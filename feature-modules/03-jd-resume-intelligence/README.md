# MODULE 03 — JD & Resume Intelligence Comparison

> **Status**: Production-Ready, Completely Decoupled, Portable Feature Package.  
> **Source**: TALENTRA Incubation Repository (`feature-modules/03-jd-resume-intelligence/`).

---

## 1. Module Overview
This package provides a complete 3-mode intelligence comparison workspace:
1. **1-on-1 Deep Compare**: Side-by-side evidence analysis, exact text match citations, missing mandatory gap detection.
2. **Multi-Candidate Comparison Matrix**: Multi-select candidate pills, green AI Shortlist recommendation banner, 3-column scorecard cards.
3. **Paste / Upload Text Comparison**: Side-by-side text inputs, sample text loader, 4-dimension metric progress bars, grounded breakdown.

---

## 2. Directory Layout
```
03-jd-resume-intelligence/
├── frontend/               # React components (JDResumeIntelligenceModule, JDResumeComparisonPage, MatchExplanationModal, api.js)
├── backend/                # Standalone FastAPI router, comparison scoring, and standalone_app.py
├── contracts/              # Pydantic schemas (schemas.py)
├── tests/                  # Independent pytest test suite (test_jd_resume_intelligence.py)
├── docs/                   # API specification & schema documentation
├── integration/            # Host application integration snippets (FastAPI, React)
├── config/                 # Environment configuration (.env.example)
└── README.md               # Integration & developer guide
```

---

## 3. How to Copy and Integrate

### Frontend Integration (React)
1. Copy `frontend/` into your React project:
   ```bash
   cp -r feature-modules/03-jd-resume-intelligence/frontend src/features/comparison
   ```
2. Mount in your layout:
   ```jsx
   import { JDResumeIntelligenceModule } from './features/comparison';

   <JDResumeIntelligenceModule apiBaseUrl="/api/v1/jd-resume-intelligence" />
   ```

### Backend Integration (FastAPI)
1. Copy `backend/` and `contracts/`:
   ```bash
   cp -r feature-modules/03-jd-resume-intelligence/backend app/modules/comparison
   ```
2. Mount router:
   ```python
   from app.modules.comparison.router import router as comp_router
   app.include_router(comp_router, prefix="/api/v1/jd-resume-intelligence", tags=["Intelligence Comparison"])
   ```

---

## 4. Independent Testing
```bash
pytest feature-modules/03-jd-resume-intelligence/tests/
```
