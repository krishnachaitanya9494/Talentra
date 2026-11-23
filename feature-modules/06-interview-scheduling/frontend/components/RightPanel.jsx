import React, { useState } from 'react';
import {
  X,
  User,
  Briefcase,
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
  AlertOctagon,
  Mail,
  History,
  Plus,
  ChevronRight,
  ChevronDown,
  FileText,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  Edit2,
} from 'lucide-react';
import { interviewApi } from '../api';
import { getInterviewCategoryStyle } from '../styles';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'confirmed', label: 'Confirmed', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'completed', label: 'Completed', badge: 'bg-slate-100 text-slate-700 border-slate-300' },
  { value: 'rescheduled', label: 'Rescheduled', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'cancelled', label: 'Cancelled', badge: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'no_show', label: 'No Show', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export const RightPanel = ({
  selectedInterview,
  selectedDate,
  dayInterviews = [],
  onSelectInterview,
  onClose,
  onOpenAdd,
  onOpenEdit,
  onOpenReschedule,
  onOpenCancel,
  onOpenInvite,
  onOpenHistory,
  onStatusUpdated,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Expandable sections
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleCopyLink = (link) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCreateReschedulePortal = async () => {
    if (!selectedInterview) return;
    setGeneratingReschedule(true);
    try {
      const res = await interviewApi.createReschedulePortalLink(selectedInterview.id, 'self_service');
      const url = `${window.location.origin}/candidate-reschedule/${res.token}`;
      navigator.clipboard.writeText(url);
      setCopiedReschedulePortal(true);
      setTimeout(() => setCopiedReschedulePortal(false), 2500);
    } catch (err) {
      console.error('Failed to create reschedule portal link', err);
    } finally {
      setGeneratingReschedule(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedInterview || newStatus === selectedInterview.status) return;
    setUpdatingStatus(true);
    try {
      const updated = await interviewApi.updateInterview(selectedInterview.id, {
        status: newStatus,
      });
      if (onStatusUpdated) onStatusUpdated(updated);
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleToggleHistory = async () => {
    if (!historyOpen && selectedInterview) {
      setLoadingHistory(true);
      try {
        const hist = await interviewApi.getInterviewHistory(selectedInterview.id);
        setHistoryList(hist || []);
      } catch (e) {
        console.error('Failed to load history', e);
      } finally {
        setLoadingHistory(false);
      }
    }
    setHistoryOpen(!historyOpen);
  };

  const selectedCategory = selectedInterview
    ? getInterviewCategoryStyle(selectedInterview.round_name, selectedInterview.status)
    : null;

  const sortedDayInterviews = [...dayInterviews].sort((a, b) =>
    (a.start_time || '').localeCompare(b.start_time || '')
  );

  return (
    <div className="w-80 sm:w-96 shrink-0 border-l border-[#D9DEE8] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900 flex flex-col h-full overflow-hidden transition-all shadow-xs">
      {/* Top Header */}
      <div className="px-5 py-3.5 border-b border-[#D9DEE8] dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-brand-700 dark:text-brand-300" />
          <h3 className="text-xs font-black text-[#172033] dark:text-white uppercase tracking-wider">
            {selectedInterview ? 'Interview Details' : `Day's Agenda`}
          </h3>
          {!selectedInterview && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EEF1F6] dark:bg-slate-700 text-[#475569] dark:text-slate-300 border border-[#D9DEE8] dark:border-slate-600">
              {selectedDate}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenAdd}
            className="p-1.5 rounded-lg bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white transition-colors text-sm font-medium flex items-center gap-1 px-3"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
          {selectedInterview && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
              title="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Panel Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedInterview ? (
          <>
            {/* SECTION 1: Candidate & Requisition Banner */}
            <div
              style={{ backgroundColor: selectedCategory.accent, borderColor: selectedCategory.accent }}
              className={`p-4 rounded-2xl ${selectedCategory.agendaBg} border ${selectedCategory.border} relative overflow-hidden shadow-md text-white`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selectedCategory.badge} uppercase tracking-wider`}>
                  {selectedInterview.round_name}
                </span>
                <span className="text-[10px] font-mono font-bold text-white/80">
                  #{selectedInterview.interview_code}
                </span>
              </div>
              <h4 className="text-base font-black text-white truncate flex items-center gap-1.5">
                <span>{selectedInterview.candidate_name}</span>
                {selectedInterview.status === 'confirmed' && (
                  <ShieldCheck className="w-4 h-4 text-[#22A06B] bg-white rounded-full p-0.5 shrink-0" title="Confirmed Session" />
                )}
              </h4>
              <p className="text-xs text-white/90 font-semibold truncate mt-0.5">
                {selectedInterview.jd_title || 'General Engineering Requisition'}
              </p>
              {selectedInterview.candidate_email && (
                <p className="text-[11px] text-white/75 truncate mt-1 font-mono">
                  {selectedInterview.candidate_email}
                </p>
              )}
            </div>

            {/* SECTION 2: Interview Date & Time */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-[#D9DEE8] dark:border-slate-700 space-y-2.5 shadow-2xs">
              <div className="text-[10px] font-extrabold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
                Schedule & Timezone
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-900 border border-[#D9DEE8]/70 dark:border-slate-700">
                  <Calendar className="w-4 h-4 text-brand-700 dark:text-brand-300 shrink-0" />
                  <span className="font-bold text-[#172033] dark:text-slate-200">{selectedInterview.interview_date}</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-900 border border-[#D9DEE8]/70 dark:border-slate-700">
                  <Clock className="w-4 h-4 text-brand-700 dark:text-brand-300 shrink-0" />
                  <span className="font-mono font-bold text-[#172033] dark:text-slate-200">
                    {selectedInterview.start_time} - {selectedInterview.end_time}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-[#64748B] dark:text-slate-400 flex items-center justify-between font-medium px-1">
                <span>Duration: {selectedInterview.duration_minutes || 60} minutes</span>
                <span>Timezone: {selectedInterview.timezone || 'UTC'}</span>
              </div>
            </div>

            {/* SECTION 3: Virtual Meeting Details */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-[#D9DEE8] dark:border-slate-700 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-brand-700 dark:text-brand-300" />
                  <span>Virtual Meeting Room</span>
                </div>
                {selectedInterview.location_or_link && (
                  <button
                    onClick={() => handleCopyLink(selectedInterview.location_or_link)}
                    className="text-sm font-medium text-brand-700 dark:text-brand-300 hover:underline flex items-center gap-1"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                )}
              </div>
              {selectedInterview.location_or_link ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={selectedInterview.location_or_link}
                    className="flex-1 text-xs py-1.5 px-2.5 rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 text-[#172033] dark:text-slate-200 font-mono select-all truncate"
                  />
                  {selectedInterview.location_or_link.startsWith('http') && (
                    <a
                      href={selectedInterview.location_or_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-sm font-medium bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white rounded-lg flex items-center gap-1 shrink-0"
                    >
                      <span>Join</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-xs text-[#64748B] italic">No virtual meeting link specified</div>
              )}
            </div>

            {/* SECTION 4: Assigned Interview Panel */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-[#D9DEE8] dark:border-slate-700 space-y-2.5 shadow-2xs">
              <div className="text-[10px] font-extrabold text-[#64748B] dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-700 dark:text-brand-300" />
                Assigned Interview Panel ({selectedInterview.panel?.length || 0})
              </div>
              <div className="space-y-1.5">
                {selectedInterview.panel?.map((pm) => (
                  <div
                    key={pm.id || pm.interviewer_id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-900 border border-[#D9DEE8]/70 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#EEF1F6] dark:bg-slate-800 text-[#172033] dark:text-white font-bold text-xs flex items-center justify-center shrink-0 border border-[#D9DEE8] dark:border-slate-700">
                        {pm.interviewer_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[#172033] dark:text-white truncate">
                          {pm.interviewer_name}
                        </div>
                        <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">
                          {pm.interviewer_role || 'Evaluator'}
                        </div>
                      </div>
                    </div>
                    {pm.is_lead && (
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-[#4F46B8] border border-purple-200 shrink-0">
                        Lead
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 5: Interview Lifecycle Status */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-[#D9DEE8] dark:border-slate-700 space-y-2 shadow-2xs">
              <label className="text-[10px] font-extrabold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
                Interview Lifecycle Status
              </label>
              <select
                disabled={updatingStatus}
                value={selectedInterview.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 text-[#172033] dark:text-white capitalize font-bold focus:ring-2 focus:ring-[#4F46B8] focus:outline-hidden"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* SECTION 6: Lifecycle & Edit Controls */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-[#D9DEE8] dark:border-slate-700 space-y-2.5 shadow-2xs">
              <div className="text-[10px] font-extrabold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
                Interview Management
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onOpenEdit && onOpenEdit(selectedInterview)}
                  className="px-2 py-2 text-sm font-medium text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900/60 rounded-lg border border-brand-200 dark:border-brand-800 flex items-center justify-center gap-1 transition-colors"
                  title="Edit details"
                >
                  <Edit2 className="w-3.5 h-3.5 text-brand-700 dark:text-brand-300" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => onOpenReschedule(selectedInterview)}
                  className="px-2 py-2 text-xs font-bold text-[#92400E] dark:text-amber-200 bg-[#FEF3C7] dark:bg-amber-950/40 hover:bg-amber-200/80 dark:hover:bg-amber-900/60 rounded-xl border border-[#FDE68A] dark:border-amber-800 flex items-center justify-center gap-1 transition shadow-2xs"
                  title="Reschedule session"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reschedule</span>
                </button>
                <button
                  onClick={() => onOpenCancel(selectedInterview)}
                  className="px-2 py-2 text-xs font-bold text-[#991B1B] dark:text-red-300 bg-[#FEE2E2] dark:bg-red-950/40 hover:bg-red-200/80 dark:hover:bg-red-900/60 rounded-xl border border-[#FCA5A5] dark:border-red-900 flex items-center justify-center gap-1 transition shadow-2xs"
                  title="Cancel interview"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>

              <button
                onClick={() => onOpenInvite(selectedInterview)}
                className="w-full px-3 py-2 text-xs font-bold text-[#1E40AF] dark:text-blue-300 bg-[#DBEAFE] dark:bg-blue-950/50 hover:bg-blue-200/80 rounded-xl border border-[#BFDBFE] dark:border-blue-800 flex items-center justify-center gap-2 transition shadow-2xs"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Invitation Preview & .ICS Export</span>
              </button>
            </div>

            {/* SECTION 8: Interview History (Expandable Audit Timeline) */}
            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-[#D9DEE8] dark:border-slate-700 overflow-hidden shadow-2xs">
              <button
                onClick={handleToggleHistory}
                className="w-full px-3.5 py-3 flex items-center justify-between text-xs font-bold text-[#172033] dark:text-slate-200 hover:bg-[#EEF1F6] dark:hover:bg-slate-700/60 transition"
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Interview Audit History</span>
                </div>
                {historyOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {historyOpen && (
                <div className="p-3 border-t border-[#D9DEE8] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900/60 space-y-2 max-h-48 overflow-y-auto">
                  {loadingHistory ? (
                    <div className="text-center text-xs text-slate-400 py-3">Loading history...</div>
                  ) : historyList.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 py-2">No audit logs recorded</div>
                  ) : (
                    historyList.map((h, i) => (
                      <div key={h.id || i} className="text-[11px] p-2 rounded-xl bg-white dark:bg-slate-800 border border-[#D9DEE8]/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold uppercase text-[9px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            {h.action}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {h.timestamp ? h.timestamp.split('T')[0] : ''}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 font-medium">{h.details}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Day List View when no individual card is clicked */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#475569] dark:text-slate-400 px-1">
              <span>{dayInterviews.length} Scheduled Sessions</span>
              <span className="font-mono text-[#172033] dark:text-slate-200">{selectedDate}</span>
            </div>

            {dayInterviews.length === 0 ? (
              <div className="py-14 text-center space-y-3 bg-white dark:bg-slate-800 border border-[#D9DEE8] dark:border-slate-700 rounded-2xl p-6 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-surface-darkHover text-brand-700 dark:text-brand-300 mx-auto flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="text-xs font-medium text-[#64748B] dark:text-slate-400">
                  No interviews scheduled for this date.
                </div>
                <button
                  onClick={onOpenAdd}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-700 hover:bg-brand-800 rounded-lg transition-colors"
                >
                  Schedule New Interview
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sortedDayInterviews.map((item) => {
                  const style = getInterviewCategoryStyle(item.round_name, item.status);
                  const isConfirmed = (item.status || '').toLowerCase() === 'confirmed';
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectInterview(item)}
                      style={{ backgroundColor: style.accent, borderColor: style.accent }}
                      className={`p-3.5 rounded-2xl ${style.agendaBg} border ${style.border} transition-all cursor-pointer shadow-sm hover:shadow-md group space-y-2 relative overflow-hidden`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white/90">
                          {item.start_time} - {item.end_time}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isConfirmed && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#22A06B] text-white border border-white/40 flex items-center gap-0.5 shrink-0 shadow-xs">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              <span>Confirmed</span>
                            </span>
                          )}
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${style.badge}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-black text-white group-hover:underline transition flex items-center justify-between">
                          <span>{item.candidate_name}</span>
                        </div>
                        <div className="text-[11px] text-white/80 truncate mt-0.5 font-medium">
                          {item.round_name} • {item.jd_title || 'General Engineering Requisition'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-white/75 pt-1.5 border-t border-white/20 font-medium">
                        <span>Panel: {item.panel?.length || 1} evaluators</span>
                        <span className="flex items-center gap-1 font-bold group-hover:translate-x-0.5 transition">
                          <span>View Details</span>
                          <ChevronRight className="w-3.5 h-3.5 text-white" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
