import React from 'react';
import ProfileScraperPage from './ProfileScraperPage';

/**
 * Portable Mount Component for Module 04: Resume Data Extraction.
 */
export function ResumeExtractionModule({
  apiBaseUrl,
  onExportComplete,
  theme = 'light',
  className = '',
}) {
  return (
    <div className={`talentra-module-resume-extraction ${className}`}>
      <ProfileScraperPage />
    </div>
  );
}

export default ResumeExtractionModule;
