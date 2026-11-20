import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Clock,
  CheckCircle,
  MessageSquare,
  AlertCircle,
  Send,
  CornerDownLeft,
  User,
  ShieldCheck,
} from 'lucide-react';
import axios from 'axios';

/**
 * CandidateTimelineModal Component.
 *
 * Displays full communication history and chronological timeline for a specific candidate.
 * Shows outreach email, provider message ID, delivery status, and incoming candidate replies.
 * Includes a quick action to simulate/record candidate replies.
 */
export default function CandidateTimelineModal({
  isOpen,
  onClose,
  candidate,
  onRefresh,
}) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyInput, setReplyInput] = useState('');
  const [activeCommId, setActiveCommId] = useState(null);
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    if (isOpen && candidate?.id) {
      fetchTimeline();
    }
  }, [isOpen, candidate]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`/api/v1/outreach/candidate/${candidate.id}/timeline`);
      setTimeline(res.data.items || []);
    } catch (err) {
      console.error('Failed to load candidate timeline:', err);
      setError('Could not load communication history.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordReply = async (commId) => {
    if (!replyInput.trim()) return;
    try {
      setSubmittingReply(true);
      await axios.post(`/api/v1/outreach/communications/${commId}/reply`, {
        reply: replyInput.trim(),
      });
      setReplyInput('');
      setActiveCommId(null);
      fetchTimeline();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to record reply:', err);
      alert('Failed to record reply: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingReply(false);
    }
  };

  if (!isOpen || !candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-surface-darkBorder">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white font-display">
                Communication History
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {candidate.first_name || candidate.name} {candidate.last_name || ''} &bull;{' '}
                <span className="font-mono text-[11px]">{candidate.email}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Loading timeline records...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          ) : timeline.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-navy-900 dark:text-white">
                No Communication Sent Yet
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Outreach emails sent via Mode A (Manual Send) or Mode B (Approved Campaigns) will appear chronologically here with delivery receipts and reply records.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {timeline.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Timeline bullet */}
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 bg-white dark:bg-surface-dark flex items-center justify-center ${
                      item.reply_received_at
                        ? 'border-emerald-500 text-emerald-500'
                        : item.status === 'delivered'
                        ? 'border-blue-500 text-blue-500'
                        : 'border-slate-400 text-slate-400'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  </div>

                  {/* Message Card */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark/80 border border-slate-200 dark:border-surface-darkBorder space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-navy-900 dark:text-white">
                          {item.subject}
                        </span>
                        {item.campaign_name && (
                          <span className="px-2 py-0.5 text-[10px] rounded-md font-mono bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {item.campaign_name}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.sent_at ? new Date(item.sent_at).toLocaleString() : 'Just now'}
                      </span>
                    </div>

                    {/* Email preview */}
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans max-h-40 overflow-y-auto leading-relaxed">
                      {item.body}
                    </div>

                    {/* Metadata & Status */}
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          Sender: <strong className="text-slate-700 dark:text-slate-300">{item.sender_name}</strong>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          Status: <strong className="capitalize">{item.status}</strong>
                        </span>
                      </div>
                      {item.provider_message_id && (
                        <span className="font-mono text-[9px] text-slate-400">
                          ID: {item.provider_message_id.slice(0, 18)}...
                        </span>
                      )}
                    </div>

                    {/* Incoming Reply if present */}
                    {item.reply_received_at ? (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                          <span className="flex items-center gap-1.5">
                            <CornerDownLeft className="w-3.5 h-3.5" /> Candidate Reply Received
                          </span>
                          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                            {new Date(item.reply_received_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-200 italic bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                          "{item.reply_snippet}"
                        </p>
                      </div>
                    ) : (
                      /* Quick action to record candidate response */
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                        {activeCommId === item.id ? (
                          <div className="space-y-2">
                            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block">
                              Record Inbound Candidate Response:
                            </label>
                            <textarea
                              rows={2}
                              value={replyInput}
                              onChange={(e) => setReplyInput(e.target.value)}
                              placeholder="e.g. Yes, I am very interested and available this Thursday at 2 PM..."
                              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setActiveCommId(null)}
                                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleRecordReply(item.id)}
                                disabled={submittingReply || !replyInput.trim()}
                                className="px-3 py-1 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition disabled:opacity-50"
                              >
                                {submittingReply ? 'Recording...' : 'Save Inbound Reply'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveCommId(item.id);
                              setReplyInput('Yes, I would be delighted to discuss this position. Please share next steps!');
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Log Inbound Candidate Response
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-surface-dark flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Opt-out suppression checked &bull; Delivery tracked via TALENTRA Outreach Hub</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
