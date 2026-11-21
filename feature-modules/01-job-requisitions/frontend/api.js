/**
 * Standalone API client for Module 01: Job Requisitions.
 * Configured via environment variable or custom base URL.
 */

const getBaseUrl = () => {
  return (
    (typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
    'http://127.0.0.1:8001/api/v1/job-requisitions'
  );
};

export async function fetchRequisitions(baseUrl = getBaseUrl(), params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${baseUrl}${query ? `?${query}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getStructuredJD(jdId, baseUrl = getBaseUrl()) {
  const res = await fetch(`${baseUrl}/${jdId}/structured`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function updateRequisition(jdId, payload, baseUrl = getBaseUrl()) {
  const res = await fetch(`${baseUrl}/${jdId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function getJDVersions(jdId, baseUrl = getBaseUrl()) {
  const res = await fetch(`${baseUrl}/${jdId}/versions`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function validateJD(jdId, baseUrl = getBaseUrl()) {
  const res = await fetch(`${baseUrl}/${jdId}/validation`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}
