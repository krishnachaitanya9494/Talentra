// Host Application Integration Snippet (React)
import React from 'react';
import { ResumeExtractionModule } from './feature-modules/04-resume-data-extraction/frontend';

export function CompanyResumeExtractionPage() {
  return (
    <div className="main-company-layout p-6">
      <ResumeExtractionModule
        apiBaseUrl="/api/v1/scraper"
        onExportComplete={() => console.log('Export ready')}
      />
    </div>
  );
}
