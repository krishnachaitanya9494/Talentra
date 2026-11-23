import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Users,
  Clock,
  Mail,
  RefreshCw,
  CalendarDays,
  Sparkles,
  Check,
  Link2,
  Layers,
  Settings2,
} from 'lucide-react';
import { interviewApi } from '../api';
import { CATEGORY_LEGEND } from '../styles';
import { CalendarGrid } from '../components/CalendarGrid';
import { RightPanel } from '../components/RightPanel';
import { AddInterviewModal } from '../components/AddInterviewModal';
import { EditInterviewModal } from '../components/EditInterviewModal';
import { RescheduleModal } from '../components/RescheduleModal';
import { CancelInterviewModal } from '../components/CancelInterviewModal';
import { InvitationPreviewModal } from '../components/InvitationPreviewModal';
import { InterviewHistoryModal } from '../components/InterviewHistoryModal';

const VIEW_OPTIONS = ['Day', '3 Days', 'Week', 'Multi-day'];

export const InterviewTimetablePage = () => {
  // Calendar date range states
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedView, setSelectedView] = useState('Week');
  const [interviewerFilter, setInterviewerFilter] = useState('');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [roundFilter, setRoundFilter] = useState('');

  // Loaded data
  const [interviewers, setInterviewers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [gridData, setGridData] = useState(null);
  const [allInterviews, setAllInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected item states
  const [selectedInterview, setSelectedInterview] = useState(null);

  // Modal triggers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addDefaultSlot, setAddDefaultSlot] = useState({ interviewerId: null, time: '10:00' });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Compute date range based on view
  const computeDateRange = useCallback(() => {
    const base = new Date(currentDate);
    if (selectedView === 'Day') {
      return { start: currentDate, end: currentDate };
    }
    if (selectedView === '3 Days') {
      const endD = new Date(base);
      endD.setDate(base.getDate() + 2);
      return { start: currentDate, end: endD.toISOString().split('T')[0] };
    }
    // Week view (default): 7 days starting from base
    const endW = new Date(base);
    endW.setDate(base.getDate() + 6);
    return { start: currentDate, end: endW.toISOString().split('T')[0] };
  }, [currentDate, selectedView]);

  // Load calendar grid and interviewers
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = computeDateRange();
      const [invList, candList, grid] = await Promise.all([
        interviewApi.getInterviewers(),
        interviewApi.getCandidates(),
        interviewApi.getCalendarGrid(start, end, interviewerFilter ? Number(interviewerFilter) : null),
      ]);
      setInterviewers(invList);
      setCandidates(candList);
      setGridData(grid);

      // Collect all interviews flatly for quick access
      const flat = [];
      (grid.columns || []).forEach((c) => {
        (c.interviews || []).forEach((it) => {
          if (!flat.some((x) => x.id === it.id)) {
            flat.push(it);
          }
        });
      });
      setAllInterviews(flat);
    } catch (err) {
      console.error('Failed to load timetable data', err);
    } finally {
      setLoading(false);
    }
  }, [computeDateRange, interviewerFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigation handlers
  const handlePrevRange = () => {
    const d = new Date(currentDate);
    const step = selectedView === 'Day' ? 1 : selectedView === '3 Days' ? 3 : 7;
    d.setDate(d.getDate() - step);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleNextRange = () => {
    const d = new Date(currentDate);
    const step = selectedView === 'Day' ? 1 : selectedView === '3 Days' ? 3 : 7;
    d.setDate(d.getDate() + step);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setCurrentDate(new Date().toISOString().split('T')[0]);
  };

  // Slot click to open add modal
  const handleSlotClick = (interviewerId, rawHour) => {
    setAddDefaultSlot({
      interviewerId,
      time: rawHour,
    });
    setIsAddOpen(true);
  };

  // Filter columns based on search and round
  const rawColumns = gridData?.columns || [];
  const filteredColumns = rawColumns.map((col) => {
    let filtered = col.interviews || [];
    if (candidateSearch.trim()) {
      const q = candidateSearch.toLowerCase();
      filtered = filtered.filter(
        (it) =>
          it.candidate_name?.toLowerCase().includes(q) ||
          it.jd_title?.toLowerCase().includes(q) ||
          it.round_name?.toLowerCase().includes(q)
      );
    }
    if (roundFilter) {
      filtered = filtered.filter((it) =>
        it.round_name?.toLowerCase().includes(roundFilter.toLowerCase())
      );
    }
    return {
      ...col,
      interviews: filtered,
    };
  });

  // Interviews on currently active date for RightPanel
  const activeDayInterviews = allInterviews.filter(
    (it) => it.interview_date === currentDate && it.status !== 'cancelled'
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-50 dark:bg-surface-darkCanvas">
      {/* =========================================================================
          TOP HEADER - ASHBY ENTERPRISE COORDINATION SYSTEM
         ========================================================================= */}
      <div className="px-6 py-4 shrink-0 border-b border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title and description */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-700 text-white flex items-center justify-center">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-navy-900 dark:text-white flex items-center gap-2.5">
                  <span>Interview timetable</span>
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Review scheduled interviews and manage interview rounds
                </p>
              </div>
            </div>
          </div>

          {/* Quick Date Range & Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Today Button */}
            <button
              onClick={handleToday}
              className="h-9 px-3.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-surface-darkHover hover:bg-slate-50 dark:hover:bg-surface-dark rounded-lg border border-slate-200 dark:border-surface-darkBorder transition-colors flex items-center justify-center"
            >
              Today
            </button>

            {/* Prev / Next Range Buttons */}
            <div className="h-9 flex items-center rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-surface-darkHover overflow-hidden">
              <button
                onClick={handlePrevRange}
                className="h-full px-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors flex items-center justify-center"
                title="Previous range"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="h-full px-3 text-sm font-medium text-navy-900 dark:text-white border-x border-slate-200 dark:border-surface-darkBorder flex items-center justify-center bg-slate-50 dark:bg-surface-dark">
                {currentDate}
              </span>
              <button
                onClick={handleNextRange}
                className="h-full px-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors flex items-center justify-center"
                title="Next range"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View Selector (Day, 3 Days, Week, Multi-day) */}
            <div className="h-9 flex items-center rounded-lg p-1 bg-slate-100 dark:bg-surface-darkHover border border-slate-200 dark:border-surface-darkBorder">
              {VIEW_OPTIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => setSelectedView(v)}
                  className={`h-full px-3 text-xs font-bold rounded-lg transition flex items-center justify-center ${
                    selectedView === v
                      ? 'bg-white dark:bg-surface-dark text-brand-700 dark:text-brand-300'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Refresh Data */}
            <button
              onClick={loadData}
              disabled={loading}
              className="h-9 w-9 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-surface-darkHover rounded-lg border border-slate-200 dark:border-surface-darkBorder transition-colors flex items-center justify-center shrink-0"
              title="Refresh Timetable"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-700' : ''}`} />
            </button>

            {/* Primary Add Interview Action */}
            <button
              onClick={() => {
                setAddDefaultSlot({ interviewerId: null, time: '10:00' });
                setIsAddOpen(true);
              }}
              className="h-9 px-4 text-sm font-medium text-white bg-brand-700 hover:bg-brand-800 active:bg-brand-900 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add interview</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter & Round Category Bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-surface-darkBorder flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
            {/* Candidate Search */}
            <div className="relative w-full sm:flex-1 sm:max-w-xs">
              <input
                type="text"
                placeholder="Search candidate, role or round..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                className="w-full h-9 text-sm py-1.5 pl-8 pr-3 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-surface-darkHover text-navy-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Interviewer Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1 whitespace-nowrap">
                <Users className="w-3.5 h-3.5 text-brand-700 dark:text-brand-300" />
                Interviewer:
              </span>
              <select
                value={interviewerFilter}
                onChange={(e) => setInterviewerFilter(e.target.value)}
                className="w-full sm:w-auto h-9 text-sm py-1.5 px-3 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-surface-darkHover text-navy-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700"
              >
                <option value="">All Panel Evaluators ({interviewers.length})</option>
                {interviewers.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.full_name} ({inv.scheduled_count} scheduled)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Category Legend Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mr-1">
              Rounds:
            </span>
            {CATEGORY_LEGEND.map((cat) => {
              const isActive = roundFilter.toLowerCase() === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setRoundFilter(isActive ? '' : cat.key)}
                  title={`Filter by ${cat.label}`}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition shadow-2xs hover:opacity-90"
                  style={{
                    backgroundColor: isActive ? cat.color : `${cat.color}18`,
                    borderColor: isActive ? cat.color : `${cat.color}45`,
                    color: isActive ? '#FFFFFF' : cat.color,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: isActive ? '#FFFFFF' : cat.color }}
                  />
                  <span>{cat.label}</span>
                  {isActive && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
            {roundFilter && (
              <button
                onClick={() => setRoundFilter('')}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 underline ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          CENTRAL WORKSPACE: MULTI-COLUMN GRID + RIGHT PANEL
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* Central Interviewer Timetable Grid */}
        <CalendarGrid
          columns={filteredColumns}
          selectedDate={currentDate}
          selectedInterview={selectedInterview}
          onSelectInterview={(item) => setSelectedInterview(item)}
          onSlotClick={handleSlotClick}
        />

        {/* Right-Side Interview Management Panel */}
        <RightPanel
          selectedInterview={selectedInterview}
          selectedDate={currentDate}
          dayInterviews={activeDayInterviews}
          onSelectInterview={(item) => setSelectedInterview(item)}
          onClose={() => setSelectedInterview(null)}
          onOpenAdd={() => {
            setAddDefaultSlot({ interviewerId: null, time: '10:00' });
            setIsAddOpen(true);
          }}
          onOpenEdit={(item) => {
            setSelectedInterview(item);
            setIsEditOpen(true);
          }}
          onOpenReschedule={(item) => {
            setSelectedInterview(item);
            setIsRescheduleOpen(true);
          }}
          onOpenCancel={(item) => {
            setSelectedInterview(item);
            setIsCancelOpen(true);
          }}
          onOpenInvite={(item) => {
            setSelectedInterview(item);
            setIsInviteOpen(true);
          }}
          onOpenHistory={(item) => {
            setSelectedInterview(item);
            setIsHistoryOpen(true);
          }}
          onStatusUpdated={(updated) => {
            setSelectedInterview(updated);
            loadData();
          }}
        />
      </div>

      {/* =========================================================================
          MODALS & DRAWERS
         ========================================================================= */}
      <AddInterviewModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        defaultDate={currentDate}
        defaultStartTime={addDefaultSlot.time}
        defaultInterviewerId={addDefaultSlot.interviewerId}
        interviewers={interviewers}
        onSuccess={() => {
          loadData();
        }}
      />

      <EditInterviewModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        interview={selectedInterview}
        onSuccess={(updated) => {
          setSelectedInterview(updated);
          loadData();
        }}
      />

      <RescheduleModal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        interview={selectedInterview}
        onSuccess={(updated) => {
          setSelectedInterview(updated);
          loadData();
        }}
      />

      <CancelInterviewModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        interview={selectedInterview}
        onSuccess={() => {
          setSelectedInterview(null);
          loadData();
        }}
      />

      <InvitationPreviewModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        interview={selectedInterview}
      />

      <InterviewHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        interview={selectedInterview}
      />
    </div>
  );
};
