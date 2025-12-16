import { toast } from 'react-hot-toast';

export function handleApiError(error: unknown) {
  if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error('An unexpected error occurred');
  }
  console.error('API Error:', error);
} 