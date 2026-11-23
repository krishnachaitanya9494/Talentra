# TALENTRA Platform Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a secure, database-backed recruitment workflow across TALENTRA modules, using Nemotron only where permitted and preserving the Interview Timetable implementation exactly.

**Architecture:** Extend the existing FastAPI, SQLAlchemy, Alembic, SQLite and React application in place. Reuse existing candidate, requisition, parsing, matching, sourcing and event services; add only missing lifecycle, approval, pool, auth and analytics behavior. Keep restricted AI requests blocked and use operator-approved activation for self-registered accounts.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, Pydantic, SQLite, React, Next.js wrapper, existing npm and Python dependencies.

**Spec:** `docs/superpowers/specs/2026-11-23-talentra-platform-enhancement-design.md`

## Global Constraints

- Never inspect or modify the dedicated Interview Timetable UI, page, components, styles, APIs, models or functionality; preserve its route and shared sidebar exactly.
- Never reset, drop, recreate, overwrite, or seed the existing database; use additive migrations and preserve all existing records and contracts.
- Before a migration, back up the configured SQLite database using SQLite backup API and verify the backup without printing candidate data.
- Do not expose or replace credentials; keep `.env` ignored and never print secrets.
- Never send private candidate or JD data to the free Nemotron endpoint; do not use paid models, endpoints, fallbacks, embeddings or external candidate sources.
- New public registrations cannot select roles; accounts remain inactive until operator activation and start as Viewer.
- Missing candidate/JD facts remain null/blank/unknown; do not fabricate, auto-reject, or silently overwrite recruiter corrections.
- All tests use disposable SQLite and document/export roots; no test may target `data/talentra_dev.db` or `talentra.db`.
- Keep each feature portable through documented APIs, data dependencies, migrations and environment variable names.

## Review Focus

- Public registration role injection or inactive-user access: auth tests assert role cannot be supplied and inactive accounts cannot obtain tokens or access protected endpoints.
- Existing-record loss or exposure during migration: backup/migration tests verify prior IDs and values remain intact and backup integrity is valid.
- Missing or corrected candidate facts becoming invented/overwritten: parser, reprocessing and export tests assert null/blank preservation and manual correction precedence.
- Unknown data being scored as a mismatch or candidate rejection: comparison tests assert unknown remains unknown and no auto-rejection occurs.
- Missing analytics events producing plausible fake metrics: analytics tests assert incomplete intervals are omitted with sample counts and no formula-derived values appear.

---

### Task 1: Isolate every backend test from developer data

**Files:** `backend/tests/conftest.py`, `backend/app/core/config.py`, document storage/export path configuration as needed, focused test modules, optional `backend/scripts/run_isolated_tests.ps1`.

**Interfaces:** Test setup establishes a temporary `DATABASE_URL` and temporary storage/export roots before application modules are imported. Production defaults remain unchanged.

- [ ] Add a test asserting application DB and storage resolve under pytest temporary paths.
- [ ] Run that test and verify it fails against current hardcoded paths.
- [ ] Make test configuration injectable before app/model imports; route document and export roots through existing settings or test monkeypatches.
- [ ] Run a sentinel test that writes a row and file, then verify both are under temp roots and the configured development DB file timestamp/size is unchanged.
- [ ] Run existing backend tests through the isolated runner; stop and fix any path that touches developer data.

### Task 2: Secure account registration, activation and API authorization

**Files:** `backend/app/core/config.py`, `backend/app/core/security.py`, new `backend/app/routers/auth.py`, auth schemas, `backend/app/main.py`, affected protected routers except timetable router, `frontend/src/services/api.js`, `frontend/src/App.jsx`, new `frontend/src/pages/AuthPage.jsx`, auth tests.

**Interfaces:** `POST /api/auth/register` accepts only registration fields and creates an inactive Viewer; `POST /api/auth/login` returns a token only for an active account; operator CLI provisions/activates/promotes users without a public role field. Protected application API dependencies require a valid token. Timetable files/router are not edited.

- [ ] Test registration with a malicious `role=admin`, inactive login rejection, unknown credentials, and protected endpoint rejection without a token.
- [ ] Test active-user login, token expiry/invalid signature, and Viewer authorization.
- [ ] Implement explicit signup/login routes, operator-controlled account command using secure password input, configured token secret requirement, and remove default admin/password creation.
- [ ] Add frontend auth state and registration/login forms; ensure unauthorized API responses route to auth while preserving existing page route map and timetable view.
- [ ] Run isolated auth tests and frontend unit/build checks available in the project.

### Task 3: Additive workflow schema and verified migration backup

**Files:** `backend/app/models/` requisition approval/history and talent-pool models, `backend/alembic/versions/`, model exports, focused migration tests, migration/backup documentation.

**Interfaces:** Add nullable requisition `approval_status` with an appropriate existing-state default, append-only approval history with actor/comment/time, and candidate pools with a join table referencing existing candidate IDs. Existing columns and IDs remain unchanged.

- [ ] Test a legacy schema fixture with representative requisition/candidate rows and assert the migration preserves IDs/data and adds only the new workflow structures.
- [ ] Implement additive Alembic revision; do not edit prior migrations or use destructive downgrade operations.
- [ ] Add a SQLite backup command using the online backup API; verify backup opens and `PRAGMA integrity_check` passes before migration.
- [ ] Test migration against a copied disposable legacy DB and compare table/row inventory before and after.
- [ ] Document operator migration, backup location, verification and forward-repair/restore procedure.

### Task 4: Dynamic requisition lifecycle and approval

**Files:** existing requisition schemas/services/routers, `frontend/src/pages/JobRequisitionsPage.jsx` and page-owned components/styles, focused API/UI tests.

**Interfaces:** Existing CRUD contract remains compatible. Add filtered/sorted/paginated database-backed requisition list and approval transitions Draft → Pending Approval → Approved → Active → On Hold → Closed, with actor, timestamp, comments and role checks.

- [ ] Test legacy requisitions, valid/invalid transitions, unauthorized approval, search/filter/sort/pagination, and explicit/inferred/manual/missing requirement provenance.
- [ ] Implement lifecycle service and endpoints using existing requisition records and approval history.
- [ ] Replace static counts/list placeholders in the requisition page with returned DB records and approval controls.
- [ ] Add interview preparation entry within requisition workspace only; do not link or change timetable functionality.
- [ ] Run isolated requisition API tests and frontend checks.

### Task 5: Candidate directory, profile, pools and review-safe extraction

**Files:** candidate schemas/services/routers, existing resume parsing/reprocessing paths, new candidate directory/profile/pool page components, existing resume/review pages, tests.

**Interfaces:** Candidate profile/list/pool operations use existing candidate IDs and records; extraction keeps evidence/confidence fields and recruiter corrections take precedence on reprocessing.

- [ ] Test directory filters/pagination, pool membership, duplicate review, evidence/null values, correction-preserving reprocessing, and blank missing-value export cells.
- [ ] Implement dynamic directory, profile sections, candidate pool CRUD/membership and lifecycle visibility over existing records.
- [ ] Complete extraction review controls using existing deterministic parsers and contextual parsing results; require review for uncertain/conflicting values.
- [ ] Ensure export includes actual selected records, blank unsupported fields, and formula-injection-safe cells.
- [ ] Run isolated candidate API/parser/export tests and frontend checks.

### Task 6: Evidence-based comparison, sourcing and interview preparation

**Files:** comparison/matching/sourcing services and routes, sourcing/comparison pages, page-owned interview preparation UI, API/schema tests.

**Interfaces:** Exact filters and retrieval remain deterministic; contextual ranking/explanations consume only approved data classifications; comparison statuses distinguish confirmed match, confirmed mismatch, not mentioned and requires review.

- [ ] Test missing-value statuses, exact-skill filters, multiple-resume comparison, evidence references, scoring criteria, recruiter review, and no auto-rejection.
- [ ] Implement multi-candidate comparisons and retain existing score weights/criteria; make every explanation trace to resume/JD evidence.
- [ ] Wire internal-only candidate search, shortlist and candidate-to-requisition workflow to actual records; do not add external scraping.
- [ ] Add workbook export with selectable columns, one candidate per row, filters/frozen header/formatting, blank unsupported fields and safe cell values.
- [ ] Connect requisition-specific interview preparation without changing timetable APIs or page behavior.
- [ ] Run isolated comparison/sourcing/export tests and frontend checks.

### Task 7: Real analytics events and truthful dashboards

**Files:** event-writing points in requisition/candidate/assignment/interview workflow services, analytics service/routes, `frontend/src/pages/AnalyticsPage.jsx`, analytics tests.

**Interfaces:** Metrics aggregate stored records/events only. Time-to-source is requisition opened to first linked candidate; time-to-shortlist is linked candidate to first shortlisted transition; time-to-interview is shortlisted to first scheduled interview timestamp; time-to-fill is opened to filled/closed-with-hire. Missing event intervals are omitted and reported with sample counts.

- [ ] Test each metric with complete, missing and out-of-order timestamps plus empty datasets; assert no synthetic formulas or hardcoded demo values.
- [ ] Record recruitment events at actual lifecycle transitions without fabricated backfills.
- [ ] Replace analytics formulas and static frontend/demo values with aggregate API results, explicit date filters and sample sizes.
- [ ] Scope recruiter metrics by authorized user/assignment where applicable; add CSV filters to exports.
- [ ] Run isolated event/analytics tests and frontend checks.

### Task 8: Assistant entry points, Nemotron policy and portability contracts

**Files:** existing centralized AI service, assistant routes/services and non-timetable page-owned components, `docs/` module integration contracts, targeted AI/security tests.

**Interfaces:** Assistant dispatches deterministic actions to existing app services; private candidate/JD inputs return a clear blocked response before outbound calls; Nemotron is used only for explicitly public/synthetic content permitted by the current verified free endpoint.

- [ ] Test public/synthetic allowed calls, private data blocked before request construction, quota/errors surfaced without fallback, and logs exclude secrets/candidate content.
- [ ] Add assistant/help entry points only within dashboard and non-timetable feature pages; do not alter Sidebar, Header, global styles or timetable files.
- [ ] Document each module's API, schema/migration dependencies, environment variable names, auth expectations and integration steps.
- [ ] Run targeted AI tests using mocked HTTP transport; do not send private data to live services.

### Task 9: Cross-module security, regression and release verification

**Files:** isolated backend tests, frontend verification, `docs/` implementation status and operator guide; no timetable implementation files.

**Interfaces:** A local verification report records exact commands/results without secrets or candidate PII.

- [ ] Run the complete backend suite using isolated DB/storage roots and verify developer DB inventory is unchanged.
- [ ] Run frontend production build and available lint/type checks.
- [ ] Exercise registration/activation, requisition approval, resume review/export, comparison, sourcing, dashboard and authorization with synthetic fixtures only.
- [ ] Verify environment/config contains no newly exposed credentials, `.env` remains ignored, and migrations are additive.
- [ ] Verify changeset contains no modifications to the dedicated timetable implementation; confirm the timetable route still resolves from the app route map without editing/inspecting its implementation.
- [ ] Document completed modules, DB/API changes, Nemotron actual verification limits, known gaps and portability instructions.
