import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosHeaders } from 'axios';
import { config as envConfig } from '@/config/env';
import { ApiResponse, ErrorResponse } from '@/types/api';
import { logApiError } from '@/lib/utils/error-logger';

class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<AxiosRequestConfig, 'baseURL' | 'url' | 'data' | 'headers'> {
  timeout?: number;
  headers?: Record<string, string>;
}

export class ApiClient {
  private static instance: ApiClient;
  private readonly axiosInstance: AxiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: envConfig.apiUrl,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Only log in development mode
        if (envConfig.isDevelopment) {
          // eslint-disable-next-line no-console
          console.log('Making request to:', config.url, 'with method:', config.method);
        }
        // Get token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        // Add token to headers if it exists
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => {
        if (envConfig.isDevelopment) {
          logApiError(error, 'Request Setup');
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Only log in development mode
        if (envConfig.isDevelopment) {
          // eslint-disable-next-line no-console
          console.log('Received response from:', response.config.url, 'with status:', response.status);
        }
        // Handle successful responses
        const data = response.data;
        
        // Ensure response has success property
        if (!('success' in data)) {
          data.success = true;
        }
        
        return data;
      },
      (error: unknown) => {
        // Log error details only in development mode
        if (envConfig.isDevelopment) {
          try {
            if (axios.isAxiosError(error)) {
              const endpoint = error.config?.url || 'unknown';
              logApiError(error, 'API Request', endpoint);
            } else {
              logApiError(error, 'API Request');
            }
          } catch {
            // Silently fail if logging errors
          }
        }
        
        // Handle 401 Unauthorized errors
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }
        
        // Format error response
        const errorMessage = axios.isAxiosError(error)
          ? ((error.response?.data as any)?.error || error.message || 'An unknown error occurred')
          : (error instanceof Error ? error.message : 'An unknown error occurred');
        const statusCode = axios.isAxiosError(error) ? (error.response?.status || 500) : 500;
        
        return Promise.reject({
          success: false,
          error: errorMessage,
          status: statusCode
        });
      }
    );
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private getHeaders(options?: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };
    return headers;
  }

  public async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.request({
        method,
        url: endpoint,
        data,
        ...options,
        headers: this.getHeaders(options),
      });

      return response as unknown as ApiResponse<T>;
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError(error.message, 'REQUEST_ERROR');
      }
      throw error;
    }
  }

  public async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  public async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, options);
  }

  public async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  public async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  public async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, options);
  }
}

export const apiClient = ApiClient.getInstance(); 