import React from 'react';
import { JobWorkspace } from './JobWorkspace';

/**
 * Portable Mount Component for Module 01: Job Requisitions.
 * Accepts host props, custom API base URL, and event handlers.
 */
export function JobRequisitionsModule({
  apiBaseUrl,
  onSelectRequisition,
  onUploadRequisition,
  theme = 'light',
  className = '',
}) {
  return (
    <div className={`talentra-module-job-requisitions ${className}`}>
      <JobWorkspace
        onSelectJD={onSelectRequisition}
        onUploadJD={onUploadRequisition}
      />
    </div>
  );
}

export default JobRequisitionsModule;
