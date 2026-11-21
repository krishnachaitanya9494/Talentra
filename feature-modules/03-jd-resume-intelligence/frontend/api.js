/**
 * Standalone API client for Module 03: JD & Resume Intelligence Comparison.
 */

const getBaseUrl = () => {
  return (
    (typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
    'http://127.0.0.1:8001/api/v1/jd-resume-intelligence'
  );
};

export async function fetchComparisonTargets(baseUrl = getBaseUrl()) {
  const res = await fetch(`${baseUrl}/targets`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function analyzeComparison(payload, baseUrl = getBaseUrl()) {
  const res = await fetch(`${baseUrl}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}
