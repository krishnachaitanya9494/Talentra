import React, { useState, useEffect } from 'react';
import { X, History, Clock, User, CheckCircle2, AlertOctagon, RotateCcw } from 'lucide-react';
import { interviewApi } from '../api';

export const InterviewHistoryModal = ({
  isOpen,
  onClose,
  interview,
}) => {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !interview) return;
    setLoading(true);
    interviewApi.getInterviewHistory(interview.id)
      .then((data) => setHistoryItems(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [isOpen, interview]);

  if (!isOpen || !interview) return null;

  const getActionBadge = (action) => {
    switch (action) {
      case 'scheduled':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200',
          label: 'Scheduled',
        };
      case 'rescheduled':
        return {
          icon: RotateCcw,
          color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200',
          label: 'Rescheduled',
        };
      case 'cancelled':
        return {
          icon: AlertOctagon,
          color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200',
          label: 'Cancelled',
        };
      default:
        return {
          icon: Clock,
          color: 'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200',
          label: action,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Interview Lifecycle Audit History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {interview.candidate_name} • {interview.round_name} ({interview.interview_code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading audit logs...
            </div>
          ) : historyItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No audit trail events recorded yet.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {historyItems.map((item) => {
                const badge = getActionBadge(item.action);
                const IconComponent = badge.icon;
                return (
                  <div key={item.id} className="relative">
                    <div className="absolute -left-[29px] top-0.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] border ${badge.color}`}>
                          <IconComponent className="w-3 h-3" />
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        {item.details}
                      </p>
                      <div className="text-[10px] text-slate-400">
                        Actor: {item.changed_by}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
