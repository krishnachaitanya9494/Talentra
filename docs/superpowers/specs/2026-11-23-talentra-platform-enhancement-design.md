# TALENTRA Recruitment Platform Enhancement — Design

Date: 2026-11-23

## Intent

Improve TALENTRA's existing recruitment workflows for recruiters using one connected platform. Preserve the current application, records, APIs, routes, and working behavior while adding only the missing lifecycle, review, pool, integration, analytics, and assistant capabilities requested in the attached brief.

## Current Repository Findings

- Backend: FastAPI routers and SQLAlchemy models under `backend/app`; SQLite is configured by `.env`; Alembic is present with a single initial schema revision. Application startup calls `Base.metadata.create_all`, which creates missing tables but does not perform the planned data migration workflow.
- Frontend: Next.js 14 hosts a catch-all page, but the active application and page routing use React Router under `frontend/src/App.jsx`. Tailwind and the current component system are already used throughout. This design keeps that routing arrangement.
- Requisitions: `JobRequirement` already stores status, client, location, salary, skills, dates and descriptions. JD uploads, parsing, structured requirements, manual corrections and version history already exist. Approval history and approver-linked state do not exist.
- Candidates: `Candidate`, `CandidateSubmission`, `CandidateAssignment`, candidate education/employer/certification records, resume links, duplicate detection, manual correction audit, sourcing and XLSX export already exist. A reusable many-to-many talent-pool model does not exist; lifecycle is spread between candidate and submission/assignment status.
- Comparison and sourcing: deterministic matching, comparison and internal sourcing endpoints already exist. Nemotron is not currently available for private content through the configured free hosted endpoint.
- Analytics: routes and SQL aggregation services already exist, as do recruitment-event models. Event writes are incomplete; some TAT values are synthesized from IDs, and the analytics UI contains fixed example values. Those values must be replaced by real records or an unavailable/empty state.
- Security: User and role models exist, but authentication is optional on multiple routers; `get_current_user_optional` can fall back to a built-in administrator. Authorization must be hardened without inventing recruiter identities or silently breaking existing clients.
- Test safety: some current TestClient tests write to the configured development database. New and regression test runs must use a temporary isolated SQLite database and must not import candidate records or call real-data inference.
- Protected scope: the Interview Timetable route, page, module files, dedicated API, and database models are explicitly excluded. This design does not depend on inspecting or editing them. Shared layout, navigation, global styles, and cross-cutting frontend components are also excluded unless a proposed change can be proven not to change the timetable experience; the default is to leave them untouched.

## External AI and Data Policy

The existing configuration uses `nvidia/nemotron-3.5-super-vl:free` through `https://openrouter.ai/api/v1`; the API key is configured and was not displayed or changed. The model page currently lists zero token pricing and explicitly prohibits uploading personal data or confidential information; OpenRouter lists free-model limits of 20 requests per minute and 50 per day without purchased credits. No credits or paid providers are allowed. Therefore:

- Keep the current centralized backend Nemotron service and the default-unknown data classification gate.
- Only explicitly synthetic or public content may be sent to the hosted free endpoint. Candidate data, resumes and confidential JDs remain blocked unless provider terms change and are re-verified.
- AI UI actions must show “unavailable for private recruitment data” or an equivalent clear message; do not replace AI output with canned questions, fake scores or another model.
- Deterministic parsing, SQL filtering, scoring, export and analytics continue to work independently.
- Embedding settings remain unused until a compliant, useful free workflow is justified; no vector database or paid embedding dependency is in scope.

## Goals

1. Make requisition status, search, counts and approval activity traceable to real rows and real users.
2. Make candidate directory/profile, extraction review and talent pools operate on existing candidate identities and records.
3. Preserve the existing explainable scoring configuration while distinguishing confirmed evidence, gaps, missing information and review-needed data.
4. Keep sourcing internal, connect selected candidates to existing requisition/submission workflows and export only real values.
5. Replace invented analytics and timing values with documented calculations based only on actual timestamps/events.
6. Make the AI boundary and current availability explicit without shipping private data to an unsuitable free endpoint.
7. Keep module business logic in existing services/routers and document portable contracts for future integration.

## Non-Goals

- No new application, frontend rewrite, production-site integration, external candidate scraping, provider switch, paid API, paid embedding, or vector database.
- No changes to the Interview Timetable or its dedicated code/data/API/models.
- No broad global visual redesign, dependency refresh, or unrelated cleanup.
- No fabricated user identities, candidate details, event history, metrics, or AI responses.

## Approaches Considered

### A. Extend the active app in place — selected

Reuse the current FastAPI, SQLAlchemy, SQLite, React Router pages, existing models, services, and API patterns. Add narrowly scoped frontend/backend changes and additive Alembic revisions. This matches “enhancement, not a new application”, keeps working routes, minimizes duplicate behavior, and avoids timetable code.

### B. Rebuild each workflow in `feature-modules/` before mounting it

This improves package isolation, but duplicates existing active pages and APIs, then requires adapters and synchronization before users receive an improvement. Defer unless a module cannot be kept portable through documented service/schema contracts.

### C. Migrate to native Next.js App Router

This would change route hosting and frontend structure across the application. It is not required for the requested workflows and increases regression exposure, including shared-shell effects near the protected timetable. Rejected for this enhancement.

## Design Decisions

### Requisitions and approval

- Use the current `JobRequirement` record and APIs as the source of truth. Preserve existing IDs and current `status` meanings/contracts.
- Add an explicit approval state and append-only approval history via an additive migration; approval events reference actual `User` rows and record comments/timestamps. A missing approver is an error, not a default/fictitious user.
- Keep the existing requisition lifecycle `status` distinct from approval state so old API consumers are not silently reinterpreted. Expose additive response fields and preserve the original fields.
- Use actual requisition status in the dashboard. Keep raw JD content and parser evidence, distinguish explicit values from deterministic extraction, recruiter edits, and missing fields. Do not send private JD text to Nemotron.
- Keep interview preparation inside the requisition module and separate from scheduling. It can display recruiter-entered questions/criteria and the explicit AI-unavailable state.

### Candidates and extraction

- Reuse `Candidate`, `CandidateSubmission`, existing normalized profile tables, resume links, audit log, and duplicate detection. Use one candidate record across pools, sourcing, comparison and analytics.
- Add candidate pools and a join table with uniqueness constraints; allow a candidate in multiple pools. Do not preseed fictional categories or membership.
- Keep existing candidate/submission/assignment lifecycles canonical. Map UI labels to existing values or add a documented additive status only where there is no equivalent.
- Preserve current deterministic document parsers. Persist field evidence/confidence with extraction results using existing storage where practical; manual edits remain authoritative, and reprocessing only fills fields that were not manually corrected.
- Missing values stay null/blank. Suspected duplicates remain review items and are never auto-merged.

### Comparison, sourcing and export

- Keep exact skill, experience, location, filtering, ranking inputs and export in deterministic code.
- Preserve configured scoring weights. Missing candidate evidence is “not mentioned/unknown”, never proof of mismatch. Do not auto-reject.
- Only claim contextual Nemotron comparison/ranking when content is approved synthetic/public and the actual request succeeds; real candidate and JD contexts remain blocked.
- Keep sourcing internal. Reuse candidate/requisition IDs and submission/assignment flows. Excel/CSV exports contain selected/filtered database rows, leave missing cells blank, and neutralize spreadsheet formulas in untrusted text.
- Allow recruiters to select export columns while preserving existing default columns and any current callers' expected formats.

### Analytics and assistant

- Reuse `RecruitmentEvent` and existing workflow timestamps; add events at real state transitions where records are currently not emitted. Do not backfill historical event times.
- Define each duration from these event pairs: time to source = requisition opened to first linked candidate; time to shortlist = candidate linked to first shortlisted state; time to interview = shortlisted state to the first existing scheduled-interview timestamp; time to fill = requisition opened to filled/closed-with-hire. Overall TAT uses opened to filled. If either timestamp is absent, omit the duration and expose its sample count; never substitute zero or a synthetic estimate. Funnel totals and conversions use actual submissions/events and filters.
- Recruiter performance uses real `User`/assignment records only. Unknown historical ownership remains unattributed.
- Replace analytics UI constants with values from existing analytics APIs and explicit unavailable states.
- Provide a recruitment assistant route/page only as a truthful feature surface: deterministic queries can call existing services; Nemotron actions on private records return a safe blocked state. No assistant tool may perform a destructive action or candidate rejection.

### UI and protected timetable

- Improve only pages owned by the requested modules, using existing components and local styles.
- Keep the shared shell, `Sidebar`, `Header`, global styles and timetable route/component unchanged. New grouped navigation and assistant links live inside non-timetable pages and use page-owned styles.
- Preserve route names. New module links and contextual actions are exposed on the dashboard and relevant feature pages; the shared sidebar remains exactly as it is.

### Database safety, migration and tests

- Before any schema migration, make a SQLite backup using a consistent database backup operation and verify its file; never overwrite the source DB or root `talentra.db`.
- Add tables/nullable columns/indexes only. No reset, drop, record rewrite, guessed data backfill, or automatic seeding. Keep old columns/contracts intact.
- A rollback must leave newly recorded data recoverable; document forward-fix/restore procedure from the pre-migration backup rather than dropping populated feature tables.
- Use temporary SQLite fixtures for tests. Existing TestClient tests that rely on configured production-like data must be isolated or skipped until safe fixtures are supplied; do not rerun them against the development DB.
- Verify each phase with focused tests, then the full safe suite and frontend build. Verify the timetable remains unchanged by protected-file checks and route/shell smoke checks, without editing its implementation.

## Phased Delivery

1. **Design and safety baseline:** document protected paths, map routes/contracts/models, establish temporary DB test configuration, record the no-secret AI policy.
2. **Requisition workflow:** actual status dashboard, filters and CRUD audit; additive approval models/routes/UI; reviewable structured JD fields; independent interview-preparation workspace with no fake AI fallback.
3. **Candidate workspace and extraction:** directory/profile improvements using existing entities; pools; evidence/confidence and correction-safe reprocessing; duplicate review.
4. **Comparison and sourcing:** evidence-state improvements, existing exact filters, selected candidates connected to requisitions, accurate exports and removal of remaining fake/sample behavior in these routes.
5. **Analytics:** event emission at real workflow transitions, metric definitions, truthful funnels/TAT/recruiter results, remove hardcoded UI metrics.
6. **Assistant and portability:** deterministic assistant actions; private Nemotron calls remain unavailable; document module contracts, auth dependencies, migrations, and integration steps.
7. **Cross-module QA:** isolated-database suite, production frontend build, security/authorization checks, contract review, and protected timetable integrity check.

Phases 2–6 are separate testable slices and can be planned independently. No phase begins until this design is approved and an implementation plan is reviewed.

## Acceptance Criteria

- Existing DB records and API fields remain preserved; all new schema work is additive and backed up before migration.
- No production-facing fake metrics or candidate samples remain in changed modules.
- Recruiters can manage requisitions and pools, review candidate extraction, compare/source selected internal records, and export verified values through actual existing identities.
- Approval and status changes have user-linked history and server-side permission checks; existing anonymous default-admin behavior is not used for new protected operations.
- Analytics exclude incomplete timestamps and contain no generated/synthetic time values.
- Private candidate/JD content cannot reach the configured free hosted Nemotron endpoint, and the UI explains why.
- Interview Timetable dedicated implementation, APIs, models, styles and interactions are untouched.
- Focused tests, isolated backend test suite and production build pass; any remaining unmet module requirement is reported plainly.

## Reference Patterns Consulted

The design borrows workflows rather than branding or layouts: requisition approval and candidate pools from Workday; structured job criteria and scorecards from Greenhouse; centralized candidate profile/activity information from Greenhouse and Lever; report filters and drill-through to source records from Ashby; evidence-linked match explanations and human decision support from Eightfold. Sources: [Workday requisition setup and approvals](https://doc.workday.com/admin-guide/en-us/human-capital-management/recruiting/job-requisitions-for-recruiting/san1394560120032.html), [Greenhouse scorecards](https://support.greenhouse.io/hc/en-us/articles/4414777492891-Scorecard-overview), [Greenhouse candidate profiles](https://support.greenhouse.io/hc/en-us/articles/11957068130971-Using-the-new-candidate-profile), [Ashby analytics and drill-through](https://www.ashbyhq.com/platform/recruiting/analytics), [Eightfold match-score explanations](https://docs.eightfold.ai/talent-intelligence-platform/match-score-explanation).

## Confirmed Product Decisions

1. **Recruiter accounts:** Add self-registration, but new accounts are inactive and cannot log in or access candidate data until activated by an operator. The public registration payload cannot choose roles; activated users begin as Viewer. Role promotion and initial administrator provisioning use an operator-controlled process; remove the default-password/default-admin behavior. Protected APIs require a valid user token.
2. **Navigation:** Keep the shared sidebar exactly as-is so the Interview Timetable context is unchanged. Add grouped links and assistant entry points only within the dashboard and other non-timetable feature pages.
