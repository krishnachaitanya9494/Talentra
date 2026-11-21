import React, { useState, useEffect } from 'react';
import { X, GitCommit, ArrowRight, History, Check, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { getJDVersions, createNewJDVersion, getJDVersionDiff } from '../../services/api';

export const JDVersionHistoryModal = ({ isOpen, onClose, jdId, reqCode }) => {
  if (!isOpen || !jdId) return null;

  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVerA, setSelectedVerA] = useState(1);
  const [selectedVerB, setSelectedVerB] = useState(1);
  const [diffResult, setDiffResult] = useState(null);
  const [diffLoading, setDiffLoading] = useState(false);

  // New version form state
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');
  const [author, setAuthor] = useState('Krishna Chaitanya (Recruiter Admin)');
  const [submitting, setSubmitting] = useState(false);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const res = await getJDVersions(jdId);
      setVersions(res || []);
      if (res && res.length >= 2) {
        setSelectedVerA(res[res.length - 2].version_number);
        setSelectedVerB(res[res.length - 1].version_number);
      } else if (res && res.length === 1) {
        setSelectedVerA(1);
        setSelectedVerB(1);
      }
    } catch (err) {
      console.error('Failed to load JD versions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [jdId]);

  const handleComputeDiff = async () => {
    if (selectedVerA === selectedVerB) {
      setDiffResult(null);
      return;
    }
    try {
      setDiffLoading(true);
      const diff = await getJDVersionDiff(jdId, selectedVerA, selectedVerB);
      setDiffResult(diff);
    } catch (err) {
      console.error('Failed to diff versions:', err);
    } finally {
      setDiffLoading(false);
    }
  };

  useEffect(() => {
    if (selectedVerA && selectedVerB && selectedVerA !== selectedVerB) {
      handleComputeDiff();
    } else {
      setDiffResult(null);
    }
  }, [selectedVerA, selectedVerB]);

  const handleCreateVersion = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createNewJDVersion(jdId, {
        author,
        change_summary: changeSummary || 'Periodic requisition revision',
        modified_fields: ['Requirements review and approval'],
      });
      setShowAddVersion(false);
      setChangeSummary('');
      await fetchVersions();
    } catch (err) {
      console.error('Failed to create version:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-surface-darkBorder shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="font-bold text-sm text-navy-900 dark:text-slate-100">
                Requisition Version Audit History — {reqCode || `JD-${jdId}`}
              </h3>
              <p className="text-[11px] text-slate-500">
                Deterministic version snapshots with side-by-side skill diffing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Version Diff Toolbar */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-surface-darkBorder flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Compare Versions:</span>
              <select
                value={selectedVerA}
                onChange={(e) => setSelectedVerA(Number(e.target.value))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-slate-900 font-bold"
              >
                {versions.map((v) => (
                  <option key={v.version_number} value={v.version_number}>
                    {v.version} ({new Date(v.created_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedVerB}
                onChange={(e) => setSelectedVerB(Number(e.target.value))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-slate-900 font-bold"
              >
                {versions.map((v) => (
                  <option key={v.version_number} value={v.version_number}>
                    {v.version} ({new Date(v.created_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowAddVersion(!showAddVersion)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Snapshot New Version</span>
            </button>
          </div>

          {/* New Version Inline Form */}
          {showAddVersion && (
            <form onSubmit={handleCreateVersion} className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3 animate-in fade-in duration-150">
              <span className="font-bold uppercase text-[10px] text-indigo-700 dark:text-indigo-300 block">
                CREATE IMMUTABLE VERSION SNAPSHOT
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Author Name</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Change Log Summary</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Added Kubernetes and removed legacy middleware"
                    value={changeSummary}
                    onChange={(e) => setChangeSummary(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddVersion(false)}
                  className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Confirm Snapshot'}
                </button>
              </div>
            </form>
          )}

          {/* Diff Results View */}
          {diffResult && (
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-emerald-100 dark:border-emerald-900/40">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <GitCommit className="w-4 h-4 text-emerald-600" />
                  <span>Diff: {diffResult.version_a} → {diffResult.version_b}</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Modified by {diffResult.author_b}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">
                    + Skills Added in {diffResult.version_b} ({diffResult.added_in_b?.length || 0})
                  </span>
                  {diffResult.added_in_b?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {diffResult.added_in_b.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                          + {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">No new skills added.</span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase block">
                    - Skills Removed ({diffResult.removed_in_b?.length || 0})
                  </span>
                  {diffResult.removed_in_b?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {diffResult.removed_in_b.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                          - {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">No skills removed.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timeline of all versions */}
          <div className="space-y-3">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400 block">
              IMMUTABLE AUDIT TIMELINE
            </span>
            <div className="space-y-2.5">
              {loading ? (
                <div className="p-8 text-center text-slate-400">Loading version audit log...</div>
              ) : (
                versions.map((ver) => (
                  <div
                    key={ver.version_number}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                          {ver.version}
                        </span>
                        <span className="font-bold text-navy-900 dark:text-slate-100">
                          {ver.change_summary}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ver.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>Author: <strong>{ver.author}</strong></span>
                      <span>•</span>
                      <span>Skills Count: <strong>{ver.skills_snapshot?.length || 0}</strong></span>
                      <span>•</span>
                      <span>Exp: <strong>{ver.experience_range}</strong></span>
                    </div>

                    {ver.modified_fields?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {ver.modified_fields.map((mf, mIdx) => (
                          <span key={mIdx} className="px-2 py-0.2 rounded text-[10px] bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {mf}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer text-xs"
          >
            Close Audit History
          </button>
        </div>
      </div>
    </div>
  );
};
