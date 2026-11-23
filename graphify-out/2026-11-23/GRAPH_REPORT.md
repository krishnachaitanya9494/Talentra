# Graph Report - Talentra  (2026-11-23)

## Corpus Check
- 339 files · ~277,246 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 29 file(s) not represented in the graph (top: .doc 14, .example 7, (none) 4)

## Summary
- 2790 nodes · 6774 edges · 171 communities (98 shown, 73 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 550 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d89140e4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Test-Driven Development (TDD)
- Plan Execution & Integration
- Companion Server Backend
- Session Diagnostic Dimensions
- Companion Token & Launcher
- Companion Request Handler
- Cross-Agent Tool Mappings
- Companion Client Runtime
- Brainstorming & Builder Check
- WebSocket Protocol Handling
- Flowchart & Graph Renderer
- typing
- Server Process Management
- JobDescriptionDocument
- Root Cause Tracing & 5 Whys
- Server Startup Utilities
- Git Worktree Isolation
- Implementation Plan Design
- Companion HTML Frame Structure
- Transcript Scrubber & Auditor
- Diagnostic Issue & Report Templates
- Parallel Agent Dispatching
- Test Polluter Detector
- Lay Out Approaches
- Spike Investigation
- Visual Companion Offer
- Companion Browser Events
- Companion HTTP Server
- Analyst Subagent Role
- Cost and Time Dimension
- Plan Adherence Dimension
- Quality Evidence Dimension
- Repeated Work Dimension
- Request Conflicts Dimension
- Session Signature Matcher
- Skill Timeline Dimension
- Stumbles Dimension
- Issue Search and Filing Procedure
- Session Discovery Procedure
- Problem Intake Step
- Diagnosis Workflow
- Diagnosis Bundle Structure
- Diagnostic Case Record Spec
- Candidate
- routers/outreach.py
- interview_router.py
- InterviewService
- AIService
- re
- InterviewService
- react
- routers/matching.py
- TALENTRA — FEATURE PORTABILITY & INTEGRATION MATRIX
- routers/repository.py
- App.jsx
- routers/intelligence.py
- lucide-react
- .export_analytics_csv
- ResumeParser
- services/api.js
- 06-interview-scheduling/frontend/index.js
- JobDescriptionParser
- routers/scraper.py
- frontend/JobWorkspace.jsx
- routers/health.py
- io
- test_matching.py
- 3. DEEP-DIVE: HOW TO PORT EACH FEATURE TO YOUR MAIN WEBSITE
- backend/models/interview_models.py
- documents/JobWorkspace.jsx
- pathlib
- requisitions_router.py
- interview/interview_service.py
- services/interview_service.py
- main.py
- sys
- schemas/interview_schemas.py
- structured_jd_service.py
- sourcing_router.py
- test_interview_scheduling.py
- resumes_router.py
- package.json
- AppLayout.jsx
- config.py
- routers/documents.py
- ProfileScraperService
- Session
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
- BooleanNode
- schedule_interview
- Session
- Review Focus
- frontend/JDResumeComparisonPage.jsx
- Counter.jsx
- Flow
- save_and_ingest_pasted_jd
- frontend/SourcingPage.jsx
- create_client
- create_jd_version
- dependencies
- ClientsPage.jsx
- AndNode
- Review Focus
- LatticeLoader.jsx
- TALENTRA — Talent Intelligence Platform
- boolean_search_candidates
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
- validator.py
- Ponytail, lazy senior dev mode
- RecruitmentEvent
- NotNode
- TermNode
- test_db_session
- settings.py
- layout.jsx
- AnimatedList.jsx
- set_sqlite_pragma

## God Nodes (most connected - your core abstractions)
1. `react` - 115 edges
2. `Candidate` - 105 edges
3. `Base` - 81 edges
4. `lucide-react` - 80 edges
5. `InterviewService` - 63 edges
6. `InterviewService` - 55 edges
7. `JobRequirement` - 54 edges
8. `JobDescriptionDocument` - 49 edges
9. `AnalyticsService` - 37 edges
10. `ResumeParser` - 37 edges

## Surprising Connections (you probably didn't know these)
- `Current Repository Findings` --references--> `get_current_user_optional()`  [INFERRED]
  docs/superpowers/specs/2026-11-23-talentra-platform-enhancement-design.md → backend/app/core/security.py
- `Current Repository Findings` --references--> `CandidateAssignment`  [INFERRED]
  docs/superpowers/specs/2026-11-23-talentra-platform-enhancement-design.md → backend/app/models/assignment.py
- `Current Repository Findings` --references--> `Candidate`  [INFERRED]
  docs/superpowers/specs/2026-11-23-talentra-platform-enhancement-design.md → backend/app/models/candidate.py
- `Requisitions and approval` --references--> `JobRequirement`  [INFERRED]
  docs/superpowers/specs/2026-11-23-talentra-platform-enhancement-design.md → backend/app/models/job_requirement.py
- `Candidates and extraction` --references--> `CandidateSubmission`  [INFERRED]
  docs/superpowers/specs/2026-11-23-talentra-platform-enhancement-design.md → backend/app/models/submission.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Brainstorming Visual Companion Components** — brainstorming_skill, brainstorming_visual_companion, brainstorming_scripts_frame_template [EXTRACTED 1.00]
- **Diagnostic Analyst Dimensions Suite** — diagnosing_superpowers_prompts_cost_and_time, diagnosing_superpowers_prompts_plan_adherence, diagnosing_superpowers_prompts_quality_evidence, diagnosing_superpowers_prompts_repeated_work, diagnosing_superpowers_prompts_request_conflicts, diagnosing_superpowers_prompts_skill_timeline, diagnosing_superpowers_prompts_stumbles [EXTRACTED 1.00]
- **Redaction Scrub and Audit Pipeline** — diagnosing_superpowers_prompts_scrub, diagnosing_superpowers_prompts_scrub_audit, diagnosing_superpowers_references_redaction_policy [EXTRACTED 1.00]
- **Multi-Platform Agent Tool Adaptation** — using_superpowers_references_antigravity_tools, using_superpowers_references_claude_code_tools, using_superpowers_references_codex_tools, using_superpowers_references_gemini_tools [EXTRACTED 1.00]
- **Subagent-Driven Development Execution and Review Loop** — subagent_driven_development_skill_subagent_driven_development, subagent_driven_development_implementer_prompt_template, subagent_driven_development_task_reviewer_prompt_template, subagent_driven_development_references_fix_loop_fix_loop [EXTRACTED 1.00]
- **Systematic Debugging Methodology and Reliability Patterns** — systematic_debugging_skill_systematic_debugging, systematic_debugging_condition_based_waiting_condition_based_waiting, systematic_debugging_defense_in_depth_defense_in_depth_validation [EXTRACTED 1.00]
- **Test-Driven Development Discipline Flow** — test_driven_development_skill_iron_law, test_driven_development_skill_red_green_refactor, test_driven_development_writing_good_tests_name_the_break [EXTRACTED 1.00]
- **Implementation Plan Execution and Integration Lifecycle** — executing_plans_skill_executing_plans, subagent_driven_development_skill_subagent_driven_development, finishing_a_development_branch_skill_finishing_a_development_branch [INFERRED 0.85]
- **Skill Authoring Compliance Framework** — writing_skills_references_bulletproofing_loophole_closing, writing_skills_references_persuasion_principles_psychological_triggers, writing_skills_references_anthropic_best_practices_concise_is_key [INFERRED 0.85]

## Communities (171 total, 73 thin omitted)

### Community 0 - "Test-Driven Development (TDD)"
Cohesion: 0.08
Nodes (21): Test-Driven Development Skill, Red-Green-Refactor Cycle, Writing Good Tests, Verification Before Completion Skill, Completion Gate Function, Anthropic Skill Authoring Best Practices, Progressive Disclosure in Prompts, Bulletproofing Skills Against Rationalization (+13 more)

### Community 1 - "Plan Execution & Integration"
Cohesion: 0.06
Nodes (25): Task Completion Contract, Executing Plans Inline, Progress Ledger, Branch Integration Options, Finishing a Development Branch, Worktree Cleanup Procedure, Receiving Code Review, YAGNI Review Check (+17 more)

### Community 2 - "Companion Server Backend"
Cohesion: 0.08
Nodes (24): brandMarkup(), clients, CONTENT_DIR, crypto, debounceTimers, escapeHtmlText(), frameTemplate, fs (+16 more)

### Community 3 - "Session Diagnostic Dimensions"
Cohesion: 0.18
Nodes (18): Analyst Common Prompt, Cost and Time Dimension Prompt, Plan Adherence Dimension Prompt, Quality Evidence Dimension Prompt, Repeated Work Dimension Prompt, Request Conflicts Dimension Prompt, Scrub Prompt, Scrub Audit Prompt (+10 more)

### Community 4 - "Companion Token & Launcher"
Cohesion: 0.16
Nodes (11): browserLauncherForPlatform(), chmodOwnerOnly(), companionUrl(), generateToken(), initialToken(), maybeOpenBrowser(), preferredPort(), randomPort() (+3 more)

### Community 5 - "Companion Request Handler"
Cohesion: 0.18
Nodes (14): bootstrapPage(), getNewestScreen(), handleRequest(), isAuthorized(), isFullDocument(), isRegularFileInsideContentDir(), parseCookies(), pathnameOf() (+6 more)

### Community 6 - "Cross-Agent Tool Mappings"
Cohesion: 0.29
Nodes (10): Antigravity CLI Tool Mapping, Claude Code Tool Mapping, Codex Tool Mapping, Gemini CLI Tool Mapping, Hermes Agent Tool Mapping, Muse Tool Mapping, Pi Tool Mapping, Agent Platform Tool Abstraction (+2 more)

### Community 7 - "Companion Client Runtime"
Cohesion: 0.42
Nodes (7): connect(), nextReconnectDelay(), reloadAfterRecovery(), sessionKey(), setStatus(), showTombstone(), websocketUrl()

### Community 8 - "Brainstorming & Builder Check"
Cohesion: 0.25
Nodes (7): Builder Check Prompt, Builder Subagent Reviewer, Brainstorming Skill, Builder Check Review, Hard Gate Approval, Visual Companion Guide, Parallel Analyst Triage

### Community 9 - "WebSocket Protocol Handling"
Cohesion: 0.25
Nodes (8): broadcast(), computeAcceptKey(), decodeFrame(), encodeFrame(), handleMessage(), handleUpgrade(), isAllowedWebSocketOrigin(), touchActivity()

### Community 10 - "Flowchart & Graph Renderer"
Cohesion: 0.39
Nodes (5): combineGraphs(), extractDotBlocks(), extractGraphBody(), main(), renderToSvg()

### Community 11 - "typing"
Cohesion: 0.06
Nodes (19): upgrade(), get_db(), RecruitmentMetricSnapshot, Base, TimestampMixin, Client, Interview, JobRequirement (+11 more)

### Community 12 - "Server Process Management"
Cohesion: 0.52
Nodes (6): command_has_server_id(), command_line_for_pid(), is_brainstorm_server(), mark_stopped(), read_expected_server_id(), stop-server.sh script

### Community 13 - "JobDescriptionDocument"
Cohesion: 0.05
Nodes (28): AssignmentHistory, AssignmentNote, AssignmentNotification, AssignmentStatus, CandidateAssignment, JobDescriptionDocument, User, UserRole (+20 more)

### Community 18 - "Git Worktree Isolation"
Cohesion: 0.67
Nodes (3): Using Git Worktrees Skill, Worktree Isolation Detection, Workspace Isolation via Git Worktrees

### Community 52 - "Candidate"
Cohesion: 0.05
Nodes (32): Candidate, CandidateAuditLog, CandidateCertification, CandidateEducation, CandidateEmployer, CandidateResumeLink, ParsedJobRequirement, CandidateMatch (+24 more)

### Community 53 - "routers/outreach.py"
Cohesion: 0.06
Nodes (24): CampaignStatus, CandidateCommunication, EmailProviderAccount, EmailSuppressionList, EmailTemplate, OutreachCampaign, add_to_suppression_list(), approve_campaign() (+16 more)

### Community 54 - "interview_router.py"
Cohesion: 0.06
Nodes (25): CandidateAvailabilityRequest, CandidateAvailabilitySlot, CandidateBookingRequest, InterviewAvailability, InterviewerWorkingHours, InterviewPanelMember, InterviewRescheduleRequest, InterviewSchedule (+17 more)

### Community 55 - "InterviewService"
Cohesion: 0.07
Nodes (3): InterviewHistory, InterviewService, SchedulingConflictException

### Community 56 - "AIService"
Cohesion: 0.05
Nodes (23): AIService, FreeModelPolicyError, SampleExtractionSchema, test_cache_deduplication(), test_extract_json_markdown_blocks(), test_strict_free_model_policy_blocks_paid_models(), test_strict_free_model_policy_permits_free_models(), test_unclassified_prompt_is_blocked_before_api_call() (+15 more)

### Community 57 - "re"
Cohesion: 0.07
Nodes (21): AIDataPolicyError, get_ai_service(), import_candidates_from_file(), inspect_headers(), parse_repository_resumes_batch(), detect_candidate_duplicate(), DuplicateMatchResult, extract_all_emails() (+13 more)

### Community 58 - "InterviewService"
Cohesion: 0.07
Nodes (3): InterviewHistory, InterviewService, SchedulingConflictException

### Community 59 - "react"
Cohesion: 0.04
Nodes (10): ProfileScraperPage(), ResumeExtractionModule(), REQUIREMENT_CATEGORIES, AnimatedContent(), prefersReducedMotion(), BlurText(), prefersReducedMotion(), Magnet() (+2 more)

### Community 60 - "routers/matching.py"
Cohesion: 0.06
Nodes (18): create_access_token(), decode_access_token(), get_current_user(), get_current_user_optional(), hash_password(), require_role(), verify_password(), MatchingConfiguration (+10 more)

### Community 61 - "TALENTRA — FEATURE PORTABILITY & INTEGRATION MATRIX"
Cohesion: 0.05
Nodes (18): 1. Executive Summary, 2. Portability Matrix by Module, 3. What Host Interfaces Must Be Supplied, 4. Frontend Mounting Contract (React), 5. Backend Mounting Contract (FastAPI), 6. What Cannot Be Copied Independently (And Why), 7. Future Feature Standard Operating Procedure (Feature 06+), A. Candidate Repository Adapter (+10 more)

### Community 62 - "routers/repository.py"
Cohesion: 0.11
Nodes (26): bulk_upload_jds(), bulk_upload_resumes(), delete_jd_document(), delete_resume_document(), get_jd_document(), get_repository_stats(), get_resume_document(), list_uploaded_jds() (+18 more)

### Community 63 - "App.jsx"
Cohesion: 0.13
Nodes (33): App(), AssignCandidatesModal(), PageHeader(), CandidateIntelligenceModal(), AnimatedMetricValue(), MetricCard(), CreateCampaignModal(), ThemeProvider() (+25 more)

### Community 64 - "routers/intelligence.py"
Cohesion: 0.11
Nodes (31): batch_parse_repository(), get_candidate_intelligence(), get_parsed_jd(), import_candidates_crm(), inspect_crm_file_headers(), link_resume_to_candidate(), list_candidate_duplicates(), manually_correct_candidate() (+23 more)

### Community 65 - "lucide-react"
Cohesion: 0.13
Nodes (31): Badge(), Modal(), SearchInput(), ConfirmDeleteModal(), CrmImportModal(), TARGET_FIELDS, DataExplorer(), DocumentViewerModal() (+23 more)

### Community 66 - ".export_analytics_csv"
Cohesion: 0.07
Nodes (13): export_analytics_csv(), get_campaign_analytics(), get_jd_pipelines(), get_recruitment_funnel(), get_recruitment_overview(), get_ta_performance_analytics(), get_turnaround_time_intelligence(), test_export_analytics_csv_service() (+5 more)

### Community 67 - "ResumeParser"
Cohesion: 0.07
Nodes (6): batch_parse_resumes(), ResumeParser, test_resume_parser_reports_when_hosted_ai_is_blocked(), test_resume_parser_complete(), test_resume_parser_missing_fields_never_invents(), test_sap_security_jd_extraction_ignores_go_live_and_finds_domain_skills()

### Community 68 - "services/api.js"
Cohesion: 0.06
Nodes (17): AssignmentHistoryModal(), CandidateDirectory(), UploadResumeModal(), ManualEmailModal(), addAssignmentNote(), apiClient, bulkUploadResumes(), getAssignmentHistory() (+9 more)

### Community 69 - "06-interview-scheduling/frontend/index.js"
Cohesion: 0.13
Nodes (25): FALLBACK_CANDIDATES, FALLBACK_INTERVIEWERS, FALLBACK_JDS, interviewApi, AddInterviewModal(), MODE_OPTIONS, ROUND_OPTIONS, CalendarGrid() (+17 more)

### Community 70 - "JobDescriptionParser"
Cohesion: 0.07
Nodes (9): analyze_comparison(), build_dynamic_jd_specs(), build_text_jd_specs(), get_comparison_targets(), JobDescriptionParser, test_text_mode_compares_pasted_jd_and_resume_without_database_records(), test_text_mode_marks_unmentioned_skill_as_unknown_not_a_gap(), test_text_mode_requires_both_pasted_documents() (+1 more)

### Community 71 - "routers/scraper.py"
Cohesion: 0.09
Nodes (15): download_scraper_export(), export_dataset_csv(), export_dataset_json(), export_parsed_resumes_csv(), export_parsed_resumes_excel(), export_parsed_resumes_json(), get_scrape_run_details(), import_parsed_candidates() (+7 more)

### Community 72 - "frontend/JobWorkspace.jsx"
Cohesion: 0.11
Nodes (15): EditJDModal(), JDVersionHistoryModal(), JobRequisitionsModule(), AVATAR_COLORS, JobWorkspace(), REQUIREMENT_CATEGORIES, RequirementsWorkspaceTab(), StructuredJDSpecs() (+7 more)

### Community 73 - "routers/health.py"
Cohesion: 0.07
Nodes (11): init_database(), verify_database_connection(), lifespan(), root(), check_health(), DatabaseStatus, HealthResponse, RootResponse (+3 more)

### Community 74 - "io"
Cohesion: 0.06
Nodes (15): extract_text_from_docx(), test_upload_invalid_file_extension(), test_upload_jd_file(), test_upload_resume_file(), test_crm_csv_import_with_mapping(), client(), test_bulk_upload_resumes_200_documents(), test_empty_file_rejected() (+7 more)

### Community 75 - "test_matching.py"
Cohesion: 0.09
Nodes (14): ResumeDocument, MatchEvidence, canonicalize_skill(), MatchingEngine, matches_skill(), sync_repository_resumes_to_candidates(), db_session(), test_absent_candidate_skills_are_unknown_not_confirmed_mismatch() (+6 more)

### Community 76 - "3. DEEP-DIVE: HOW TO PORT EACH FEATURE TO YOUR MAIN WEBSITE"
Cohesion: 0.05
Nodes (36): 10 Standardized Canonical Sections Extracted:, 11 Standard Enterprise Categories:, 1. ARCHITECTURAL PHILOSOPHY & ISOLATION PRINCIPLES, 2. FEATURE INTEGRATION INVENTORY, 3. DEEP-DIVE: HOW TO PORT EACH FEATURE TO YOUR MAIN WEBSITE, 4. HOW TO PRESENT THIS ARCHITECTURE TO YOUR TEAM LEAD (TL), 5. REPOSITORY CODE MAPPING AT A GLANCE, Deterministic Rules Checked: (+28 more)

### Community 77 - "backend/models/interview_models.py"
Cohesion: 0.07
Nodes (10): CandidateAvailabilityRequest, CandidateAvailabilitySlot, CandidateBookingRequest, InterviewAvailability, InterviewerWorkingHours, InterviewPanelMember, InterviewRescheduleRequest, InterviewSchedule (+2 more)

### Community 78 - "documents/JobWorkspace.jsx"
Cohesion: 0.18
Nodes (25): EditJDModal(), JDVersionHistoryModal(), AVATAR_COLORS, JobWorkspace(), StructuredJDSpecs(), EditJDModal(), JDVersionHistoryModal(), AVATAR_COLORS (+17 more)

### Community 79 - "pathlib"
Cohesion: 0.08
Nodes (7): health_check(), health_check(), test_resume_upload_and_deduplication(), health_check(), health_check(), test_excel_export_generation(), root()

### Community 80 - "requisitions_router.py"
Cohesion: 0.11
Nodes (12): get_requisition(), get_structured_specs(), list_requisitions(), update_requisition(), validate_requisition(), JobRequisitionService, RequisitionCreateSchema, RequisitionResponseSchema (+4 more)

### Community 81 - "interview/interview_service.py"
Cohesion: 0.14
Nodes (25): AvailabilityCheckRequest, AvailabilityCheckResponse, AvailabilityConflict, AvailabilityRequestCreate, AvailabilitySubmissionRequest, BookingLinkCreateRequest, CandidateBookingConfirmRequest, CandidateSlotSubmission (+17 more)

### Community 82 - "services/interview_service.py"
Cohesion: 0.16
Nodes (25): AvailabilityCheckRequest, AvailabilityCheckResponse, AvailabilityConflict, AvailabilityRequestCreate, AvailabilitySubmissionRequest, BookingLinkCreateRequest, CandidateBookingConfirmRequest, CandidateSlotSubmission (+17 more)

### Community 83 - "main.py"
Cohesion: 0.07
Nodes (10): evaluate_candidate_against_specs(), db(), test_analytics_api_endpoints(), test_candidate_creation_and_unique_constraints(), client(), test_data_summary_endpoint(), test_list_candidates_endpoint(), test_list_jds_endpoint() (+2 more)

### Community 84 - "sys"
Cohesion: 0.12
Nodes (11): health_check(), export_batch(), get_results(), get_status(), upload_batch(), ResumeExtractionService, BatchExtractionJobResponse, ExtractedCandidateRecordSchema (+3 more)

### Community 85 - "schemas/interview_schemas.py"
Cohesion: 0.13
Nodes (25): AvailabilityCheckRequest, AvailabilityCheckResponse, AvailabilityConflict, AvailabilityRequestCreate, AvailabilitySubmissionRequest, BookingLinkCreateRequest, CandidateBookingConfirmRequest, CandidateSlotSubmission (+17 more)

### Community 86 - "structured_jd_service.py"
Cohesion: 0.13
Nodes (8): validate_job_description(), categorize_skills_list(), detect_duplicate_skills(), normalize_skill(), process_jd_skills(), SkillClassificationService, extract_sections_from_text(), get_structured_job_description()

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
Cohesion: 0.11
Nodes (19): devDependencies, autoprefixer@^10.4.20, postcss@^8.4.49, tailwindcss@^3.4.17, @types/react@^18.3.12, @types/react-dom@^18.3.1, name, private (+11 more)

### Community 91 - "AppLayout.jsx"
Cohesion: 0.19
Nodes (9): CommandPalette(), ErrorBoundary, PageTransition(), AppLayout(), Sidebar(), Topbar(), ThemeContext, useTheme() (+1 more)

### Community 92 - "config.py"
Cohesion: 0.11
Nodes (4): run_migrations_offline(), run_migrations_online(), Settings, verify_sqlite_health()

### Community 93 - "routers/documents.py"
Cohesion: 0.24
Nodes (13): list_candidates(), list_job_descriptions(), paste_job_description(), CandidateDetailItem, CandidateItem, DataSummaryResponse, JobRequirementDetailItem, JobRequirementItem (+5 more)

### Community 95 - "Session"
Cohesion: 0.19
Nodes (16): bulk_associate_candidates(), create_new_jd_version(), get_candidate(), get_data_summary(), get_jd_candidates(), get_jd_interview_kit(), get_jd_templates(), get_jd_validation() (+8 more)

### Community 96 - "extract_text_from_pdf"
Cohesion: 0.12
Nodes (5): upload_candidate_document(), upload_job_description_file(), extract_text_from_pdf(), extract_text_from_txt(), test_txt_extractor_encodings()

### Community 97 - "TALENTRA — Developer Commands Reference"
Cohesion: 0.11
Nodes (18): 1. Quick Launchers (Recommended), 2. Backend Commands, 3. Frontend Commands, 4. Database & Health Verification Commands, A. Installing Frontend Dependencies, A. Virtual Environment Activation, B. Installing Backend Dependencies, B. Starting the React Vite Development Server (+10 more)

### Community 98 - "TALENTRA — Development Environment Setup Guide"
Cohesion: 0.11
Nodes (18): 1. System Prerequisites, 2. Technology Stack & Architecture Decisions, 3. Directory Layout & Folder Responsibilities, 4. How the Systems Communicate, 5. Step-by-Step Quickstart, 6. How SQLite and SQLAlchemy Operate, 7. Troubleshooting & Common Questions, Backend Server (+10 more)

### Community 99 - "skillTaxonomy.js"
Cohesion: 0.12
Nodes (8): REQUIREMENT_CATEGORIES, RequirementsWorkspaceTab(), categorizeSkill(), deduplicateSkills(), normalizeSkill(), SKILL_CATEGORIES, SKILL_CATEGORY_MAP, SKILL_NORMALIZATION_MAP

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
Cohesion: 0.17
Nodes (6): sync_data(), ingest_all_local_data(), clean_text(), extract_text_from_file(), parse_job_description(), parse_resume()

### Community 104 - "comparison_router.py"
Cohesion: 0.26
Nodes (9): analyze_comparison(), get_targets(), ComparisonAnalyzeRequest, ComparisonAnalyzeResponse, ComparisonTargetCandidate, ComparisonTargetJD, ComparisonTargetsResponse, DimensionScores (+1 more)

### Community 105 - "boolean_search.py"
Cohesion: 0.18
Nodes (4): evaluate_candidate_boolean(), parse_boolean_query(), tokenize_boolean_query(), test_boolean_tokenizer_and_ast()

### Community 106 - "BooleanNode"
Cohesion: 0.36
Nodes (3): BooleanNode, BooleanParser, Token

### Community 108 - "schedule_interview"
Cohesion: 0.17
Nodes (5): get_candidate_interviews(), schedule_interview(), ScheduleInterviewRequest, update_interview_feedback(), UpdateInterviewFeedbackRequest

### Community 109 - "Session"
Cohesion: 0.19
Nodes (5): delete_export(), download_export_file(), get_candidate_details(), get_sourcing_search(), list_exports()

### Community 110 - "Review Focus"
Cohesion: 0.15
Nodes (12): Global Constraints, Review Focus, TALENTRA Platform Enhancement Implementation Plan, Task 1: Isolate every backend test from developer data, Task 2: Secure account registration, activation and API authorization, Task 3: Additive workflow schema and verified migration backup, Task 4: Dynamic requisition lifecycle and approval, Task 5: Candidate directory, profile, pools and review-safe extraction (+4 more)

### Community 112 - "Counter.jsx"
Cohesion: 0.31
Nodes (12): clamp(), Counter(), createFormatter(), digitsFor(), DIRECTIONS, makeItem(), mod(), NUMERIC (+4 more)

### Community 113 - "Flow"
Cohesion: 0.15
Nodes (12): 0. Pre-flight, 1. Ask once, 2. Shape, 3. Direction, 4. Load, 5. The Picks block, 6. Build, 7. Sweep (+4 more)

### Community 114 - "save_and_ingest_pasted_jd"
Cohesion: 0.20
Nodes (6): save_and_ingest_pasted_jd(), upload_job_description(), upload_resume(), get_or_create_default_client(), save_and_ingest_uploaded_jd(), save_and_ingest_uploaded_resume()

### Community 116 - "create_client"
Cohesion: 0.20
Nodes (4): create_client(), CreateClientRequest, get_client_detail(), list_clients()

### Community 117 - "create_jd_version"
Cohesion: 0.25
Nodes (4): update_structured_jd(), create_jd_version(), diff_jd_versions(), get_jd_versions()

### Community 118 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, axios@^1.7.9, lucide-react@^1.76.0, next@^14.2.35, react@^18.3.1, react-dom@^18.3.1, react-router-dom@^6.28.0, CatchAllPage() (+2 more)

### Community 119 - "ClientsPage.jsx"
Cohesion: 0.33
Nodes (8): EmptyState(), analyzeComparison(), createClient(), getClientDetail(), getClients(), getComparisonTargets(), ClientsPage(), JDResumeComparisonPage()

### Community 121 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, Next.js App Router Migration Implementation Plan, Review Focus, Task 1: Update Frontend Package Dependencies, Task 2: Configure Next.js Reverse Proxy and Compiler, Task 3: Establish Next.js App Router Root Layout & Client Catch-All, Task 4: Update Launcher Scripts & Environment Config, Task 5: Build Verification and Live Integration Testing

### Community 122 - "LatticeLoader.jsx"
Cohesion: 0.31
Nodes (8): DEFAULT_PATTERN, fmt(), LatticeLoader(), LIT, MARKS, PATTERNS, resolvePattern(), spoken()

### Community 123 - "TALENTRA — Talent Intelligence Platform"
Cohesion: 0.22
Nodes (8): 1. Launch the Backend Server, 2. Launch the Frontend Development Server, Documentation Index, Overview, Project Structure, Quickstart, TALENTRA — Talent Intelligence Platform, Technology Stack

### Community 124 - "boolean_search_candidates"
Cohesion: 0.32
Nodes (3): boolean_search_candidates(), generate_excel_export(), parse_job_description()

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

### Community 142 - "DynamicQuestionItem"
Cohesion: 0.50
Nodes (3): DynamicQuestionItem, generate_screening_questions(), test_generated_screening_questions_require_recruiter_approval()

### Community 144 - "Ponytail, lazy senior dev mode"
Cohesion: 0.50
Nodes (3): Before you write, Ponytail, lazy senior dev mode, The smallest complete change

### Community 151 - "AnimatedList.jsx"
Cohesion: 0.83
Nodes (3): AnimatedItem(), AnimatedList(), prefersReducedMotion()

## Knowledge Gaps
- **55 isolated node(s):** `RFC-6455`, `Completion Gate Function`, `Progressive Disclosure in Prompts`, `Agent Pressure Testing Scenarios`, `Skill Triggering & Description Optimization` (+50 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1172 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **73 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Candidate` connect `Candidate` to `typing`, `JobDescriptionDocument`, `routers/outreach.py`, `interview_router.py`, `re`, `routers/matching.py`, `routers/intelligence.py`, `ResumeParser`, `JobDescriptionParser`, `routers/scraper.py`, `test_matching.py`, `main.py`, `routers/documents.py`, `ProfileScraperService`, `Session`, `test_scraper.py`, `document_parser.py`, `schedule_interview`, `save_and_ingest_pasted_jd`, `boolean_search_candidates`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Are the 43 inferred relationships involving `Candidate` (e.g. with `export_assignments_csv()` and `list_assignments()`) actually correct?**
  _`Candidate` has 43 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-6455`, `Completion Gate Function`, `Progressive Disclosure in Prompts` to the rest of the system?**
  _55 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Test-Driven Development (TDD)` be split into smaller, more focused modules?**
  _Cohesion score 0.07586206896551724 - nodes in this community are weakly interconnected._
- **Why does `Base` connect `typing` to `test_matching.py`, `JobDescriptionDocument`, `backend/models/interview_models.py`, `RecruitmentEvent`, `Candidate`, `routers/outreach.py`, `interview_router.py`, `InterviewService`, `InterviewService`, `routers/matching.py`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Should `Plan Execution & Integration` be split into smaller, more focused modules?**
  _Cohesion score 0.06349206349206349 - nodes in this community are weakly interconnected._
- **Why does `InterviewService` connect `InterviewService` to `typing`, `backend/models/interview_models.py`, `interview/interview_service.py`, `schemas/interview_schemas.py`, `interview_router.py`, `InterviewService`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._