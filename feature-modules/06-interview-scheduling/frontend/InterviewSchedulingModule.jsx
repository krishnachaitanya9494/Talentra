import React, { useEffect } from 'react';
import { InterviewTimetablePage } from './pages/InterviewTimetablePage';

/**
 * Top-Level Exportable React Mount Component for Module 06 — Interview Scheduling & Timetable.
 * 
 * Can be rendered directly inside any company production host application:
 * 
 * ```jsx
 * <InterviewSchedulingModule apiBaseUrl="https://api.yourcompany.com/v1" />
 * ```
 */
export const InterviewSchedulingModule = ({ apiBaseUrl }) => {
  useEffect(() => {
    if (apiBaseUrl && typeof window !== 'undefined') {
      window.__INTERVIEW_API_BASE__ = apiBaseUrl;
    }
  }, [apiBaseUrl]);

  return <InterviewTimetablePage />;
};

export default InterviewSchedulingModule;
