// Import React for JSX component creation.
import React from 'react';

// Import Search and X icons from lucide-react.
import { Search, X } from 'lucide-react';

// Export reusable SearchInput component with shortcut hint and clear button.
export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  shortcut = '/',
  onClear,
}) => {
  // Return rendered input wrapper.
  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Search magnifying glass icon positioned at the left */}
      <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />

      {/* Styled text input element */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-14 py-2 bg-white dark:bg-surface-darkCard border border-slate-200/90 dark:border-surface-darkBorder rounded-xl text-sm text-navy-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all shadow-subtle"
      />

      {/* Clear button if text exists, otherwise show keyboard shortcut hint badge */}
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange('');
            if (onClear) onClear();
          }}
          className="absolute right-3 p-0.5 text-slate-400 hover:text-navy-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : shortcut ? (
        <span className="absolute right-3 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-surface-darkBorder rounded">
          {shortcut}
        </span>
      ) : null}
    </div>
  );
};
