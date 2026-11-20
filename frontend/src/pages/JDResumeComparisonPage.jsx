import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  GitCompare,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Users,
  Copy,
  Check,
  Eye,
  FileText,
  Briefcase,
  Layers,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Download,
  Share2,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { getComparisonTargets, analyzeComparison } from '../services/api';

/**
 * TALENTRA — JD & Resume Intelligence Comparison Workspace
 * Recreates the exact multi-mode, evidence-grounded layout from the reference video.
 */
export default function JDResumeComparisonPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mode: 'single' (1-on-1 Deep Compare), 'multi' (Multi-Candidate 3), 'text' (Paste / Upload Text)
  const [mode, setMode] = useState('single');

  // Targets state
  const [jds, setJds] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJdId, setSelectedJdId] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);

  // Text mode state
  const [jdText, setJdText] = useState('');
  const [resumeText, setResumeText] = useState('');

  // Results state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [specFilter, setSpecFilter] = useState('all'); // 'all', 'satisfied', 'mandatory_gaps', 'preferred_gaps'
  const [candidateViewTab, setCandidateViewTab] = useState('profile'); // 'profile', 'resume'

  // Load targets
  useEffect(() => {
    loadTargets();
  }, []);

  const loadTargets = async () => {
    try {
      setLoading(true);
      const res = await getComparisonTargets();
      const jdList = res.jds || [];
      const candList = res.candidates || [];
      setJds(jdList);
      setCandidates(candList);

      const paramJd = searchParams.get('jd');
      const paramCand = searchParams.get('candidate');

      const initialJdId = paramJd ? Number(paramJd) : (jdList[0]?.id || 1);
      const initialCandId = paramCand ? Number(paramCand) : (candList[0]?.id || 1);

      setSelectedJdId(initialJdId);
      setSelectedCandidateId(initialCandId);
      setSelectedCandidateIds(candList.slice(0, 3).map((c) => c.id));

      // Trigger initial comparison
      runComparison(initialJdId, initialCandId, 'single');
    } catch (err) {
      console.error('Failed to load comparison targets:', err);
    } finally {
      setLoading(false);
    }
  };

  const runComparison = async (jdId, candId, currentMode = mode) => {
    try {
      setLoading(true);
      setError(null);
      const payload = {
        mode: currentMode,
        jd_id: jdId || selectedJdId,
      };

      if (currentMode === 'single') {
        payload.candidate_id = candId || selectedCandidateId;
      } else if (currentMode === 'multi') {
        payload.candidate_ids = selectedCandidateIds;
      } else if (currentMode === 'text') {
        payload.jd_text = jdText;
        payload.resume_text = resumeText;
      }

      const res = await analyzeComparison(payload);
      setComparisonData(res);
    } catch (err) {
      console.error('Comparison analysis failed:', err);
      setError(err.response?.data?.detail || err.message || 'Comparison request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    runComparison(selectedJdId, selectedCandidateId, newMode);
  };

  const handleCopyBrief = () => {
    const brief = comparisonData?.comparison?.recruiter_brief;
    if (brief) {
      navigator.clipboard.writeText(brief);
      setCopiedBrief(true);
      setTimeout(() => setCopiedBrief(false), 2000);
    }
  };

  const handleLoadSampleText = () => {
    setJdText(
      `Job Title: Senior Oracle EPM / Hyperion Planning Consultant
Experience Required: 5 - 8 Years
Location: Hyderabad / Remote
Mandatory Skills: Calculation Scripts, Essbase, Hyperion Planning, PBCS, EPBCS, Dimension Hierarchies, Financial Close Automation.
Responsibilities: Design, develop, and maintain complex calculation scripts. Configure and maintain planning forms, dashboards, and automated workflow triggers.`
    );
    setResumeText(
      `Lavanya Gudibanda
Senior Oracle Cloud EPM / FCCS Consultant
7.2 Years Experience | Bangalore, India
Key Competencies: Oracle FCCS, Hyperion Financial Management (HFM), Financial Consolidation, Smart View, EPM Automate, Business Rules, Data Management, SQL, Hyperion.
Summary: 7.2 years hands-on experience in enterprise financial systems architecture and cloud consolidation delivery.`
    );
  };

  const comp = comparisonData?.comparison;
  const jd = comparisonData?.jd;

  // Filtered grounded specs
  const filteredSpecs = (comp?.grounded_specs || []).filter((s) => {
    if (specFilter === 'satisfied') return s.status === 'satisfied';
    if (specFilter === 'mandatory_gaps') return s.status === 'gap' && s.is_mandatory;
    if (specFilter === 'preferred_gaps') return s.status === 'gap' && !s.is_mandatory;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-surface-darkBorder">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>JD & Resume Intelligence Comparison</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Dual AI Verification
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Side-by-side semantic alignment, requirement verification, gap analysis, and tailored interview kit.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleModeChange('single')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === 'single'
                ? 'bg-white dark:bg-surface-darkCard text-navy-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>1-on-1 Deep Compare</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('multi')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === 'multi'
                ? 'bg-white dark:bg-surface-darkCard text-navy-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Multi-Candidate (3)</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('text')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === 'text'
                ? 'bg-white dark:bg-surface-darkCard text-navy-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste / Upload Text</span>
          </button>
        </div>
      </div>

      {/* On-the-Fly / Input Configuration Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-3">
        <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-navy-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>On-the-Fly Job Description & Resume Text Comparison</span>
          </div>
          <button
            type="button"
            onClick={handleLoadSampleText}
            className="text-brand-600 dark:text-brand-400 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
          >
            <span>⚡ Load Sample Text</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Target JD Selection */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Target Job Description *
            </label>
            <select
              value={selectedJdId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedJdId(id);
                runComparison(id, selectedCandidateId, mode);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {jds.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.req_code} — {j.title}
                </option>
              ))}
            </select>
            {mode === 'text' && (
              <textarea
                rows={4}
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste Job Description, specifications, mandatory requirements, and preferred qualifications..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-brand-500 font-mono mt-2"
              />
            )}
          </div>

          {/* Candidate Selection */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Candidate Resume Profile *
            </label>
            <select
              value={selectedCandidateId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedCandidateId(id);
                runComparison(selectedJdId, id, mode);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.candidate_code} — {c.name} ({c.experience}y, {c.location})
                </option>
              ))}
            </select>
            {mode === 'text' && (
              <textarea
                rows={4}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste candidate resume text, project history, core competencies, and profile background..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-brand-500 font-mono mt-2"
              />
            )}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => runComparison(selectedJdId, selectedCandidateId, mode)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Evaluating Model...' : 'Run Deep AI Comparison'}</span>
          </button>
        </div>
      </div>

      {/* Loading Feedback */}
      {loading && !comp && (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-surface-darkBorder space-y-2">
          <Sparkles className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-navy-900 dark:text-white">
            Running Deep AI Grounded Comparison...
          </p>
          <p className="text-[11px] text-slate-400">
            Verifying 16 specifications against candidate evidence with zero hallucination
          </p>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Failed to evaluate comparison: {error}</span>
          </div>
          <button
            type="button"
            onClick={() => runComparison(selectedJdId, selectedCandidateId, mode)}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1-ON-1 DEEP COMPARE RESULTS VIEW */}
      {/* ========================================================================= */}
      {mode === 'single' && comp && (
        <div className="space-y-5">
          {/* Overall Match Verdict Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Big Score Box */}
                <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 font-black shadow-xs">
                  <span className="text-xl font-bold leading-none">{comp.overall_score}%</span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold mt-0.5">MATCH</span>
                </div>

                {/* Classification & Brief */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                      {comp.segment}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 uppercase">
                      {comp.segment}
                    </span>
                    {comp.has_critical_gaps && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                        Critical Gaps
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                    {comp.recruiter_brief}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyBrief}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  {copiedBrief ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBrief ? 'Copied Brief' : 'Copy Brief'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/resumes')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Profile</span>
                </button>
              </div>
            </div>

            {/* 4 Dimension Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  MANDATORY STACK FIT
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-bold text-navy-900 dark:text-white">
                    {comp.metrics.mandatory_stack_fit}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {comp.metrics.mandatory_fraction}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  SEMANTIC COSINE FIT
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-bold text-navy-900 dark:text-white">
                    {comp.metrics.semantic_cosine_fit}
                  </span>
                  <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                    Nemotron
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  EXPERIENCE ALIGNMENT
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-bold text-navy-900 dark:text-white">
                    {comp.metrics.experience_alignment}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {comp.metrics.experience_req}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  LOCATION COMPATIBILITY
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-navy-900 dark:text-white truncate">
                    {comp.metrics.location_text}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {comp.metrics.location_compatibility}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Side-by-Side Detail Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Left Card: Requisition Specification */}
            <div className="p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold text-brand-600 dark:text-brand-400">
                      {jd?.req_code}
                    </span>
                    <span className="text-slate-400 text-[11px]">• {jd?.department}</span>
                  </div>
                  <h3 className="font-bold text-sm text-navy-900 dark:text-white">
                    {jd?.title}
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {jd?.location}
                </span>
              </div>

              {/* Position Architecture */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  POSITION ARCHITECTURE & OVERVIEW
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {jd?.overview}
                </p>
              </div>

              {/* Mandatory Technical Requirements */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    MANDATORY TECHNICAL REQUIREMENTS
                  </span>
                  <span className="text-[10px] font-bold text-rose-600">
                    {jd?.mandatory_skills?.length || 1} REQUIRED
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {jd?.mandatory_skills?.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Preferred Qualifications */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  PREFERRED QUALIFICATIONS & DIFFERENTIATORS
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {jd?.preferred_skills?.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                <span>Total Specifications: {jd?.total_specs_count || 16} Domains</span>
                <span>Experience: {jd?.experience}</span>
              </div>
            </div>

            {/* Right Card: Candidate Profile Breakdown */}
            <div className="p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold text-brand-600 dark:text-brand-400">
                      {comp.candidate_code}
                    </span>
                    <span className="text-slate-400 text-[11px]">• Professional • {comp.total_experience_years} Years Experience</span>
                  </div>
                  <h3 className="font-bold text-sm text-navy-900 dark:text-white">
                    {comp.candidate_name}
                  </h3>
                </div>

                {/* Profile / Raw Resume Tabs */}
                <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setCandidateViewTab('profile')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      candidateViewTab === 'profile'
                        ? 'bg-white dark:bg-surface-darkCard text-navy-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateViewTab('resume')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      candidateViewTab === 'resume'
                        ? 'bg-white dark:bg-surface-darkCard text-navy-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Raw Resume
                  </button>
                </div>
              </div>

              {/* Professional Summary */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  PROFESSIONAL SUMMARY
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {comp.professional_summary}
                </p>
              </div>

              {/* Discovered Candidate Skills */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  DISCOVERED CANDIDATE SKILLS ({comp.discovered_skills?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {comp.discovered_skills?.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                <span>Location: {comp.location}</span>
                <span>Availability: {comp.availability}</span>
              </div>
            </div>
          </div>

          {/* Skills Alignment, Gaps & Transferable Competencies (3 Columns) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>Skills Alignment, Gaps & Transferable Competencies</span>
              </span>
              <span className="text-[11px] text-slate-400">Comparative Skill Matrix</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Matched Core Skills */}
              <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Matched Core Skills</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                    {comp.skills_alignment?.matched_core_skills?.length || 0}
                  </span>
                </div>
                {comp.skills_alignment?.matched_core_skills?.length === 0 ? (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1">
                    No direct mandatory skill overlap detected.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {comp.skills_alignment.matched_core_skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200"
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Missing Skills & Gaps */}
              <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Missing Skills & Gaps</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                    {comp.skills_alignment?.missing_skills_gaps?.length || 0}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {comp.skills_alignment?.missing_skills_gaps?.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 dark:bg-rose-900/70 text-rose-800 dark:text-rose-200"
                    >
                      ✕ {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Transferable Adjacent Skills */}
              <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Transferable Adjacent Skills</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                    {comp.skills_alignment?.transferable_adjacent_skills?.length || 0}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {comp.skills_alignment?.transferable_adjacent_skills?.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-900/70 text-indigo-800 dark:text-indigo-200"
                    >
                      + {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Requirement-by-Requirement Grounded Alignment (Frame 05) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-navy-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-600" />
                  <span>Requirement-by-Requirement Grounded Alignment</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Every JD specification audited against the candidate's verified resume document citations.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSpecFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                    specFilter === 'all'
                      ? 'bg-slate-900 text-white dark:bg-brand-600 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  All ({comp.grounded_specs?.length || 16})
                </button>
                <button
                  type="button"
                  onClick={() => setSpecFilter('satisfied')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                    specFilter === 'satisfied'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Satisfied
                </button>
                <button
                  type="button"
                  onClick={() => setSpecFilter('mandatory_gaps')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                    specFilter === 'mandatory_gaps'
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Mandatory Gaps
                </button>
                <button
                  type="button"
                  onClick={() => setSpecFilter('preferred_gaps')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                    specFilter === 'preferred_gaps'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Preferred Gaps
                </button>
              </div>
            </div>

            {/* List of Grounded Specifications */}
            <div className="space-y-3">
              {filteredSpecs.map((spec, idx) => {
                const isSatisfied = spec.status === 'satisfied';
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            spec.is_mandatory
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {spec.is_mandatory ? 'MANDATORY' : 'PREFERRED'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {spec.category}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                          isSatisfied
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                        }`}
                      >
                        {isSatisfied ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{isSatisfied ? 'SATISFIED' : 'MANDATORY GAP'}</span>
                      </span>
                    </div>

                    <h4 className="font-bold text-navy-900 dark:text-white text-xs">
                      {spec.title}
                    </h4>

                    {/* Citation snippet box */}
                    <div
                      className={`p-2.5 rounded-lg text-[11px] leading-relaxed font-mono ${
                        isSatisfied
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'
                          : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {spec.citation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MULTI-CANDIDATE COMPARISON MATRIX (Frame 07) */}
      {/* ========================================================================= */}
      {mode === 'multi' && comparisonData?.matrix_rows && (
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-navy-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-600" />
                <span>Multi-Candidate Grounded Alignment Matrix (3 Candidates)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Side-by-side verification of all 16 requisition specifications against the top 3 candidates.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900/60 text-[11px] text-slate-500 dark:text-slate-400 uppercase">
                  <th className="py-3 px-4 font-bold">Requirement Specification</th>
                  {comparisonData.candidates.map((c) => (
                    <th key={c.candidate_id} className="py-3 px-4 font-bold text-center">
                      <div className="text-navy-900 dark:text-white font-bold capitalize">
                        {c.candidate_name}
                      </div>
                      <div className="text-[10px] font-normal text-slate-400">
                        {c.overall_score}% Match • {c.total_experience_years}y Exp
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {comparisonData.matrix_rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            row.is_mandatory
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {row.is_mandatory ? 'MANDATORY' : 'PREFERRED'}
                        </span>
                        <span className="text-[10px] text-slate-400">{row.category}</span>
                      </div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {row.title}
                      </div>
                    </td>

                    {row.candidates.map((candStatus, cIdx) => {
                      const isSatisfied = candStatus.status === 'satisfied';
                      return (
                        <td key={cIdx} className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              isSatisfied
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {isSatisfied ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Satisfied</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                <span>Gap</span>
                              </>
                            )}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
