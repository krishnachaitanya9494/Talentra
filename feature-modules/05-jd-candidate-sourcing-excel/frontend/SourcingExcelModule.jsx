import React from 'react';
import SourcingPage from './SourcingPage';

/**
 * Portable Mount Component for Module 05: JD-Based Candidate Sourcing & Excel Engine.
 */
export function SourcingExcelModule({
  apiBaseUrl,
  theme = 'light',
  className = '',
}) {
  return (
    <div className={`talentra-module-sourcing-excel ${className}`}>
      <SourcingPage />
    </div>
  );
}

export default SourcingExcelModule;
