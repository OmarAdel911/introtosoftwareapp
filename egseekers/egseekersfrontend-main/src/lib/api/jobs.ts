import { api } from './api';
import { handleApiError } from '../utils/error-handler';

export interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  skills: string[];
  category: string;
  status: string;
  postedAt: string;
  deadline: string;
  client: {
    id: string;
    name: string;
  };
  proposals?: Array<{
    id: string;
    amount: number;
    coverLetter: string;
    status: string;
    freelancer: {
      id: string;
      name: string;
    };
  }>;
}

export interface ProposalSubmission {
  amount: number;
  coverLetter: string;
}

export const jobsApi = {
  getById: async (jobId: string): Promise<Job> => {
    try {
      const response = await api.get(`/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  submitProposal: async (jobId: string, proposal: ProposalSubmission): Promise<void> => {
    try {
      await api.post(`/jobs/${jobId}/proposals`, proposal);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}; 