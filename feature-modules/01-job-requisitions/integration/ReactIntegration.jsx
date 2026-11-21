// Host Application Integration Snippet (React)
// Mount the module inside your company's existing layout:

import React from 'react';
import { JobRequisitionsModule } from './feature-modules/01-job-requisitions/frontend';

export function CompanyRequisitionsPage() {
  const handleSelectRequisition = (jd) => {
    console.log('Selected requisition:', jd);
  };

  return (
    <div className="main-company-layout p-6">
      <JobRequisitionsModule
        apiBaseUrl="/api/v1/job-requisitions"
        onSelectRequisition={handleSelectRequisition}
      />
    </div>
  );
}
