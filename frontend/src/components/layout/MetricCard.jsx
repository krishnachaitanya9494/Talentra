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
  subvalue,
  icon: Icon,
  badgeText,
  badgeVariant = 'brand',
  trend,
  onClick,
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
        return 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-700/60';
      case 'amber':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60';
      case 'blue':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60';
      case 'neutral':
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60';
    }
  };

  const Container = spotlight ? SpotlightCard : 'div';
  const containerProps = spotlight
    ? {
        intensity: 0.22,
        borderGlow: 0.4,
        spotlightSize: 190,
        proximity: 48,
      }
    : {};

  // Render KPI card with hybrid enterprise styling, React Bits hover spotlight, and dark mode compatibility.
  return (
    <Container
      {...containerProps}
      onClick={onClick}
      className={`group p-5 bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder rounded-2xl card-reflective h-full flex flex-col justify-between ${
        onClick
          ? 'cursor-pointer hover:border-brand-300/80 dark:hover:border-brand-700/60'
          : ''
      } ${className}`}
    >
      <div>
        {/* Top row with label (14-16px) and optional icon */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm sm:text-[15px] font-medium text-slate-600 dark:text-slate-300 tracking-wide">
            {title}
          </span>
          {Icon && (
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-surface-darkHover border border-slate-100 dark:border-slate-700/60 text-slate-500 dark:text-slate-300 transition-transform duration-200 group-hover:scale-105 group-hover:text-brand-600 dark:group-hover:text-brand-400">
              <Icon className="w-4 h-4 stroke-[1.75]" />
            </div>
          )}
        </div>

        {/* Numerical value (30-36px) and secondary context stacked cleanly */}
        <div className="mb-2">
          <div className="text-[30px] sm:text-[34px] lg:text-[36px] font-bold text-navy-900 dark:text-white tracking-tight font-mono leading-tight">
            <AnimatedMetricValue value={value} />
          </div>
          {subvalue && (
            <div className="text-[13px] sm:text-sm text-slate-500 dark:text-slate-400 font-normal truncate mt-1">
              {subvalue}
            </div>
          )}
        </div>
      </div>

      {/* Footer row with status badge or trend context */}
      {(trend || badgeText) && (
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-surface-darkBorder mt-2">
          {badgeText && (
            <span className={`text-[13px] font-semibold px-2.5 py-0.5 rounded-md ${getBadgeClass(badgeVariant)}`}>
              {badgeText}
            </span>
          )}
          {trend && (
            <span className="text-[13px] text-slate-500 dark:text-slate-400 truncate">
              {trend}
            </span>
          )}
        </div>
      )}
    </Container>
  );
};
