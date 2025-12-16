'use client';

import { useEffect } from 'react';
import { clearAuthData } from '@/lib/clear-auth';

export default function ClearAuthPage() {
  useEffect(() => {
    // Clear auth data when the page loads
    clearAuthData();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Clearing Authentication Data</h1>
      <p className="text-center mb-4">
        All authentication tokens and user data are being cleared from your browser.
      </p>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      <p className="mt-4 text-sm text-gray-500">
        You will be redirected to the login page shortly...
      </p>
    </div>
  );
} 