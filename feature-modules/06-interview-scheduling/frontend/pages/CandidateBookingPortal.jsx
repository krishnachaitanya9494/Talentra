import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle, Video, Check, Sparkles, Download } from 'lucide-react';
import { interviewApi } from '../api';

export const CandidateBookingPortal = ({ token: propToken }) => {
  const token = propToken || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '');
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Slot selection states
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Candidate confirmation details
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    loadBookingDetails();
  }, [token]);

  const loadBookingDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await interviewApi.getBookingLinkDetails(token);
      setBookingData(data);
      if (data.start_date) {
        setSelectedDate(data.start_date);
        fetchSlots(data.start_date);
      }
    } catch (err) {
      setError(err.message || 'Booking link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (dateVal) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const res = await interviewApi.getBookingSlots(token, dateVal);
      setAvailableSlots(res.available_slots || []);
    } catch (err) {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    fetchSlots(newDate);
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setConfirming(true);
    setError(null);
    try {
      const res = await interviewApi.confirmBooking(token, {
        chosen_date: selectedSlot.date,
        chosen_start_time: selectedSlot.start_time,
        chosen_end_time: selectedSlot.end_time,
        candidate_phone: phone,
        notes,
      });
      setConfirmedBooking(res.interview || res);
    } catch (err) {
      setError(err.message || 'Slot was just taken or booking failed. Please choose another slot.');
      fetchSlots(selectedDate);
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-4">
        <div className="text-sm font-semibold text-slate-600">Loading booking portal...</div>
      </div>
    );
  }

  if (error && !bookingData) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-red-200 shadow-xl text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Booking Link Expired</h2>
          <p className="text-xs text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (confirmedBooking) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-emerald-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Interview Confirmed!</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your {confirmedBooking.round_name} has been confirmed for:
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
            <div className="font-bold text-slate-900">{confirmedBooking.interview_date}</div>
            <div className="text-[#4F46B8] font-bold">
              {confirmedBooking.start_time} - {confirmedBooking.end_time} ({confirmedBooking.timezone || 'UTC'})
            </div>
          </div>
          {confirmedBooking.location_or_link && (
            <div className="pt-2">
              <a
                href={confirmedBooking.location_or_link}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-[#4F46B8] hover:bg-[#3730A3] text-white text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                <span>Join Video Meeting</span>
              </a>
            </div>
          )}
          {confirmedBooking.id && (
            <a
              href={interviewApi.getIcsDownloadUrl(confirmedBooking.id)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#4F46B8] font-medium pt-2 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download iCalendar (.ics) Event</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4F46B8]/10 text-[#4F46B8] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TALENTRA Self-Booking</span>
          </div>
          <h1 className="text-2xl font-black text-[#172033]">Schedule Your Interview Session</h1>
          <p className="text-xs text-[#64748B]">
            Position: <strong className="text-[#172033]">{bookingData?.jd_title}</strong> • Round: <strong className="text-[#172033]">{bookingData?.round_name}</strong> ({bookingData?.duration_minutes} min)
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#D9DEE8] shadow-sm p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Date Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#172033]">
                1. Select Interview Date
              </label>
              <input
                type="date"
                min={bookingData?.start_date}
                max={bookingData?.end_date}
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D9DEE8] bg-white text-[#172033]"
              />

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-[#64748B] space-y-1">
                <div>Candidate: <strong className="text-[#172033]">{bookingData?.candidate_name}</strong></div>
                <div>Interview Length: <strong>{bookingData?.duration_minutes} Minutes</strong></div>
                <div>Panel: <strong>{bookingData?.interviewer_ids?.length || 1} Evaluator(s)</strong></div>
              </div>
            </div>

            {/* Right: Real-time Slot Picker */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#172033] flex items-center justify-between">
                <span>2. Select Available Slot</span>
                <span className="text-[10px] text-slate-400 font-normal">Real-time availability</span>
              </label>

              {loadingSlots ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Calculating panel openings...
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No mutual slots open on this date. Please pick another date on the left.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {availableSlots.map((s, idx) => {
                    const isSelected = selectedSlot?.start_time === s.start_time;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedSlot(s)}
                        className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#4F46B8] text-white border-[#4F46B8] shadow-xs'
                            : 'bg-white hover:border-[#4F46B8] border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{s.start_time} - {s.end_time}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Details & Confirmation */}
          {selectedSlot && (
            <form onSubmit={handleConfirm} className="pt-4 border-t border-[#D9DEE8] space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Selected Slot: </span>
                  <strong className="text-[#4F46B8] font-bold">
                    {selectedSlot.date} at {selectedSlot.start_time} - {selectedSlot.end_time}
                  </strong>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Ready to Book
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Contact Phone (For SMS Reminders)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] text-[#172033]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Special Accommodations or Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Needs closed captions"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] text-[#172033]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={confirming}
                className="w-full py-3 rounded-xl bg-[#4F46B8] hover:bg-[#3730A3] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{confirming ? 'Locking Slot...' : 'Confirm & Schedule My Interview'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
