import React from 'react';
import { Clock, Plus, Video, MapPin, Coffee, ShieldCheck, Calendar } from 'lucide-react';
import { getInterviewCategoryStyle } from '../styles';

const START_HOUR = 8;  // 08:00 AM
const END_HOUR = 19;   // 07:00 PM
const TOTAL_HOURS = END_HOUR - START_HOUR;
const ROW_HEIGHT = 80; // pixels per hour for comfortable, unclipped typography
const PX_PER_MINUTE = ROW_HEIGHT / 60; // 1.333 px/min

const HOURS_LIST = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
  const h = START_HOUR + i;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const rawH = String(h).padStart(2, '0');
  return {
    hour: h,
    raw: `${rawH}:00`,
    label: `${String(displayH).padStart(2, '0')}:00`,
    ampm,
    fullLabel: `${String(displayH).padStart(2, '0')}:00 ${ampm}`,
  };
});

const timeToMinutesFromStart = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  const totalM = h * 60 + m;
  return totalM - START_HOUR * 60;
};

export const CalendarGrid = ({
  columns = [],
  selectedDate,
  selectedInterview,
  onSelectInterview,
  onSlotClick,
}) => {
  // Current time line calculation
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;
  const currentMinutesFromStart = isToday ? now.getHours() * 60 + now.getMinutes() - START_HOUR * 60 : -1;
  const currentTop = currentMinutesFromStart * PX_PER_MINUTE;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-[#F5F6FA] dark:bg-slate-950">
      {/* Horizontally scrollable outer container */}
      <div className="flex-1 overflow-auto relative">
        <div
          className="min-w-full flex flex-col"
          style={{ minWidth: `${Math.max(columns.length * 260 + 96, 920)}px` }}
        >
          {/* Top Sticky Header: Interviewer Avatars, Roles, Specializations & F02 Workload Badges */}
          <div className="sticky top-0 z-30 flex bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[#D9DEE8] dark:border-slate-800 shadow-2xs">
            {/* Top-Left Corner Time Header: Sticky in both X and Y */}
            <div className="w-24 shrink-0 p-3 sticky left-0 z-40 border-r border-[#D9DEE8] dark:border-slate-800 bg-[#EEF1F6] dark:bg-slate-800 text-[11px] font-mono font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider flex items-center justify-center shadow-xs">
              TIME
            </div>

            {/* Column Headers */}
            {columns.map((col, cIdx) => {
              const inv = col.interviewer || {};
              const scheduledCount = col.scheduled_count !== undefined
                ? col.scheduled_count
                : col.interviews
                ? col.interviews.length
                : 0;

              const isEven = cIdx % 2 === 0;
              return (
                <div
                  key={inv.id || cIdx}
                  className={`flex-1 min-w-[250px] p-3.5 border-r border-[#D9DEE8] dark:border-slate-800 flex flex-col justify-between transition-colors ${
                    isEven ? 'bg-white dark:bg-slate-900' : 'bg-[#FAFBFC] dark:bg-slate-900/60'
                  }`}
                >
                  {/* Interviewer Identity */}
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#4F46B8] to-[#3157D5] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {(inv.full_name || 'Evaluator')
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-[#172033] dark:text-white truncate">
                        {inv.full_name || 'Evaluator'}
                      </div>
                      <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate font-semibold">
                        {inv.role || 'Evaluator'}
                      </div>
                      {inv.specialization && (
                        <div
                          title={`Technical Specialization: ${inv.specialization}`}
                          className="mt-0.5 text-[9px] font-bold text-[#4F46B8] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded-md border border-purple-200/80 dark:border-purple-800/80 truncate inline-block max-w-full"
                        >
                          {inv.specialization}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scheduled Sessions Counter */}
                  <div className="mt-2.5 pt-2 border-t border-[#D9DEE8]/60 dark:border-slate-800 flex items-center justify-between text-[10px]">
                    <span className="px-2 py-0.5 rounded-lg font-mono font-bold border bg-[#F8FAFC] dark:bg-slate-800 text-[#475569] dark:text-slate-300 border-[#D9DEE8] dark:border-slate-700 flex items-center gap-1.5 shadow-2xs">
                      <Calendar className="w-3 h-3 text-[#4F46B8]" />
                      <span>{scheduledCount} Session{scheduledCount === 1 ? '' : 's'}</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Active</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Central Grid Area */}
          <div className="relative flex" style={{ height: `${TOTAL_HOURS * ROW_HEIGHT}px` }}>
            {/* Left Sticky Time Axis */}
            <div className="w-24 shrink-0 sticky left-0 z-20 border-r border-[#D9DEE8] dark:border-slate-800 bg-[#EEF1F6] dark:bg-slate-900 shadow-sm relative">
              {HOURS_LIST.map((hObj, i) => (
                <div
                  key={hObj.raw}
                  className="absolute left-0 right-0 flex items-start justify-end pr-3 text-[11px] font-mono font-bold text-[#64748B] dark:text-slate-400 border-t border-[#D9DEE8] dark:border-slate-800"
                  style={{ top: `${i * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px` }}
                >
                  <div className="-translate-y-2.5 text-right flex items-baseline gap-1">
                    <span className="text-xs text-[#172033] dark:text-slate-200 font-extrabold">{hObj.label}</span>
                    <span className="text-[9px] text-[#64748B] dark:text-slate-400 font-bold uppercase">{hObj.ampm}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Current Time Indicator Line (Cross-Column Red Line) */}
            {isToday && currentTop >= 0 && currentTop <= TOTAL_HOURS * ROW_HEIGHT && (
              <div
                className="absolute left-0 right-0 z-25 flex items-center pointer-events-none"
                style={{ top: `${currentTop}px` }}
              >
                <div className="sticky left-0 w-24 flex items-center justify-end pr-1.5">
                  <span className="bg-[#DC2626] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm">
                    {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
                  </span>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#DC2626] -ml-1 ring-4 ring-red-500/25 shadow-sm" />
                <div className="flex-1 h-0.5 bg-[#DC2626] shadow-sm" />
              </div>
            )}

            {/* Column Timetables */}
            {columns.map((col, cIdx) => {
              const inv = col.interviewer || {};
              const interviews = col.interviews || [];
              const busyBlocks = col.busy_blocks || [];
              const isEven = cIdx % 2 === 0;

              return (
                <div
                  key={inv.id || cIdx}
                  className={`flex-1 min-w-[250px] border-r border-[#D9DEE8] dark:border-slate-800 relative group/col transition-colors ${
                    isEven
                      ? 'bg-white dark:bg-slate-900/60'
                      : 'bg-[#FAFBFC] dark:bg-slate-900/90'
                  }`}
                >
                  {/* Hourly Horizontal Grid Guidelines & 30-min Subdivisions */}
                  {HOURS_LIST.map((hObj, i) => (
                    <div
                      key={hObj.raw}
                      className="absolute left-0 right-0 border-t border-[#D9DEE8] dark:border-slate-800/80 pointer-events-none"
                      style={{ top: `${i * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px` }}
                    >
                      {/* 30-Minute Subtle Dashed Guideline */}
                      <div className="w-full border-t border-dashed border-[#D9DEE8]/60 dark:border-slate-800/50 mt-[40px]" />
                    </div>
                  ))}

                  {/* Interactive Slot Click Zones */}
                  {HOURS_LIST.map((hObj, i) => (
                    <div
                      key={`slot-${hObj.raw}`}
                      onClick={() => onSlotClick(inv.id, hObj.raw)}
                      className="absolute left-0 right-0 hover:bg-[#4F46B8]/5 dark:hover:bg-[#4F46B8]/10 cursor-pointer transition flex items-center justify-center group/slot z-[1]"
                      style={{ top: `${i * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px` }}
                    >
                      <span className="opacity-0 group-hover/slot:opacity-100 text-[10px] text-[#4F46B8] dark:text-purple-300 font-bold flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg shadow-sm border border-purple-300 dark:border-purple-700 transition">
                        <Plus className="w-3 h-3 text-[#4F46B8] dark:text-purple-400" /> Book {hObj.raw}
                      </span>
                    </div>
                  ))}

                  {/* Busy Blocks (e.g. Lunch Break - Exactly One per Column) */}
                  {busyBlocks.map((bb, bIdx) => {
                    const topMin = timeToMinutesFromStart(bb.start_time);
                    const botMin = timeToMinutesFromStart(bb.end_time);
                    const top = topMin * PX_PER_MINUTE;
                    const height = Math.max((botMin - topMin) * PX_PER_MINUTE - 2, 34);

                    return (
                      <div
                        key={`busy-${bIdx}`}
                        className="absolute left-1.5 right-1.5 rounded-xl bg-[#EAECEF] dark:bg-slate-800 border border-[#D9DEE8] dark:border-slate-700 px-3 py-1.5 text-[#64748B] dark:text-slate-300 text-[11px] font-bold flex items-center justify-center select-none shadow-2xs z-[2]"
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <Coffee className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{bb.label || 'Lunch Break'}</span>
                          <span className="text-[10px] font-mono opacity-65">({bb.start_time} - {bb.end_time})</span>
                        </span>
                      </div>
                    );
                  })}

                  {/* STRONGLY COLORED ASHBY INTERVIEW CARDS */}
                  {interviews.map((item) => {
                    const topMin = timeToMinutesFromStart(item.start_time);
                    const dur = item.duration_minutes || 60;
                    const top = topMin * PX_PER_MINUTE;
                    const height = Math.max(dur * PX_PER_MINUTE - 2, 54);
                    const colors = getInterviewCategoryStyle(item.round_name, item.status);
                    const isSelected = selectedInterview && selectedInterview.id === item.id;
                    const isConfirmed = (item.status || '').toLowerCase() === 'confirmed';

                    return (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInterview(item);
                        }}
                        title={`${item.candidate_name}\n${item.round_name} (${item.start_time} - ${item.end_time})\nPosition: ${item.jd_title || 'N/A'}\nStatus: ${item.status}`}
                        className={`absolute left-1.5 right-1.5 rounded-xl px-2.5 py-2 transition-all cursor-pointer z-[5] overflow-hidden flex flex-col justify-between ${
                          colors.cardBg
                        } ${
                          isSelected
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#4F46B8] shadow-lg scale-[1.01]'
                            : ''
                        }`}
                        style={{
                          top: `${top + 1}px`,
                          height: `${height}px`,
                          backgroundColor: colors.accent,
                          borderColor: colors.accent,
                        }}
                      >
                        {/* Line 1: Time Range & Stage Badge */}
                        <div className="flex items-center justify-between gap-1 leading-none">
                          <span className={`text-[10px] font-mono font-bold ${colors.timeText} truncate`}>
                            {item.start_time} - {item.end_time}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${colors.badge} truncate uppercase tracking-wider leading-none`}
                          >
                            {item.round_name ? item.round_name.split(' ')[0] : 'Round'}
                          </span>
                        </div>

                        {/* Line 2: Candidate Name & Confirmed Indicator */}
                        <div className="flex items-center justify-between gap-1 my-auto">
                          <div className="font-black text-xs text-white truncate leading-tight">
                            {item.candidate_name}
                          </div>
                          {isConfirmed && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#22A06B] text-white border border-white/40 flex items-center gap-0.5 shrink-0 shadow-xs leading-none"
                              title="Confirmed Session"
                            >
                              <ShieldCheck className="w-2.5 h-2.5 text-white" />
                              <span>Confirmed</span>
                            </span>
                          )}
                        </div>

                        {/* Line 3: Requisition / Mode Footer (Unclipped with Tooltip) */}
                        <div className={`text-[10px] ${colors.subtext} truncate flex items-center gap-1 font-medium leading-none`}>
                          {item.mode?.includes('meet') || item.mode?.includes('virtual') ? (
                            <Video className="w-3 h-3 shrink-0 text-white/90" />
                          ) : (
                            <MapPin className="w-3 h-3 shrink-0 text-white/90" />
                          )}
                          <span className="truncate">{item.jd_title || item.round_name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
