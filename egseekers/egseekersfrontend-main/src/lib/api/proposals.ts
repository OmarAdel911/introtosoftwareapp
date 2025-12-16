import { api } from './api';

export interface Proposal {
  id: string;
  jobId: string;
  freelancerId: string;
  amount: number;
  coverLetter: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CreateProposalData {
  jobId: string;
  amount: number;
  coverLetter: string;
}

export const proposalsApi = {
  getAll: async () => {
    const response = await api.get<Proposal[]>('/proposals');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Proposal>(`/proposals/${id}`);
    return response.data;
  },

  create: async (data: CreateProposalData) => {
    const response = await api.post<Proposal>('/proposals', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateProposalData>) => {
    const response = await api.put<Proposal>(`/proposals/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/proposals/${id}`);
  },
}; 