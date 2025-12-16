import { api } from './api';

export interface Profile {
  id: string;
  userId: string;
  name: string;
  email: string;
  bio: string;
  avatar?: string;
  coverImage?: string;
  location: string;
  skills: string[];
  hourlyRate?: number;
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
  socialLinks: {
    linkedin?: string;
    github?: string;
    website?: string;
    twitter?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProfileStats {
  completedJobs: number;
  totalEarnings: number;
  averageRating: number;
  responseRate: number;
  responseTime: number;
  onTimeDelivery: number;
}

export const profileApi = {
  get: async () => {
    const response = await api.get<Profile>('/profile');
    return response.data;
  },

  update: async (data: Partial<Profile>) => {
    const response = await api.put<Profile>('/profile', data);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<ProfileStats>('/profile/stats');
    return response.data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post<string>('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadCoverImage: async (file: File) => {
    const formData = new FormData();
    formData.append('coverImage', file);
    const response = await api.post<string>('/profile/cover', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteAvatar: async () => {
    await api.delete('/profile/avatar');
  },

  deleteCoverImage: async () => {
    await api.delete('/profile/cover');
  },

  addEducation: async (education: Omit<Profile['education'][0], 'id'>) => {
    const response = await api.post<Profile>('/profile/education', education);
    return response.data;
  },

  updateEducation: async (id: string, education: Partial<Profile['education'][0]>) => {
    const response = await api.put<Profile>(`/profile/education/${id}`, education);
    return response.data;
  },

  deleteEducation: async (id: string) => {
    await api.delete(`/profile/education/${id}`);
  },

  addExperience: async (experience: Omit<Profile['experience'][0], 'id'>) => {
    const response = await api.post<Profile>('/profile/experience', experience);
    return response.data;
  },

  updateExperience: async (id: string, experience: Partial<Profile['experience'][0]>) => {
    const response = await api.put<Profile>(`/profile/experience/${id}`, experience);
    return response.data;
  },

  deleteExperience: async (id: string) => {
    await api.delete(`/profile/experience/${id}`);
  },

  updateSkills: async (skills: string[]) => {
    const response = await api.put<Profile>('/profile/skills', { skills });
    return response.data;
  },

  updateAvailability: async (availability: Profile['availability']) => {
    const response = await api.put<Profile>('/profile/availability', { availability });
    return response.data;
  },

  updateHourlyRate: async (hourlyRate: number) => {
    const response = await api.put<Profile>('/profile/hourly-rate', { hourlyRate });
    return response.data;
  },

  updateSocialLinks: async (socialLinks: Profile['socialLinks']) => {
    const response = await api.put<Profile>('/profile/social-links', { socialLinks });
    return response.data;
  },
}; 