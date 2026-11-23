import React from 'react';

export const AnimatedMetricValue = ({ value, suffix = '' }) => {
  if (value === null || value === undefined || value === '') return <span>—</span>;
  return <span>{value}{suffix}</span>;
};

export const MetricCard = ({
  title,
  value,
  unit,
  subvalue,
  onClick,
  isSelected = false,
  isLoading = false,
  className = '',
}) => {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      {...(onClick ? { type: 'button', onClick, 'aria-pressed': isSelected } : {})}
      aria-busy={isLoading}
      className={`w-full text-left p-4 sm:p-5 rounded-xl border bg-white dark:bg-surface-darkCard ${
        isSelected
          ? 'border-brand-600 dark:border-brand-400 border-l-2 bg-brand-50/40 dark:bg-brand-950/20'
          : 'border-slate-200 dark:border-surface-darkBorder'
      } ${onClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-surface-darkHover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600' : ''} ${className}`}
    >
      {isLoading ? (
        <div className="space-y-3" aria-label="Loading metric">
          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-8 w-16 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      ) : (
        <>
          <div className="text-sm text-slate-600 dark:text-slate-400">{title}</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold leading-none tabular-nums text-navy-900 dark:text-white">
              <AnimatedMetricValue value={value} />
            </span>
            {unit && <span className="text-sm text-slate-500 dark:text-slate-400">{unit}</span>}
          </div>
          {subvalue && <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subvalue}</div>}
        </>
      )}
    </Component>
  );
};
