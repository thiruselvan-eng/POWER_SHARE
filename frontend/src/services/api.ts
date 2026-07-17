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
  withCredentials: true,
});

// ─── Request interceptor: attach JWT & log outgoing request details ──────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ps_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Comprehensive logging of every outgoing request URL, method, headers, and payload JSON
    console.groupCollapsed(`%c[API Request →] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url || ''}`, 'color: #0ea5e9; font-weight: bold;');
    console.log('Request URL:', `${config.baseURL || ''}${config.url || ''}`);
    console.log('Method:', config.method?.toUpperCase());
    console.log('Headers:', JSON.parse(JSON.stringify(config.headers)));
    console.log('Payload:', config.data || '(None)');
    console.groupEnd();

    return config;
  },
  (error) => {
    console.error('[API Request Exception]', error);
    return Promise.reject(error);
  }
);

// ─── Response interceptor: handle errors & log response details ──────────────
api.interceptors.response.use(
  (response) => {
    // Comprehensive logging of every successful response
    console.groupCollapsed(`%c[API Response ←] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, 'color: #10b981; font-weight: bold;');
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response data:', response.data);
    console.groupEnd();

    return response;
  },
  (error) => {
    // Comprehensive logging of every response error
    console.groupCollapsed(`%c[API Response Error ⚠] ${error.message}`, 'color: #ef4444; font-weight: bold;');
    console.log('Error Message:', error.message);
    console.log('Code:', error.code || 'N/A');
    if (error.config) {
      console.log('Request URL:', `${error.config.baseURL || ''}${error.config.url || ''}`);
      console.log('Request Method:', error.config.method?.toUpperCase());
      console.log('Request Headers:', error.config.headers);
      console.log('Request Payload:', error.config.data || '(None)');
    }
    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', error.response.data);
    }
    console.groupEnd();

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
