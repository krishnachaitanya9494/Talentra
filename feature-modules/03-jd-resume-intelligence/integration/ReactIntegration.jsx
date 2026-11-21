// Host Application Integration Snippet (React)
import React from 'react';
import { JDResumeIntelligenceModule } from './feature-modules/03-jd-resume-intelligence/frontend';

export function CompanyComparisonPage() {
  return (
    <div className="main-company-layout p-6">
      <JDResumeIntelligenceModule apiBaseUrl="/api/v1/jd-resume-intelligence" />
    </div>
  );
}
