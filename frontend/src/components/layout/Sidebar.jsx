import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Building2,
  Sparkles,
  UserCheck,
  Mail,
  BarChart3,
  FileSpreadsheet,
  Globe,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Info,
  GitCompare,
  CalendarDays,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Clean Enterprise Navigation Sidebar for TALENTRA.
 *
 * Dedicated strictly to core talent operations:
 * - Job Descriptions (Requisitions, specs, upload)
 * - Candidate Resumes (Talent profiles, skills, upload)
 * - Settings & Theme Toggle
 */
export const Sidebar = ({
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [plannedNotice, setPlannedNotice] = useState(null);

  const navSections = [
    {
      title: 'Overview',
      items: [
        {
          id: '/',
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: null,
          isFunctional: true,
        },
      ],
    },
    {
      title: 'Talent Sourcing',
      items: [
        {
          id: '/jds',
          label: 'Job Requisitions',
          icon: Briefcase,
          badge: '10',
          isFunctional: true,
        },
        {
          id: '/resumes',
          label: 'Candidate Resumes',
          icon: Users,
          badge: '195',
          isFunctional: true,
        },
        {
          id: '/comparison',
          label: 'JD & Resume Comparison',
          icon: GitCompare,
          badge: 'Dual AI',
          isFunctional: true,
        },
        {
          id: '/profile-scraper',
          label: 'Resume Extraction',
          icon: Globe,
          badge: null,
          isFunctional: true,
        },
        {
          id: '/sourcing',
          label: 'Sourcing & Excel',
          icon: FileSpreadsheet,
          badge: null,
          isFunctional: true,
        },
        {
          id: '/interview-timetable',
          label: 'Interview Timetable',
          icon: CalendarDays,
          badge: 'New',
          isFunctional: true,
        },
      ],
    },
    {
      title: 'Recruitment Pipeline',
      items: [
        {
          id: '/matching',
          label: 'Candidate Matching',
          icon: Sparkles,
          badge: 'AI Match',
          isFunctional: true,
        },
        {
          id: '/assignments',
          label: 'TA Assignments',
          icon: UserCheck,
          badge: null,
          isFunctional: true,
        },
        {
          id: '/campaigns',
          label: 'Outreach & Campaigns',
          icon: Mail,
          badge: null,
          isFunctional: true,
        },
        {
          id: '/clients',
          label: 'Clients & Accounts',
          icon: Building2,
          badge: null,
          isFunctional: true,
        },
      ],
    },
    {
      title: 'Intelligence & Reports',
      items: [
        {
          id: '/analytics',
          label: 'Recruitment Analytics',
          icon: BarChart3,
          badge: null,
          isFunctional: true,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: '/settings',
          label: 'Settings',
          icon: Settings,
          badge: null,
          isPlanned: true,
          description: 'Workspace and recruitment pipeline preferences.',
        },
      ],
    },
  ];

  return (
    <>
      <aside
        className={`relative flex flex-col h-full bg-white dark:bg-surface-dark border-r border-slate-200/80 dark:border-surface-darkBorder transition-all duration-300 ease-in-out select-none z-20 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 dark:border-surface-darkBorder">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-navy-900 flex items-center justify-center text-white font-bold text-sm shadow-subtle flex-shrink-0">
                T
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold tracking-tight text-navy-900 dark:text-white font-display">
                  TALENTRA
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium tracking-wider uppercase">
                  Talent Intelligence
                </span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-navy-900 flex items-center justify-center text-white font-bold text-sm shadow-subtle">
              T
            </div>
          )}

          {onToggleCollapse && !isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-darkHover transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                  {section.title}
                </div>
              )}

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.id === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.id);

                if (item.isFunctional) {
                  return (
                    <NavLink
                      key={item.id}
                      to={item.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-bold shadow-subtle border border-brand-200/60 dark:border-brand-800/60'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-surface-darkHover hover:text-navy-900 dark:hover:text-slate-100'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                      {!isCollapsed && (
                        <div className="flex items-center justify-between flex-1 truncate gap-1">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </NavLink>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPlannedNotice(item.description)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-surface-darkHover/40 transition-colors cursor-pointer ${
                      isCollapsed ? 'justify-center px-0' : ''
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && (
                      <span className="flex-1 truncate text-left">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Collapsed Toggle Button when collapsed */}
        {isCollapsed && onToggleCollapse && (
          <div className="p-3 border-t border-slate-100 dark:border-surface-darkBorder flex justify-center">
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-darkHover transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* User & Theme Toggle Row */}
        <div className="p-3 border-t border-slate-100 dark:border-surface-darkBorder">
          <div className={`flex items-center justify-between ${isCollapsed ? 'flex-col gap-2' : ''}`}>
            {!isCollapsed ? (
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">
                  KC
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-semibold text-navy-900 dark:text-slate-100 truncate">
                    Krishna Chaitanya
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400">Recruiter Admin</span>
                </div>
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">
                KC
              </div>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-darkHover transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Planned Feature Toast / Modal */}
      {plannedNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-navy-900 text-white text-xs shadow-dropdown flex items-center gap-3 animate-fadeIn">
          <Info className="w-4 h-4 text-brand-400 shrink-0" />
          <span>{plannedNotice}</span>
          <button
            onClick={() => setPlannedNotice(null)}
            className="ml-2 text-slate-400 hover:text-white font-bold"
          >
            &times;
          </button>
        </div>
      )}
    </>
  );
};
