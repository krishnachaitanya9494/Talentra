/**
 * API Client Service for TALENTRA.
 *
 * Configures Axios instance to interact with the backend.
 * Uses Vite proxy by default for seamless same-origin communication.
 */

import axios from 'axios';

// Force empty baseURL to always use relative paths (/api/...) proxied by Vite to port 8001,
// preventing collisions with external processes on port 8000 and avoiding CORS issues.
const API_BASE_URL = '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
  },
});

export async function getRootInfo() {
  const response = await apiClient.get('/');
  return response.data;
}

export async function getHealthStatus() {
  const response = await apiClient.get('/health');
  return response.data;
}

// ---------------------------------------------------------------------------
// Document Repository API (Phase 1 Ingestion Engine)
// ---------------------------------------------------------------------------

export async function getRepositoryStats() {
  const response = await apiClient.get('/api/v1/repository/stats');
  return response.data;
}

export async function getRepositoryJDs(params = {}) {
  const response = await apiClient.get('/api/v1/repository/jds', { params });
  return response.data;
}

export async function getRepositoryJD(docId) {
  const response = await apiClient.get(`/api/v1/repository/jds/${docId}`);
  return response.data;
}

export async function getRepositoryResumes(params = {}) {
  const response = await apiClient.get('/api/v1/repository/resumes', { params });
  return response.data;
}

export async function getRepositoryResume(docId) {
  const response = await apiClient.get(`/api/v1/repository/resumes/${docId}`);
  return response.data;
}

export async function uploadSingleJD(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/api/v1/repository/jds/upload', formData);
  return response.data;
}

export async function bulkUploadJDs(files, onProgress) {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }
  const response = await apiClient.post('/api/v1/repository/jds/bulk-upload', formData, {
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });
  return response.data;
}

export async function uploadSingleResume(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/api/v1/repository/resumes/upload', formData);
  return response.data;
}

export async function bulkUploadResumes(files, onProgress) {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }
  const response = await apiClient.post('/api/v1/repository/resumes/bulk-upload', formData, {
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });
  return response.data;
}

export async function deleteRepositoryDocument(docId, type = 'jd') {
  const endpoint = type === 'jd' ? `/api/v1/repository/jds/${docId}` : `/api/v1/repository/resumes/${docId}`;
  const response = await apiClient.delete(endpoint);
  return response.data;
}

export async function syncRepositoryDocuments() {
  const response = await apiClient.post('/api/v1/repository/sync');
  return response.data;
}

// ---------------------------------------------------------------------------
// Legacy / Talent Intelligence Endpoints (Retained for Compatibility)
// ---------------------------------------------------------------------------

export async function getDataSummary() {
  const response = await apiClient.get('/api/v1/data/summary');
  return response.data;
}

export async function getJobDescriptions(params = {}) {
  const response = await apiClient.get('/api/v1/jds', { params });
  return response.data;
}

export async function getJobDescriptionDetails(id) {
  const response = await apiClient.get(`/api/v1/jds/${id}`);
  return response.data;
}

export async function getCandidates(params = {}) {
  const response = await apiClient.get('/api/v1/resumes', { params });
  return response.data;
}

export async function getCandidateDetails(id) {
  const response = await apiClient.get(`/api/v1/resumes/${id}`);
  return response.data;
}

export async function uploadJobDescription(file, title = '', skills = '') {
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);
  if (skills) formData.append('skills', skills);

  const response = await apiClient.post('/api/v1/jds/upload', formData);
  return response.data;
}

export async function uploadResume(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/api/v1/resumes/upload', formData);
  return response.data;
}

export async function syncLocalData() {
  const response = await apiClient.post('/api/v1/data/sync');
  return response.data;
}

// ---------------------------------------------------------------------------
// Phase 2: Candidate Intelligence & Extraction API
// ---------------------------------------------------------------------------

export async function getCandidateIntelligence(candidateId, role = 'recruiter') {
  const response = await apiClient.get(`/api/v1/intelligence/candidates/${candidateId}`, {
    params: { role },
  });
  return response.data;
}

export async function manuallyCorrectCandidate(candidateId, payload) {
  const response = await apiClient.put(`/api/v1/intelligence/candidates/${candidateId}/correct`, payload);
  return response.data;
}

export async function linkResumeToCandidate(candidateId, resumeDocId, isPrimary = false) {
  const response = await apiClient.post(`/api/v1/intelligence/candidates/${candidateId}/resumes/link`, null, {
    params: { resume_doc_id: resumeDocId, is_primary: isPrimary },
  });
  return response.data;
}

export async function getDuplicateCandidates() {
  const response = await apiClient.get('/api/v1/intelligence/duplicates');
  return response.data;
}

export async function mergeCandidates(payload) {
  const response = await apiClient.post('/api/v1/intelligence/candidates/merge', payload);
  return response.data;
}

export async function inspectCrmHeaders(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/api/v1/intelligence/crm/inspect', formData);
  return response.data;
}

export async function importCrmCandidates(file, columnMapping = null, sourceName = 'CRM Import') {
  const formData = new FormData();
  formData.append('file', file);
  if (columnMapping) {
    formData.append('column_mapping_json', JSON.stringify(columnMapping));
  }
  formData.append('source_name', sourceName);
  const response = await apiClient.post('/api/v1/intelligence/crm/import', formData);
  return response.data;
}

export async function batchParseRepository(limit = null) {
  const response = await apiClient.post('/api/v1/intelligence/repository/batch-parse', null, {
    params: limit ? { limit } : {},
  });
  return response.data;
}

export async function getParsedJD(jdDocId) {
  const response = await apiClient.get(`/api/v1/intelligence/jds/${jdDocId}/parsed`);
  return response.data;
}

// ---------------------------------------------------------------------------
// Phase 3: Intelligent Candidate Matching & Segmentation API
// ---------------------------------------------------------------------------

export async function getMatchingConfig() {
  const response = await apiClient.get('/api/matching/config');
  return response.data;
}

export async function updateMatchingConfig(payload) {
  const response = await apiClient.put('/api/matching/config', payload);
  return response.data;
}

export async function triggerMatchingRun(jdId, customWeights = null, customThresholds = null) {
  const payload = { jd_id: jdId };
  if (customWeights) payload.custom_weights = customWeights;
  if (customThresholds) payload.custom_thresholds = customThresholds;
  const response = await apiClient.post('/api/matching/run', payload);
  return response.data;
}

export async function getMatchingRuns() {
  const response = await apiClient.get('/api/matching/runs');
  return response.data;
}

export async function getMatchingRunDetails(runId) {
  const response = await apiClient.get(`/api/matching/runs/${runId}`);
  return response.data;
}

export async function getMatchedCandidates(runId, params = {}) {
  const response = await apiClient.get(`/api/matching/runs/${runId}/candidates`, { params });
  return response.data;
}

export async function getMatchExplanation(matchId) {
  const response = await apiClient.get(`/api/matching/candidates/${matchId}/explanation`);
  return response.data;
}

export function getExportMatchesCsvUrl(runId, segment = null, role = 'recruiter') {
  let url = `/api/matching/runs/${runId}/export?role=${role}`;
  if (segment) url += `&segment=${encodeURIComponent(segment)}`;
  return url;
}

// ---------------------------------------------------------------------------
// Phase 4: Manual TA Distribution & Candidate Ownership API
// ---------------------------------------------------------------------------

export async function getTADirectory() {
  const response = await apiClient.get('/api/v1/assignments/tas');
  return response.data;
}

export async function getManagerOverview() {
  const response = await apiClient.get('/api/v1/assignments/manager-overview');
  return response.data;
}

export async function assignCandidatesToTA(candidateIds, jdId, taUserId, notes = null) {
  const payload = {
    candidate_ids: candidateIds,
    jd_id: jdId,
    ta_user_id: taUserId,
    notes: notes,
  };
  const response = await apiClient.post('/api/v1/assignments/assign', payload);
  return response.data;
}

export async function listAssignments(params = {}) {
  const response = await apiClient.get('/api/v1/assignments/list', { params });
  return response.data;
}

export async function reassignCandidate(assignmentId, newTaId, note = null) {
  const response = await apiClient.post(`/api/v1/assignments/${assignmentId}/reassign`, {
    new_ta_id: newTaId,
    note: note,
  });
  return response.data;
}

export async function unassignCandidate(assignmentId, note = null) {
  const response = await apiClient.post(`/api/v1/assignments/${assignmentId}/unassign`, { note });
  return response.data;
}

export async function updateAssignmentStatus(assignmentId, newStatus, note = null) {
  const response = await apiClient.patch(`/api/v1/assignments/${assignmentId}/status`, {
    status: newStatus,
    note: note,
  });
  return response.data;
}

export async function addAssignmentNote(assignmentId, content) {
  const response = await apiClient.post(`/api/v1/assignments/${assignmentId}/notes`, { content });
  return response.data;
}

export async function getAssignmentHistory(assignmentId) {
  const response = await apiClient.get(`/api/v1/assignments/${assignmentId}/history`);
  return response.data;
}

export function getExportAssignmentsCsvUrl(params = {}) {
  const query = new URLSearchParams(params).toString();
  return `/api/v1/assignments/export?${query}`;
}

// ---------------------------------------------------------------------------
// Phase 5: Email Outreach & Campaign Automation API
// ---------------------------------------------------------------------------

export async function getEmailTemplates() {
  const response = await apiClient.get('/api/v1/outreach/templates');
  return response.data;
}

export async function previewEmailTemplate(payload) {
  const response = await apiClient.post('/api/v1/outreach/templates/preview', payload);
  return response.data;
}

export async function sendManualEmail(payload) {
  const response = await apiClient.post('/api/v1/outreach/send-manual', payload);
  return response.data;
}

export async function getOutreachCampaigns() {
  const response = await apiClient.get('/api/v1/outreach/campaigns');
  return response.data;
}

export async function createOutreachCampaign(payload) {
  const response = await apiClient.post('/api/v1/outreach/campaigns', payload);
  return response.data;
}

export async function approveCampaign(campaignId, notes = null) {
  const response = await apiClient.post(`/api/v1/outreach/campaigns/${campaignId}/approve`, { notes });
  return response.data;
}

export async function rejectCampaign(campaignId, reason = null) {
  const response = await apiClient.post(`/api/v1/outreach/campaigns/${campaignId}/reject`, { reason });
  return response.data;
}

export async function executeCampaign(campaignId, candidateIds = null) {
  const payload = candidateIds ? { candidate_ids: candidateIds } : {};
  const response = await apiClient.post(`/api/v1/outreach/campaigns/${campaignId}/execute`, payload);
  return response.data;
}

export async function getCandidateTimeline(candidateId) {
  const response = await apiClient.get(`/api/v1/outreach/candidate/${candidateId}/timeline`);
  return response.data;
}

export async function addEmailToSuppression(email, reason = 'candidate_opt_out') {
  const response = await apiClient.post('/api/v1/outreach/suppression', { email, reason });
  return response.data;
}

export async function recordCandidateReply(communicationId, reply) {
  const response = await apiClient.post(`/api/v1/outreach/communications/${communicationId}/reply`, { reply });
  return response.data;
}

// ---------------------------------------------------------------------------
// Recruitment Intelligence Platform Enhancements
// ---------------------------------------------------------------------------

export async function searchBooleanCandidates(payload) {
  const response = await apiClient.post('/api/v1/sourcing/boolean-search', payload);
  return response.data;
}

export async function getJDInterviewKit(jdId) {
  const response = await apiClient.get(`/api/v1/jds/${jdId}/interview-kit`);
  return response.data;
}

export async function scheduleInterview(payload) {
  const response = await apiClient.post('/api/v1/interviews/schedule', payload);
  return response.data;
}

export async function getCandidateInterviews(candidateId) {
  const response = await apiClient.get(`/api/v1/interviews/candidate/${candidateId}`);
  return response.data;
}

export async function updateInterviewFeedback(interviewId, payload) {
  const response = await apiClient.put(`/api/v1/interviews/${interviewId}`, payload);
  return response.data;
}

export async function getClients(params = {}) {
  const response = await apiClient.get('/api/v1/clients', { params });
  return response.data;
}

export async function getClientDetail(clientId) {
  const response = await apiClient.get(`/api/v1/clients/${clientId}`);
  return response.data;
}

export async function createClient(payload) {
  const response = await apiClient.post('/api/v1/clients', payload);
  return response.data;
}

// ---------------------------------------------------------------------------
// JD & Resume Intelligence Comparison API
// ---------------------------------------------------------------------------

export async function getComparisonTargets() {
  const response = await apiClient.get('/api/v1/comparison/targets');
  return response.data;
}

export async function analyzeComparison(payload) {
  const response = await apiClient.post('/api/v1/comparison/analyze', payload);
  return response.data;
}

export default apiClient;
