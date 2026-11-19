// Import React for functional component definition.
import React from 'react';

// Export Badge component supporting enterprise visual variants with full Light & Dark theme contrast.
export const Badge = ({ children, variant = 'neutral', size = 'sm', className = '' }) => {
  // Define style map based on variant prop to maintain consistent design tokens.
  const variantStyles = {
    // Subtle emerald green accent for AI matches, positive status, and verified tags.
    brand: 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border-brand-200/80 dark:border-brand-800/70',
    // Explicit semantic success variant used by Placements and Clients views.
    success: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/70',
    // Dark navy subtle tint for structural identifiers and active tabs.
    navy: 'bg-slate-100 dark:bg-slate-800 text-navy-800 dark:text-slate-100 border-slate-200 dark:border-slate-700',
    // Neutral slate tone for general skill tags and metadata.
    neutral: 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/70',
    // Warning amber tone for medium priority or pending review items.
    warning: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/70',
    // Alias 'amber' to warning style for callers passing variant="amber".
    amber: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/70',
    // Danger tone for urgent requisitions or high risk warnings.
    danger: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/70',
    // Blue tone for ongoing interviews or active progress stages.
    blue: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/70',
    // Indigo / Violet secondary accent for AI intelligence, embeddings, and analytics highlights.
    accent: 'bg-accent-50 dark:bg-accent-950/60 text-accent-700 dark:text-accent-400 border-accent-200 dark:border-accent-700/60',
  };

  // Define size map for padding and typography adjustments (13-14px readable scale).
  const sizeStyles = {
    xs: 'px-2 py-0.5 text-[13px] font-medium leading-tight',
    sm: 'px-2.5 py-1 text-[13px] font-medium leading-tight',
    md: 'px-3 py-1.5 text-sm font-medium leading-snug',
  };

  // Return styled span element.
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border tracking-tight font-sans ${variantStyles[variant] || variantStyles.neutral} ${sizeStyles[size] || sizeStyles.sm} ${className}`}
    >
      {children}
    </span>
  );
};
