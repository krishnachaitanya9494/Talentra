# Nemotron Recruitment Upgrade Status

Updated 2026-11-23 after authorization to implement the full plan.

## Provider and privacy boundary

The configured chat model remains `nvidia/nemotron-3.5-super-vl:free`, accessed through the existing OpenRouter-compatible service. The free route is not approved here for confidential job descriptions or candidate/resume data, so the shared service now defaults every call to `unknown` classification and blocks it before cache lookup or network access. Calls must explicitly classify content as `synthetic` or `public`; no current recruitment caller does so. No paid model or provider fallback is allowed. No live inference call was made.

## Implemented in this pass

- Central AI service restricts the model to the approved Nemotron free ID and the HTTPS OpenRouter API URL. It handles quota errors without provider failover, avoids logging provider response bodies, and records returned usage metadata.
- Resume and JD parsing retain deterministic extraction and return a safe blocked/unavailable AI status rather than silently substituting AI output.
- Screening questions are loaded from saved records, default to pending recruiter review, and persist approval state. AI generation errors surface as HTTP 503; canned fallback questions are no longer returned.
- Matching treats absent candidate skills and absent education as unknown instead of confirmed mismatch or inferred qualification.
- Comparison requires selected existing records, no longer fills missing selections with arbitrary first candidates or sample identities, and identifies deterministic scoring accurately. The synthetic prefilled sample candidate/JD was removed.
- Dashboard counts show unavailable values when their API calls fail instead of substituting fixed counts.
- Tailwind scans the feature-module frontend folders only. This avoids the build failing while traversing permission-protected pytest cache directories.
- Existing API/database CRUD, repository parsing, internal sourcing, Excel export, analytics and manual correction routes remain in their existing modules; this pass did not add a second AI client, embeddings, a vector store, or database migration.

## Current contracts and integration notes

- Shared AI interface: `backend/app/services/ai/ai_service.py`; call `generate_text` or `generate_structured` and pass `data_classification="synthetic"` or `"public"` only after confirming that classification. Never pass candidate PII or confidential JDs to the configured free hosted endpoint.
- Existing settings remain in `.env` (not modified): `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `OPENROUTER_LLM_MODEL`, `OPENROUTER_CHAT_MODEL`, `OPENROUTER_EMBEDDING_MODEL`. Embedding configuration is not called by the application.
- Screening routes: `GET /api/v1/jds/{jd_id}/screening/questions`, `POST /api/v1/jds/{jd_id}/screening/save`, and `POST /api/v1/jds/{jd_id}/screening/generate`. Saved data currently lives in `data/jds/screening/{jd_id}_questions.json`; this is file-backed, not a database migration.
- Existing comparison and sourcing use internal database records and deterministic logic. Excel creation remains deterministic in `backend/app/services/sourcing/excel_export_service.py`.
- Current database configuration remains the TALENTRA SQLite DB; no CompanyAI-Agent connection or database change was made.

## Work still blocked or incomplete

- Live Nemotron JD analysis, resume interpretation, contextual comparison/ranking, and natural-language sourcing cannot be enabled against real recruiter/candidate content while the free endpoint data terms remain unsuitable. The code rejects these inputs centrally. No suitable free compliant private-data endpoint has been verified.
- A synthetic-only request to the configured endpoint returned `OK`; provider usage metadata reported cost `0`. An initial test prompt returned empty content, so it was retried once with a simpler synthetic prompt. No candidate or JD data was sent.
- This pass did not rewrite the full resume UI to add bulk upload/reprocessing field provenance, nor add dedicated permission/retention controls across all modules. Existing code has its own parsing, audit, and export paths, but those requirements need separate focused reviews rather than an unverified claim of completion.
- Screening-question storage is still JSON file-backed. A database migration was not justified for this implementation and no migration ran.

## Verification

- Backend: `backend\\.venv\\Scripts\\python.exe -m pytest backend\\tests -q -p no:cacheprovider --basetemp backend\\.pytest-run-tmp` — 91 passed.
- Frontend: `npm.cmd run build` — passed with the existing Google Fonts network download skipped; system fonts remain the configured fallback.
- No API secret was printed. `.env` was not changed.
- Caution: the existing backend suite includes TestClient integration tests that use the configured application database and some create records. The database was not reset. Review test-created records in the TALENTRA SQLite database before using those records operationally.
