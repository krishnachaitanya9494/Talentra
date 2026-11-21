// Host Application Integration Snippet (React)
import React from 'react';
import { CandidateResumesModule } from './feature-modules/02-candidate-resumes/frontend';

export function CompanyResumesPage() {
  return (
    <div className="main-company-layout p-6">
      <CandidateResumesModule
        apiBaseUrl="/api/v1/candidate-resumes"
        onSelectCandidate={(c) => console.log('Selected:', c)}
      />
    </div>
  );
}
