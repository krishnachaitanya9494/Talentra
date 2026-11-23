/**
 * Decoupled API Client for Module 06 — Interview Scheduling & Timetable.
 * 
 * Works seamlessly against TALENTRA's backend or any standalone host API.
 */

const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.__INTERVIEW_API_BASE__ !== undefined) {
    return window.__INTERVIEW_API_BASE__;
  }
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_BASE_URL !== undefined) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  return '';
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail);
  }
  return response.json();
};

const FALLBACK_INTERVIEWERS = [
  { id: 1, full_name: 'Recruiter 1', email: 'recruiter1@talentra.ai', role: 'Administrator', specialization: 'Full Stack, Cloud', scheduled_count: 0, is_available: true },
  { id: 2, full_name: 'Recruiter 2', email: 'recruiter2@talentra.ai', role: 'Senior TA Lead', specialization: 'Kubernetes, AWS, Docker, Python', scheduled_count: 0, is_available: true },
  { id: 3, full_name: 'Recruiter 3', email: 'recruiter3@talentra.ai', role: 'Principal TA Recruiter', specialization: 'SAP, Oracle, Hyperion, Data Engineering', scheduled_count: 0, is_available: true },
  { id: 4, full_name: 'Recruiter 4', email: 'recruiter4@talentra.ai', role: 'Engineering Manager', specialization: 'React, TypeScript, Java, Spring Boot', scheduled_count: 0, is_available: true },
  { id: 5, full_name: 'Recruiter 5', email: 'recruiter5@talentra.ai', role: 'Recruitment Manager', specialization: 'Engineering Staffing & Requisitions', scheduled_count: 0, is_available: true },
];

const FALLBACK_CANDIDATES = [
  { id: 1, first_name: 'Pooja', last_name: 'Singh', full_name: 'Pooja Singh', email: 'poojakirti1695@gmail.com', current_title: 'Oracle EPM Consultant' },
  { id: 2, first_name: 'Naresh', last_name: 'Kumawat', full_name: 'Naresh Kumawat', email: 'kumawatnaresh740@gmail.com', current_title: 'Senior Hyperion Specialist' },
  { id: 3, first_name: 'Pallavi V', last_name: 'Honagond', full_name: 'Pallavi V Honagond', email: 'pallavipattan8@gmail.com', current_title: 'Siemens Teamcenter Engineer' },
  { id: 4, first_name: 'Karthik', last_name: 'Raman', full_name: 'Karthik Raman', email: 'karthik.raman@example.com', current_title: 'Site Reliability Engineer' },
];

const FALLBACK_JDS = [
  { id: 1, title: 'Oracle EPM / Hyperion Planning Consultant', req_code: 'JD-001', client_name: 'Talentra Enterprise' },
  { id: 2, title: 'Siemens Teamcenter PLM Consultant / Engineer', req_code: 'JD-002', client_name: 'Talentra Enterprise' },
  { id: 3, title: 'PMO / Project Financial Management Consultant – SAP PS', req_code: 'JD-003', client_name: 'Talentra Enterprise' },
  { id: 8, title: 'Lead Cloud Architect (Enterprise)', req_code: 'REQ-UP-0008', client_name: 'Talentra Enterprise' },
  { id: 12, title: 'Embedded Systems Engineer', req_code: 'REQ-UP-0012', client_name: 'Talentra Enterprise' },
];

export const interviewApi = {
  /**
   * Fetches interviews matching query filters.
   */
  async getInterviews(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        qs.append(k, v);
      }
    });
    const url = `${getBaseUrl()}/api/v1/interviews${qs.toString() ? '?' + qs.toString() : ''}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  /**
   * Fetches aggregated calendar grid data for a date range.
   */
  async getCalendarGrid(startDate, endDate, interviewerId = null) {
    const qs = new URLSearchParams({ start_date: startDate, end_date: endDate });
    if (interviewerId) qs.append('interviewer_id', interviewerId);
    const url = `${getBaseUrl()}/api/v1/interviews/calendar?${qs.toString()}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  /**
   * Fetches available interviewers and workload metrics.
   */
  async getInterviewers() {
    try {
      const url = `${getBaseUrl()}/api/v1/interviews/interviewers`;
      const res = await fetch(url);
      const data = await handleResponse(res);
      return Array.isArray(data) && data.length > 0 ? data : FALLBACK_INTERVIEWERS;
    } catch {
      return FALLBACK_INTERVIEWERS;
    }
  },

  /**
   * Checks candidate and interviewer availability for a proposed time slot.
   */
  async checkAvailability(payload) {
    const url = `${getBaseUrl()}/api/v1/interviews/availability`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  /**
   * Schedules a new interview session.
   */
  async scheduleInterview(payload) {
    const url = `${getBaseUrl()}/api/v1/interviews`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  /**
   * Gets details for a single interview.
   */
  async getInterviewDetail(interviewId) {
    const url = `${getBaseUrl()}/api/v1/interviews/${interviewId}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  /**
   * Updates non-scheduling interview fields.
   */
  async updateInterview(interviewId, payload) {
    const url = `${getBaseUrl()}/api/v1/interviews/${interviewId}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  /**
   * Reschedules an interview to a new date and time.
   */
  async rescheduleInterview(interviewId, payload) {
    const url = `${getBaseUrl()}/api/v1/interviews/${interviewId}/reschedule`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  /**
   * Cancels an interview with reason.
   */
  async cancelInterview(interviewId, payload) {
    const url = `${getBaseUrl()}/api/v1/interviews/${interviewId}/cancel`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  /**
   * Gets interview audit history trail.
   */
  async getInterviewHistory(interviewId) {
    const url = `${getBaseUrl()}/api/v1/interviews/${interviewId}/history`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  /**
   * Gets calendar invitation preview.
   */
  async getInvitationPreview(interviewId) {
    const url = `${getBaseUrl()}/api/v1/interviews/${interviewId}/invitations`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  /**
   * Generates direct download URL for .ics calendar file.
   */
  getIcsDownloadUrl(interviewId) {
    return `${getBaseUrl()}/api/v1/interviews/${interviewId}/ics`;
  },

  /**
   * Helper to load candidates from TALENTRA repository.
   */
  async getCandidates(search = '') {
    try {
      const url = `${getBaseUrl()}/api/v1/interviews/candidates${search ? '?search=' + encodeURIComponent(search) : ''}`;
      const res = await fetch(url);
      const data = await handleResponse(res);
      const list = Array.isArray(data) ? data : (data.items || data.candidates || []);
      return list.length > 0 ? list : FALLBACK_CANDIDATES;
    } catch {
      // Fallback to resumes endpoint
      try {
        const url2 = `${getBaseUrl()}/api/v1/resumes?page_size=100${search ? '&search=' + encodeURIComponent(search) : ''}`;
        const res2 = await fetch(url2);
        const data2 = await handleResponse(res2);
        const list2 = data2.items || data2.candidates || [];
        return list2.length > 0 ? list2 : FALLBACK_CANDIDATES;
      } catch {
        return FALLBACK_CANDIDATES;
      }
    }
  },

  /**
   * Helper to load job requisitions from TALENTRA repository.
   */
  async getJobRequisitions() {
    try {
      const url = `${getBaseUrl()}/api/v1/interviews/job-requisitions`;
      const res = await fetch(url);
      const data = await handleResponse(res);
      const list = Array.isArray(data) ? data : (data.items || data.jds || []);
      return list.length > 0 ? list : FALLBACK_JDS;
    } catch {
      // Fallback to jds endpoint
      try {
        const url2 = `${getBaseUrl()}/api/v1/jds?page_size=100`;
        const res2 = await fetch(url2);
        const data2 = await handleResponse(res2);
        const list2 = data2.items || data2.jds || [];
        return list2.length > 0 ? list2 : FALLBACK_JDS;
      } catch {
        return FALLBACK_JDS;
      }
    }
  },
};
