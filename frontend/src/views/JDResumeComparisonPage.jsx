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
  Building2,
  User,
  Star,
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

      const initialJdId = paramJd ? Number(paramJd) : (jdList[0]?.id || '');
      const initialCandId = paramCand ? Number(paramCand) : (candList[0]?.id || '');

      setSelectedJdId(initialJdId);
      setSelectedCandidateId(initialCandId);
      const initialMultiIds = [];
      setSelectedCandidateIds(initialMultiIds);

      // Trigger initial comparison
      if (initialJdId && initialCandId) runComparison(initialJdId, initialCandId, 'single', initialMultiIds);
    } catch (err) {
      console.error('Failed to load comparison targets:', err);
    } finally {
      setLoading(false);
    }
  };

  const runComparison = async (
    jdId,
    candId,
    currentMode = mode,
    candIds = selectedCandidateIds,
    customJd = jdText,
    customResume = resumeText
  ) => {
    try {
      setLoading(true);
      setError(null);
      const payload = {
        mode: currentMode,
      };

      if (currentMode !== 'text') payload.jd_id = jdId || selectedJdId;

      if (currentMode === 'single') {
        payload.candidate_id = candId || selectedCandidateId;
      } else if (currentMode === 'multi') {
        payload.candidate_ids = candIds;
      } else if (currentMode === 'text') {
        payload.jd_text = customJd;
        payload.resume_text = customResume;
        payload.candidate_id = candId || selectedCandidateId;
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
    setError(null);
    if (newMode === 'text') {
      setComparisonData(null);
      setSpecFilter('all');
      return;
    }
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

  const comp = comparisonData?.comparison;
  const jd = comparisonData?.jd;

  // Filtered grounded specs
  const filteredSpecs = (comp?.grounded_specs || []).filter((s) => {
    if (specFilter === 'satisfied') return s.status === 'satisfied';
    if (specFilter === 'mandatory_gaps') return s.status === 'gap' && s.is_mandatory;
    if (specFilter === 'preferred_gaps') return s.status === 'gap' && !s.is_mandatory;
    if (specFilter === 'not_mentioned') return s.status === 'not_mentioned';
    return true;
  });

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-surface-darkBorder">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold text-navy-900 dark:text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-brand-700 dark:text-brand-300" />
              <span>JD & resume comparison</span>
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Compare documented job requirements with evidence from selected resumes
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleModeChange('single')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === 'single'
                ? 'bg-white dark:bg-surface-darkCard text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>1-on-1 Deep Compare</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('multi')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === 'multi'
                ? 'bg-white dark:bg-surface-darkCard text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Multi-candidate</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('text')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === 'text'
                ? 'bg-white dark:bg-surface-darkCard text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste / Upload Text</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: 1-ON-1 SELECTION CARD */}
      {/* ========================================================================= */}
      {mode === 'single' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-3">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="flex-1 min-w-0 w-full space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>SELECT TARGET JOB REQUISITION</span>
              </label>
              <select
                value={selectedJdId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedJdId(id);
                  runComparison(id, selectedCandidateId, 'single');
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer truncate"
              >
                {jds.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.req_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="shrink-0 pt-4 hidden lg:block">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                <GitCompare className="w-4 h-4" />
              </div>
            </div>

            <div className="flex-1 min-w-0 w-full space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>SELECT CANDIDATE RESUME</span>
              </label>
              <select
                value={selectedCandidateId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedCandidateId(id);
                  runComparison(selectedJdId, id, 'single');
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer truncate"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.experience}y, {c.location})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: MULTI-CANDIDATE SELECTION CARD (Exact from Image 1) */}
      {/* ========================================================================= */}
      {mode === 'multi' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-3">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            {/* Target Requisition */}
            <div className="flex-1 min-w-0 w-full space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>SELECT TARGET JOB REQUISITION</span>
              </label>
              <div className="relative">
                <select
                  value={selectedJdId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedJdId(id);
                    runComparison(id, selectedCandidateId, 'multi');
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer truncate"
                >
                  {jds.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.req_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap/Compare Icon */}
            <div className="shrink-0 pt-4 hidden lg:block">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                <GitCompare className="w-4 h-4" />
              </div>
            </div>

            {/* Candidate Resume Multi-Select Pills */}
            <div className="flex-1 min-w-0 w-full space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>SELECT CANDIDATE RESUME</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Select 2 to 5 candidates for side-by-side comparison:
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 min-h-[44px]">
                {candidates.slice(0, 6).map((cand) => {
                  const isSelected = selectedCandidateIds.includes(cand.id);
                  return (
                    <button
                      key={cand.id}
                      type="button"
                      onClick={() => {
                        let nextIds;
                        if (isSelected) {
                          if (selectedCandidateIds.length <= 2) return;
                          nextIds = selectedCandidateIds.filter((id) => id !== cand.id);
                        } else {
                          if (selectedCandidateIds.length >= 5) return;
                          nextIds = [...selectedCandidateIds, cand.id];
                        }
                        setSelectedCandidateIds(nextIds);
                        runComparison(selectedJdId, selectedCandidateId, 'multi', nextIds);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs font-bold'
                          : 'bg-white dark:bg-surface-darkCard text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-surface-darkBorder hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      <span>{cand.name} (γ)</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: PASTE / UPLOAD TEXT CARD (Exact from Image 2) */}
      {/* ========================================================================= */}
      {mode === 'text' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-4">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-navy-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>On-the-Fly Job Description & Resume Text Comparison</span>
            </div>
            <span className="text-xs text-amber-700">Hosted AI is disabled for private recruitment data.</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full min-w-0 text-xs">
            {/* Target Job Description Column */}
            <div className="flex flex-col gap-1.5 w-full min-w-0">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Job Description Text *
                </label>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Senior Technical Lead
                </span>
              </div>
              <textarea
                rows={7}
                value={jdText}
                onChange={(e) => {
                  setJdText(e.target.value);
                  setComparisonData(null);
                  setError(null);
                }}
                placeholder="Paste Job Description, specifications, mandatory requirements, and preferred qualifications..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans resize-y"
              />
            </div>

            {/* Candidate Resume Text Column */}
            <div className="flex flex-col gap-1.5 w-full min-w-0">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Candidate Resume Text *
                </label>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Candidate Profile
                </span>
              </div>
              <textarea
                rows={7}
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                  setComparisonData(null);
                  setError(null);
                }}
                placeholder="Paste candidate resume text, project history, core competencies, and profile background..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans resize-y"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                if (!jdText.trim() || !resumeText.trim()) {
                  setError('Paste both the job description and resume text before comparing.');
                  return;
                }
                runComparison(selectedJdId, selectedCandidateId, 'text');
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Comparing supplied text...' : 'Compare pasted text'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Feedback */}
      {loading && !comp && (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-surface-darkBorder space-y-2">
          <Sparkles className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-navy-900 dark:text-white">
            Comparing supplied text against explicit requirements...
          </p>
          <p className="text-[11px] text-slate-400">
            Checking extracted requirements against text evidence locally; hosted AI is not used.
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
      {/* 1-ON-1 DEEP COMPARE & ON-THE-FLY TEXT RESULTS VIEW */}
      {/* ========================================================================= */}
      {(mode === 'single' || mode === 'text') && comp && (
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
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 uppercase">
                      {comp.segment}
                    </span>
                    {comp.has_critical_gaps && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
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
                {comp.candidate_id && <button
                  type="button"
                  onClick={() => navigate('/resumes')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Profile</span>
                </button>}
              </div>
            </div>

            {/* 4 Dimension Metrics Grid (With Visual Alignment Bars) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder space-y-2">
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
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full"
                    style={{ width: comp.metrics.mandatory_stack_fit || '0%' }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  CONTEXTUAL REVIEW
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-bold text-navy-900 dark:text-white">
                    {comp.metrics.semantic_cosine_fit ?? 'Unavailable'}
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                    Contextual review unavailable
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: comp.metrics.semantic_cosine_fit || '0%' }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  EXPERIENCE ALIGNMENT
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-bold text-navy-900 dark:text-white">
                    {comp.metrics.experience_alignment}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {comp.metrics.experience_req || 'Req: 5-8y'}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  LOCATION COMPATIBILITY
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-navy-900 dark:text-white truncate">
                    {comp.metrics.location_text}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {comp.metrics.location_compatibility}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-full" />
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
                    {jd?.mandatory_skills?.length ?? '—'} required
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
                <span>Total specifications: {jd?.total_specs_count ?? '—'}</span>
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
                  Discovered candidate skills ({comp.discovered_skills?.length ?? '—'})
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
                    {comp.skills_alignment?.matched_core_skills?.length ?? '—'}
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
                    {comp.skills_alignment?.missing_skills_gaps?.length ?? '—'}
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
                    {comp.skills_alignment?.transferable_adjacent_skills?.length ?? '—'}
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
                  All ({comp.grounded_specs?.length ?? '—'})
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
                <button
                  type="button"
                  onClick={() => setSpecFilter('not_mentioned')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                    specFilter === 'not_mentioned'
                      ? 'bg-slate-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Not mentioned
                </button>
              </div>
            </div>

            {/* List of Grounded Specifications */}
            <div className="space-y-3">
              {filteredSpecs.map((spec, idx) => {
                const isSatisfied = spec.status === 'satisfied';
                const isNotMentioned = spec.status === 'not_mentioned';
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
                            : isNotMentioned
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                        }`}
                      >
                        {isSatisfied ? <CheckCircle2 className="w-3 h-3" /> : isNotMentioned ? <AlertCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{isSatisfied ? 'SATISFIED' : isNotMentioned ? 'NOT MENTIONED' : 'MANDATORY GAP'}</span>
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
      {/* MULTI-CANDIDATE COMPARISON MATRIX & CARDS (Exact from Image 1) */}
      {/* ========================================================================= */}
      {mode === 'multi' && comparisonData?.candidates && (
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-5">
          {/* Top Section Header with AI Shortlist Recommendation Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-navy-900 dark:text-white">
                  Multi-Candidate Side-by-Side Comparison Matrix
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluating {comparisonData.candidates.length} selected candidates against {jd?.title || 'the selected requisition'}
              </p>
            </div>

            {/* AI Shortlist Recommendation Box */}
            {comparisonData.candidates.length > 0 && (() => {
              const sorted = [...comparisonData.candidates].sort((a, b) => b.overall_score - a.overall_score);
              const topCand = sorted[0];
              const gaps = topCand.critical_gaps_count;
              return (
                <div className="p-3 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 text-xs max-w-xl">
                  <div className="flex items-center gap-1.5 font-bold mb-0.5 text-emerald-800 dark:text-emerald-300 text-xs">
                    <span className="text-amber-500">★</span>
                    <span>Highest score (review required)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
                    <strong className="font-semibold">{topCand.candidate_name}</strong> has the highest score at <strong className="font-semibold">{topCand.overall_score}% ({topCand.segment || '—'})</strong>. Experience: {topCand.total_experience_years ?? '—'} years. Mandatory gaps: {gaps ?? '—'}.
                  </p>
                </div>
              );
            })()}
          </div>

          {/* 3 Candidate Cards in Side-by-Side Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
            {comparisonData.candidates.map((cand, idx) => {
              const maxScore = Math.max(...comparisonData.candidates.map((c) => c.overall_score));
              const isTop = cand.overall_score === maxScore && maxScore > 0;
              const gaps = cand.critical_gaps_count;

              return (
                <div
                  key={cand.candidate_id || idx}
                  className={`relative p-5 rounded-2xl bg-white dark:bg-surface-darkCard transition-all flex flex-col justify-between space-y-4 ${
                    isTop
                      ? 'border-2 border-emerald-500 shadow-sm'
                      : 'border border-slate-200/80 dark:border-surface-darkBorder'
                  }`}
                >
                  {isTop && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold tracking-wide uppercase shadow-xs whitespace-nowrap">
                      Top Recommendation
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Score & Verdict Row */}
                    <div className="flex items-start justify-between">
                      <span className="text-3xl font-extrabold text-navy-900 dark:text-white leading-none">
                        {cand.overall_score}%
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                          cand.overall_score >= 50
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {cand.overall_score >= 50 ? 'Partial Match' : 'Needs Review'}
                      </span>
                    </div>

                    {/* Candidate Name & Current Role */}
                    <div>
                      <h4 className="font-bold text-sm text-navy-900 dark:text-white">
                        {cand.candidate_name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {cand.current_title || '—'}
                      </p>
                    </div>

                    {/* Key-Value Metadata */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Experience:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {cand.total_experience_years ?? '—'} yrs
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Mandatory Gaps:</span>
                        <span className="font-bold text-rose-600">
                          {gaps}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Location:</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                          {cand.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deep 1-on-1 Compare Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCandidateId(cand.candidate_id);
                      handleModeChange('single');
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    Compare candidate
                  </button>
                </div>
              );
            })}
          </div>

          {/* Matrix Rows Table */}
          {comparisonData.matrix_rows && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Detailed Requirement Alignment
              </h4>
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
      )}
    </div>
  );
}
