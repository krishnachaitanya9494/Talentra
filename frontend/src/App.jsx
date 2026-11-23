'use client';

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './views/DashboardPage';
import HomePage from './views/HomePage';
import MatchingPage from './views/MatchingPage';
import AssignmentsPage from './views/AssignmentsPage';
import CampaignsPage from './views/CampaignsPage';
import AnalyticsPage from './views/AnalyticsPage';
import SourcingPage from './views/SourcingPage';
import ProfileScraperPage from './views/ProfileScraperPage';
import ClientsPage from './views/ClientsPage';
import JDResumeComparisonPage from './views/JDResumeComparisonPage';
import InterviewTimetablePage from './views/InterviewTimetablePage';
import RecruiterAgentPage from './views/RecruiterAgentPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';

/**
 * Root Application Component.
 *
 * Configures ThemeProvider for class-based dark mode persistence
 * and client routing via React Router DOM.
 */
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ErrorBoundary title="TALENTRA Shell Error">
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/jds" element={<HomePage defaultTab="jds" />} />
              <Route path="/resumes" element={<HomePage defaultTab="resumes" />} />
              <Route path="/matching" element={<MatchingPage />} />
              <Route path="/comparison" element={<JDResumeComparisonPage />} />
              <Route path="/assignments" element={<AssignmentsPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/sourcing" element={<SourcingPage />} />
              <Route path="/agent" element={<RecruiterAgentPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/interview-timetable" element={<InterviewTimetablePage />} />
              <Route
                path="/profile-scraper"
                element={
                  <ErrorBoundary title="Resume Importer Error">
                    <ProfileScraperPage />
                  </ErrorBoundary>
                }
              />
            </Route>
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  );
}
