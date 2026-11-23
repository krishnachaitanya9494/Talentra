# TALENTRA Nemotron Recruitment Upgrade Plan

> User approved implementation of all stages on 2026-11-23, subject to the free-provider data policy and project safety constraints.

**Goal:** Extend TALENTRA's existing centralized Nemotron integration across recruitment workflows while preserving candidate evidence, using deterministic logic for deterministic work, and keeping modules portable.

**Architecture:** Keep the backend `AIService` as the only LLM gateway and expose feature-specific Pydantic schemas and prompts from existing domain services. Continue using SQL/Python for CRUD, filtering, ranking inputs, aggregation, and exports; use Nemotron only for contextual interpretation and generation. Do not send real personal or confidential candidate data to a free trial endpoint.

**Tech Stack:** FastAPI, Pydantic, SQLAlchemy, SQLite (current `DATABASE_URL`), Next.js 14 frontend, OpenRouter-compatible chat and embedding APIs.

**Spec:** User-provided “TALENTRA — NVIDIA NEMOTRON AI INTEGRATION & DYNAMIC RECRUITMENT UPGRADE” request (Stage 1 audit requested before code changes).

## Global Constraints

- Keep NVIDIA Nemotron as the sole AI model family; no other model/provider fallback.
- Use only verified $0 access; do not purchase credits or invoke paid endpoints.
- Keep `.env` and credentials private; `.env` is already excluded by `.gitignore`.
- Never send candidate PII/confidential content to a provider unless its current terms explicitly permit it.
- Preserve recruiter corrections and original JD/resume source files.
- Do not connect to or modify CompanyAI-Agent or its database; current backend `DATABASE_URL` is the TALENTRA SQLite file.
- Keep each feature independently transferable and document its API/schema/database dependencies.

## Review Focus

- Free endpoint trial/data terms conflict with real candidate PII: run AI only against synthetic fixtures until a compliant free access path is verified.
- Free model limits can be exhausted: surface quota/rate-limit errors without another provider or fabricated fallback.
- Reprocessing can overwrite reviewed data: retain field-level recruiter corrections and provenance.
- Missing resume fields can be fabricated: require null/empty values and evidence for every extracted field.
- Ranking can turn missing data into rejection: distinguish match, mismatch, not mentioned, and review states; do not auto-reject.

## Plan

### Stage 1: Configuration audit — complete, read-only

- Confirmed `.env` uses `OPENROUTER_LLM_MODEL=nvidia/nemotron-3.5-super-vl:free`, `OPENROUTER_CHAT_MODEL` with the same ID, and `OPENROUTER_EMBEDDING_MODEL=nvidia/nemotron-3-embed-1b:free`.
- Confirmed the effective base URL is `https://openrouter.ai/api/v1`; `AIService` uses Bearer auth and `/chat/completions`.
- Confirmed the OpenRouter key is configured without printing it; confirmed `.env` is ignored by Git.
- Existing AI callers are JD parsing (`backend/app/services/extraction/jd_parser.py`), low-confidence resume parsing (`backend/app/services/extraction/resume_parser.py`), and screening-question generation (`backend/app/routers/documents.py`).
- No embedding API caller was found. Comparison, sourcing, and analytics have no `AIService` call sites. Dashboard uses live API data but has fallback values in `frontend/src/views/DashboardPage.jsx`.
- Existing centralized service already has `urllib`, 45-second timeout, two retries, in-memory prompt cache, Pydantic validation, and a `:free` suffix check. It lacks usage accounting and safe error-body logging; it declares non-Nemotron free fallback IDs (currently unused), and the model check permits any provider with a `:free` suffix.
- Provider status: OpenRouter currently lists both configured Nemotron IDs at $0. Free variants are limited to 20 requests/minute and 50/day on the no-purchase tier. OpenRouter's Nemotron Super VL page warns against confidential or personal data; NVIDIA API Catalog free access is for prototyping/testing and not production. Therefore, real candidate-data workflows are blocked pending a compliant free endpoint/data policy. No live inference call was made.

### Stage 2: Central Nemotron boundary

**Files:** `backend/app/services/ai/ai_service.py`, `backend/app/core/config.py`, `backend/tests/test_ai_service.py`.

- Restrict allowed model IDs to explicitly approved Nemotron free IDs; remove unused non-Nemotron fallback identifiers.
- Keep provider/base URL and credential resolution centralized; reject missing/paid/unapproved configurations before network calls.
- Add safe provider error mapping/logging, `Retry-After` handling for 429, and usage metadata capture when returned; never log prompts, candidate data, or raw provider error bodies.
- Keep Pydantic validation and cache; add cache invalidation/size behavior tests and explicit no-paid-fallback tests.
- Test with mocked HTTP and synthetic prompts only. Live inference verification must wait for a provider policy that permits the intended data.

### Stage 3: Job Requisitions

**Files:** existing JD parser, document/JD routers and schemas, and the `frontend/src/components/documents/JobWorkspace.jsx` workflow.

- Reuse existing database CRUD and document parsing; add the missing explicit/present-versus-inferred JD fields and provenance in schemas.
- Generate editable recruiter-approved screening questions through the shared service; remove silent hardcoded question fallback when Nemotron fails, and show a clear retryable error.
- Cover create/edit/delete/search/upload/paste and question approval with route/service tests.
- Use synthetic/public JDs for AI tests until confidential data use is permitted.

### Stage 4: Candidate Resumes and Resume Extraction

**Files:** `backend/app/services/extraction/resume_parser.py`, document/repository routes and schemas, and resume frontend views/components.

- Retain deterministic parsers for basic extraction; constrain Nemotron to contextual interpretation.
- Add null/empty schemas, per-field evidence/confidence, duplicate/reprocess behavior, and recruiter-correction preservation.
- Add PDF/DOCX/TXT and bulk-upload tests; ensure missing cells export blank.
- Block sending actual resumes to free trial endpoints; use synthetic fixtures only.

### Stage 5: JD–Resume Comparison

**Files:** comparison router/service/schema and `frontend/src/views/JDResumeComparisonPage.jsx`.

- Keep exact requirement checks deterministic; ask Nemotron only for contextual interpretation and evidence-grounded explanations.
- Represent match/mismatch/not-mentioned/review separately; show evidence, completeness, and a deterministic documented score; never auto-reject.
- Test single/multi-resume comparisons and missing/conflicting evidence using synthetic fixtures.

### Stage 6: JD-Based Sourcing and Excel Automation

**Files:** sourcing routes/services and `backend/app/services/sourcing/excel_export_service.py`.

- Query/filter/page internal records deterministically; use Nemotron only for contextual relevance and evidence-based explanation.
- Keep export deterministic and populate only real stored fields; test xlsx columns, blank values, filtering, and source references.
- Do not add external scraping or another vector database/provider. Do not run model inference on real candidates while terms prohibit it.

### Stage 7: Talent Sourcing

**Files:** internal candidate search/sourcing services, relevant routes, and sourcing frontend.

- Add JD selection, exact filters, shortlisting, and comparison over existing internal records.
- Add contextual natural-language interpretation only behind the same centralized service and data-policy gate.
- Keep profile scraping out of this workflow; test only authorized internal fixtures.

### Stage 8: Dashboards and Analytics

**Files:** repository/assignment/analytics routes and `frontend/src/views/DashboardPage.jsx`.

- Replace remaining display fallbacks with explicit empty/loading/error states and database-derived values.
- Keep aggregates deterministic; optional summaries can use Nemotron only on non-sensitive aggregate data.
- Test zero-data, large counts, and API failures; verify no model-generated metric values.

### Stage 9: Portability and integration readiness

**Files:** module API documentation and migration/integration docs identified during implementation.

- Document each feature's API contract, DB entities/migrations, environment variable names, and shared AI-service interface.
- Keep auth integration isolated behind existing dependencies and document assumptions for another host website.
- Run backend tests and frontend production build; report unimplemented or policy-blocked workflows plainly.

## Stop Conditions

- Do not begin real candidate/JD inference on free hosted endpoints unless current terms explicitly allow that data and use.
- If no free compliant Nemotron endpoint is verified, stop those integrations and report the blocker; user has authorized deterministic and synthetic-only implementation to continue.
- Do not claim an actual Nemotron integration works until an explicitly authorized, non-sensitive live request succeeds.

## Implementation ledger

- Stage 1 audit completed before code changes. Provider terms were rechecked; no live call was made.
- Stage 2: centralized model and endpoint allowlist, safe errors, usage metadata, and default-unknown content policy implemented. Recruitment callers cannot send private inputs to the free route.
- Stage 3: screening question persistence/review state wired to the active requisition UI; fallback questions removed from responses. JD CRUD/parsing continues to use existing routes and deterministic parsing when hosted AI is blocked.
- Stage 4: existing deterministic resume extraction and field evidence retained; AI blocking status made explicit. Full bulk/reprocess/correction-provenance UI requirement remains incomplete.
- Stage 5: deterministic comparison remains in place; hidden sample defaults and fabricated target/candidate selection were removed. Contextual Nemotron interpretation remains blocked by provider terms.
- Stages 6–7: existing internal sourcing, deterministic filters, and genuine XLSX export retained. Contextual Nemotron ranking remains blocked by provider terms.
- Stage 8: removed dashboard count fallbacks that displayed fabricated values. Database aggregations remain deterministic.
- Stage 9: added `docs/NEMOTRON_IMPLEMENTATION_STATUS.md` with shared-service usage, API routes, storage, and portability limitations.
- Verification: all 90 backend tests pass; Next.js production build passes. Full details and known limitations are in the implementation status document.
