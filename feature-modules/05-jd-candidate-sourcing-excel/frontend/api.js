/**
 * Standalone API client for Module 05: JD-Based Candidate Sourcing & Excel Engine.
 */

const getBaseUrl = () => {
  return (
    (typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
    'http://127.0.0.1:8001/api/v1/sourcing'
  );
};

export async function searchSourcingCandidates(params, baseUrl = getBaseUrl()) {
  const res = await fetch(`${baseUrl}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function exportSourcingExcel(payload, baseUrl = getBaseUrl()) {
  const res = await fetch(`${baseUrl}/export-excel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function getExportHistory(baseUrl = getBaseUrl()) {
  const res = await fetch(`${baseUrl}/export-history`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}
