// Lightweight accessible page transition wrapper keying on route/tab changes.
import React from 'react';

/**
 * PageTransition applies a subtle 180ms opacity + 4px settle animation when switching pages.
 * Honors `prefers-reduced-motion: reduce` via CSS utilities in index.css.
 */
export const PageTransition = ({ transitionKey, children, className = '' }) => {
  return (
    <div key={transitionKey} className={`animate-fadeIn ${className}`}>
      {children}
    </div>
  );
};

export default PageTransition;
