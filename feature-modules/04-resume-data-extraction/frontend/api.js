/**
 * Standalone API client for Module 04: Resume Data Extraction.
 */

const getBaseUrl = () => {
  return (
    (typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
    'http://127.0.0.1:8001/api/v1/scraper'
  );
};

export async function uploadExtractionBatch(formData, baseUrl = getBaseUrl()) {
  const res = await fetch(`${baseUrl}/upload-batch`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function getBatchStatus(jobId, baseUrl = getBaseUrl()) {
  const res = await fetch(`${baseUrl}/batch-status/${jobId}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function getBatchResults(jobId, baseUrl = getBaseUrl()) {
  const res = await fetch(`${baseUrl}/batch-results/${jobId}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function exportBatchResults(jobId, format = 'csv', baseUrl = getBaseUrl()) {
  window.open(`${baseUrl}/export/${jobId}?format=${format}`, '_blank');
}
