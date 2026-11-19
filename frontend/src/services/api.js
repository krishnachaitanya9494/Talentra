/**
 * API Client Service for TALENTRA.
 *
 * Configures a centralized Axios instance to interact with the FastAPI backend.
 * Base URL defaults to local development server (http://127.0.0.1:8000) or
 * the VITE_API_BASE_URL environment variable when provided.
 */

import axios from 'axios';

// Read API base URL from Vite environment variables or fallback to local backend default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Fetch root metadata from the backend API.
 * @returns {Promise<Object>} Root welcome payload
 */
export async function getRootInfo() {
  const response = await apiClient.get('/');
  return response.data;
}

/**
 * Fetch system health and database connectivity diagnostics.
 * @returns {Promise<Object>} Health response including database probe status
 */
export async function getHealthStatus() {
  const response = await apiClient.get('/health');
  return response.data;
}

export default apiClient;
