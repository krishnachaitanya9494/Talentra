import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Clock,
  User,
  ArrowRight,
  MessageSquare,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { getAssignmentHistory, addAssignmentNote } from '../../services/api';

/**
 * Assignment History and Recruiter Notes Modal.
 *
 * Displays full ownership timeline, reassignment events,
 * and recruiter internal notes.
 */
export const AssignmentHistoryModal = ({ assignmentId, isOpen, onClose }) => {
  const [data, setData] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    if (isOpen && assignmentId) {
      loadHistory();
      setNewNote('');
    }
  }, [isOpen, assignmentId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await getAssignmentHistory(assignmentId);
      setData(res);
    } catch (err) {
      console.error('Failed to load assignment history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setSubmittingNote(true);
      await addAssignmentNote(assignmentId, newNote.trim());
      setNewNote('');
      await loadHistory();
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in text-xs">
      <div className="bg-white dark:bg-surface-darkCard rounded-2xl max-w-xl w-full border border-slate-200/80 dark:border-surface-darkBorder shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200/60 text-brand-600 dark:text-brand-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Ownership & Activity History
              </h3>
              <p className="text-xs text-slate-500">
                {data ? `${data.candidate_name} • Current Owner: ${data.current_ta}` : 'Loading history...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
              <span>Loading audit logs...</span>
            </div>
          ) : data ? (
            <>
              {/* Timeline Events */}
              <div>
                <h4 className="font-bold text-slate-500 uppercase tracking-wider mb-3 text-[11px]">
                  Ownership Audit Trail
                </h4>
                <div className="space-y-3 relative pl-4 border-l-2 border-slate-200 dark:border-surface-darkBorder ml-2">
                  {data.history.map((h) => (
                    <div key={h.id} className="relative group">
                      <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-white dark:bg-surface-darkCard border-2 border-brand-500" />
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-surface-darkBorder">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-navy-900 dark:text-white capitalize">
                            {h.action.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(h.created_at).toLocaleString()}
                          </span>
                        </div>
                        {h.previous_ta && h.new_ta ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                            <span>{h.previous_ta}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-brand-600 font-bold">{h.new_ta}</span>
                          </div>
                        ) : h.new_ta ? (
                          <div className="text-xs text-slate-600 dark:text-slate-300">
                            Assigned to <strong className="text-brand-600">{h.new_ta}</strong>
                          </div>
                        ) : null}
                        {h.note && (
                          <p className="text-[11px] text-slate-500 mt-1 italic">
                            "{h.note}"
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          By: {h.changed_by}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recruiter Notes Section */}
              <div className="pt-4 border-t border-slate-100 dark:border-surface-darkBorder">
                <h4 className="font-bold text-slate-500 uppercase tracking-wider mb-2 text-[11px]">
                  Internal Recruiter Notes ({data.notes.length})
                </h4>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="mb-3 space-y-2">
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an internal note or screening feedback..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/70 dark:bg-slate-900/40 text-navy-900 dark:text-white text-xs focus:ring-1 focus:ring-brand-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingNote || !newNote.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {submittingNote ? 'Adding...' : 'Post Note'}
                    </button>
                  </div>
                </form>

                <div className="space-y-2">
                  {data.notes.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-surface-darkBorder"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-navy-900 dark:text-slate-100">
                          {n.author}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {n.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 dark:border-surface-darkBorder bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-navy-900 dark:text-slate-100 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
