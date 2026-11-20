// Import React for functional component structure.
import React from 'react';
// Import official React Bits SpotlightCard & Counter for subtle enterprise polish and numeric reveal.
import { SpotlightCard } from '../reactbits/SpotlightCard';
import { Counter } from '../reactbits/Counter';

/**
 * Render numeric KPI values with React Bits Counter when finite (never animating placeholders),
 * while falling back cleanly to static text for non-numeric strings.
 */
export const AnimatedMetricValue = ({ value, suffix = '', decimals }) => {
  if (value === null || value === undefined || value === '') {
    return <span>—</span>;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return (
      <Counter
        value={value}
        suffix={suffix}
        decimals={decimals}
        fontSize="inherit"
        fontWeight="inherit"
        duration={0.65}
        bounce={0.05}
        stagger={0.03}
        motionBlur={false}
        intro
      />
    );
  }

  // Parse trailing '%' strings (e.g. "85%") into numeric Counter + suffix so percentages animate cleanly too.
  if (typeof value === 'string') {
    const match = value.trim().match(/^(-?\d+(?:\.\d+)?)(%?)$/);
    if (match) {
      const parsed = Number(match[1]);
      const parsedDecimals = match[1].includes('.') ? match[1].split('.')[1].length : decimals;
      return (
        <Counter
          value={parsed}
          suffix={match[2] || suffix}
          decimals={parsedDecimals}
          fontSize="inherit"
          fontWeight="inherit"
          duration={0.65}
          bounce={0.05}
          stagger={0.03}
          motionBlur={false}
          intro
        />
      );
    }
  }

  return <span>{value}{suffix}</span>;
};

// Export MetricCard component for clean enterprise dashboard KPI displays.
export const MetricCard = ({
  title,
  value,
  unit,
  subvalue,
  icon: Icon,
  badgeText,
  badgeVariant = 'brand',
  trend,
  onClick,
  isSelected = false,
  isLoading = false,
  spotlight = true,
  className = '',
}) => {
  // Render polished shimmer loading skeleton while real metrics are fetched.
  if (isLoading) {
    return (
      <div className="p-5 bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder rounded-2xl shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 w-24 rounded animate-shimmer bg-slate-200/70 dark:bg-slate-700/60" />
          <div className="w-8 h-8 rounded-xl animate-shimmer bg-slate-100/80 dark:bg-slate-800/70" />
        </div>
        <div className="h-7 w-16 rounded mb-2 animate-shimmer bg-slate-200/70 dark:bg-slate-700/60" />
        <div className="h-3 w-32 rounded animate-shimmer bg-slate-100/80 dark:bg-slate-800/70" />
      </div>
    );
  }

  // Derive badge styling classes dynamically based on semantic badgeVariant.
  const getBadgeClass = (variant) => {
    switch (variant) {
      case 'brand':
      case 'emerald':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60';
      case 'amber':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60';
      case 'blue':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60';
      case 'neutral':
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60';
    }
  };

  const Container = spotlight ? SpotlightCard : 'div';
  const containerProps = spotlight
    ? {
        intensity: 0.18,
        borderGlow: 0.35,
        spotlightSize: 220,
        proximity: 48,
      }
    : {};

  return (
    <Container
      {...containerProps}
      onClick={onClick}
      className={`group p-5 rounded-2xl h-full flex flex-col justify-between transition-all duration-200 ${
        isSelected
          ? 'border-2 border-brand-500 bg-brand-50/15 dark:bg-brand-950/15 shadow-sm'
          : 'bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-subtle hover:-translate-y-0.5'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div>
        {/* Top row with clean label and icon */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
          {Icon && (
            <div
              className={`p-2 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? 'bg-brand-500 text-white border-brand-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:bg-brand-50/50'
              }`}
            >
              <Icon className="w-4 h-4 stroke-[2]" />
            </div>
          )}
        </div>

        {/* Clean, bold sans-serif numerical value with unit */}
        <div className="mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white tracking-tight font-sans tabular-nums leading-none">
              <AnimatedMetricValue value={value} />
            </span>
            {unit && (
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 font-sans">
                {unit}
              </span>
            )}
          </div>
          {subvalue && (
            <div className="text-xs text-slate-500 dark:text-slate-400 font-normal truncate mt-1.5 flex items-center gap-1.5">
              <span>{subvalue}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer row: minimal active status pill */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-surface-darkBorder/80 mt-3">
        {badgeText ? (
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${getBadgeClass(badgeVariant)}`}>
            {isSelected && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            )}
            <span>{badgeText}</span>
          </span>
        ) : isSelected ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active View</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
            Click to view records
          </span>
        )}

        {trend && (
          <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
            {trend}
          </span>
        )}
      </div>
    </Container>
  );
};
