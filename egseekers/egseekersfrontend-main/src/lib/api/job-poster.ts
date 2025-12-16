import { api } from './api';

export interface JobPoster {
  id: string;
  userId: string;
  companyName: string;
  companyLogo?: string;
  companySize: string;
  industry: string;
  location: string;
  website?: string;
  description: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobPosterStats {
  totalJobsPosted: number;
  activeJobs: number;
  completedJobs: number;
  totalSpent: number;
  averageRating: number;
  responseRate: number;
}

export const jobPosterApi = {
  getProfile: async () => {
    const response = await api.get<JobPoster>('/job-poster/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<JobPoster>) => {
    const response = await api.put<JobPoster>('/job-poster/profile', data);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<JobPosterStats>('/job-poster/stats');
    return response.data;
  },

  uploadCompanyLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post<string>('/job-poster/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteCompanyLogo: async () => {
    await api.delete('/job-poster/logo');
  },

  verifyCompany: async (verificationData: {
    documentType: string;
    documentNumber: string;
    documentFile: File;
  }) => {
    const formData = new FormData();
    formData.append('documentType', verificationData.documentType);
    formData.append('documentNumber', verificationData.documentNumber);
    formData.append('document', verificationData.documentFile);
    
    const response = await api.post<{ status: string; message: string }>(
      '/job-poster/verify',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  getVerificationStatus: async () => {
    const response = await api.get<{ status: string; message?: string }>(
      '/job-poster/verification-status'
    );
    return response.data;
  },
}; 