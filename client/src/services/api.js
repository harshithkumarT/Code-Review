import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  // In development, Vite dev server proxies /api to http://localhost:5000
  if (import.meta.env.DEV) {
    return '/api';
  }
  // In production, fallback directly to the deployed Render backend
  return 'https://code-review-4cy0.onrender.com/api';
};

const API = axios.create({
  baseURL: getBaseUrl(),
});

// Axios Request Interceptor: Attach JWT Bearer token automatically to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
