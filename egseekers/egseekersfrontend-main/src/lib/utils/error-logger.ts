/**
 * Utility function for better error logging that prevents empty object logging
 */

import { config } from '@/config/env';

export interface ErrorLogContext {
  operation?: string;
  endpoint?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export function logError(
  error: unknown, 
  context: ErrorLogContext = {}
): void {
  // Only log errors in development mode
  if (!config.isDevelopment) {
    return;
  }

  const errorInfo: any = {
    timestamp: new Date().toISOString(),
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context
  };

  // Handle different error types
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    
    // Add response data if it exists
    if (errorObj.response) {
      errorInfo.response = {
        status: errorObj.response.status,
        statusText: errorObj.response.statusText,
        data: errorObj.response.data
      };
    }
    
    // Add request config if it exists
    if (errorObj.config) {
      errorInfo.request = {
        url: errorObj.config.url,
        method: errorObj.config.method,
        baseURL: errorObj.config.baseURL
      };
    }
    
    // Add any other relevant properties
    if (errorObj.code) errorInfo.code = errorObj.code;
    if (errorObj.status) errorInfo.status = errorObj.status;
    if (errorObj.error) errorInfo.error = errorObj.error;
  }

  // Use console.warn instead of console.error to avoid triggering Next.js error overlay
  // These are expected API errors, not unexpected runtime errors
  // eslint-disable-next-line no-console
  console.warn('API Error occurred:', errorInfo);
}

export function logApiError(
  error: unknown, 
  operation: string,
  endpoint?: string
): void {
  logError(error, { operation, endpoint });
}

export function logNetworkError(
  error: unknown, 
  operation: string
): void {
  logError(error, { 
    operation, 
    additionalData: { 
      errorType: 'network',
      isNetworkError: error instanceof Error && 
        (error.message.includes('Network Error') || 
         error.message.includes('Failed to fetch') ||
         error.message.includes('timeout'))
    }
  });
}
