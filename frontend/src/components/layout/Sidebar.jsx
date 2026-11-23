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
  Info,
  GitCompare,
  CalendarDays,
  Bot,
} from 'lucide-react';

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
          isFunctional: true,
        },
        {
          id: '/resumes',
          label: 'Candidate Resumes',
          icon: Users,
          isFunctional: true,
        },
        {
          id: '/comparison',
          label: 'JD & Resume Comparison',
          icon: GitCompare,
          isFunctional: true,
        },
        {
          id: '/profile-scraper',
          label: 'Resume Importer & Excel',
          icon: Globe,
          isFunctional: true,
        },
        {
          id: '/sourcing',
          label: 'Sourcing & Excel',
          icon: FileSpreadsheet,
          isFunctional: true,
        },
        {
          id: '/interview-timetable',
          label: 'Interview Timetable',
          icon: CalendarDays,
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
          isFunctional: true,
        },
        {
          id: '/assignments',
          label: 'Recruiter Assignments',
          icon: UserCheck,
          isFunctional: true,
        },
        {
          id: '/campaigns',
          label: 'Outreach & Campaigns',
          icon: Mail,
          isFunctional: true,
        },
        {
          id: '/clients',
          label: 'Clients & Accounts',
          icon: Building2,
          isFunctional: true,
        },
      ],
    },
    {
      title: 'Intelligence & Reports',
      items: [
        {
          id: '/agent',
          label: 'AI Recruiter Agent',
          icon: Bot,
          isFunctional: true,
        },
        {
          id: '/analytics',
          label: 'Recruitment Analytics',
          icon: BarChart3,
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
          isPlanned: true,
          description: 'Workspace and recruitment pipeline preferences.',
        },
      ],
    },
  ];

  return (
    <>
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-30 md:z-20 flex flex-col h-full w-60 shrink-0 bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-surface-darkBorder select-none transition-transform duration-150 md:transition-[width] ${
          isCollapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'translate-x-0 md:w-60'
        }`}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-slate-200 dark:border-surface-darkBorder">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-700 dark:text-brand-300 font-semibold text-sm flex-shrink-0">
                T
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold tracking-tight text-navy-900 dark:text-white font-display">
                  TALENTRA
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Recruitment workspace
                </span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="mx-auto w-7 h-7 rounded-lg border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-700 dark:text-brand-300 font-semibold text-sm">
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
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
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
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group ${
                        isActive
                          ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-l-2 border-brand-600 rounded-l-none font-medium'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-darkHover hover:text-navy-900 dark:hover:text-slate-100'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-700 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'}`} />
                      {!isCollapsed && (
                        <span className="flex-1 truncate">{item.label}</span>
                      )}
                    </NavLink>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPlannedNotice(item.description)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-darkHover transition-colors cursor-pointer ${
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
        <div className="p-3 border-t border-slate-200 dark:border-surface-darkBorder">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
            {!isCollapsed ? (
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">
                  KC
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-sm font-medium text-navy-900 dark:text-slate-100 truncate">
                    Krishna Chaitanya
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Recruiter admin</span>
                </div>
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">
                KC
              </div>
            )}
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
