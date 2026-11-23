import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  MapPin,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  X,
  UserCheck,
  Upload,
  Files,
} from 'lucide-react';
import apiClient from '../../services/api';
import { UploadResumeModal } from './UploadResumeModal';

export const CandidateDirectory = ({ onInspectCandidate, onAssignCandidates, onUploadComplete }) => {
  const [candidates, setCandidates] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [minExp, setMinExp] = useState('');
  const [maxExp, setMaxExp] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [resumeUploadMode, setResumeUploadMode] = useState('single');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (search) params.search = search;
      if (locationFilter) params.location = locationFilter;
      if (statusFilter) params.status_filter = statusFilter;
      if (minExp) params.experience_min = parseFloat(minExp);
      if (maxExp) params.experience_max = parseFloat(maxExp);

      const res = await apiClient.get('/api/v1/resumes', { params });
      setCandidates(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch candidates directory:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, search, locationFilter, statusFilter, minExp, maxExp]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(candidates.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setSelectedIds(updated);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setLocationFilter('');
    setStatusFilter('');
    setMinExp('');
    setMaxExp('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || locationFilter || statusFilter || minExp || maxExp);

  return (
    <div className="space-y-4 text-xs">
      {/* Control Strip */}
      <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by candidate name, title, skills, email, location..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Quick Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setResumeUploadMode('single');
                setUploadModalOpen(true);
              }}
              className="inline-flex min-h-11 items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload resume</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setResumeUploadMode('bulk');
                setUploadModalOpen(true);
              }}
              className="inline-flex min-h-11 items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-surface-darkBorder text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Files className="w-3.5 h-3.5" />
              <span>Bulk add resumes</span>
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                filtersOpen || hasActiveFilters
                  ? 'bg-brand-50 text-brand-700 border-brand-300 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-800'
                  : 'border-slate-200 dark:border-surface-darkBorder text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
              )}
            </button>

            <button
              type="button"
              onClick={fetchCandidates}
              disabled={loading}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
              title="Refresh candidate directory"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expandable Advanced Filters Drawer */}
        {filtersOpen && (
          <div className="pt-3 border-t border-slate-100 dark:border-surface-darkBorder grid grid-cols-1 sm:grid-cols-4 gap-3 animate-fadeIn">
            <div>
              <label className="block text-slate-500 text-[11px] font-semibold mb-1">
                Min Experience (Years)
              </label>
              <input
                type="number"
                placeholder="e.g. 2"
                value={minExp}
                onChange={(e) => {
                  setMinExp(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[11px] font-semibold mb-1">
                Max Experience (Years)
              </label>
              <input
                type="number"
                placeholder="e.g. 10"
                value={maxExp}
                onChange={(e) => {
                  setMaxExp(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[11px] font-semibold mb-1">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. Bangalore, Pune"
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[11px] font-semibold mb-1">
                Talent Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="interviewing">Interviewing</option>
                <option value="placed">Placed</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {hasActiveFilters && (
              <div className="sm:col-span-4 flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold hover:underline"
                >
                  <X className="w-3 h-3" />
                  <span>Clear All Filters</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="p-3 rounded-2xl bg-brand-600 text-white flex items-center justify-between shadow-lg animate-scaleIn">
          <span className="font-semibold text-xs ml-2">
            {selectedIds.size} candidate{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            {onAssignCandidates && (
              <button
                type="button"
                onClick={() => onAssignCandidates(Array.from(selectedIds))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-brand-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer shadow-subtle"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Assign to TA Queue</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-medium text-xs cursor-pointer"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Candidate Directory Table */}
      <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-surface-darkBorder text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={candidates.length > 0 && selectedIds.size === candidates.length}
                    onChange={handleSelectAll}
                    className="rounded text-brand-600 cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-3.5 cursor-pointer hover:text-navy-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Candidate Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3.5">Current Title & Role</th>
                <th
                  onClick={() => handleSort('experience')}
                  className="py-3 px-3.5 cursor-pointer hover:text-navy-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Experience</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3.5">Location</th>
                <th className="py-3 px-3.5">Verified Core Skills</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    <span>Loading candidate records from SQLite...</span>
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No candidates found matching the criteria.
                  </td>
                </tr>
              ) : (
                candidates.map((cand) => {
                  const isChecked = selectedIds.has(cand.id);
                  const skillsList = cand.skills
                    ? cand.skills.split(',').map((s) => s.trim())
                    : [];

                  return (
                    <tr
                      key={cand.id}
                      onClick={() => onInspectCandidate(cand.id)}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                        isChecked ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(cand.id)}
                          className="rounded text-brand-600 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-bold text-navy-950 dark:text-slate-100 group-hover:text-brand-600 transition-colors block">
                            {cand.first_name} {cand.last_name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {cand.candidate_code || `CAN-${cand.id}`}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3.5 max-w-xs truncate text-slate-700 dark:text-slate-300">
                        <span className="font-medium block truncate">
                          {cand.current_title || 'Software Professional'}
                        </span>
                        {cand.current_company && (
                          <span className="text-[11px] text-slate-400 truncate block">
                            {cand.current_company}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                        {cand.total_experience_years !== null ? `${cand.total_experience_years} y` : '—'}
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-500">
                        {cand.location || 'India'}
                      </td>

                      <td className="py-3 px-3.5 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {skillsList.slice(0, 3).map((skill, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {skillsList.length > 3 && (
                            <span className="text-[10px] text-slate-400">
                              +{skillsList.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            cand.status === 'available'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : cand.status === 'interviewing'
                              ? 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {cand.status || 'available'}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onInspectCandidate(cand.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 hover:bg-brand-100 font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-surface-darkBorder text-xs text-slate-500">
            <span>
              Showing {Math.min(total, (page - 1) * pageSize + 1)} to{' '}
              {Math.min(total, page * pageSize)} of {total} Candidate Records
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded-lg border border-slate-200 dark:border-surface-darkBorder disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono">
                {page} / {Math.ceil(total / pageSize)}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * pageSize >= total}
                className="p-1 rounded-lg border border-slate-200 dark:border-surface-darkBorder disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <UploadResumeModal
        isOpen={uploadModalOpen}
        mode={resumeUploadMode}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          fetchCandidates();
          onUploadComplete?.();
        }}
      />
    </div>
  );
};
