import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Check, AlertCircle, Save, Coffee, Shield } from 'lucide-react';
import { interviewApi } from '../api';

const WEEKDAYS = [
  { id: 0, label: 'Mon' },
  { id: 1, label: 'Tue' },
  { id: 2, label: 'Wed' },
  { id: 3, label: 'Thu' },
  { id: 4, label: 'Fri' },
  { id: 5, label: 'Sat' },
  { id: 6, label: 'Sun' },
];

export const WorkingHoursModal = ({ isOpen, onClose, interviewers = [] }) => {
  const [selectedInterviewerId, setSelectedInterviewerId] = useState('');
  const [workingDays, setWorkingDays] = useState([0, 1, 2, 3, 4]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [lunchStart, setLunchStart] = useState('12:30');
  const [lunchEnd, setLunchEnd] = useState('13:30');
  const [bufferMinutes, setBufferMinutes] = useState(15);
  const [maxDailyInterviews, setMaxDailyInterviews] = useState(5);
  const [maxWeeklyInterviews, setMaxWeeklyInterviews] = useState(20);
  const [maxDailyHours, setMaxDailyHours] = useState(6.0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (interviewers.length > 0 && !selectedInterviewerId) {
      setSelectedInterviewerId(String(interviewers[0].id));
    }
  }, [interviewers, selectedInterviewerId]);

  useEffect(() => {
    if (isOpen && selectedInterviewerId) {
      loadWorkingHours(selectedInterviewerId);
    }
  }, [isOpen, selectedInterviewerId]);

  const loadWorkingHours = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await interviewApi.getWorkingHours(id);
      if (data) {
        setWorkingDays(data.working_days || [0, 1, 2, 3, 4]);
        setStartTime(data.start_time || '09:00');
        setEndTime(data.end_time || '18:00');
        setLunchStart(data.lunch_start || '12:30');
        setLunchEnd(data.lunch_end || '13:30');
        setBufferMinutes(data.buffer_minutes || 15);
        setMaxDailyInterviews(data.max_daily_interviews || 5);
        setMaxWeeklyInterviews(data.max_weekly_interviews || 20);
        setMaxDailyHours(data.max_daily_hours || 6.0);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch working hours.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayId) => {
    setWorkingDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort()
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedInterviewerId) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await interviewApi.updateWorkingHours(selectedInterviewerId, {
        working_days: workingDays,
        start_time: startTime,
        end_time: endTime,
        lunch_start: lunchStart,
        lunch_end: lunchEnd,
        buffer_minutes: Number(bufferMinutes),
        max_daily_interviews: Number(maxDailyInterviews),
        max_weekly_interviews: Number(maxWeeklyInterviews),
        max_daily_hours: Number(maxDailyHours),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err.message || 'Failed to update working hours.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-[#D9DEE8] dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D9DEE8] dark:border-slate-800 flex items-center justify-between bg-[#F5F6FA] dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#4F46B8]/10 text-[#4F46B8] flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172033] dark:text-white">
                Interviewer Working Hours & Limits
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                F07 • Configure weekly days, daily hours, lunch breaks, and burnout guardrails
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Working hours and limits saved successfully!</span>
            </div>
          )}

          {/* Select Interviewer */}
          <div>
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
              Evaluator / Interviewer
            </label>
            <select
              value={selectedInterviewerId}
              onChange={(e) => setSelectedInterviewerId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
            >
              {interviewers.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.full_name} ({i.role})
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Working Days */}
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-2">
                Active Working Days
              </label>
              <div className="flex items-center gap-2">
                {WEEKDAYS.map((d) => {
                  const isActive = workingDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDay(d.id)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                        isActive
                          ? 'bg-[#4F46B8] text-white border-[#4F46B8] shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border-[#D9DEE8] dark:border-slate-700 text-slate-500 hover:border-slate-400'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Hours Window */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                  Day Shift Start
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                  Day Shift End
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                />
              </div>
            </div>

            {/* Lunch Break Window */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-[#D9DEE8] dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#172033] dark:text-slate-200">
                <Coffee className="w-4 h-4 text-amber-600" />
                <span>Daily Lunch Break (Automatically Reserved)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#64748B] dark:text-slate-400 mb-1">
                    Lunch Start
                  </label>
                  <input
                    type="time"
                    value={lunchStart}
                    onChange={(e) => setLunchStart(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#64748B] dark:text-slate-400 mb-1">
                    Lunch End
                  </label>
                  <input
                    type="time"
                    value={lunchEnd}
                    onChange={(e) => setLunchEnd(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Guardrails & Buffer */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                  Buffer (Min)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                  Max Daily Rounds
                </label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={maxDailyInterviews}
                  onChange={(e) => setMaxDailyInterviews(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                  Max Weekly Rounds
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxWeeklyInterviews}
                  onChange={(e) => setMaxWeeklyInterviews(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D9DEE8] dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-[#4F46B8] hover:bg-[#3730A3] text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
