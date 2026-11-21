/**
 * TALENTRA Interview Timetable Design System Styles & Tokens
 * Adheres strictly to the Ashby enterprise design identity:
 * - Canvas Background: #F5F6FA
 * - Surface Cards: #FFFFFF
 * - Primary Control Purple: #4F46B8
 * - Grid Borders: #D9DEE8
 * 
 * Ashby Round Categories:
 * - Initial Screening: Blue #3157D5
 * - Technical: Purple #4F46B8
 * - Managerial: Orange #E58A36
 * - HR Discussion: Pink #DB3281
 * - Final Discussion: Teal #19B5B5
 * - Confirmed: Green #22A06B
 * - Cancelled: Red #DC2626
 * - Unavailable: Grey #D8D8E1
 */

export const getInterviewCategoryStyle = (roundName = '', status = '') => {
  const st = (status || '').toLowerCase();
  
  if (st === 'cancelled') {
    return {
      cardBg: 'bg-[#DC2626] text-white shadow-sm',
      agendaBg: 'bg-[#DC2626] text-white',
      softBg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
      border: 'border-red-400 dark:border-red-700',
      text: 'text-white',
      subtext: 'text-red-100',
      timeText: 'text-red-100',
      badge: 'bg-white/20 text-white border border-white/30 backdrop-blur-xs',
      bar: 'bg-[#B91C1C]',
      dot: 'bg-[#DC2626]',
      accent: '#DC2626',
      label: 'Cancelled',
    };
  }

  if (st === 'completed') {
    return {
      cardBg: 'bg-[#475569] text-white shadow-sm',
      agendaBg: 'bg-[#475569] text-white',
      softBg: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700',
      border: 'border-slate-500 dark:border-slate-600',
      text: 'text-white',
      subtext: 'text-slate-200',
      timeText: 'text-slate-200',
      badge: 'bg-white/20 text-white border border-white/30 backdrop-blur-xs',
      bar: 'bg-[#334155]',
      dot: 'bg-[#475569]',
      accent: '#475569',
      label: 'Completed',
    };
  }

  const r = (roundName || '').toLowerCase();

  // 1. Initial Screening -> Ashby Blue #3157D5
  if (r.includes('screening') || r.includes('initial')) {
    return {
      cardBg: 'bg-[#3157D5] text-white shadow-md hover:shadow-lg',
      agendaBg: 'bg-[#3157D5] text-white',
      softBg: 'bg-[#3157D5]/10 text-[#3157D5] border-[#3157D5]/30 dark:bg-[#3157D5]/25 dark:text-[#C4D1FC]',
      border: 'border-[#2848B8]',
      text: 'text-white',
      subtext: 'text-blue-100',
      timeText: 'text-blue-100',
      badge: 'bg-white/20 text-white border border-white/30 backdrop-blur-xs',
      bar: 'bg-[#223FA6]',
      dot: 'bg-[#3157D5]',
      accent: '#3157D5',
      label: 'Initial Screening',
    };
  }

  // 2. Managerial Round -> Ashby Orange #E58A36
  if (r.includes('manager')) {
    return {
      cardBg: 'bg-[#E58A36] text-white shadow-md hover:shadow-lg',
      agendaBg: 'bg-[#E58A36] text-white',
      softBg: 'bg-[#E58A36]/10 text-[#E58A36] border-[#E58A36]/30 dark:bg-[#E58A36]/25 dark:text-[#FFEDD5]',
      border: 'border-[#C87326]',
      text: 'text-white',
      subtext: 'text-amber-100',
      timeText: 'text-amber-100',
      badge: 'bg-white/20 text-white border border-white/30 backdrop-blur-xs',
      bar: 'bg-[#B45F13]',
      dot: 'bg-[#E58A36]',
      accent: '#E58A36',
      label: 'Managerial Round',
    };
  }

  // 3. HR Discussion -> Ashby Pink #DB3281
  if (r.includes('hr') || r.includes('culture') || r.includes('behavioral')) {
    return {
      cardBg: 'bg-[#DB3281] text-white shadow-md hover:shadow-lg',
      agendaBg: 'bg-[#DB3281] text-white',
      softBg: 'bg-[#DB3281]/10 text-[#DB3281] border-[#DB3281]/30 dark:bg-[#DB3281]/25 dark:text-[#FCE7F3]',
      border: 'border-[#BF246E]',
      text: 'text-white',
      subtext: 'text-pink-100',
      timeText: 'text-pink-100',
      badge: 'bg-white/20 text-white border border-white/30 backdrop-blur-xs',
      bar: 'bg-[#A3165B]',
      dot: 'bg-[#DB3281]',
      accent: '#DB3281',
      label: 'HR Discussion',
    };
  }

  // 4. Final Discussion -> Ashby Teal #19B5B5
  if (r.includes('final') || r.includes('client') || r.includes('executive') || r.includes('offer')) {
    return {
      cardBg: 'bg-[#19B5B5] text-white shadow-md hover:shadow-lg',
      agendaBg: 'bg-[#19B5B5] text-white',
      softBg: 'bg-[#19B5B5]/10 text-[#19B5B5] border-[#19B5B5]/30 dark:bg-[#19B5B5]/25 dark:text-[#CCFBF1]',
      border: 'border-[#149898]',
      text: 'text-white',
      subtext: 'text-teal-100',
      timeText: 'text-teal-100',
      badge: 'bg-white/20 text-white border border-white/30 backdrop-blur-xs',
      bar: 'bg-[#0E7D7D]',
      dot: 'bg-[#19B5B5]',
      accent: '#19B5B5',
      label: 'Final Discussion',
    };
  }

  // 5. Default Technical Round -> Ashby Purple #4F46B8
  return {
    cardBg: 'bg-[#4F46B8] text-white shadow-md hover:shadow-lg',
    agendaBg: 'bg-[#4F46B8] text-white',
    softBg: 'bg-[#4F46B8]/10 text-[#4F46B8] border-[#4F46B8]/30 dark:bg-[#4F46B8]/25 dark:text-[#E0E7FF]',
    border: 'border-[#3D359E]',
    text: 'text-white',
    subtext: 'text-purple-100',
    timeText: 'text-purple-100',
    badge: 'bg-white/20 text-white border border-white/30 backdrop-blur-xs',
    bar: 'bg-[#312986]',
    dot: 'bg-[#4F46B8]',
    accent: '#4F46B8',
    label: 'Technical Round',
  };
};

export const CATEGORY_LEGEND = [
  {
    key: 'screening',
    label: 'Initial Screening',
    color: '#3157D5',
    bg: 'bg-[#3157D5]',
    badgeBg: 'bg-[#3157D5]/15 text-[#3157D5] border-[#3157D5]/30',
    dot: 'bg-[#3157D5]',
  },
  {
    key: 'technical',
    label: 'Technical Round',
    color: '#4F46B8',
    bg: 'bg-[#4F46B8]',
    badgeBg: 'bg-[#4F46B8]/15 text-[#4F46B8] border-[#4F46B8]/30',
    dot: 'bg-[#4F46B8]',
  },
  {
    key: 'managerial',
    label: 'Managerial Round',
    color: '#E58A36',
    bg: 'bg-[#E58A36]',
    badgeBg: 'bg-[#E58A36]/15 text-[#E58A36] border-[#E58A36]/30',
    dot: 'bg-[#E58A36]',
  },
  {
    key: 'hr',
    label: 'HR Discussion',
    color: '#DB3281',
    bg: 'bg-[#DB3281]',
    badgeBg: 'bg-[#DB3281]/15 text-[#DB3281] border-[#DB3281]/30',
    dot: 'bg-[#DB3281]',
  },
  {
    key: 'final',
    label: 'Final Discussion',
    color: '#19B5B5',
    bg: 'bg-[#19B5B5]',
    badgeBg: 'bg-[#19B5B5]/15 text-[#19B5B5] border-[#19B5B5]/30',
    dot: 'bg-[#19B5B5]',
  },
];
