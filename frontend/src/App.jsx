import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import MatchingPage from './pages/MatchingPage';
import AssignmentsPage from './pages/AssignmentsPage';
import CampaignsPage from './pages/CampaignsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SourcingPage from './pages/SourcingPage';
import ProfileScraperPage from './pages/ProfileScraperPage';
import ClientsPage from './pages/ClientsPage';
import JDResumeComparisonPage from './pages/JDResumeComparisonPage';
import InterviewTimetablePage from './pages/InterviewTimetablePage';
import {
  CandidateAvailabilityPortal,
  CandidateBookingPortal,
  CandidateReschedulePortal,
} from '../../feature-modules/06-interview-scheduling/frontend';
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
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/interview-timetable" element={<InterviewTimetablePage />} />
              <Route
                path="/profile-scraper"
                element={
                  <ErrorBoundary title="Candidate Web Scraper Error">
                    <ProfileScraperPage />
                  </ErrorBoundary>
                }
              />
            </Route>
            {/* Public Standalone Candidate Portals (No Admin Sidebar) */}
            <Route path="/candidate-availability/:token" element={<CandidateAvailabilityPortal />} />
            <Route path="/candidate-booking/:token" element={<CandidateBookingPortal />} />
            <Route path="/candidate-reschedule/:token" element={<CandidateReschedulePortal />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  );
}
