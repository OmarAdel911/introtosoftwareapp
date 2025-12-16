import { api } from './api';

export interface Review {
  id: string;
  jobId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: number]: number;
  };
}

export const reviewsApi = {
  create: async (data: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<Review>('/reviews', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Review>) => {
    const response = await api.put<Review>(`/reviews/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/reviews/${id}`);
  },

  getById: async (id: string) => {
    const response = await api.get<Review>(`/reviews/${id}`);
    return response.data;
  },

  getByUser: async (userId: string) => {
    const response = await api.get<Review[]>(`/reviews/user/${userId}`);
    return response.data;
  },

  getByJob: async (jobId: string) => {
    const response = await api.get<Review[]>(`/reviews/job/${jobId}`);
    return response.data;
  },

  getStats: async (userId: string) => {
    const response = await api.get<ReviewStats>(`/reviews/stats/${userId}`);
    return response.data;
  },

  report: async (id: string, reason: string) => {
    await api.post(`/reviews/${id}/report`, { reason });
  },
}; 