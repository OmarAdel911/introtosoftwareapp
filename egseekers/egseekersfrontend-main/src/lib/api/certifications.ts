import { api } from './api';

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId: string;
  credentialUrl?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export const certificationsApi = {
  create: async (data: Omit<Certification, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<Certification>('/certifications', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Certification>) => {
    const response = await api.put<Certification>(`/certifications/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/certifications/${id}`);
  },

  getById: async (id: string) => {
    const response = await api.get<Certification>(`/certifications/${id}`);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get<Certification[]>('/certifications');
    return response.data;
  },

  uploadImage: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post<string>(`/certifications/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteImage: async (id: string) => {
    await api.delete(`/certifications/${id}/image`);
  },

  verify: async (id: string) => {
    const response = await api.post<{ verified: boolean; message: string }>(
      `/certifications/${id}/verify`
    );
    return response.data;
  },
}; 