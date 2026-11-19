import React from 'react';

/**
 * Top Header Component.
 *
 * Provides application-wide top navigation, current context indicators,
 * and environment status signals.
 */
export default function Header() {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center space-x-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Environment
        </span>
        <span className="text-slate-600">/</span>
        <span className="text-xs font-medium text-slate-200">
          Overview & Diagnostics
        </span>
      </div>

      <div className="flex items-center space-x-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
          Environment Ready
        </span>
      </div>
    </header>
  );
}
