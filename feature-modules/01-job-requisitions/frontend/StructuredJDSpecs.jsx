import React, { useState } from 'react';
import {
  FileText,
  Layers,
  Briefcase,
  BookOpen,
  Award,
  Shield,
  Star,
  MapPin,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Edit3,
  History,
  Check,
  Zap,
} from 'lucide-react';

export const StructuredJDSpecs = ({
  jd,
  structuredData,
  onOpenEdit,
  onOpenVersionHistory,
}) => {
  const [scopeMode, setScopeMode] = useState('structured'); // 'structured' vs 'source'
  const [isValidationOpen, setIsValidationOpen] = useState(true);
  const [selectedSkillCategory, setSelectedSkillCategory] = useState('All');

  const sec = structuredData?.sections || {};
  const validation = structuredData?.validation || {
    completeness_percentage: 92,
    is_publishable: true,
    critical_count: 0,
    warning_count: 1,
    suggestion_count: 0,
    issues: [
      {
        id: 'val-skills-scant',
        level: 'WARNING',
        field: 'skills',
        message: 'Requisitions typically specify 5–8 normalized skills.',
        fix_suggestion: 'Review secondary technical competencies.',
      },
    ],
  };

  const overview = sec['1_overview'] || {
    role_title: jd?.title || 'Lead Architect',
    requisition_code: jd?.req_code || 'JD-001',
    client_name: 'Talentra Enterprise Delivery',
    client_industry: 'Corporate Systems & Technology Architecture',
    department: jd?.department || 'Engineering & Delivery',
    employment_type: jd?.employment_type || 'full_time',
    status: jd?.status || 'open',
    priority: jd?.priority || 'medium',
    open_positions: jd?.open_positions || 1,
  };

  const summary = sec['2_summary']?.content || jd?.description || '';

  const resp = sec['3_responsibilities'] || {
    core_responsibilities: [
      `Own end-to-end design, implementation, and deployment of ${jd?.title || 'platform'} solution architectures.`,
      'Collaborate with enterprise stakeholders to translate business requirements into governed technical specifications.',
      'Maintain auditable workflow history and compliance with regulatory governance standards.',
    ],
    functional_deliverables: [
      'Develop reusable service components and standardized platform extensions.',
      'Participate in release management, defect resolution, and pre-production operational readiness.',
      'Provide engineering guidance and code reviews for delivery consultants.',
    ],
  };

  const techSkills = sec['4_technical_skills'] || {
    categories: [],
    by_category: {},
    skills_list: [],
    duplicates_found: [],
    total_skills: 0,
    mandatory_count: 0,
    preferred_count: 0,
  };

  const exp = sec['5_experience'] || {
    formatted_range: '5 - 8 Years',
    seniority_tier: 'senior',
    relevant_experience_note: 'Minimum 5 years active delivery experience in enterprise technology stacks.',
  };

  const edu = sec['6_education']?.qualifications || [
    "Bachelor's degree in Computer Science, Information Technology, Engineering, or equivalent practical experience.",
    "Master's degree (M.Tech / MS / MCA / MBA) is a strong plus.",
  ];

  const certs = sec['7_certifications']?.certifications || [
    'Vendor-certified specialist or equivalent enterprise delivery track record.',
  ];

  const domain = sec['8_domain']?.requirements || [
    `Deep working experience in ${jd?.department || 'Enterprise Systems'} lifecycle operations.`,
    'Proven fluency adhering to enterprise change control and SOX compliance standards.',
  ];

  const preferred = sec['9_preferred']?.qualifications || [
    'Prior engagement with Global Capability Centers (GCCs) or Fortune 500 corporate environments.',
    'Experience automating repeatable operational routines with scripting (Python, Shell, REST APIs).',
  ];

  const loc = sec['10_location_employment'] || {
    office_location: jd?.location || 'Hyderabad / Remote',
    work_mode: 'Hybrid (3 Days Office / 2 Days Remote)',
    budget_currency: 'INR',
    salary_range: 'Competitive Market Standard (₹18 LPA – ₹26 LPA Base + Variable)',
  };

  const skillsList = techSkills.skills_list || [];
  const filteredSkills =
    selectedSkillCategory === 'All'
      ? skillsList
      : skillsList.filter((s) => s.category === selectedSkillCategory);

  return (
    <div className="space-y-4 text-xs">
      {/* ========================================================================= */}
      {/* Top Action Bar & Mode Switcher */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="font-bold text-sm text-navy-900 dark:text-slate-100 flex items-center gap-2">
                <span>{overview.role_title}</span>
                <span className="px-2 py-0.2 rounded-full font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {overview.requisition_code}
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  v1
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {overview.client_name} • {overview.department}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenVersionHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>Version History</span>
            </button>

            <button
              type="button"
              onClick={onOpenEdit}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Requisition</span>
            </button>
          </div>
        </div>

        {/* Mode Toggle Switch (10 Sections vs Source Text) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-surface-darkBorder font-semibold">
            <button
              type="button"
              onClick={() => setScopeMode('structured')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                scopeMode === 'structured'
                  ? 'bg-white dark:bg-surface-darkCard text-navy-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Structured Specifications (10 Sections)</span>
            </button>

            <button
              type="button"
              onClick={() => setScopeMode('source')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                scopeMode === 'source'
                  ? 'bg-white dark:bg-surface-darkCard text-navy-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Original Raw Document Text</span>
            </button>
          </div>

          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
            ✓ Conventional Deterministic Segmentation
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Rule-Based Quality & Validation Engine Card (Section 7) */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard overflow-hidden shadow-subtle">
        <div
          onClick={() => setIsValidationOpen(!isValidationOpen)}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold font-mono text-xs ${
                validation.completeness_percentage >= 85
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {validation.completeness_percentage}%
            </div>
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-navy-900 dark:text-slate-100 flex items-center gap-2">
                <span>DETERMINISTIC JD VALIDATION & READINESS SCORE</span>
                {validation.is_publishable ? (
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    PUBLISHABLE
                  </span>
                ) : (
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800">
                    BLOCKING ISSUES
                  </span>
                )}
              </span>
              <p className="text-[11px] text-slate-500">
                Rule-based checks: {validation.critical_count} Critical, {validation.warning_count} Warnings, {validation.suggestion_count} Suggestions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-xs">
            {isValidationOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {isValidationOpen && validation.issues && validation.issues.length > 0 && (
          <div className="p-4 pt-0 space-y-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            {validation.issues.map((iss, iIdx) => (
              <div
                key={iIdx}
                className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                  iss.level === 'CRITICAL'
                    ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 text-rose-800 dark:text-rose-300'
                    : iss.level === 'WARNING'
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 text-amber-800 dark:text-amber-300'
                    : 'bg-sky-50/60 dark:bg-sky-950/30 border-sky-200 text-sky-800 dark:text-sky-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase text-[9px] px-1.5 py-0.2 rounded bg-black/10">
                      {iss.level}
                    </span>
                    <span className="font-bold">{iss.message}</span>
                  </div>
                  <p className="opacity-80">Fix: {iss.fix_suggestion}</p>
                </div>
                <button
                  type="button"
                  onClick={onOpenEdit}
                  className="px-2 py-1 rounded bg-white dark:bg-surface-darkCard font-semibold shadow-2xs hover:underline cursor-pointer shrink-0"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: 10 STRUCTURED CANONICAL SECTIONS */}
      {/* ========================================================================= */}
      {scopeMode === 'structured' ? (
        <div className="space-y-4">
          {/* Section 1 & 2: Overview & Summary */}
          <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-3">
            <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">
              1. JOB OVERVIEW & 2. ROLE SUMMARY
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  DEPARTMENT
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {overview.department}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  EMPLOYMENT TYPE
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                  {overview.employment_type.replace('_', ' ')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  REQUISITION STATUS
                </span>
                <span className="font-bold text-emerald-600 uppercase">
                  {overview.status}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  OPEN POSITIONS
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {overview.open_positions} Vacancy
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/60 dark:bg-slate-900/30 border border-slate-200/70 dark:border-surface-darkBorder space-y-1">
              <span className="font-bold text-[10px] uppercase text-slate-500 block">
                EXECUTIVE SUMMARY
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                {summary ||
                  'The Consultant is responsible for driving end-to-end technical solution delivery, configuration, and workflow integration within the practice.'}
              </p>
            </div>
          </div>

          {/* Section 3: Responsibilities (Core & Deliverables) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-3">
            <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">
              3. RESPONSIBILITIES & DELIVERABLES
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                <span className="font-bold text-[10px] uppercase text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CORE ARCHITECTURAL RESPONSIBILITIES</span>
                </span>
                <ul className="text-slate-700 dark:text-slate-300 space-y-1.5 text-xs list-disc pl-4">
                  {resp.core_responsibilities.map((r, rIdx) => (
                    <li key={rIdx}>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                <span className="font-bold text-[10px] uppercase text-slate-500 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  <span>LIFECYCLE & FUNCTIONAL DELIVERABLES</span>
                </span>
                <ul className="text-slate-700 dark:text-slate-300 space-y-1.5 text-xs list-disc pl-4">
                  {resp.functional_deliverables.map((d, dIdx) => (
                    <li key={dIdx}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Section 4: Technical Skills & 11 Taxonomy Categories (Section 5) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">
                  4. TECHNICAL SKILLS & 11-CATEGORY TAXONOMY MATRIX
                </span>
                <span className="text-[11px] text-slate-500">
                  {skillsList.length} Competencies • {techSkills.mandatory_count} Mandatory, {techSkills.preferred_count} Preferred
                </span>
              </div>

              {/* Category filter pills */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Filter:</span>
                <select
                  value={selectedSkillCategory}
                  onChange={(e) => setSelectedSkillCategory(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                >
                  <option value="All">All Categories ({skillsList.length})</option>
                  {Object.keys(techSkills.by_category || {}).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} ({techSkills.by_category[cat]?.length || 0})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Skills Chips Grid */}
            <div className="flex flex-wrap gap-2 pt-1">
              {filteredSkills.map((sk, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs transition-all ${
                    sk.is_mandatory
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-surface-darkBorder text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <span className="font-bold block">{sk.name}</span>
                    <span className="text-[9px] uppercase font-semibold text-slate-400">
                      {sk.category}
                    </span>
                  </div>

                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                      sk.is_mandatory
                        ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {sk.is_mandatory ? 'MANDATORY' : 'PREFERRED'}
                  </span>
                </div>
              ))}
            </div>

            {/* Normalization & Duplicate Detection Summary */}
            {techSkills.duplicates_found?.length > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Duplicate skills normalized: <strong>{techSkills.duplicates_found.join(', ')}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Section 5 & 6: Experience & Education */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-2.5">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span>5. EXPERIENCE REQUIREMENTS</span>
              </span>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  EXPERIENCE RANGE & SENIORITY TIER
                </span>
                <span className="font-bold text-sm text-navy-900 dark:text-slate-100 block">
                  {exp.formatted_range} ({exp.seniority_tier.toUpperCase()})
                </span>
                <p className="text-[11px] text-slate-500">
                  {exp.relevant_experience_note}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-2.5">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                <span>6. EDUCATIONAL QUALIFICATIONS</span>
              </span>

              <ul className="text-slate-700 dark:text-slate-300 space-y-1 text-xs list-disc pl-4 pt-1">
                {edu.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 7 & 8: Certifications & Domain */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-2.5">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>7. CERTIFICATIONS & CREDENTIALS</span>
              </span>

              <ul className="text-slate-700 dark:text-slate-300 space-y-1 text-xs list-disc pl-4 pt-1">
                {certs.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-2.5">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-rose-600" />
                <span>8. DOMAIN REQUIREMENTS</span>
              </span>

              <ul className="text-slate-700 dark:text-slate-300 space-y-1 text-xs list-disc pl-4 pt-1">
                {domain.map((d, idx) => (
                  <li key={idx}>{d}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 9 & 10: Preferred Qualifications & Location/Employment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-2.5">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>9. PREFERRED QUALIFICATIONS</span>
              </span>

              <ul className="text-slate-700 dark:text-slate-300 space-y-1 text-xs list-disc pl-4 pt-1">
                {preferred.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-2.5">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>10. LOCATION & EMPLOYMENT INFORMATION</span>
              </span>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 space-y-1 text-xs">
                <div>
                  <strong className="text-slate-700 dark:text-slate-300">Office Location:</strong>{' '}
                  <span>{loc.office_location}</span>
                </div>
                <div>
                  <strong className="text-slate-700 dark:text-slate-300">Work Arrangement:</strong>{' '}
                  <span>{loc.work_mode}</span>
                </div>
                <div>
                  <strong className="text-slate-700 dark:text-slate-300">Compensation Benchmark:</strong>{' '}
                  <span className="text-emerald-600 font-bold">{loc.salary_range}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MODE 2: ORIGINAL SOURCE RAW DOCUMENT TEXT */
        <div className="p-5 rounded-2xl bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed max-h-[600px] overflow-y-auto whitespace-pre-wrap select-all border border-slate-800 shadow-2xl">
          {structuredData?.raw_text || jd?.description || 'Full source document loaded from repository.'}
        </div>
      )}
    </div>
  );
};
