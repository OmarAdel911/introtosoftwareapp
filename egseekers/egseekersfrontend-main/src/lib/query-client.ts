'use client'

import { QueryClient } from '@tanstack/react-query';
import { handleApiError } from './error-handler';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// Add global error handlers
queryClient.getQueryCache().subscribe((event) => {
  if (event?.type === 'updated' && event.action?.type === 'error') {
    const error = event.action.error;
    if (error) {
      handleApiError(error);
    }
  }
});

queryClient.getMutationCache().subscribe((event) => {
  if (event?.type === 'updated' && event.action?.type === 'error') {
    const error = event.action.error;
    if (error) {
      handleApiError(error);
    }
  }
}); 