import React from 'react';
import JDResumeComparisonPage from './JDResumeComparisonPage';

/**
 * Portable Mount Component for Module 03: JD & Resume Intelligence Comparison.
 */
export function JDResumeIntelligenceModule({
  apiBaseUrl,
  theme = 'light',
  className = '',
}) {
  return (
    <div className={`talentra-module-jd-resume-intelligence ${className}`}>
      <JDResumeComparisonPage />
    </div>
  );
}

export default JDResumeIntelligenceModule;
