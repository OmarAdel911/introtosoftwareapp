import { ErrorResponse } from '@/types/api';
import { toast } from '@/components/ui/toast';

export class ApiError extends Error {
  statusCode: number;
  details?: Record<string, string[]>;

  constructor(error: ErrorResponse) {
    super(error.message);
    this.name = 'ApiError';
    this.statusCode = error.statusCode;
   
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    // Handle known API errors
    if (error.statusCode === 401) {
      // Handle unauthorized error
      toast.error('Please log in to continue');
      // Redirect to login page
      window.location.href = '/login';
      return;
    }

    if (error.statusCode === 403) {
      toast.error('You do not have permission to perform this action');
      return;
    }

    if (error.statusCode === 404) {
      toast.error('The requested resource was not found');
      return;
    }

    if (error.statusCode === 422) {
      // Handle validation errors
      const details = error.details;
      if (details) {
        Object.entries(details).forEach(([field, messages]) => {
          messages.forEach((message) => {
            toast.error(`${field}: ${message}`);
          });
        });
      }
      return;
    }

    // Handle other API errors
    toast.error(error.message);
    return;
  }

  // Handle unknown errors
  console.error('Unexpected error:', error);
  toast.error('An unexpected error occurred. Please try again later.');
} 