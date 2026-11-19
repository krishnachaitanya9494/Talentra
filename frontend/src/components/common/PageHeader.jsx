/**
 * Unified Enterprise PageHeader component inspired by 21st.dev & Origin UI.
 * Establishes consistent 24-28px Plus Jakarta Sans heading scale, BlurText entrance,
 * optional status badge, readable subtitle, and right-aligned action slot across modules.
 */
import React from 'react';
import { BlurText } from '../reactbits/BlurText';

export const PageHeader = ({
  title,
  subtitle,
  badge,
  actions,
  animateTitle = true,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main page title: 28-32px Plus Jakarta Sans */}
          <h2 className="text-[28px] lg:text-[32px] font-bold text-navy-950 dark:text-white tracking-tight font-display leading-tight">
            {animateTitle ? (
              <BlurText text={title} animateBy="words" delay={45} stepDuration={0.25} direction="top" />
            ) : (
              title
            )}
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
