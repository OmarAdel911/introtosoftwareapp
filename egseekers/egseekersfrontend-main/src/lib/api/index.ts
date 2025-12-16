import axios from 'axios';
import { config } from '@/config/env';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors with retry logic
    if (!error.response && error.message === 'Network Error') {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        // Wait for 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return api(originalRequest);
      }
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Store the current path to redirect back after login
        sessionStorage.setItem('redirectPath', window.location.pathname);
        window.location.href = '/login';
      }
      return Promise.reject(new Error('Session expired. Please login again.'));
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 5;
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return api(originalRequest);
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    }

    // Handle validation errors
    if (error.response?.status === 422) {
      const validationErrors = error.response.data.errors;
      return Promise.reject(new Error(
        Object.values(validationErrors).flat().join(', ')
      ));
    }

    return Promise.reject(error);
  }
);

export default api; 