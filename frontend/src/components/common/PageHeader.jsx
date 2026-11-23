/**
 * Shared page heading with a readable subtitle and optional actions.
 */
import React from 'react';

export const PageHeader = ({
  title,
  subtitle,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-2xl lg:text-[28px] font-semibold text-navy-950 dark:text-white font-sans leading-tight">
            {title}
          </h2>
          {badge}
        </div>
        {subtitle && (
          <p className="text-sm sm:text-[15px] text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap flex-shrink-0">{actions}</div>}
    </div>
  );
};

export default PageHeader;
