import axios from 'axios';

// In dev, Vite proxies /api → http://localhost:8080 (same-origin, cookies work).
// In prod, set VITE_API_URL to the absolute backend URL.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send HttpOnly refresh cookie on refresh calls
});

// ── In-memory access token (survives tab session, immune to XSS unlike localStorage) ──
let _accessToken: string | null = null;
export const getAccessToken = () => _accessToken;
export const setAccessToken = (t: string | null) => { _accessToken = t; };

// Attach access token to every outgoing request
apiClient.interceptors.request.use(config => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`;
  return config;
});

// On 401: silently refresh, then retry the original request once
let _refreshing = false;
let _queue: Array<(token: string | null) => void> = [];

apiClient.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config;

    // Don't retry auth endpoints or already-retried requests
    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url?.includes('/auth/')
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (_refreshing) {
      return new Promise((resolve, reject) => {
        _queue.push(token => {
          if (token) {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          } else {
            reject(error);
          }
        });
      });
    }

    _refreshing = true;
    try {
      const { data } = await apiClient.post<{ accessToken: string }>('/auth/refresh');
      _accessToken = data.accessToken;
      _queue.forEach(cb => cb(_accessToken));
      _queue = [];
      original.headers.Authorization = `Bearer ${_accessToken}`;
      return apiClient(original);
    } catch {
      _accessToken = null;
      _queue.forEach(cb => cb(null));
      _queue = [];
      return Promise.reject(error);
    } finally {
      _refreshing = false;
    }
  }
);

export default apiClient;
