import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, DEFAULT_TIMEOUT, MAX_RETRIES } from '../config';

// Extend the AxiosRequestConfig type to include our retry property
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: number;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: DEFAULT_TIMEOUT,
  withCredentials: true,
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // Check if we're in the browser before accessing localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Handle network errors with retry logic
    if (error.message === 'Network Error' && (originalRequest._retry || 0) < MAX_RETRIES) {
      originalRequest._retry = (originalRequest._retry || 0) + 1;
      
      // Exponential backoff delay
      const delay = Math.min(1000 * Math.pow(2, originalRequest._retry), 10000);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
); 