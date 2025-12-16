import { api } from './api';
import { handleApiError } from '../utils/error-handler';

export interface JobPost {
  id: string;
  title: string;
  description: string;
  budget: {
    min: number;
    max: number;
    type: 'fixed' | 'hourly';
  };
  skills: string[];
  category: string;
  subcategory?: string;
  experience: 'entry' | 'intermediate' | 'expert';
  duration: 'less_than_1_month' | '1_to_3_months' | '3_to_6_months' | 'more_than_6_months';
  location: {
    type: 'remote' | 'onsite' | 'hybrid';
    country?: string;
    city?: string;
  };
  attachments?: string[];
  visibility: 'public' | 'private';
  status: 'draft' | 'published' | 'closed' | 'cancelled';
  proposalsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface JobPostDraft extends Omit<JobPost, 'id' | 'proposalsCount' | 'viewsCount' | 'createdAt' | 'updatedAt' | 'expiresAt'> {
  id?: string;
}

export const postJobApi = {
  create: async (data: JobPostDraft) => {
    try {
      const response = await api.post<JobPost>('/jobs', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  update: async (jobId: string, data: Partial<JobPostDraft>) => {
    try {
      const response = await api.put<JobPost>(`/jobs/${jobId}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  publish: async (jobId: string) => {
    try {
      const response = await api.post<JobPost>(`/jobs/${jobId}/publish`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  unpublish: async (jobId: string) => {
    try {
      const response = await api.post<JobPost>(`/jobs/${jobId}/unpublish`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  close: async (jobId: string) => {
    try {
      const response = await api.post<JobPost>(`/jobs/${jobId}/close`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  delete: async (jobId: string) => {
    try {
      await api.delete(`/jobs/${jobId}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getById: async (jobId: string) => {
    try {
      const response = await api.get<JobPost>(`/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getDrafts: async () => {
    try {
      const response = await api.get<JobPost[]>('/jobs/drafts');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getActive: async () => {
    try {
      const response = await api.get<JobPost[]>('/jobs/active');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getClosed: async () => {
    try {
      const response = await api.get<JobPost[]>('/jobs/closed');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  uploadAttachment: async (jobId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('attachment', file);
      const response = await api.post<string>(`/jobs/${jobId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  deleteAttachment: async (jobId: string, attachmentUrl: string) => {
    try {
      await api.delete(`/jobs/${jobId}/attachments`, {
        data: { attachmentUrl },
      });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  extendDeadline: async (jobId: string, newDeadline: string) => {
    try {
      const response = await api.put<JobPost>(`/jobs/${jobId}/deadline`, { deadline: newDeadline });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
}; 