'use client';

import React from 'react';
import { IdVerification } from '@/components/verification/IdVerification';

export default function VerificationPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Identity Verification</h1>
        <p className="text-gray-600 mb-8">
          To ensure the security and trust of our platform, we require all users to verify their identity.
          This helps us maintain a safe environment for all users and enables access to all platform features.
        </p>
        <IdVerification />
      </div>
    </div>
  );
} 