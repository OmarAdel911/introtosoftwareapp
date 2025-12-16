import { api } from './api';

export interface FreelancerProfile {
  id: string;
  userId: string;
  title: string;
  bio: string;
  avatar?: string;
  coverImage?: string;
  location: string;
  skills: string[];
  hourlyRate: number;
  availability: 'available' | 'busy' | 'unavailable';
  languages: string[];
  education: {
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string;
    current: boolean;
  }[];
  experience: {
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
  }[];
  portfolio: {
    title: string;
    description: string;
    images: string[];
    link?: string;
    technologies: string[];
  }[];
  certifications: {
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId: string;
    credentialUrl?: string;
  }[];
  socialLinks: {
    linkedin?: string;
    github?: string;
    website?: string;
    twitter?: string;
  };
  completedJobs: number;
  totalEarnings: number;
  averageRating: number;
  responseRate: number;
  responseTime: number;
  onTimeDelivery: number;
  createdAt: string;
  updatedAt: string;
}

export interface FreelancerStats {
  completedJobs: number;
  activeJobs: number;
  totalEarnings: number;
  averageRating: number;
  responseRate: number;
  responseTime: number;
  onTimeDelivery: number;
  clientSatisfaction: number;
}

export const freelancerApi = {
  getProfile: async () => {
    const response = await api.get<FreelancerProfile>('/freelancer/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<FreelancerProfile>) => {
    const response = await api.put<FreelancerProfile>('/freelancer/profile', data);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<FreelancerStats>('/freelancer/stats');
    return response.data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post<string>('/freelancer/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadCoverImage: async (file: File) => {
    const formData = new FormData();
    formData.append('coverImage', file);
    const response = await api.post<string>('/freelancer/cover', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteAvatar: async () => {
    await api.delete('/freelancer/avatar');
  },

  deleteCoverImage: async () => {
    await api.delete('/freelancer/cover');
  },

  addPortfolioItem: async (item: Omit<FreelancerProfile['portfolio'][0], 'id'>) => {
    const response = await api.post<FreelancerProfile>('/freelancer/portfolio', item);
    return response.data;
  },

  updatePortfolioItem: async (id: string, item: Partial<FreelancerProfile['portfolio'][0]>) => {
    const response = await api.put<FreelancerProfile>(`/freelancer/portfolio/${id}`, item);
    return response.data;
  },

  deletePortfolioItem: async (id: string) => {
    await api.delete(`/freelancer/portfolio/${id}`);
  },

  uploadPortfolioImage: async (portfolioId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post<string>(`/freelancer/portfolio/${portfolioId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deletePortfolioImage: async (portfolioId: string, imageUrl: string) => {
    await api.delete(`/freelancer/portfolio/${portfolioId}/images`, {
      data: { imageUrl },
    });
  },

  updateAvailability: async (availability: FreelancerProfile['availability']) => {
    const response = await api.put<FreelancerProfile>('/freelancer/availability', { availability });
    return response.data;
  },

  updateHourlyRate: async (hourlyRate: number) => {
    const response = await api.put<FreelancerProfile>('/freelancer/hourly-rate', { hourlyRate });
    return response.data;
  },

  getRecommendedJobs: async () => {
    const response = await api.get<Array<{ id: string; title: string; budget: number; skills: string[] }>>(
      '/freelancer/recommended-jobs'
    );
    return response.data;
  },
}; 