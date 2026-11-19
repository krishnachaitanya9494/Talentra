import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { Magnet } from '../reactbits/Magnet';
import { useTheme } from '../../context/ThemeContext';

/**
 * Enterprise Topbar Component for TALENTRA.
 *
 * Implements CompanyAI's Topbar design tokens:
 * - Height: 64px (h-16)
 * - Glass surface with subtle border and backdrop-blur
 * - Breadcrumb / Title area with responsive mobile drawer toggle
 * - Global Search trigger with ⌘K badge
 * - React Bits Magnet pull on AI trigger button
 * - Theme toggle button with smooth icon transitions
 * - Notification bell and user profile dropdown
 */
export const Topbar = ({
  title = 'Environment Overview',
  subtitle = 'System Diagnostics & Infrastructure Baseline',
  onToggleSidebar,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <header className="h-16 px-4 md:px-6 border-b border-slate-200/80 dark:border-surface-darkBorder bg-white/90 dark:bg-surface-darkCard/90 backdrop-blur-md glass-surface flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Left side: mobile menu trigger, title, and breadcrumb context */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title="Toggle navigation sidebar"
            className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-darkHover transition-colors md:hidden cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-semibold text-navy-900 dark:text-white tracking-tight truncate font-display">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] md:text-sm text-slate-500 dark:text-slate-400 font-normal truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right side: Global Search, AI trigger, Theme switch, Notifications, and Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Global ⌘K search shortcut button */}
        <button
          type="button"
          title="Global Search (⌘K / Ctrl+K)"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/90 dark:bg-surface-darkHover hover:bg-slate-200/70 dark:hover:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white text-[15px] rounded-xl transition-all shadow-subtle btn-interactive cursor-pointer"
        >
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="hidden sm:inline font-medium text-xs">Search</span>
          <span className="text-[11px] bg-white dark:bg-surface-darkCard px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-slate-500 dark:text-slate-400">
            ⌘K
          </span>
        </button>

        {/* AI Assistant shortcut button with subtle React Bits Magnet pull */}
        <Magnet padding={20} magnetStrength={8}>
          <button
            type="button"
            title="Talent Intelligence AI Assistant"
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-3.5 py-1.5 bg-gradient-to-r from-brand-50 via-white to-accent-50 dark:from-brand-900/30 dark:via-surface-darkCard dark:to-accent-950/60 hover:from-brand-100/80 hover:to-accent-100/80 dark:hover:to-accent-900/50 border border-accent-200/80 dark:border-accent-700/60 text-accent-700 dark:text-accent-400 text-xs font-semibold rounded-xl transition-all shadow-subtle btn-interactive group cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent-600 dark:text-accent-400 transition-transform group-hover:rotate-12" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </Magnet>

        {/* Vertical divider */}
        <div className="w-px h-5 bg-slate-200 dark:bg-surface-darkBorder" />

        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-darkHover transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 btn-interactive group cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 transition-transform duration-300 group-hover:-rotate-12" />
          )}
        </button>

        {/* Notification bell button */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            title="System notifications"
            className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-darkHover transition-colors relative border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-surface-darkCard" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-surface-darkBorder rounded-2xl shadow-dropdown p-4 text-xs z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-surface-darkBorder mb-3">
                <span className="font-semibold text-navy-900 dark:text-white">System Diagnostics</span>
                <span className="text-[10px] text-slate-400 font-mono">Live</span>
              </div>
              <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-800 text-brand-800 dark:text-brand-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 text-brand-600 dark:text-brand-400 mt-0.5" />
                <div>
                  <span className="font-semibold block">Infrastructure Verified</span>
                  <span className="text-[11px] text-brand-700 dark:text-brand-300">
                    FastAPI + SQLite + React 18 operational.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile menu dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-surface-darkHover border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-navy-950 dark:bg-slate-700 text-white flex items-center justify-center text-xs font-bold shadow-subtle">
              KC
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-surface-darkBorder rounded-2xl shadow-dropdown p-2 text-xs z-50 animate-fadeIn">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-surface-darkBorder mb-1">
                <span className="font-semibold text-navy-900 dark:text-white block">Krishna C.</span>
                <span className="text-[11px] text-slate-400">Platform Engineer</span>
              </div>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-darkHover font-medium transition-colors"
              >
                Profile & Settings
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-darkHover font-medium transition-colors"
              >
                API Tokens
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
