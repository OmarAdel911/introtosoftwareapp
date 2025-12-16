'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { config } from '@/config/env';

type VerificationStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

interface VerificationData {
  status: VerificationStatus;
  documentType?: string;
  documentNumber?: string;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export function IdVerification() {
  const [verificationData, setVerificationData] = useState<VerificationData>({
    status: 'NOT_SUBMITTED'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const axiosInstance = axios.create({
    baseURL: config.apiUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor to include auth token
  axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const response = await axiosInstance.get('/verification/status');
      setVerificationData(response.data);
    } catch (err) {
      setError('Failed to fetch verification status');
      console.error('Error fetching verification status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('documentNumber', documentNumber);
      if (documentFile) {
        formData.append('document', documentFile);
      }

      await axiosInstance.post('/verification/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setVerificationData({
        status: 'PENDING',
        documentType,
        documentNumber,
        submittedAt: new Date().toISOString(),
      });

      // Reset form
      setDocumentType('');
      setDocumentNumber('');
      setDocumentFile(null);
    } catch (err) {
      setError('Failed to submit verification documents');
      console.error('Error submitting verification:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (verificationData.status === 'APPROVED') {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle>Verification Approved</AlertTitle>
        <AlertDescription>
          Your identity has been verified. You now have access to all platform features.
        </AlertDescription>
      </Alert>
    );
  }

  if (verificationData.status === 'PENDING') {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertTitle>Verification Pending</AlertTitle>
        <AlertDescription>
          Your verification documents are being reviewed. This usually takes 1-2 business days.
        </AlertDescription>
      </Alert>
    );
  }

  if (verificationData.status === 'REJECTED') {
    return (
      <Alert className="bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle>Verification Rejected</AlertTitle>
        <AlertDescription>
          {verificationData.rejectionReason || 'Your verification documents were not accepted. Please try again with valid documents.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="documentType">Document Type</Label>
        <Select value={documentType} onValueChange={setDocumentType}>
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PASSPORT">Passport</SelectItem>
            <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
            <SelectItem value="NATIONAL_ID">National ID</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="documentNumber">Document Number</Label>
        <Input
          id="documentNumber"
          value={documentNumber}
          onChange={(e) => setDocumentNumber(e.target.value)}
          placeholder="Enter document number"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="document">Upload Document</Label>
        <Input
          id="document"
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          required
        />
        <p className="text-sm text-gray-500">
          Please upload a clear photo or scan of your document. Supported formats: JPG, PNG, PDF
        </p>
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Verification'
        )}
      </Button>
    </form>
  );
}