import { api } from './api';

export interface FreelancerSearchParams {
  query?: string;
  skills?: string[];
  location?: string;
  hourlyRate?: {
    min?: number;
    max?: number;
  };
  availability?: 'available' | 'busy' | 'unavailable';
  rating?: number;
  completedJobs?: number;
  languages?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'hourlyRate' | 'completedJobs' | 'responseTime';
  sortOrder?: 'asc' | 'desc';
}

export interface FreelancerSearchResult {
  id: string;
  title: string;
  name: string;
  avatar?: string;
  location: string;
  skills: string[];
  hourlyRate: number;
  availability: 'available' | 'busy' | 'unavailable';
  completedJobs: number;
  averageRating: number;
  responseRate: number;
  responseTime: number;
  onTimeDelivery: number;
  topSkills: string[];
  recentWork: {
    title: string;
    client: string;
    completedAt: string;
    rating: number;
  }[];
}

export interface FreelancerSearchResponse {
  freelancers: FreelancerSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const freelancersApi = {
  search: async (params: FreelancerSearchParams) => {
    const response = await api.get<FreelancerSearchResponse>('/freelancers/search', { params });
    return response.data;
  },

  getTopRated: async (limit: number = 10) => {
    const response = await api.get<FreelancerSearchResult[]>('/freelancers/top-rated', {
      params: { limit },
    });
    return response.data;
  },

  getRecentlyJoined: async (limit: number = 10) => {
    const response = await api.get<FreelancerSearchResult[]>('/freelancers/recently-joined', {
      params: { limit },
    });
    return response.data;
  },

  getBySkills: async (skills: string[], limit: number = 10) => {
    const response = await api.get<FreelancerSearchResult[]>('/freelancers/by-skills', {
      params: { skills, limit },
    });
    return response.data;
  },

  getByLocation: async (location: string, limit: number = 10) => {
    const response = await api.get<FreelancerSearchResult[]>('/freelancers/by-location', {
      params: { location, limit },
    });
    return response.data;
  },

  getAvailable: async (limit: number = 10) => {
    const response = await api.get<FreelancerSearchResult[]>('/freelancers/available', {
      params: { limit },
    });
    return response.data;
  },

  getFeatured: async () => {
    const response = await api.get<FreelancerSearchResult[]>('/freelancers/featured');
    return response.data;
  },

  getSimilar: async (freelancerId: string, limit: number = 5) => {
    const response = await api.get<FreelancerSearchResult[]>(`/freelancers/${freelancerId}/similar`, {
      params: { limit },
    });
    return response.data;
  },

  getSkills: async () => {
    const response = await api.get<string[]>('/freelancers/skills');
    return response.data;
  },

  getLocations: async () => {
    const response = await api.get<string[]>('/freelancers/locations');
    return response.data;
  },

  getLanguages: async () => {
    const response = await api.get<string[]>('/freelancers/languages');
    return response.data;
  },
}; 