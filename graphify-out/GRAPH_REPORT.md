# Graph Report - Talentra  (2026-11-23)

## Corpus Check
- 361 files · ~301,739 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 29 file(s) not represented in the graph (top: .doc 14, .example 7, (none) 4)

## Summary
- 2799 nodes · 6953 edges · 136 communities (95 shown, 41 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 539 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d89140e4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Any
- comparison.py
- Session
- schemas/intelligence.py
- EnterpriseRecruitmentAgent
- MatchingPage.jsx
- EmbeddingProvider
- test_health.py
- document_storage.py
- TALENTRA Design Standard: Unslop UI Architecture
- typing
- routers/scraper.py
- Session
- quick reference
- quick reference
- BooleanNode
- quick reference
- Component canvas
- services/api.js
- Create DESIGN.md
- Session
- Baseline UI
- Device frames
- Improve UI
- export_parsed_resumes_excel
- Create canvas
- interface
- env.py
- AndNode
- UI Skills Root
- init_database
- get_comparison_targets
- validator.py
- TermNode
- requirements-workspace/RequirementsWorkspaceTab.jsx
- deduplicate_all.py
- JobDescriptionDocument
- interview_router.py
- InterviewService
- AIService
- test_intelligence.py
- InterviewService
- frontend/JobWorkspace.jsx
- security.py
- TALENTRA — FEATURE PORTABILITY & INTEGRATION MATRIX
- routers/repository.py
- frontend/ProfileScraperPage.jsx
- JobDescriptionParser
- lucide-react
- .export_analytics_csv
- ResumeParser
- 06-interview-scheduling/frontend/index.js
- main.py
- io
- Candidate
- 3. DEEP-DIVE: HOW TO PORT EACH FEATURE TO YOUR MAIN WEBSITE
- backend/models/interview_models.py
- documents/JobWorkspace.jsx
- pathlib
- requisitions_router.py
- interview/interview_service.py
- services/interview_service.py
- main.py
- sys
- structured_jd_service.py
- sourcing_router.py
- test_interview_scheduling.py
- resumes_router.py
- package.json
- react
- routers/documents.py
- ProfileScraperService
- extract_text_from_pdf
- TALENTRA — Developer Commands Reference
- TALENTRA — Development Environment Setup Guide
- skillTaxonomy.js
- test_scraper.py
- 3. Backend Layered Architecture
- TALENTRA Recruitment Platform Enhancement — Design
- document_parser.py
- comparison_router.py
- boolean_search.py
- FastAPI
- .run_sourcing_search
- Review Focus
- frontend/JDResumeComparisonPage.jsx
- Counter.jsx
- Flow
- frontend/SourcingPage.jsx
- create_client
- create_jd_version
- Review Focus
- LatticeLoader.jsx
- TALENTRA — Talent Intelligence Platform
- .generate_sourcing_workbook
- Step-by-Step Production Integration Blueprint for Team Leads & Engineers
- MODULE 01 — Job Requisitions
- MODULE 02 — Candidate Resumes
- MODULE 03 — JD & Resume Intelligence Comparison
- MODULE 04 — Resume Data Extraction
- MODULE 05 — JD-Based Candidate Sourcing & Excel Engine
- ShinyText.jsx
- skill_normalizer.py
- Nemotron Recruitment Upgrade Status
- Enterprise Recruitment Calendar, Multi-Interviewer Timetable & Conflict Engine
- next.config.mjs
- SpotlightCard.jsx
- DynamicQuestionItem
- Ponytail, lazy senior dev mode
- test_db_session
- ai_service.py
- AnimatedList.jsx
- set_sqlite_pragma

## God Nodes (most connected - your core abstractions)
1. `react` - 117 edges
2. `Candidate` - 114 edges
3. `Base` - 86 edges
4. `lucide-react` - 82 edges
5. `InterviewService` - 63 edges
6. `JobRequirement` - 63 edges
7. `InterviewService` - 55 edges
8. `JobDescriptionDocument` - 49 edges
9. `AnalyticsService` - 37 edges
10. `ResumeParser` - 37 edges

## Surprising Connections (you probably didn't know these)
- `Candidates and extraction` --references--> `CandidateSubmission`  [INFERRED]
  docs/superpowers/specs/2026-11-23-talentra-platform-enhancement-design.md → backend/app/models/submission.py
- `Analytics and assistant` --references--> `RecruitmentEvent`  [INFERRED]
  docs/superpowers/specs/2026-11-23-talentra-platform-enhancement-design.md → backend/app/models/analytics.py
- `Current Repository Findings` --references--> `CandidateAssignment`  [INFERRED]
  docs/superpowers/specs/2026-11-23-talentra-platform-enhancement-design.md → backend/app/models/assignment.py
- `Stage 1: Configuration audit — complete, read-only` --references--> `AIService`  [INFERRED]
  docs/superpowers/plans/2026-11-23-nemotron-recruitment-upgrade.md → backend/app/services/ai/ai_service.py
- `Current Repository Findings` --references--> `Candidate`  [INFERRED]
  docs/superpowers/specs/2026-11-23-talentra-platform-enhancement-design.md → backend/app/models/candidate.py

## Import Cycles
- None detected.

## Communities (136 total, 41 thin omitted)

### Community 0 - "Any"
Cohesion: 0.08
Nodes (9): CandidateAvailabilityRequest, CandidateAvailabilitySlot, CandidateBookingRequest, InterviewAvailability, InterviewerWorkingHours, InterviewPanelMember, InterviewRescheduleRequest, InterviewTemplate (+1 more)

### Community 1 - "comparison.py"
Cohesion: 0.19
Nodes (7): analyze_comparison(), build_dynamic_jd_specs(), build_text_jd_specs(), evaluate_candidate_against_specs(), test_text_mode_compares_pasted_jd_and_resume_without_database_records(), test_text_mode_marks_unmentioned_skill_as_unknown_not_a_gap(), test_text_mode_requires_both_pasted_documents()

### Community 2 - "Session"
Cohesion: 0.12
Nodes (9): boolean_search_candidates(), delete_export(), download_export_file(), generate_excel_export(), get_candidate_details(), get_sourcing_search(), list_exports(), parse_job_description() (+1 more)

### Community 3 - "schemas/intelligence.py"
Cohesion: 0.10
Nodes (22): list_candidate_duplicates(), AuditLogItem, CandidateActivityEvent, CandidateIntelligenceDetail, CertificationItem, CrmHeaderInspectResponse, CrmImportExecuteRequest, CrmImportResponse (+14 more)

### Community 4 - "EnterpriseRecruitmentAgent"
Cohesion: 0.06
Nodes (13): act_on_approval(), agent_chat_turn(), ApprovalActionRequest, ApprovalItemResponse, ChatRequest, ChatResponse, get_tool_registry(), list_approvals() (+5 more)

### Community 5 - "MatchingPage.jsx"
Cohesion: 0.16
Nodes (18): AssignCandidatesModal(), PageHeader(), MatchExplanationModal(), CreateCampaignModal(), assignCandidatesToTA(), getExportMatchesCsvUrl(), getMatchedCandidates(), getMatchExplanation() (+10 more)

### Community 6 - "EmbeddingProvider"
Cohesion: 0.12
Nodes (6): compute_content_sha256(), cosine_similarity(), deterministic_2048_projection(), EmbeddingProvider, normalize_text_for_embedding(), test_embedding_provider_and_cosine_similarity()

### Community 7 - "test_health.py"
Cohesion: 0.15
Nodes (4): verify_database_connection(), test_database_connection_probe(), test_health_endpoint(), test_root_endpoint()

### Community 9 - "TALENTRA Design Standard: Unslop UI Architecture"
Cohesion: 0.40
Nodes (4): Mandatory 9-Pass Redline Sequence (In Order), Strictly Protected Module, TALENTRA Design Direction (5-Point Anchor), TALENTRA Design Standard: Unslop UI Architecture

### Community 11 - "typing"
Cohesion: 0.04
Nodes (33): upgrade(), AgentTrace, ApprovalRequest, JobEmbedding, ResumeEmbedding, RecruitmentEvent, RecruitmentMetricSnapshot, Base (+25 more)

### Community 12 - "routers/scraper.py"
Cohesion: 0.18
Nodes (7): export_parsed_resumes_csv(), export_parsed_resumes_json(), import_parsed_candidates(), import_to_talent_pool(), manual_correct_candidate_field(), quick_match_candidates(), trigger_scrape_run()

### Community 13 - "Session"
Cohesion: 0.06
Nodes (18): AssignmentHistory, AssignmentNote, add_assignment_note(), assign_candidates(), get_manager_overview(), get_ta_directory(), list_assignments(), unassign_candidate() (+10 more)

### Community 14 - "quick reference"
Cohesion: 0.11
Nodes (17): 1. never patterns (critical), 2. choose the mechanism (critical), 3. measurement (high), 4. scroll (high), 5. paint (medium-high), 6. layers (medium), 7. blur and filters (medium), 8. view transitions (low) (+9 more)

### Community 15 - "quick reference"
Cohesion: 0.12
Nodes (16): 1. accessible names (critical), 2. keyboard access (critical), 3. focus and dialogs (critical), 4. semantics (high), 5. forms and errors (high), 6. announcements (medium-high), 7. contrast and states (medium), 8. media and motion (low-medium) (+8 more)

### Community 17 - "BooleanNode"
Cohesion: 0.28
Nodes (4): BooleanNode, BooleanParser, OrNode, Token

### Community 18 - "quick reference"
Cohesion: 0.14
Nodes (13): 1. correctness and duplication (critical), 2. title and description (high), 3. canonical and indexing (high), 4. social cards (high), 5. icons and manifest (medium), 6. structured data (medium), 7. locale and alternates (low-medium), 8. tool boundaries (critical) (+5 more)

### Community 19 - "Component canvas"
Cohesion: 0.15
Nodes (12): Before building, Build order, Camera, Checks, Component canvas, Ground rules, Interactions, Layout (+4 more)

### Community 20 - "services/api.js"
Cohesion: 0.06
Nodes (33): AssignmentHistoryModal(), EmptyState(), AnimatedMetricValue(), MetricCard(), ManualEmailModal(), actionAgentApproval(), addAssignmentNote(), analyzeComparison() (+25 more)

### Community 21 - "Create DESIGN.md"
Cohesion: 0.17
Nodes (11): 1. Choose the mode, 2. Trace the evidence, 3. Decide what belongs, 4. Write the document, 5. Validate, 6. Report, Boundaries, Create DESIGN.md (+3 more)

### Community 22 - "Session"
Cohesion: 0.23
Nodes (5): download_scraper_export(), export_dataset_json(), get_scrape_run_details(), list_scrape_runs(), list_scraper_exports()

### Community 23 - "Baseline UI"
Cohesion: 0.18
Nodes (10): Animation, Baseline UI, Components, Design, How to use, Interaction, Layout, Performance (+2 more)

### Community 24 - "Device frames"
Cohesion: 0.18
Nodes (10): Construct the frame, Coordinate example, Device frames, Device geometry, Fully open Duo: one screen, not two phones, Insets, corners, and controls, Laptop and display proportions, Measured hardware (+2 more)

### Community 25 - "Improve UI"
Cohesion: 0.18
Nodes (9): Design plan template, 1. Select the surface, 2. Reconstruct the local system, 3. Prove findings, 4. Vet findings, 5. Report, 6. Specify selected changes, Boundaries (+1 more)

### Community 26 - "export_parsed_resumes_excel"
Cohesion: 0.20
Nodes (3): export_parsed_resumes_excel(), test_crm_excel_import(), test_excel_export_generation()

### Community 27 - "Create canvas"
Cohesion: 0.22
Nodes (8): Create canvas, Keep content in source, Keep gestures separate from preview input, Keep the workspace quiet, Preserve live content, Save layout, not content, Start with the project, Test and report honestly

### Community 28 - "interface"
Cohesion: 0.25
Nodes (7): interface, default_prompt, display_name, short_description, policy, allow_implicit_invocation, products

### Community 31 - "UI Skills Root"
Cohesion: 0.40
Nodes (4): CLI, Protocol, Selection Rules, UI Skills Root

### Community 52 - "deduplicate_all.py"
Cohesion: 0.08
Nodes (27): CandidateAuditLog, CandidateCertification, CandidateEducation, CandidateEmployer, CandidateResumeLink, ParsedJobRequirement, ResumeDocument, CandidateExport (+19 more)

### Community 53 - "JobDescriptionDocument"
Cohesion: 0.05
Nodes (35): AssignmentNotification, AssignmentStatus, CandidateAssignment, JobDescriptionDocument, CampaignStatus, CandidateCommunication, EmailProviderAccount, EmailSuppressionList (+27 more)

### Community 54 - "interview_router.py"
Cohesion: 0.14
Nodes (18): InterviewSchedule, AvailabilityCheckResponse, cancel_interview(), check_availability(), download_ics(), get_all_interviewers(), get_calendar(), get_interview() (+10 more)

### Community 55 - "InterviewService"
Cohesion: 0.07
Nodes (3): InterviewHistory, InterviewService, SchedulingConflictException

### Community 56 - "AIService"
Cohesion: 0.05
Nodes (24): AIDataPolicyError, AIService, FreeModelPolicyError, SampleExtractionSchema, test_cache_deduplication(), test_extract_json_markdown_blocks(), test_strict_free_model_policy_blocks_paid_models(), test_strict_free_model_policy_permits_free_models() (+16 more)

### Community 57 - "test_intelligence.py"
Cohesion: 0.06
Nodes (28): export_assignments_csv(), batch_parse_repository(), import_candidates_crm(), inspect_crm_file_headers(), link_resume_to_candidate(), manually_correct_candidate(), record_change(), import_candidates_from_file() (+20 more)

### Community 58 - "InterviewService"
Cohesion: 0.06
Nodes (26): AvailabilityCheckRequest, AvailabilityConflict, AvailabilityRequestCreate, AvailabilitySubmissionRequest, BookingLinkCreateRequest, CandidateBookingConfirmRequest, CandidateSlotSubmission, InterviewCancelRequest (+18 more)

### Community 59 - "frontend/JobWorkspace.jsx"
Cohesion: 0.09
Nodes (19): EditJDModal(), JDVersionHistoryModal(), JobRequisitionsModule(), AVATAR_COLORS, JobWorkspace(), REQUIREMENT_CATEGORIES, RequirementsWorkspaceTab(), ScreeningQAManager() (+11 more)

### Community 60 - "security.py"
Cohesion: 0.12
Nodes (7): create_access_token(), decode_access_token(), get_current_user(), get_current_user_optional(), hash_password(), require_role(), verify_password()

### Community 61 - "TALENTRA — FEATURE PORTABILITY & INTEGRATION MATRIX"
Cohesion: 0.05
Nodes (18): 1. Executive Summary, 2. Portability Matrix by Module, 3. What Host Interfaces Must Be Supplied, 4. Frontend Mounting Contract (React), 5. Backend Mounting Contract (FastAPI), 6. What Cannot Be Copied Independently (And Why), 7. Future Feature Standard Operating Procedure (Feature 06+), A. Candidate Repository Adapter (+10 more)

### Community 62 - "routers/repository.py"
Cohesion: 0.13
Nodes (24): bulk_upload_jds(), bulk_upload_resumes(), delete_jd_document(), delete_resume_document(), get_jd_document(), get_repository_stats(), get_resume_document(), list_uploaded_jds() (+16 more)

### Community 63 - "frontend/ProfileScraperPage.jsx"
Cohesion: 0.12
Nodes (9): ProfileScraperPage(), ResumeExtractionModule(), dependencies, axios@^1.7.9, lucide-react@^1.76.0, react@^18.3.1, react-dom@^18.3.1, react-router-dom@^6.28.0 (+1 more)

### Community 64 - "JobDescriptionParser"
Cohesion: 0.13
Nodes (4): get_parsed_jd(), JobDescriptionParser, test_job_description_parser(), test_sap_security_jd_extraction_ignores_go_live_and_finds_domain_skills()

### Community 65 - "lucide-react"
Cohesion: 0.10
Nodes (39): Badge(), Modal(), SearchInput(), CandidateDirectory(), CandidateIntelligenceModal(), ConfirmDeleteModal(), CrmImportModal(), TARGET_FIELDS (+31 more)

### Community 66 - ".export_analytics_csv"
Cohesion: 0.07
Nodes (13): export_analytics_csv(), get_campaign_analytics(), get_jd_pipelines(), get_recruitment_funnel(), get_recruitment_overview(), get_ta_performance_analytics(), get_turnaround_time_intelligence(), test_export_analytics_csv_service() (+5 more)

### Community 67 - "ResumeParser"
Cohesion: 0.08
Nodes (4): ResumeParser, test_resume_parser_reports_when_hosted_ai_is_blocked(), test_resume_parser_complete(), test_resume_parser_missing_fields_never_invents()

### Community 69 - "06-interview-scheduling/frontend/index.js"
Cohesion: 0.12
Nodes (25): FALLBACK_CANDIDATES, FALLBACK_INTERVIEWERS, FALLBACK_JDS, interviewApi, AddInterviewModal(), MODE_OPTIONS, ROUND_OPTIONS, CalendarGrid() (+17 more)

### Community 73 - "main.py"
Cohesion: 0.14
Nodes (5): root(), check_health(), DatabaseStatus, HealthResponse, RootResponse

### Community 74 - "io"
Cohesion: 0.10
Nodes (10): test_upload_invalid_file_extension(), test_upload_jd_file(), test_upload_resume_file(), test_crm_csv_import_with_mapping(), test_bulk_upload_resumes_200_documents(), test_empty_file_rejected(), test_file_size_limit_rejection(), test_unsupported_file_extension() (+2 more)

### Community 75 - "Candidate"
Cohesion: 0.05
Nodes (28): Candidate, CandidateMatch, MatchEvidence, MatchingConfiguration, MatchingRun, export_matches_csv(), get_match_explanation(), get_matched_candidates() (+20 more)

### Community 76 - "3. DEEP-DIVE: HOW TO PORT EACH FEATURE TO YOUR MAIN WEBSITE"
Cohesion: 0.05
Nodes (36): 10 Standardized Canonical Sections Extracted:, 11 Standard Enterprise Categories:, 1. ARCHITECTURAL PHILOSOPHY & ISOLATION PRINCIPLES, 2. FEATURE INTEGRATION INVENTORY, 3. DEEP-DIVE: HOW TO PORT EACH FEATURE TO YOUR MAIN WEBSITE, 4. HOW TO PRESENT THIS ARCHITECTURE TO YOUR TEAM LEAD (TL), 5. REPOSITORY CODE MAPPING AT A GLANCE, Deterministic Rules Checked: (+28 more)

### Community 77 - "backend/models/interview_models.py"
Cohesion: 0.07
Nodes (10): CandidateAvailabilityRequest, CandidateAvailabilitySlot, CandidateBookingRequest, InterviewAvailability, InterviewerWorkingHours, InterviewPanelMember, InterviewRescheduleRequest, InterviewSchedule (+2 more)

### Community 78 - "documents/JobWorkspace.jsx"
Cohesion: 0.16
Nodes (26): EditJDModal(), JDVersionHistoryModal(), AVATAR_COLORS, JobWorkspace(), ScreeningQAManager(), StructuredJDSpecs(), EditJDModal(), JDVersionHistoryModal() (+18 more)

### Community 80 - "requisitions_router.py"
Cohesion: 0.11
Nodes (12): get_requisition(), get_structured_specs(), list_requisitions(), update_requisition(), validate_requisition(), JobRequisitionService, RequisitionCreateSchema, RequisitionResponseSchema (+4 more)

### Community 81 - "interview/interview_service.py"
Cohesion: 0.16
Nodes (25): AvailabilityCheckRequest, AvailabilityCheckResponse, AvailabilityConflict, AvailabilityRequestCreate, AvailabilitySubmissionRequest, BookingLinkCreateRequest, CandidateBookingConfirmRequest, CandidateSlotSubmission (+17 more)

### Community 82 - "services/interview_service.py"
Cohesion: 0.16
Nodes (25): AvailabilityCheckRequest, AvailabilityCheckResponse, AvailabilityConflict, AvailabilityRequestCreate, AvailabilitySubmissionRequest, BookingLinkCreateRequest, CandidateBookingConfirmRequest, CandidateSlotSubmission (+17 more)

### Community 83 - "main.py"
Cohesion: 0.06
Nodes (12): get_db(), db(), test_analytics_api_endpoints(), client(), test_data_summary_endpoint(), test_list_candidates_endpoint(), test_list_jds_endpoint(), test_search_jds_endpoint() (+4 more)

### Community 84 - "sys"
Cohesion: 0.12
Nodes (11): health_check(), export_batch(), get_results(), get_status(), upload_batch(), ResumeExtractionService, BatchExtractionJobResponse, ExtractedCandidateRecordSchema (+3 more)

### Community 86 - "structured_jd_service.py"
Cohesion: 0.17
Nodes (6): validate_job_description(), categorize_skills_list(), detect_duplicate_skills(), normalize_skill(), process_jd_skills(), SkillClassificationService

### Community 87 - "sourcing_router.py"
Cohesion: 0.16
Nodes (9): export_excel(), get_export_history(), search_candidates(), SourcingExcelService, ExcelExportRequest, ExportHistoryItem, SourcedCandidateItem, SourcingSearchFilter (+1 more)

### Community 88 - "test_interview_scheduling.py"
Cohesion: 0.09
Nodes (8): clean_db(), test_calendar_invitation_preview_and_ics(), test_cancel_interview_flow(), test_candidate_double_booking_conflict(), test_check_availability_endpoint(), test_interviewer_double_booking_conflict(), test_reschedule_interview_flow(), test_schedule_interview_success()

### Community 89 - "resumes_router.py"
Cohesion: 0.15
Nodes (7): list_candidates(), upload_bulk_resumes(), upload_single_resume(), CandidateResumeService, BulkUploadResultSchema, CandidateItemSchema, UploadResumeResultSchema

### Community 90 - "package.json"
Cohesion: 0.10
Nodes (21): next@^14.2.35, devDependencies, autoprefixer@^10.4.20, postcss@^8.4.49, tailwindcss@^3.4.17, @types/react@^18.3.12, @types/react-dom@^18.3.1, name (+13 more)

### Community 91 - "react"
Cohesion: 0.04
Nodes (22): App(), metadata, CatchAllPage(), TalentraApp, CommandPalette(), ErrorBoundary, PageTransition(), AppLayout() (+14 more)

### Community 93 - "routers/documents.py"
Cohesion: 0.12
Nodes (35): bulk_associate_candidates(), create_new_jd_version(), generate_screening_questions(), get_candidate(), get_data_summary(), get_jd_candidates(), get_jd_interview_kit(), get_jd_templates() (+27 more)

### Community 96 - "extract_text_from_pdf"
Cohesion: 0.10
Nodes (7): batch_parse_resumes(), upload_candidate_document(), upload_job_description_file(), extract_text_from_docx(), extract_text_from_pdf(), extract_text_from_txt(), test_txt_extractor_encodings()

### Community 97 - "TALENTRA — Developer Commands Reference"
Cohesion: 0.11
Nodes (18): 1. Quick Launchers (Recommended), 2. Backend Commands, 3. Frontend Commands, 4. Database & Health Verification Commands, A. Installing Frontend Dependencies, A. Virtual Environment Activation, B. Installing Backend Dependencies, B. Starting the React Vite Development Server (+10 more)

### Community 98 - "TALENTRA — Development Environment Setup Guide"
Cohesion: 0.11
Nodes (18): 1. System Prerequisites, 2. Technology Stack & Architecture Decisions, 3. Directory Layout & Folder Responsibilities, 4. How the Systems Communicate, 5. Step-by-Step Quickstart, 6. How SQLite and SQLAlchemy Operate, 7. Troubleshooting & Common Questions, Backend Server (+10 more)

### Community 99 - "skillTaxonomy.js"
Cohesion: 0.15
Nodes (6): categorizeSkill(), deduplicateSkills(), normalizeSkill(), SKILL_CATEGORIES, SKILL_CATEGORY_MAP, SKILL_NORMALIZATION_MAP

### Community 100 - "test_scraper.py"
Cohesion: 0.11
Nodes (6): client(), test_5_sheet_excel_export_genuine_empty_cells_and_structure(), test_batch_parse_zero_fabricated_data_mandatory_missing_values(), test_duplicate_detection_intra_batch(), test_manual_correction_and_exports_history(), test_single_sheet_excel_export_minimal_structure()

### Community 101 - "3. Backend Layered Architecture"
Cohesion: 0.11
Nodes (17): 1. Architectural Philosophy, 2. Frontend Architectural Layers, 3. Backend Layered Architecture, 4. Database Strategy & CompanyAI Isolation, 5. Security & Environment Principles, A. Core Configuration (`backend/app/core/`), A. Presentation Layer (`frontend/src/pages/` & `components/`), A. SQLite for Local Development (+9 more)

### Community 102 - "TALENTRA Recruitment Platform Enhancement — Design"
Cohesion: 0.11
Nodes (17): A. Extend the active app in place — selected, Acceptance Criteria, Approaches Considered, B. Rebuild each workflow in `feature-modules/` before mounting it, C. Migrate to native Next.js App Router, Comparison, sourcing and export, Confirmed Product Decisions, Database safety, migration and tests (+9 more)

### Community 103 - "document_parser.py"
Cohesion: 0.12
Nodes (8): get_or_create_default_client(), ingest_all_local_data(), save_and_ingest_uploaded_jd(), save_and_ingest_uploaded_resume(), clean_text(), extract_text_from_file(), parse_job_description(), parse_resume()

### Community 104 - "comparison_router.py"
Cohesion: 0.26
Nodes (9): analyze_comparison(), get_targets(), ComparisonAnalyzeRequest, ComparisonAnalyzeResponse, ComparisonTargetCandidate, ComparisonTargetJD, ComparisonTargetsResponse, DimensionScores (+1 more)

### Community 105 - "boolean_search.py"
Cohesion: 0.15
Nodes (5): evaluate_candidate_boolean(), NotNode, parse_boolean_query(), tokenize_boolean_query(), test_boolean_tokenizer_and_ast()

### Community 107 - "FastAPI"
Cohesion: 0.08
Nodes (5): health_check(), health_check(), health_check(), health_check(), root()

### Community 110 - "Review Focus"
Cohesion: 0.15
Nodes (12): Global Constraints, Review Focus, TALENTRA Platform Enhancement Implementation Plan, Task 1: Isolate every backend test from developer data, Task 2: Secure account registration, activation and API authorization, Task 3: Additive workflow schema and verified migration backup, Task 4: Dynamic requisition lifecycle and approval, Task 5: Candidate directory, profile, pools and review-safe extraction (+4 more)

### Community 112 - "Counter.jsx"
Cohesion: 0.31
Nodes (12): clamp(), Counter(), createFormatter(), digitsFor(), DIRECTIONS, makeItem(), mod(), NUMERIC (+4 more)

### Community 113 - "Flow"
Cohesion: 0.15
Nodes (12): 0. Pre-flight, 1. Ask once, 2. Shape, 3. Direction, 4. Load, 5. The Picks block, 6. Build, 7. Sweep (+4 more)

### Community 116 - "create_client"
Cohesion: 0.20
Nodes (4): create_client(), CreateClientRequest, get_client_detail(), list_clients()

### Community 117 - "create_jd_version"
Cohesion: 0.15
Nodes (6): update_structured_jd(), create_jd_version(), diff_jd_versions(), get_jd_versions(), extract_sections_from_text(), get_structured_job_description()

### Community 121 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, Next.js App Router Migration Implementation Plan, Review Focus, Task 1: Update Frontend Package Dependencies, Task 2: Configure Next.js Reverse Proxy and Compiler, Task 3: Establish Next.js App Router Root Layout & Client Catch-All, Task 4: Update Launcher Scripts & Environment Config, Task 5: Build Verification and Live Integration Testing

### Community 122 - "LatticeLoader.jsx"
Cohesion: 0.31
Nodes (8): DEFAULT_PATTERN, fmt(), LatticeLoader(), LIT, MARKS, PATTERNS, resolvePattern(), spoken()

### Community 123 - "TALENTRA — Talent Intelligence Platform"
Cohesion: 0.22
Nodes (8): 1. Launch the Backend Server, 2. Launch the Frontend Development Server, Documentation Index, Overview, Project Structure, Quickstart, TALENTRA — Talent Intelligence Platform, Technology Stack

### Community 126 - "Step-by-Step Production Integration Blueprint for Team Leads & Engineers"
Cohesion: 0.25
Nodes (7): 1. Architectural Philosophy, 2. Standalone Verification Before Migration, 3. Migration Checklist for Each Feature, Example: Running Module 01 Standalone, Example: Running Module 04 Standalone, Step-by-Step Production Integration Blueprint for Team Leads & Engineers, TALENTRA — ROOT MODULE INTEGRATION GUIDE

### Community 127 - "MODULE 01 — Job Requisitions"
Cohesion: 0.25
Nodes (7): 1. Module Overview, 2. Directory Layout, 3. How to Copy and Integrate, 4. Independent Testing, Backend Integration (FastAPI), Frontend Integration (React), MODULE 01 — Job Requisitions

### Community 128 - "MODULE 02 — Candidate Resumes"
Cohesion: 0.25
Nodes (7): 1. Module Overview, 2. Directory Layout, 3. How to Copy and Integrate, 4. Independent Testing, Backend Integration (FastAPI), Frontend Integration (React), MODULE 02 — Candidate Resumes

### Community 129 - "MODULE 03 — JD & Resume Intelligence Comparison"
Cohesion: 0.25
Nodes (7): 1. Module Overview, 2. Directory Layout, 3. How to Copy and Integrate, 4. Independent Testing, Backend Integration (FastAPI), Frontend Integration (React), MODULE 03 — JD & Resume Intelligence Comparison

### Community 130 - "MODULE 04 — Resume Data Extraction"
Cohesion: 0.25
Nodes (7): 1. Module Overview, 2. Directory Layout, 3. How to Copy and Integrate, 4. Independent Testing, Backend Integration (FastAPI), Frontend Integration (React), MODULE 04 — Resume Data Extraction

### Community 131 - "MODULE 05 — JD-Based Candidate Sourcing & Excel Engine"
Cohesion: 0.25
Nodes (7): 1. Module Overview, 2. Directory Layout, 3. How to Copy and Integrate, 4. Independent Testing, Backend Integration (FastAPI), Frontend Integration (React), MODULE 05 — JD-Based Candidate Sourcing & Excel Engine

### Community 132 - "ShinyText.jsx"
Cohesion: 0.36
Nodes (7): blend(), clamp(), EASINGS, FALLOFF, parseColor(), ShinyText(), TRIGGERS

### Community 133 - "skill_normalizer.py"
Cohesion: 0.32
Nodes (3): deduplicate_skills(), get_skill_category(), normalize_skill()

### Community 134 - "Nemotron Recruitment Upgrade Status"
Cohesion: 0.29
Nodes (6): Current contracts and integration notes, Implemented in this pass, Nemotron Recruitment Upgrade Status, Provider and privacy boundary, Verification, Work still blocked or incomplete

### Community 137 - "Enterprise Recruitment Calendar, Multi-Interviewer Timetable & Conflict Engine"
Cohesion: 0.29
Nodes (6): Enterprise Recruitment Calendar, Multi-Interviewer Timetable & Conflict Engine, Key Capabilities, Module 06 — Interview Scheduling & Multi-Interviewer Timetable, Overview, Package Structure, Standalone Execution

### Community 138 - "next.config.mjs"
Cohesion: 0.29
Nodes (3): __dirname, __filename, nextConfig

### Community 141 - "SpotlightCard.jsx"
Cohesion: 0.53
Nodes (5): clamp(), falloff(), SHAPES, SpotlightCard(), THEMES

### Community 144 - "Ponytail, lazy senior dev mode"
Cohesion: 0.40
Nodes (4): Before you write, Mandatory Design Standard: Unslop UI Architecture, Ponytail, lazy senior dev mode, The smallest complete change

### Community 151 - "AnimatedList.jsx"
Cohesion: 0.83
Nodes (3): AnimatedItem(), AnimatedList(), prefersReducedMotion()

## Knowledge Gaps
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Candidate` connect `Candidate` to `extract_text_from_pdf`, `comparison.py`, `get_comparison_targets`, `Session`, `schemas/intelligence.py`, `test_scraper.py`, `EmbeddingProvider`, `document_parser.py`, `typing`, `routers/scraper.py`, `Session`, `main.py`, `deduplicate_all.py`, `JobDescriptionDocument`, `interview_router.py`, `test_intelligence.py`, `routers/documents.py`, `ProfileScraperService`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Are the 43 inferred relationships involving `Candidate` (e.g. with `export_assignments_csv()` and `list_assignments()`) actually correct?**
  _`Candidate` has 43 INFERRED edges - model-reasoned connections that need verification._
- **Should `Any` be split into smaller, more focused modules?**
  _Cohesion score 0.07862903225806452 - nodes in this community are weakly interconnected._
- **Why does `Base` connect `typing` to `Any`, `Candidate`, `Session`, `backend/models/interview_models.py`, `deduplicate_all.py`, `JobDescriptionDocument`, `interview_router.py`, `InterviewService`, `InterviewService`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Should `Session` be split into smaller, more focused modules?**
  _Cohesion score 0.1225296442687747 - nodes in this community are weakly interconnected._
- **Why does `InterviewService` connect `InterviewService` to `typing`, `backend/models/interview_models.py`, `interview/interview_service.py`, `interview_router.py`, `InterviewService`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `schemas/intelligence.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09879032258064516 - nodes in this community are weakly interconnected._