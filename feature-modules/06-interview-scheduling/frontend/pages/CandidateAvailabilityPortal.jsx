import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle, Plus, Trash2, Send, Sparkles } from 'lucide-react';
import { interviewApi } from '../api';

export const CandidateAvailabilityPortal = ({ token: propToken }) => {
  const token = propToken || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '');
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected candidate slots
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [slotDate, setSlotDate] = useState('');
  const [slotStart, setSlotStart] = useState('10:00');
  const [slotEnd, setSlotEnd] = useState('11:00');
  const [candidateNotes, setCandidateNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    loadRequest();
  }, [token]);

  const loadRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await interviewApi.getAvailabilityRequestByToken(token);
      setRequestData(data);
      if (data.start_date_range) {
        setSlotDate(data.start_date_range);
      }
      if (data.preferred_start_time) {
        setSlotStart(data.preferred_start_time);
      }
    } catch (err) {
      setError(err.message || 'Availability link expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  const addSlot = () => {
    if (!slotDate || !slotStart || !slotEnd) return;
    const exists = selectedSlots.some(
      (s) => s.slot_date === slotDate && s.start_time === slotStart && s.end_time === slotEnd
    );
    if (exists) return;

    setSelectedSlots((prev) => [
      ...prev,
      {
        slot_date: slotDate,
        start_time: slotStart,
        end_time: slotEnd,
        preference_order: prev.length + 1,
      },
    ]);
  };

  const removeSlot = (idx) => {
    setSelectedSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSlots.length === 0) {
      setError('Please add at least one available time slot before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await interviewApi.submitCandidateAvailability(token, {
        slots: selectedSlots,
        candidate_notes: candidateNotes,
      });
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to submit availability.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-4">
        <div className="text-sm font-semibold text-slate-600">Loading interview details...</div>
      </div>
    );
  }

  if (error && !requestData) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-red-200 shadow-xl text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Link Inactive or Expired</h2>
          <p className="text-xs text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-emerald-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Availability Submitted!</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Thank you, {requestData?.candidate_name}. We have received your {selectedSlots.length} preferred time slots. Our recruitment team is now matching interviewers and will send your calendar confirmation shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4F46B8]/10 text-[#4F46B8] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TALENTRA Candidate Scheduling</span>
          </div>
          <h1 className="text-2xl font-black text-[#172033]">Submit Your Interview Availability</h1>
          <p className="text-xs text-[#64748B]">
            Position: <strong className="text-[#172033]">{requestData?.jd_title}</strong> • Round: <strong className="text-[#172033]">{requestData?.round_name}</strong>
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#D9DEE8] shadow-sm p-6 space-y-6">
          {/* Instructions Box */}
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-[#3730A3] space-y-1">
            <div className="font-bold">Instructions from the Recruitment Team:</div>
            <p className="leading-relaxed">{requestData?.instructions}</p>
            <div className="pt-2 text-[11px] text-purple-700">
              Accepted Window: {requestData?.start_date_range} to {requestData?.end_date_range} ({requestData?.preferred_start_time} - {requestData?.preferred_end_time})
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Slot Adder Form */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#172033]">
              Add a Free Time Slot
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  min={requestData?.start_date_range}
                  max={requestData?.end_date_range}
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] bg-white text-[#172033]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Start Time</label>
                <input
                  type="time"
                  value={slotStart}
                  onChange={(e) => setSlotStart(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] bg-white text-[#172033]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">End Time</label>
                <input
                  type="time"
                  value={slotEnd}
                  onChange={(e) => setSlotEnd(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] bg-white text-[#172033]"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addSlot}
              className="px-4 py-2 rounded-xl bg-[#4F46B8] hover:bg-[#3730A3] text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add This Slot</span>
            </button>
          </div>

          {/* Selected Slots List */}
          <div className="space-y-2 pt-2 border-t border-[#D9DEE8]">
            <div className="text-xs font-bold text-[#172033] flex items-center justify-between">
              <span>Your Selected Time Slots ({selectedSlots.length})</span>
              <span className="text-[11px] font-normal text-slate-500">
                (Please provide at least 2-3 options)
              </span>
            </div>

            {selectedSlots.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                No slots added yet. Pick dates and times above and click "Add This Slot".
              </div>
            ) : (
              <div className="space-y-2">
                {selectedSlots.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px]">
                        #{idx + 1}
                      </div>
                      <span className="font-bold text-slate-800">{s.slot_date}</span>
                      <span className="text-slate-500 font-mono">
                        {s.start_time} - {s.end_time}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSlot(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={candidateNotes}
              onChange={(e) => setCandidateNotes(e.target.value)}
              placeholder="e.g., Preferred timezone is EST; available on short notice on Thursday."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] text-[#172033]"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || selectedSlots.length === 0}
              className="w-full py-3 rounded-xl bg-[#4F46B8] hover:bg-[#3730A3] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Availability to Recruitment Team'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
