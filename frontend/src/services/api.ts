// src/services/api.ts
// Central Axios instance with JWT interceptors, timeout, and debug logging

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8085/api';

// ─── Temporary diagnostic log ─────────────────────────────────────────────────
// Remove this line once the integration is confirmed working in production.
console.info('[PowerShare] API base URL:', API_BASE_URL);
// ──────────────────────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // 30-second timeout so that a cold-starting Render instance (free tier sleeps
  // after inactivity) doesn't hang the browser request indefinitely.
  timeout: 30000,
  // Do NOT send cookies / credentials cross-origin.
  // We use Bearer token in the Authorization header — withCredentials would
  // require the server to echo back the exact Origin instead of a wildcard,
  // and causes unnecessary preflight complexity.
  withCredentials: false,
});

// ─── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ps_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Debug: log every outgoing request so we can confirm it left the browser.
  console.debug(`[API →] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

// ─── Response interceptor: handle errors ──────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    console.debug(`[API ←] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      // Timeout — tell the user instead of hanging silently
      console.error('[API] Request timed out after 30 s. Backend may be cold-starting on Render.');
      return Promise.reject(new Error('The server is taking too long to respond. It may be waking up — please try again in 30 seconds.'));
    }

    if (!error.response) {
      // Network error (no response at all — CORS block, server down, etc.)
      console.error('[API] Network error — no response received:', error.message);
      return Promise.reject(new Error('Cannot reach the server. Please check your connection.'));
    }

    console.error(`[API ←] ${error.response.status} ${error.config?.url}`, error.response.data);

    if (error.response.status === 401) {
      // Only redirect to login if we are NOT already on an auth page
      const isAuthPage = ['/login', '/register', '/forgot-password'].some((p) =>
        window.location.pathname.startsWith(p)
      );
      if (!isAuthPage) {
        localStorage.removeItem('ps_token');
        localStorage.removeItem('ps_user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
