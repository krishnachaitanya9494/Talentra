/**
 * React Host Integration Snippet for Module 06 — Interview Scheduling & Timetable.
 * 
 * Copy this snippet into your production company React frontend:
 */

import React from 'react';
import { InterviewSchedulingModule } from './feature-modules/06-interview-scheduling/frontend';

export function CompanyInterviewSchedulingPage() {
  return (
    <div className="company-page-container">
      <InterviewSchedulingModule apiBaseUrl="https://api.yourcompany.com" />
    </div>
  );
}
