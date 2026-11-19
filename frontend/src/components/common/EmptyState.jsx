// Import React for functional component structure.
import React from 'react';

// Import Inbox icon as default visual fallback.
import { Inbox } from 'lucide-react';

// Export EmptyState component for clean zero-data or filtered-out views.
export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'Try adjusting your search filters or add new records to populate this section.',
  actionLabel,
  onAction,
}) => {
  // Render centered empty state container.
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-surface-darkCard border border-dashed border-slate-200 dark:border-surface-darkBorder rounded-2xl">
      {/* Icon wrapper badge */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-surface-darkBorder rounded-2xl text-slate-400 dark:text-slate-500 mb-3.5">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>

      {/* Primary heading */}
      <h4 className="text-lg font-semibold text-navy-900 dark:text-slate-100 tracking-tight">{title}</h4>

      {/* Explanatory description */}
      <p className="text-sm sm:text-[15px] text-slate-500 dark:text-slate-400 max-w-md mt-1.5 mb-5 leading-relaxed">{description}</p>

      {/* Optional action button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-[15px] font-medium text-white bg-navy-900 dark:bg-brand-600 hover:bg-navy-800 dark:hover:bg-brand-500 rounded-lg shadow-subtle transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
