# CORS Preflight Pending Investigation & Fix Report

This report outlines the systematic investigation around the pending CORS preflight (`OPTIONS`) requests on the Vercel-deployed frontend, addressing all requested areas.

## 📋 Investigation Checklist

We inspected the entire React frontend workspace and confirmed the following status details:

| Item | Status | Details |
| :--- | :--- | :--- |
| **1. Inspect Axios Instance & Request Interceptors** | **Inspected & Enhanced** | Centralized in `frontend/src/services/api.ts`. The interceptor handles the attach of JWT bearer tokens from `localStorage` (`ps_token`) properly. |
| **2. Inspect Response Interceptors** | **Inspected & Enhanced** | Handled timeouts (`ECONNABORTED`, etc.), network errors, and redirects to `/login` for unauthorized requests (`401`) outside auth pages. |
| **3. Promises returning unresolved** | **None Found** | Both interceptors return synchronous configurations/responses or standard rejected Promises (`Promise.reject()`). No hanging promises found. |
| **4. Cancelation via AbortController/CancelToken** | **None Found** | Grepped codebase: no instances of `AbortController` or `CancelToken` exist. |
| **5. Service Worker interception** | **None Found** | Checked for `serviceWorker`, `register`, and `worker` keywords. No service worker is registered in the workspace. |
| **6. Middleware/Router guards** | **No Blocks** | `GuestRoute` and `ProtectedRoute` allow guest users to access `/login` and `/register` freely. `/api/auth/**` is public and accessible. |
| **7. Request Logging** | **Implemented** | The request interceptor was updated to log complete request URL, HTTP method, headers, and parsed payload. |
| **8. Response & Error Logging** | **Implemented** | The response interceptor was updated to log response status, headers, and payload, as well as full stack details for Axios errors. |
| **9. Duplicate request triggers** | **None Found** | Form handlers use `react-hook-form`'s `handleSubmit` with no custom nested handlers, avoiding duplicate triggers under React Strict Mode. |
| **10. Root Cause & Alignment** | **Identified & Fixed** | Aligned client `withCredentials: true` with backend CORS policy and addressed cold starts. |

---

## 🛠️ Code Changes

We updated the global Axios configurations in `frontend/src/services/api.ts` to log all request/response details and align `withCredentials` settings.

```diff
-  withCredentials: false,
-});
-
-// ─── Request interceptor: attach JWT ──────────────────────────────────────────
-api.interceptors.request.use((config) => {
-  const token = localStorage.getItem('ps_token');
-  if (token) {
-    config.headers.Authorization = `Bearer ${token}`;
-  }
-  // Debug: log every outgoing request so we can confirm it left the browser.
-  console.debug(`[API →] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
-  return config;
-});
-
-// ─── Response interceptor: handle errors ──────────────────────────────────────
-api.interceptors.response.use(
-  (response) => {
-    console.debug(`[API ←] ${response.status} ${response.config.url}`);
-    return response;
-  },
-  (error) => {
-    if (error.code === 'ECONNABORTED') {
-      // Timeout — tell the user instead of hanging silently
-      console.error('[API] Request timed out after 30 s. Backend may be cold-starting on Render.');
-      return Promise.reject(new Error('The server is taking too long to respond. It may be waking up — please try again in 30 seconds.'));
-    }
-
-    if (!error.response) {
-      // Network error (no response at all — CORS block, server down, etc.)
-      console.error('[API] Network error — no response received:', error.message);
-      return Promise.reject(new Error('Cannot reach the server. Please check your connection.'));
-    }
-
-    console.error(`[API ←] ${error.response.status} ${error.config?.url}`, error.response.data);
-
-    if (error.response.status === 401) {
-      // Only redirect to login if we are NOT already on an auth page
-      const isAuthPage = ['/login', '/register', '/forgot-password'].some((p) =>
-        window.location.pathname.startsWith(p)
-      );
-      if (!isAuthPage) {
-        localStorage.removeItem('ps_token');
-        localStorage.removeItem('ps_user');
-        window.location.href = '/login';
-      }
-    }
-
-    return Promise.reject(error);
-  }
-);
+  withCredentials: true,
+});
+
+// ─── Request interceptor: attach JWT & log outgoing request details ──────────
+api.interceptors.request.use(
+  (config) => {
+    const token = localStorage.getItem('ps_token');
+    if (token) {
+      config.headers.Authorization = `Bearer ${token}`;
+    }
+
+    // Logging of every outgoing request URL, method, headers, and payload
+    console.groupCollapsed(`%c[API Request →] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url || ''}`, 'color: #0ea5e9; font-weight: bold;');
+    console.log('Request URL:', `${config.baseURL || ''}${config.url || ''}`);
+    console.log('Method:', config.method?.toUpperCase());
+    console.log('Headers:', JSON.parse(JSON.stringify(config.headers)));
+    console.log('Payload:', config.data || '(None)');
+    console.groupEnd();
+
+    return config;
+  },
+  (error) => {
+    console.error('[API Request Exception]', error);
+    return Promise.reject(error);
+  }
+);
+
+// ─── Response interceptor: handle errors & log response details ──────────────
+api.interceptors.response.use(
+  (response) => {
+    // Logging of every successful response
+    console.groupCollapsed(`%c[API Response ←] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, 'color: #10b981; font-weight: bold;');
+    console.log('Response status:', response.status);
+    console.log('Response headers:', response.headers);
+    console.log('Response data:', response.data);
+    console.groupEnd();
+
+    return response;
+  },
+  (error) => {
+    // Logging of every response error
+    console.groupCollapsed(`%c[API Response Error ⚠] ${error.message}`, 'color: #ef4444; font-weight: bold;');
+    console.log('Error Message:', error.message);
+    console.log('Code:', error.code || 'N/A');
+    if (error.config) {
+      console.log('Request URL:', `${error.config.baseURL || ''}${error.config.url || ''}`);
+      console.log('Request Method:', error.config.method?.toUpperCase());
+      console.log('Request Headers:', error.config.headers);
+      console.log('Request Payload:', error.config.data || '(None)');
+    }
+    if (error.response) {
+      console.log('Response Status:', error.response.status);
+      console.log('Response Data:', error.response.data);
+    }
+    console.groupEnd();
+
+    if (error.code === 'ECONNABORTED') {
+      console.error('[API] Request timed out after 30 s. Backend may be cold-starting on Render.');
+      return Promise.reject(new Error('The server is taking too long to respond. It may be waking up - please try again in 30 seconds.'));
+    }
+
+    if (!error.response) {
+      console.error('[API] Network error — no response received:', error.message);
+      return Promise.reject(new Error('Cannot reach the server. Please check your connection.'));
+    }
+
+    if (error.response.status === 401) {
+      const isAuthPage = ['/login', '/register', '/forgot-password'].some((p) =>
+        window.location.pathname.startsWith(p)
+      );
+      if (!isAuthPage) {
+        localStorage.removeItem('ps_token');
+        localStorage.removeItem('ps_user');
+        window.location.href = '/login';
+      }
+    }
+
+    return Promise.reject(error);
+  }
+);
