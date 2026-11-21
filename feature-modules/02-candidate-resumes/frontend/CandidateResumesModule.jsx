import React from 'react';
import { CandidateDirectory } from './CandidateDirectory';

/**
 * Portable Mount Component for Module 02: Candidate Resumes.
 */
export function CandidateResumesModule({
  apiBaseUrl,
  onSelectCandidate,
  onUploadResume,
  theme = 'light',
  className = '',
}) {
  return (
    <div className={`talentra-module-candidate-resumes ${className}`}>
      <CandidateDirectory
        onSelectCandidate={onSelectCandidate}
        onUploadResume={onUploadResume}
      />
    </div>
  );
}

export default CandidateResumesModule;
