/**
 * Decoupled API Client for Module 06 — Interview Scheduling & Timetable.
 * 
 * Works seamlessly against TALENTRA's backend or any standalone host API.
 */

const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.__INTERVIEW_API_BASE__) {
    return window.__INTERVIEW_API_BASE__;
  }
  return import.meta.env?.VITE_API_URL || 'http://127.0.0.1:8001';
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
    const url = `${getBaseUrl()}/api/v1/interviews/interviewers`;
    const res = await fetch(url);
    return handleResponse(res);
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
      const url = `${getBaseUrl()}/api/v1/documents/candidates?page_size=50${search ? '&query=' + encodeURIComponent(search) : ''}`;
      const res = await fetch(url);
      const data = await handleResponse(res);
      return data.items || data.candidates || [];
    } catch {
      // Fallback to sourcing candidates endpoint
      try {
        const url2 = `${getBaseUrl()}/api/v1/repository/candidates?page_size=50`;
        const res2 = await fetch(url2);
        const data2 = await handleResponse(res2);
        return data2.candidates || [];
      } catch {
        return [];
      }
    }
  },

  /**
   * Helper to load job requisitions from TALENTRA repository.
   */
  async getJobRequisitions() {
    try {
      const url = `${getBaseUrl()}/api/v1/documents/jds?page_size=50`;
      const res = await fetch(url);
      const data = await handleResponse(res);
      return data.items || data.jds || [];
    } catch {
      return [];
    }
  },
};
