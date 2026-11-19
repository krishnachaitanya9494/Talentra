// Reusable smooth expand/collapse container using CSS grid-template-rows (200ms, reduced-motion safe).
import React, { useState, useId } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * ExpandableSection provides consistent progressive disclosure across candidate profiles,
 * evidence excerpts, job lists, and detail panels without layout jumps or heavy JS timers.
 */
export const ExpandableSection = ({
  title,
  badge,
  icon: Icon,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onToggle,
  headerRight,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
}) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = controlledExpanded !== undefined;
  const isOpen = isControlled ? controlledExpanded : internalExpanded;
  const contentId = useId();

  const handleToggle = () => {
    const next = !isOpen;
    if (!isControlled) setInternalExpanded(next);
    if (onToggle) onToggle(next);
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard shadow-subtle overflow-hidden transition-colors ${className}`}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={handleToggle}
        className={`w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 dark:hover:bg-surface-darkHover/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${headerClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />}
          <span className="text-[15px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 truncate">
            {title}
          </span>
          {badge !== undefined && badge !== null && (
            <span className="px-2.5 py-0.5 text-[13px] font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700 flex-shrink-0">
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {headerRight}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 motion-reduce:transition-none ${
              isOpen ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Smooth CSS grid-row accordion collapse avoiding hard height jumps */}
      <div
        id={contentId}
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className={`px-4 pb-4 pt-1 border-t border-slate-100 dark:border-surface-darkBorder ${contentClassName}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandableSection;
