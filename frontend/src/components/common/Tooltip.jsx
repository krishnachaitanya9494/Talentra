/**
 * Accessible Tooltip primitive inspired by Origin UI & shadcn/ui.
 * Zero external dependencies, Light/Dark theme adaptive, keyboard focus + hover support,
 * and prefers-reduced-motion compliance.
 */
import React, { useState, useId } from 'react';

export const Tooltip = ({
  content,
  children,
  side = 'top',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  if (!content) return children;

  const positionClass =
    side === 'bottom'
      ? 'top-full left-1/2 -translate-x-1/2 mt-2'
      : side === 'left'
      ? 'right-full top-1/2 -translate-y-1/2 mr-2'
      : side === 'right'
      ? 'left-full top-1/2 -translate-y-1/2 ml-2'
      : 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? tooltipId : undefined} className="inline-flex items-center">
        {children}
      </span>
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`pointer-events-none absolute z-50 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-navy-950 dark:bg-slate-100 text-white dark:text-navy-950 shadow-dropdown animate-fadeIn ${positionClass}`}
        >
          {content}
        </span>
      )}
    </span>
  );
};

export default Tooltip;
