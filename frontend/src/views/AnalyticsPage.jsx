import React, { useState, useEffect } from 'react';
import {
  Clock,
  Users,
  Briefcase,
  CheckCircle,
  Download,
  RefreshCw,
  Filter,
  ChevronDown,
  Layers,
} from 'lucide-react';
import axios from 'axios';

/**
 * AnalyticsPage Component (TALENTRA Phase 6).
 *
 * Full recruitment operations intelligence hub:
 * - Executive Overview KPIs with trend metrics
 * - Sequential 9-Stage Recruitment Conversion Funnel with interactive visual drop-offs
 * - Turnaround Time (TAT) Tracking evaluated against the 30-Minute Operational Target
 * - Recruiter Performance Scorecard & Workload Distribution
 * - Per-Requisition Pipeline Lifecycle Progress
 * - Multi-category CSV Export
 */
export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Analytics Data
  const [overview, setOverview] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [tat, setTat] = useState(null);
  const [taPerformance, setTaPerformance] = useState([]);
  const [jdPipelines, setJdPipelines] = useState([]);
  const [selectedJdFilter, setSelectedJdFilter] = useState('');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedJdFilter]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const jdQuery = selectedJdFilter ? `?jd_id=${selectedJdFilter}` : '';

      const [overviewRes, funnelRes, tatRes, taRes, jdRes] = await Promise.all([
        axios.get('/api/v1/analytics/overview'),
        axios.get(`/api/v1/analytics/funnel${jdQuery}`),
        axios.get(`/api/v1/analytics/tat${jdQuery}`),
        axios.get('/api/v1/analytics/ta-performance'),
        axios.get('/api/v1/analytics/jd-pipelines'),
      ]);

      setOverview(overviewRes.data.data);
      setFunnel(funnelRes.data.stages || []);
      setTat(tatRes.data.data);
      setTaPerformance(taRes.data.items || []);
      setJdPipelines(jdRes.data.items || []);
    } catch (err) {
      console.error('Failed to load recruitment analytics:', err);
      setError('Could not retrieve analytics data.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = (type) => {
    window.open(`/api/v1/analytics/export/csv?export_type=${type}`, '_blank');
    setExportMenuOpen(false);
  };

  const withinTargetPct = tat?.metrics?.within_target_percent;
  const qualifiedMatches =
    overview?.strong_matches != null && overview?.potential_matches != null
      ? overview.strong_matches + overview.potential_matches
      : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold text-navy-900 dark:text-white">
              Recruitment analytics
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pipeline progress, turnaround times, and recruiter workload
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Requisition Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedJdFilter}
              onChange={(e) => setSelectedJdFilter(e.target.value)}
              className="text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-surface-dark text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="">All Requisitions ({jdPipelines.length})</option>
              {jdPipelines.map((j) => (
                <option key={j.jd_id} value={j.jd_id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder rounded-lg hover:bg-slate-50 dark:hover:bg-surface-darkHover transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-brand-700 hover:bg-brand-800 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder rounded-xl shadow-xl py-1 z-30 animate-fade-in">
                <button
                  type="button"
                  onClick={() => handleExportCsv('overview')}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Overview & Pipelines CSV
                </button>
                <button
                  type="button"
                  onClick={() => handleExportCsv('funnel')}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Recruitment Funnel CSV
                </button>
                <button
                  type="button"
                  onClick={() => handleExportCsv('tat')}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Turnaround Time (TAT) CSV
                </button>
                <button
                  type="button"
                  onClick={() => handleExportCsv('ta_performance')}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  TA Workload & Performance CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && !overview && (
        <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Loading analytics…</p>
      )}
      {error && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          <span>{error}</span>
          <button type="button" onClick={fetchAnalytics} className="font-medium underline underline-offset-2">
            Try again
          </button>
        </div>
      )}

      {/* SECTION 1: OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Job Requisitions</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-navy-900 dark:text-white font-mono">
              {overview?.total_jds ?? '—'}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">{overview?.active_jds ?? '—'} active</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Indexed Candidates</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-navy-900 dark:text-white font-mono">
              {overview?.total_candidates ?? '—'}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">{overview?.assigned_candidates ?? '—'} assigned</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Qualified Matches</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {qualifiedMatches ?? '—'}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{overview?.strong_matches ?? '—'} strong</span>
            <span>{overview?.potential_matches ?? '—'} potential</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Candidate Response Rate</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 font-mono">
              {overview?.response_rate_percent ?? '—'}{overview?.response_rate_percent == null ? '' : '%'}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{overview?.candidate_replies ?? '—'} replies</span>
            <span>{overview?.shortlisted_candidates ?? '—'} shortlisted</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">30-Min SLA Adherence</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400 font-mono">
              {withinTargetPct ?? '—'}{withinTargetPct == null ? '' : '%'}
            </span>
            {withinTargetPct != null && <span className="text-xs font-medium text-slate-500">within target</span>}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Avg: {tat?.metrics?.average_minutes ?? '—'}m</span>
            <span>Target: &le;30m</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: 9-STAGE RECRUITMENT CONVERSION FUNNEL */}
      <div className="p-6 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-darkBorder pb-4">
          <div>
            <h2 className="text-sm font-bold text-navy-900 dark:text-white font-display flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              9-Stage Recruitment Conversion Funnel
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic step-to-step progression from Job Description ingestion through candidate shortlisting
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
            {funnel.length} Lifecycle Stages
          </span>
        </div>

        {/* Visual Funnel Progression */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2.5">
          {funnel.map((stage, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === funnel.length - 1;
            const isTarget = stage.key === 'shortlisted' || stage.key === 'candidate_replies';
            return (
              <div
                key={stage.key}
                className={`relative p-3.5 rounded-xl border flex flex-col justify-between transition hover:shadow-md ${
                  isLast
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                    : isTarget
                    ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800'
                    : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-surface-darkBorder'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 truncate mb-1">
                    <span className="truncate">{stage.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-navy-900 dark:text-white font-mono">
                    {stage.count}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block">{stage.unit}</span>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">Step conversion:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {stage.step_conversion_percent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLast ? 'bg-emerald-500' : isTarget ? 'bg-purple-500' : 'bg-brand-600'
                      }`}
                      style={{ width: `${Math.min(stage.step_conversion_percent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: TURNAROUND TIME (TAT) INTELLIGENCE & 30-MIN TARGET */}
      <div className="p-6 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-surface-darkBorder">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-navy-900 dark:text-white font-display flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Turnaround Time (TAT) Intelligence &bull; 30-Minute Operational SLA Target
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Target: &le; 30.0 min
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Measuring active pipeline velocity from Requisition Ingestion to First Candidate Personalized Outreach
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              {tat?.metrics?.within_target_count ?? '—'} requisitions within target
            </span>
          </div>
        </div>

        {/* Statistical Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-surface-darkBorder">
            <span className="text-xs text-slate-500 font-medium">Average Total TAT</span>
            <div className="text-2xl font-bold font-mono text-navy-900 dark:text-white mt-1">
              {tat?.metrics?.average_minutes ?? '—'} <span className="text-xs font-normal text-slate-400">min</span>
            </div>
            <span className="text-sm text-slate-500">Average pipeline time</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-surface-darkBorder">
            <span className="text-xs text-slate-500 font-medium">Median Velocity</span>
            <div className="text-2xl font-bold font-mono text-navy-900 dark:text-white mt-1">
              {tat?.metrics?.median_minutes ?? '—'} <span className="text-xs font-normal text-slate-400">min</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">50th percentile delivery</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-surface-darkBorder">
            <span className="text-xs text-slate-500 font-medium">Fastest Requisition</span>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {tat?.metrics?.fastest_minutes ?? '—'} <span className="text-xs font-normal text-slate-400">min</span>
            </div>
            <span className="text-sm text-slate-500">Fastest recorded time</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-surface-darkBorder">
            <span className="text-xs text-slate-500 font-medium">Upper Bound (Slowest)</span>
            <div className="text-2xl font-bold font-mono text-slate-700 dark:text-slate-300 mt-1">
              {tat?.metrics?.slowest_minutes ?? '—'} <span className="text-xs font-normal text-slate-400">min</span>
            </div>
            <span className="text-sm text-slate-500">Slowest recorded time</span>
          </div>
        </div>

        {/* Milestone Duration Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-surface-darkBorder space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
            <span>Granular Milestone Duration Breakdown:</span>
            <span className="font-mono text-slate-500">Average: {tat?.metrics?.average_minutes ?? '—'}m / 30m</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">1. Ingestion &rarr; Parsing</span>
              <div className="flex items-baseline justify-between">
                <span className="font-mono font-bold text-navy-900 dark:text-white text-base">
                  {tat?.granular_breakdown_minutes?.avg_jd_to_parsing ?? '—'} min
                </span>
                <span className="text-[10px] text-emerald-600 font-mono">&lt; 5m Target</span>
              </div>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">2. Parsing &rarr; Matching</span>
              <div className="flex items-baseline justify-between">
                <span className="font-mono font-bold text-navy-900 dark:text-white text-base">
                  {tat?.granular_breakdown_minutes?.avg_parsing_to_matching ?? '—'} min
                </span>
                <span className="text-[10px] text-emerald-600 font-mono">&lt; 5m Target</span>
              </div>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">3. Matching &rarr; TA Assign</span>
              <div className="flex items-baseline justify-between">
                <span className="font-mono font-bold text-navy-900 dark:text-white text-base">
                  {tat?.granular_breakdown_minutes?.avg_matching_to_assignment ?? '—'} min
                </span>
                <span className="text-[10px] text-emerald-600 font-mono">&lt; 10m Target</span>
              </div>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">4. Assign &rarr; Outreach</span>
              <div className="flex items-baseline justify-between">
                <span className="font-mono font-bold text-navy-900 dark:text-white text-base">
                  {tat?.granular_breakdown_minutes?.avg_assignment_to_outreach ?? '—'} min
                </span>
                <span className="text-[10px] text-emerald-600 font-mono">&lt; 10m Target</span>
              </div>
            </div>
          </div>
        </div>

        {/* Requisition TAT Audit Table */}
        {tat?.records && tat.records.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
              Requisition-Level TAT Audit Log:
            </h3>
            <div className="overflow-x-auto border border-slate-200 dark:border-surface-darkBorder rounded-xl bg-white dark:bg-surface-dark">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-surface-darkBorder bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Requisition</th>
                    <th className="py-2.5 px-3">Parsing</th>
                    <th className="py-2.5 px-3">Matching</th>
                    <th className="py-2.5 px-3">Assignment</th>
                    <th className="py-2.5 px-3">Outreach</th>
                    <th className="py-2.5 px-3">Total TAT</th>
                    <th className="py-2.5 px-3 text-right">SLA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                  {tat.records.map((r) => (
                    <tr key={r.jd_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-navy-900 dark:text-white max-w-xs truncate" title={r.jd_title}>
                        <div className="flex flex-col">
                          <span className="truncate">{r.jd_title}</span>
                          <span className="font-mono text-[10px] text-slate-400 font-normal">{r.jd_code}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{r.parsing_minutes ?? '—'}m</td>
                      <td className="py-2.5 px-3 font-mono">{r.matching_minutes ?? '—'}m</td>
                      <td className="py-2.5 px-3 font-mono">{r.assignment_minutes ?? '—'}m</td>
                      <td className="py-2.5 px-3 font-mono">{r.outreach_minutes ?? '—'}m</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">
                        {r.total_tat_minutes ?? r.jd_to_outreach_minutes ?? '—'} min
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {r.status ?? '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: TA SPECIALIST PRODUCTIVITY SCOREBOARD */}
      <div className="p-6 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle space-y-4">
        <div>
          <h2 className="text-sm font-bold text-navy-900 dark:text-white font-display flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Talent Acquisition Specialist Productivity & Workload
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Balanced recruiter workload distribution, verified candidate contacts, and inbound response rates
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">TA Specialist</th>
                <th className="py-3 px-4">Specialization</th>
                <th className="py-3 px-4">Active Queue</th>
                <th className="py-3 px-4">Contacted</th>
                <th className="py-3 px-4">Inbound Replies</th>
                <th className="py-3 px-4">Shortlisted</th>
                <th className="py-3 px-4">Workload Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder text-slate-700 dark:text-slate-200">
              {taPerformance.map((ta) => (
                <tr key={ta.ta_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-semibold text-navy-900 dark:text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                        {ta.ta_name?.charAt(0) || 'R'}
                      </div>
                      <div className="flex flex-col">
                        <span>{ta.ta_name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{ta.ta_email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {ta.specialization}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold">
                    {ta.active_assignments} active
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-800 dark:text-slate-100">
                    {ta.contacted_candidates}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-purple-600 dark:text-purple-400">
                    {ta.candidate_replies} ({ta.candidate_response_rate_percent}%)
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {ta.shortlisted_candidates}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-brand-600 h-full rounded-full"
                          style={{ width: `${ta.workload_share_percent}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">
                        {ta.workload_share_percent}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5: REQUISITION PIPELINES */}
      <div className="p-6 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle space-y-4">
        <div>
          <h2 className="text-sm font-bold text-navy-900 dark:text-white font-display flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            Requisition Pipeline Lifecycle Progress
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Per-job matching distribution, active TA ownership, candidate contact progression, and shortlisted counts
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Requisition Title</th>
                <th className="py-3 px-4">Evaluated Talent</th>
                <th className="py-3 px-4">Strong</th>
                <th className="py-3 px-4">Potential</th>
                <th className="py-3 px-4">Assigned</th>
                <th className="py-3 px-4">Outreach</th>
                <th className="py-3 px-4">Replies</th>
                <th className="py-3 px-4">Shortlisted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder text-slate-700 dark:text-slate-200">
              {jdPipelines.map((jd) => (
                <tr key={jd.jd_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-semibold text-navy-900 dark:text-white max-w-xs truncate" title={jd.title}>
                    <div className="flex flex-col">
                      <span className="truncate">{jd.title}</span>
                      <span className="font-mono text-[10px] text-slate-400 font-normal">{jd.jd_code}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono">{jd.total_evaluated}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {jd.strong_matches}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-blue-600 dark:text-blue-400">
                    {jd.potential_matches}
                  </td>
                  <td className="py-3.5 px-4 font-mono">{jd.assigned_count}</td>
                  <td className="py-3.5 px-4 font-mono">{jd.contacted_count}</td>
                  <td className="py-3.5 px-4 font-mono text-purple-600 dark:text-purple-400 font-semibold">
                    {jd.reply_count}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {jd.shortlisted_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
