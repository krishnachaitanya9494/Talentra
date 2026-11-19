import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Cpu,
  Database,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Info,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Enterprise Navigation Sidebar for TALENTRA.
 *
 * Implements CompanyAI's exact design system:
 * - Expanded width: ~256px (w-64)
 * - Collapsed icon rail: ~64px (w-16)
 * - Dual-tone brand identity header with badge
 * - Grouped navigation sections with active emerald rail highlight
 * - Bottom telemetry card and user profile row with theme toggle
 * - Responsive backdrop overlay for mobile viewports
 */
export const Sidebar = ({
  isCollapsed = false,
  onToggleCollapse,
  activeRoute = '/',
}) => {
  const { theme, toggleTheme } = useTheme();
  const [plannedNotice, setPlannedNotice] = useState(null);

  const navSections = [
    {
      title: 'Workspace',
      items: [
        {
          id: '/',
          label: 'Environment Overview',
          icon: LayoutDashboard,
          badge: 'Ready',
          isFunctional: true,
        },
        {
          id: '/intelligence',
          label: 'Talent Intelligence',
          icon: Sparkles,
          badge: 'AI Core',
          isAi: true,
          isPlanned: true,
          description: 'AI Talent Intelligence models are reserved for Phase 2.',
        },
      ],
    },
    {
      title: 'Infrastructure & Data',
      items: [
        {
          id: '/backend',
          label: 'FastAPI Service',
          icon: Cpu,
          badge: 'Port 8000',
          isPlanned: true,
          description: 'FastAPI health diagnostics endpoint is active on Port 8000.',
        },
        {
          id: '/database',
          label: 'SQLite & SQLAlchemy',
          icon: Database,
          badge: 'Active',
          isPlanned: true,
          description: 'Isolated SQLite database is connected in data/talentra_dev.db.',
        },
        {
          id: '/metrics',
          label: 'System Diagnostics',
          icon: BarChart3,
          badge: null,
          isPlanned: true,
          description: 'Platform infrastructure benchmarks & logs.',
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
        {
          id: '/settings',
          label: 'Settings',
          icon: Settings,
          badge: null,
          isPlanned: true,
          description: 'Environment and platform configuration.',
        },
      ],
    },
  ];

  const handleItemClick = (e, item) => {
    if (item.isPlanned) {
      e.preventDefault();
      setPlannedNotice(item.description || `${item.label} is planned for a future release.`);
      setTimeout(() => setPlannedNotice(null), 3200);
    }
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {!isCollapsed && onToggleCollapse && (
        <div
          onClick={onToggleCollapse}
          aria-hidden="true"
          className="fixed inset-0 bg-navy-950/40 backdrop-blur-[1px] z-30 md:hidden animate-fadeIn"
        />
      )}

      <aside
        className={`h-screen fixed md:sticky top-0 left-0 flex flex-col bg-white/95 dark:bg-surface-darkCard/95 backdrop-blur-md glass-surface border-r border-slate-200/80 dark:border-surface-darkBorder select-none transition-all duration-200 z-40 md:z-30 ${
          isCollapsed ? 'hidden md:flex md:w-16 md:min-w-[4rem]' : 'w-64 min-w-[16rem] shadow-2xl md:shadow-none'
        }`}
      >
        {/* Workspace branding header */}
        <div className="flex items-center justify-between px-3.5 py-4 border-b border-slate-100 dark:border-surface-darkBorder">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Dual-tone Emerald-Indigo logo badge */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-50 to-accent-100 dark:from-brand-900/50 dark:to-accent-900/60 border border-accent-200/80 dark:border-accent-700/60 flex items-center justify-center text-accent-600 dark:text-accent-400 shadow-subtle flex-shrink-0">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>

            {/* Brand identity titles */}
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-navy-900 dark:text-white tracking-tight truncate font-display">
                    TALENTRA
                  </span>
                  <span className="px-1.5 py-0.2 text-[10px] font-semibold text-accent-700 dark:text-accent-400 bg-accent-50 dark:bg-accent-950/60 border border-accent-200 dark:border-accent-700/60 rounded">
                    v0.1.0
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  Talent Intelligence
                </span>
              </div>
            )}
          </div>

          {/* Collapsible sidebar toggle button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1 rounded-lg text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-darkHover transition-colors cursor-pointer"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Planned feature temporary banner */}
        {plannedNotice && !isCollapsed && (
          <div className="mx-3 mt-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs flex items-start gap-2 animate-fadeIn">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="text-[11px] leading-tight">{plannedNotice}</span>
          </div>
        )}

        {/* Main navigation list grouped by sections */}
        <div className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto no-scrollbar">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2 pb-1">
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                    {section.title}
                  </span>
                </div>
              )}

              {section.items.map((item) => {
                const isActive = activeRoute === item.id;
                const IconComponent = item.icon;

                return (
                  <NavLink
                    key={item.id}
                    to={item.id}
                    onClick={(e) => handleItemClick(e, item)}
                    aria-current={isActive ? 'page' : undefined}
                    title={isCollapsed ? item.label : undefined}
                    className={`relative w-full flex items-center ${
                      isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
                    } rounded-xl text-[15px] font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-slate-100/95 dark:bg-surface-darkHover text-navy-950 dark:text-white shadow-subtle font-semibold'
                        : item.isPlanned
                        ? 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50/60 dark:hover:bg-surface-darkHover/40 opacity-80'
                        : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-50/90 dark:hover:bg-surface-darkHover hover:translate-x-0.5'
                    }`}
                  >
                    {isActive && !isCollapsed && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-brand-600 dark:bg-brand-400"
                      />
                    )}

                    <div className="flex items-center gap-2.5 min-w-0">
                      <IconComponent
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          isActive
                            ? item.isAi
                              ? 'text-brand-600 dark:text-brand-400'
                              : 'text-navy-950 dark:text-white'
                            : item.isPlanned
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          item.isAi
                            ? 'bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-700/60'
                            : isActive
                            ? 'bg-white dark:bg-slate-800 text-navy-900 dark:text-white border border-slate-200 dark:border-slate-700'
                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Profile & System Telemetry Footer */}
        <div className="p-2.5 border-t border-slate-100 dark:border-surface-darkBorder bg-surface-50/60 dark:bg-surface-darkCanvas/40 space-y-2">
          {!isCollapsed && (
            <div className="p-2.5 bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder rounded-xl shadow-subtle">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Talent Engine
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 dark:text-brand-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                  Synced
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-navy-900 dark:text-white font-medium">
                <Database className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>SQLite & FastAPI Baseline</span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal truncate">
                Isolated DB &bull; Environment Verified
              </p>
            </div>
          )}

          {/* User profile row and theme toggle */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between px-1'}`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 shadow-subtle">
                KC
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-navy-900 dark:text-white truncate">Krishna C.</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">Platform Engineer</span>
                </div>
              )}
            </div>

            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-darkHover transition-colors flex-shrink-0 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
