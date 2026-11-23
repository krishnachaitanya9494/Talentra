import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Download,
  Briefcase,
  CheckCircle2,
  Users,
  ChevronDown,
  Layers,
  Shield,
  Eye,
  CheckSquare,
  Square,
  AlertCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { MetricCard } from '../components/layout/MetricCard';
import { Badge } from '../components/common/Badge';
import { MatchExplanationModal } from '../components/matching/MatchExplanationModal';
import { CandidateIntelligenceModal } from '../components/documents/CandidateIntelligenceModal';
import { AssignCandidatesModal } from '../components/assignments/AssignCandidatesModal';
import {
  getRepositoryJDs,
  triggerMatchingRun,
  getMatchingRuns,
  getMatchingRunDetails,
  getMatchedCandidates,
  getExportMatchesCsvUrl,
} from '../services/api';

/**
 * TALENTRA Phase 3: Intelligent Candidate Matching & Segmentation Workspace.
 *
 * Provides end-to-end requisition-to-candidate deterministic matching,
 * multi-tier segmentation (Strong, Potential, Partial, Not Suitable),
 * granular explainability evidence, and secure CSV export.
 */
export default function MatchingPage() {
  const [jds, setJds] = useState([]);
  const [selectedJdId, setSelectedJdId] = useState('');
  const [currentRun, setCurrentRun] = useState(null);
  const [matchedCandidates, setMatchedCandidates] = useState([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [loadingJds, setLoadingJds] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Filters & Pagination
  const [activeSegment, setActiveSegment] = useState(''); // '' = All
  const [searchQuery, setSearchQuery] = useState('');
  const [minExp, setMinExp] = useState('');
  const [maxExp, setMaxExp] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Role privacy toggle ('recruiter' vs 'viewer')
  const [userRole, setUserRole] = useState('recruiter');

  // Modals & Selection
  const [inspectingMatchId, setInspectingMatchId] = useState(null);
  const [inspectingCandidateId, setInspectingCandidateId] = useState(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(new Set());
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // 1. Load available Job Descriptions on mount
  useEffect(() => {
    loadJDs();
  }, []);

  const loadJDs = async () => {
    try {
      setLoadingJds(true);
      const res = await getRepositoryJDs({ page_size: 50 });
      const items = res.items || [];
      setJds(items);
      if (items.length > 0 && !selectedJdId) {
        setSelectedJdId(items[0].id);
      }
    } catch (err) {
      console.error('Failed to load job descriptions:', err);
    } finally {
      setLoadingJds(false);
    }
  };

  // 2. Load most recent matching run when selected JD changes
  useEffect(() => {
    if (selectedJdId) {
      loadLatestRunForJD(selectedJdId);
    }
  }, [selectedJdId]);

  const loadLatestRunForJD = async (jdId) => {
    try {
      const runsRes = await getMatchingRuns();
      const runForJd = runsRes.items.find((r) => r.jd_id === Number(jdId));
      if (runForJd) {
        setCurrentRun(runForJd);
        fetchCandidatesForRun(runForJd.id);
      } else {
        // Auto-run matching if this JD hasn't been evaluated yet
        setEvaluating(true);
        const res = await triggerMatchingRun(Number(jdId));
        setCurrentRun(res);
        fetchCandidatesForRun(res.run_id);
      }
    } catch (err) {
      console.error('Failed to load runs for JD:', err);
    } finally {
      setEvaluating(false);
    }
  };

  // 3. Trigger new matching evaluation
  const handleRunMatching = async () => {
    if (!selectedJdId) return;
    try {
      setEvaluating(true);
      const res = await triggerMatchingRun(Number(selectedJdId));
      setCurrentRun(res);
      setPage(1);
      setActiveSegment('');
      await fetchCandidatesForRun(res.run_id);
    } catch (err) {
      console.error('Matching run failed:', err);
      alert('Matching run failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setEvaluating(false);
    }
  };

  // 4. Fetch matched candidates with active filters
  const fetchCandidatesForRun = async (runId) => {
    if (!runId) return;
    try {
      setLoadingCandidates(true);
      const params = {
        page,
        page_size: pageSize,
        role: userRole,
      };
      if (activeSegment) params.segment = activeSegment;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (minExp !== '') params.min_exp = Number(minExp);
      if (maxExp !== '') params.max_exp = Number(maxExp);

      const res = await getMatchedCandidates(runId, params);
      setMatchedCandidates(res.items || []);
      setTotalCandidates(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch matched candidates:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    if (currentRun?.id || currentRun?.run_id) {
      const runId = currentRun.id || currentRun.run_id;
      fetchCandidatesForRun(runId);
    }
  }, [page, activeSegment, searchQuery, minExp, maxExp, userRole]);

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedCandidateIds.size === matchedCandidates.length) {
      setSelectedCandidateIds(new Set());
    } else {
      setSelectedCandidateIds(new Set(matchedCandidates.map((c) => c.candidate_id)));
    }
  };

  const handleToggleCandidate = (id) => {
    const next = new Set(selectedCandidateIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCandidateIds(next);
  };

  const getSegmentVariant = (segment) => {
    switch (segment) {
      case 'Strong Match': return 'emerald';
      case 'Potential Match': return 'blue';
      case 'Partial Match': return 'amber';
      case 'Not Suitable': return 'rose';
      default: return 'neutral';
    }
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300';
    if (score >= 65) return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-300';
    if (score >= 45) return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-300';
    return 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-300';
  };

  const selectedJdObj = jds.find((j) => j.id === Number(selectedJdId));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title="Candidate matching"
        subtitle="Review candidates against the selected requisition using documented criteria"
        actions={
          <div className="flex items-center gap-2">
            {/* Role Privacy Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setUserRole('recruiter')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  userRole === 'recruiter'
                    ? 'bg-white dark:bg-surface-darkCard text-brand-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Recruiter View
              </button>
              <button
                type="button"
                onClick={() => setUserRole('viewer')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  userRole === 'viewer'
                    ? 'bg-white dark:bg-surface-darkCard text-brand-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Viewer (Masked)
              </button>
            </div>

            {/* Export CSV Button */}
            {currentRun && (
              <a
                href={getExportMatchesCsvUrl(currentRun.id || currentRun.run_id, activeSegment, userRole)}
                download
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-medium shadow-subtle transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </a>
            )}
          </div>
        }
      />

      {/* Requisition Selector & Match Execution Bar */}
      <div className="p-5 bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[280px]">
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
          Select a job requisition
          </label>
          <div className="relative">
            <select
              value={selectedJdId}
              onChange={(e) => setSelectedJdId(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/70 dark:bg-slate-900/40 text-navy-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {jds.map((jd) => (
                <option key={jd.id} value={jd.id}>
                  {jd.title || jd.original_filename} ({jd.req_code || jd.doc_id})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 sm:pt-0">
          <button
            type="button"
            onClick={handleRunMatching}
            disabled={evaluating || !selectedJdId}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
            <span>{evaluating ? 'Finding Matching Candidates...' : 'Find Matching Candidates'}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      {currentRun && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <MetricCard
            title="Evaluated"
            value={currentRun.total_evaluated}
            unit="candidates"
            isSelected={activeSegment === ''}
            onClick={() => setActiveSegment('')}
          />
          <MetricCard
            title="Strong matches"
            value={currentRun.strong_matches}
            unit="candidates"
            isSelected={activeSegment === 'Strong Match'}
            onClick={() => setActiveSegment('Strong Match')}
          />
          <MetricCard
            title="Potential matches"
            value={currentRun.potential_matches}
            unit="candidates"
            isSelected={activeSegment === 'Potential Match'}
            onClick={() => setActiveSegment('Potential Match')}
          />
          <MetricCard
            title="Partial matches"
            value={currentRun.partial_matches}
            unit="candidates"
            isSelected={activeSegment === 'Partial Match'}
            onClick={() => setActiveSegment('Partial Match')}
          />
          <MetricCard
            title="Not suitable"
            value={currentRun.not_suitable}
            unit="candidates"
            isSelected={activeSegment === 'Not Suitable'}
            onClick={() => setActiveSegment('Not Suitable')}
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Segment Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['', 'Strong Match', 'Potential Match', 'Partial Match', 'Not Suitable'].map((seg) => (
            <button
              key={seg}
              type="button"
              onClick={() => { setActiveSegment(seg); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                activeSegment === seg
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {seg || 'All Segments'}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search candidate, role, or skill..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/70 dark:bg-slate-900/40 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Matched Candidates Table */}
      <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-surface-darkBorder text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  <button onClick={handleSelectAll} className="cursor-pointer">
                    {selectedCandidateIds.size > 0 && selectedCandidateIds.size === matchedCandidates.length ? (
                      <CheckSquare className="w-4 h-4 text-brand-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-4">Candidate Profile</th>
                <th className="py-3 px-4">Match Score</th>
                <th className="py-3 px-4">Segment</th>
                <th className="py-3 px-4">Matched Skills</th>
                <th className="py-3 px-4">Experience</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Intelligence Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
              {loadingCandidates ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    <span>Loading matched candidates...</span>
                  </td>
                </tr>
              ) : matchedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-brand-400 opacity-60" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      {currentRun ? 'No candidates matched the selected filters.' : 'No matching run recorded for this JD.'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {currentRun ? 'Try widening your search or segment filters.' : 'Click "Run Matching Engine" above to evaluate all indexed talent against this JD.'}
                    </p>
                  </td>
                </tr>
              ) : (
                matchedCandidates.map((cand) => {
                  const isSelected = selectedCandidateIds.has(cand.candidate_id);
                  return (
                    <tr
                      key={cand.match_id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${
                        isSelected ? 'bg-brand-50/20 dark:bg-brand-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleCandidate(cand.candidate_id)}
                          className="cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-brand-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-400">
                        #{cand.rank}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-navy-900 dark:text-white truncate">
                          {cand.candidate_name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {cand.current_title} {cand.current_company ? `• ${cand.current_company}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block font-extrabold text-xs px-2.5 py-0.5 rounded-lg border ${getScoreBadgeClass(cand.overall_score)}`}>
                          {cand.overall_score} pts
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant={getSegmentVariant(cand.segment)} size="sm">
                          {cand.segment}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {cand.matched_skills.slice(0, 3).map((s, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70"
                            >
                              {s}
                            </span>
                          ))}
                          {cand.matched_skills.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{cand.matched_skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                        {cand.total_experience_years !== null ? `${cand.total_experience_years} yrs` : '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-xs">
                        {cand.location}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectingMatchId(cand.match_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50/80 dark:bg-brand-950/50 hover:bg-brand-100 rounded-lg transition-colors cursor-pointer"
                            title="Inspect transparent 7-dimension match evidence"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                            <span>Explain Match</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setInspectingCandidateId(cand.candidate_id)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Open Full Candidate Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalCandidates > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-surface-darkBorder text-xs text-slate-500">
            <span>
              Showing {Math.min(totalCandidates, (page - 1) * pageSize + 1)} to{' '}
              {Math.min(totalCandidates, page * pageSize)} of {totalCandidates} Matched Candidates
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-surface-darkBorder disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * pageSize >= totalCandidates}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-surface-darkBorder disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Selection Floating Bar with Manual TA Assignment */}
      {selectedCandidateIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-navy-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-fade-in border border-slate-700 text-xs">
          <span className="font-bold">
            {selectedCandidateIds.size} Candidate{selectedCandidateIds.size > 1 ? 's' : ''} Selected
          </span>
          <button
            onClick={() => setSelectedCandidateIds(new Set())}
            className="text-slate-300 hover:text-white underline cursor-pointer"
          >
            Clear Selection
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-all cursor-pointer shadow-sm"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Assign to TA</span>
          </button>
        </div>
      )}

      {/* Manual TA Assignment Modal */}
      <AssignCandidatesModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        candidateIds={Array.from(selectedCandidateIds)}
        jdId={selectedJdId}
        jdTitle={selectedJdObj?.original_filename}
        onSuccess={() => {
          setSelectedCandidateIds(new Set());
        }}
      />

      {/* Match Explanation Modal */}
      <MatchExplanationModal
        matchId={inspectingMatchId}
        isOpen={!!inspectingMatchId}
        onClose={() => setInspectingMatchId(null)}
      />

      {/* Candidate Profile Modal */}
      <CandidateIntelligenceModal
        candidateId={inspectingCandidateId}
        isOpen={!!inspectingCandidateId}
        onClose={() => setInspectingCandidateId(null)}
      />
    </div>
  );
}
