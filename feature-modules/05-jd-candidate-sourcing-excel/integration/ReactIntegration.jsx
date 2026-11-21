// Host Application Integration Snippet (React)
import React from 'react';
import { SourcingExcelModule } from './feature-modules/05-jd-candidate-sourcing-excel/frontend';

export function CompanySourcingPage() {
  return (
    <div className="main-company-layout p-6">
      <SourcingExcelModule apiBaseUrl="/api/v1/sourcing" />
    </div>
  );
}
