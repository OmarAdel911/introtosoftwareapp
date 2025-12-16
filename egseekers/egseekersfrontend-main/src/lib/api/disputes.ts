import { api } from './api';

export interface DisputeComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  jobId: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdBy: string;
  assignedTo?: string;
  comments: DisputeComment[];
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export const disputesApi = {
  create: async (data: Omit<Dispute, 'id' | 'comments' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<Dispute>('/disputes', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Dispute>) => {
    const response = await api.put<Dispute>(`/disputes/${id}`, data);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Dispute>(`/disputes/${id}`);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get<Dispute[]>('/disputes');
    return response.data;
  },

  getByJob: async (jobId: string) => {
    const response = await api.get<Dispute[]>(`/disputes/job/${jobId}`);
    return response.data;
  },

  addComment: async (id: string, content: string) => {
    const response = await api.post<DisputeComment>(`/disputes/${id}/comments`, { content });
    return response.data;
  },

  updateStatus: async (id: string, status: Dispute['status']) => {
    const response = await api.put<Dispute>(`/disputes/${id}/status`, { status });
    return response.data;
  },

  assign: async (id: string, userId: string) => {
    const response = await api.put<Dispute>(`/disputes/${id}/assign`, { userId });
    return response.data;
  },

  resolve: async (id: string, resolution: string) => {
    const response = await api.put<Dispute>(`/disputes/${id}/resolve`, { resolution });
    return response.data;
  },

  close: async (id: string) => {
    const response = await api.put<Dispute>(`/disputes/${id}/close`);
    return response.data;
  },
}; 