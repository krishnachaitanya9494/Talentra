/**
 * Standalone API client for Module 02: Candidate Resumes.
 */

const getBaseUrl = () => {
  return (
    (typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
    'http://127.0.0.1:8001/api/v1/candidate-resumes'
  );
};

export async function fetchCandidates(baseUrl = getBaseUrl(), params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${baseUrl}${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function uploadSingleResume(formData, baseUrl = getBaseUrl()) {
  const res = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function uploadBulkResumes(formData, baseUrl = getBaseUrl()) {
  const res = await fetch(`${baseUrl}/bulk-upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function checkDuplicateResume(fileHash, baseUrl = getBaseUrl()) {
  const res = await fetch(`${baseUrl}/check-duplicate?hash=${fileHash}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function downloadResumeFile(resumeId, baseUrl = getBaseUrl()) {
  window.open(`${baseUrl}/${resumeId}/download`, '_blank');
}
