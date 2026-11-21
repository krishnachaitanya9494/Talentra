import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle, RefreshCw, Send, Sparkles } from 'lucide-react';
import { interviewApi } from '../api';

export const CandidateReschedulePortal = ({ token: propToken }) => {
  const token = propToken || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '');
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('11:00');
  const [newEndTime, setNewEndTime] = useState('12:00');
  const [reason, setReason] = useState('Unforeseen scheduling conflict');

  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    loadPortal();
  }, [token]);

  const loadPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await interviewApi.getReschedulePortalDetails(token);
      setPortalData(data);
      if (data.interview?.interview_date) {
        const d = new Date(data.interview.interview_date);
        d.setDate(d.getDate() + 1);
        setNewDate(d.toISOString().split('T')[0]);
      }
    } catch (err) {
      setError(err.message || 'Reschedule link invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await interviewApi.confirmReschedulePortal(token, {
        new_date: newDate,
        new_start_time: newStartTime,
        new_end_time: newEndTime,
        reason,
      });
      setConfirmed(true);
    } catch (err) {
      setError(err.message || 'Failed to reschedule. Selected slot may not be available.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-4">
        <div className="text-sm font-semibold text-slate-600">Loading reschedule portal...</div>
      </div>
    );
  }

  if (error && !portalData) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-red-200 shadow-xl text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Reschedule Link Inactive</h2>
          <p className="text-xs text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-emerald-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Rescheduling Request Processed!</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your appointment has been adjusted to <strong>{newDate}</strong> at <strong>{newStartTime} - {newEndTime}</strong>. A calendar update has been dispatched to all panel members.
          </p>
        </div>
      </div>
    );
  }

  const interview = portalData?.interview;

  return (
    <div className="min-h-screen bg-[#F5F6FA] py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4F46B8]/10 text-[#4F46B8] text-xs font-bold">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>TALENTRA Rescheduling Portal</span>
          </div>
          <h1 className="text-2xl font-black text-[#172033]">Reschedule Interview Appointment</h1>
          <p className="text-xs text-[#64748B]">
            {interview?.round_name} • Candidate: <strong className="text-[#172033]">{interview?.candidate_name}</strong>
          </p>
        </div>

        {/* Current Schedule Summary */}
        <div className="bg-white rounded-2xl border border-[#D9DEE8] shadow-sm p-6 space-y-5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Currently Scheduled For:
            </div>
            <div className="font-bold text-slate-900 text-sm">
              {interview?.interview_date} • {interview?.start_time} - {interview?.end_time} ({interview?.timezone || 'UTC'})
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleReschedule} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">
                Preferred New Date
              </label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D9DEE8] bg-white text-[#172033]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  New Start Time
                </label>
                <input
                  type="time"
                  required
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] bg-white text-[#172033]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  New End Time
                </label>
                <input
                  type="time"
                  required
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] bg-white text-[#172033]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">
                Reason for Rescheduling
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please state why you need to reschedule..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] text-[#172033]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#4F46B8] hover:bg-[#3730A3] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Updating Calendar...' : 'Confirm Rescheduled Time'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
