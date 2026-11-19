// Import React for JSX structure.
import React from 'react';

// Import icons from lucide-react.
import {
  Lock,
  ShieldAlert,
  Settings,
  LayoutDashboard,
  BarChart3,
  Cpu,
  Bell,
  ArrowRight,
} from 'lucide-react';

/**
 * BlockedGovernanceView renders a polished enterprise barrier screen
 * when a user accesses Governance & Analytics while the section is blocked.
 */
export const BlockedGovernanceView = ({ onGoToSettings, onGoToDashboard }) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="max-w-xl w-full bg-white dark:bg-surface-darkCard border border-amber-200/90 dark:border-amber-800/80 rounded-3xl p-6 sm:p-8 shadow-card text-center space-y-6">
        {/* Lock / Security Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 shadow-subtle">
          <Lock className="w-8 h-8" />
        </div>

        {/* Header & Explanation */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100/80 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Workspace Security Policy</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-navy-900 dark:text-white tracking-tight">
            Governance &amp; Analytics is Blocked
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
            Access to this section is currently restricted by administrative configuration.
            You can unblock Governance &amp; Analytics at any time from the Settings workspace.
          </p>
        </div>

        {/* Modules Currently Blocked */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-darkHover/60 border border-slate-200/80 dark:border-surface-darkBorder text-left space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block px-1">
            Restricted Modules in this Section:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-200 font-medium">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/70 dark:border-surface-darkBorder">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span>Analytics &amp; Reporting</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/70 dark:border-surface-darkBorder">
              <ShieldAlert className="w-4 h-4 text-slate-400" />
              <span>Governance &amp; Approvals</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/70 dark:border-surface-darkBorder">
              <Cpu className="w-4 h-4 text-slate-400" />
              <span>Agent Activity Observability</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/70 dark:border-surface-darkBorder">
              <Bell className="w-4 h-4 text-slate-400" />
              <span>Notifications &amp; Activity Log</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onGoToSettings && (
            <button
              type="button"
              onClick={onGoToSettings}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-subtle transition-all"
            >
              <Settings className="w-4 h-4" />
              <span>Go to Settings to Unblock</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {onGoToDashboard && (
            <button
              type="button"
              onClick={onGoToDashboard}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-surface-darkHover dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-surface-darkBorder"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
