import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  UserCheck,
  RefreshCw,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  ChevronDown,
  History,
  Eye,
  AlertCircle,
  ArrowRightLeft,
  UserMinus,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { MetricCard } from '../components/layout/MetricCard';
import { Badge } from '../components/common/Badge';
import { AssignmentHistoryModal } from '../components/assignments/AssignmentHistoryModal';
import { CandidateIntelligenceModal } from '../components/documents/CandidateIntelligenceModal';
import {
  getManagerOverview,
  getTADirectory,
  listAssignments,
  reassignCandidate,
  unassignCandidate,
  updateAssignmentStatus,
  getExportAssignmentsCsvUrl,
  getRepositoryJDs,
} from '../services/api';

/**
 * TALENTRA Phase 4: Candidate Distribution & TA Ownership Workspace.
 *
 * Dedicated environment for Recruitment Managers and Talent Acquisition Specialists
 * to track active candidate queues, manage status lifecycles, reassign ownership,
 * and view workload metrics.
 */
export default function AssignmentsPage() {
  const [overview, setOverview] = useState(null);
  const [tas, setTas] = useState([]);
  const [jds, setJds] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Filters
  const [selectedTaId, setSelectedTaId] = useState('');
  const [selectedJdId, setSelectedJdId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState('recruiter');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Modals & Reassignment state
  const [inspectingHistoryId, setInspectingHistoryId] = useState(null);
  const [inspectingCandidateId, setInspectingCandidateId] = useState(null);
  const [reassigningAssignment, setReassigningAssignment] = useState(null);
  const [newTaForReassign, setNewTaForReassign] = useState('');
  const [reassignNote, setReassignNote] = useState('');
  const [reassignSubmitting, setReassignSubmitting] = useState(false);

  useEffect(() => {
    loadOverviewAndMeta();
  }, []);

  const loadOverviewAndMeta = async () => {
    try {
      setLoadingOverview(true);
      const [ov, taRes, jdRes] = await Promise.all([
        getManagerOverview(),
        getTADirectory(),
        getRepositoryJDs({ page_size: 50 }),
      ]);
      setOverview(ov);
      setTas(taRes.items || []);
      setJds(jdRes.items || []);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [selectedTaId, selectedJdId, selectedStatus, searchQuery, userRole, page]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        page_size: pageSize,
        role: userRole,
      };
      if (selectedTaId) params.ta_id = Number(selectedTaId);
      if (selectedJdId) params.jd_id = Number(selectedJdId);
      if (selectedStatus) params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await listAssignments(params);
      setAssignments(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (assignmentId, newStatus) => {
    try {
      await updateAssignmentStatus(assignmentId, newStatus);
      await fetchAssignments();
      await loadOverviewAndMeta();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Status update failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleUnassign = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to unassign this candidate?')) return;
    try {
      await unassignCandidate(assignmentId);
      await fetchAssignments();
      await loadOverviewAndMeta();
    } catch (err) {
      console.error('Failed to unassign:', err);
      alert('Unassignment failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleConfirmReassign = async (e) => {
    e.preventDefault();
    if (!reassigningAssignment || !newTaForReassign) return;
    try {
      setReassignSubmitting(true);
      await reassignCandidate(reassigningAssignment.assignment_id, Number(newTaForReassign), reassignNote.trim() || null);
      setReassigningAssignment(null);
      setNewTaForReassign('');
      setReassignNote('');
      await fetchAssignments();
      await loadOverviewAndMeta();
    } catch (err) {
      console.error('Reassign failed:', err);
      alert('Reassign failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setReassignSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Shortlisted':
      case 'Completed':
        return <Badge variant="emerald" size="sm">{status}</Badge>;
      case 'Contacted':
      case 'Interested':
        return <Badge variant="blue" size="sm">{status}</Badge>;
      case 'Follow-up Required':
      case 'On Hold':
        return <Badge variant="amber" size="sm">{status}</Badge>;
      case 'Rejected':
      case 'Not Interested':
        return <Badge variant="rose" size="sm">{status}</Badge>;
      default:
        return <Badge variant="brand" size="sm">{status}</Badge>;
    }
  };

  const allStatuses = [
    'Assigned',
    'Contact Pending',
    'Contacted',
    'Follow-up Required',
    'Interested',
    'Not Interested',
    'Shortlisted',
    'Rejected',
    'On Hold',
    'Completed',
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Candidate assignments"
        subtitle="Review recruiter queues and update candidate progress"
        actions={
          <div className="flex items-center gap-2">
            {/* Role Toggle */}
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

            {/* Export CSV */}
            <a
              href={getExportAssignmentsCsvUrl({
                ta_id: selectedTaId,
                jd_id: selectedJdId,
                status: selectedStatus,
                role: userRole,
              })}
              download
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-medium shadow-subtle transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
          </div>
        }
      />

      {/* KPI Metric Cards */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <MetricCard
            title="Active recruiters"
            value={overview.total_active_tas}
            unit="recruiters"
          />
          <MetricCard
            title="Assigned"
            value={overview.total_active_assignments}
            unit="candidates"
            isSelected={selectedStatus === ''}
            onClick={() => setSelectedStatus('')}
          />
          <MetricCard
            title="Contacted"
            value={overview.contacted_count}
            unit="candidates"
            isSelected={selectedStatus === 'Contacted'}
            onClick={() => setSelectedStatus('Contacted')}
          />
          <MetricCard
            title="Shortlisted"
            value={overview.shortlisted_count}
            unit="candidates"
            isSelected={selectedStatus === 'Shortlisted'}
            onClick={() => setSelectedStatus('Shortlisted')}
          />
          <MetricCard
            title="Follow-up needed"
            value={overview.pending_followup}
            unit="candidates"
            isSelected={selectedStatus === 'Follow-up Required'}
            onClick={() => setSelectedStatus('Follow-up Required')}
          />
        </div>
      )}

      {/* TA Team Workload Summary Rail */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {tas.map((ta) => {
          const isSelected = Number(selectedTaId) === ta.id;
          return (
            <div
              key={ta.id}
              onClick={() => setSelectedTaId(isSelected ? '' : String(ta.id))}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/25 shadow-xs'
                  : 'bg-white dark:bg-surface-darkCard border-slate-200/80 dark:border-surface-darkBorder hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-navy-900 dark:text-white truncate">
                  {ta.full_name}
                </span>
                <span className="font-extrabold text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                  {ta.active_assignments} queue
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {ta.team}
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {ta.technical_specialization}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* TA Filter */}
          <select
            value={selectedTaId}
            onChange={(e) => { setSelectedTaId(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/70 dark:bg-slate-900/40 text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="">All TAs</option>
            {tas.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>

          {/* JD Filter */}
          <select
            value={selectedJdId}
            onChange={(e) => { setSelectedJdId(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/70 dark:bg-slate-900/40 text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 max-w-xs truncate cursor-pointer"
          >
            <option value="">All Requisitions</option>
            {jds.map((j) => (
              <option key={j.id} value={j.id}>[{j.doc_id}] {j.original_filename}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/70 dark:bg-slate-900/40 text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            {allStatuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search candidate name or skill..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/70 dark:bg-slate-900/40 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Candidate Assignments Table */}
      <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-surface-darkBorder text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Candidate Profile</th>
                <th className="py-3 px-4">Assigned TA</th>
                <th className="py-3 px-4">Job Description</th>
                <th className="py-3 px-4">Match Score</th>
                <th className="py-3 px-4">Recruitment Status</th>
                <th className="py-3 px-4">Contact (Role Masked)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    <span>Loading candidate assignments...</span>
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-brand-400 opacity-60" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      No candidate assignments found.
                    </p>
                    <p className="text-slate-400 mt-1">
                      Go to the Candidate Matching workspace and select candidates to manually distribute them to TAs.
                    </p>
                  </td>
                </tr>
              ) : (
                assignments.map((a) => (
                  <tr key={a.assignment_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-navy-900 dark:text-white truncate">
                        {a.candidate_name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {a.current_title} {a.experience ? `• ${a.experience} yrs` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-navy-900 dark:text-white">
                        {a.ta_name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {a.ta_email}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      <div className="font-medium text-navy-900 dark:text-slate-100 truncate">
                        {a.jd_title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {a.jd_code}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {a.matching_score ? (
                        <span className="font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {a.matching_score} pts
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {/* Interactive Status Transition Dropdown */}
                      <select
                        value={a.status}
                        onChange={(e) => handleStatusChange(a.assignment_id, e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                      >
                        {allStatuses.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                      <div>{a.email}</div>
                      <div className="text-[10px] text-slate-400">{a.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Reassign Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setReassigningAssignment(a);
                            setNewTaForReassign(String(a.ta_id));
                            setReassignNote('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="Transfer candidate to another TA"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Reassign</span>
                        </button>

                        {/* History & Notes Button */}
                        <button
                          type="button"
                          onClick={() => setInspectingHistoryId(a.assignment_id)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="View Ownership Timeline & Internal Notes"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        {/* Candidate Profile */}
                        <button
                          type="button"
                          onClick={() => setInspectingCandidateId(a.candidate_id)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Open Full Candidate Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Unassign */}
                        <button
                          type="button"
                          onClick={() => handleUnassign(a.assignment_id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Unassign Candidate"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-surface-darkBorder text-slate-500">
            <span>
              Showing {Math.min(total, (page - 1) * pageSize + 1)} to {Math.min(total, page * pageSize)} of {total} Assignments
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
                disabled={page * pageSize >= total}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-surface-darkBorder disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inline Reassignment Modal */}
      {reassigningAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in text-xs">
          <div className="bg-white dark:bg-surface-darkCard rounded-2xl max-w-md w-full border border-slate-200/80 dark:border-surface-darkBorder shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-brand-600" />
              <span>Transfer Candidate Ownership</span>
            </h3>
            <p className="text-slate-500 text-xs">
              Reassign <strong className="text-navy-900 dark:text-white">{reassigningAssignment.candidate_name}</strong> from <span className="font-semibold">{reassigningAssignment.ta_name}</span> to a new specialist.
            </p>

            <form onSubmit={handleConfirmReassign} className="space-y-3">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1 text-[11px]">
                  Select New Talent Acquisition Specialist
                </label>
                <select
                  value={newTaForReassign}
                  onChange={(e) => setNewTaForReassign(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs font-semibold cursor-pointer"
                >
                  {tas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.team}) — {t.active_assignments} active
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1 text-[11px]">
                  Reason for Transfer (Optional)
                </label>
                <input
                  type="text"
                  value={reassignNote}
                  onChange={(e) => setReassignNote(e.target.value)}
                  placeholder="e.g. Workload rebalancing, specialist domain alignment"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReassigningAssignment(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reassignSubmitting || !newTaForReassign}
                  className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {reassignSubmitting ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      <AssignmentHistoryModal
        assignmentId={inspectingHistoryId}
        isOpen={!!inspectingHistoryId}
        onClose={() => setInspectingHistoryId(null)}
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

