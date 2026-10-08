import axios from 'axios';

// Resolve API base URL dynamically:
// 1. Runtime override via localStorage (for testing across devices without rebuilding)
// 2. Explicit VITE_API_URL environment variable (from Vercel / Render)
// 3. Local development fallback: http://localhost:3001/api
// 4. Production fallback: '/api' (relative path to avoid localhost on remote devices)
export const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('CAMPUSFLOW_API_URL');
    if (custom) return custom.trim().replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '');
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:3001/api';
  }
  return '/api';
};

export const apiClient = axios.create({
  baseURL: getApiBase(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token and ensure latest baseURL
apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBase();
  const token = localStorage.getItem('campusflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to format errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'API Request failed';
    console.error('API Error:', message, error.response?.data);
    return Promise.reject(new Error(message));
  }
);
