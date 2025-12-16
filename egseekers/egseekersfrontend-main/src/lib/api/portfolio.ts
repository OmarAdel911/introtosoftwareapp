import { api } from './api';

export interface Project {
  id: string;
  title: string;
  description: string;
  images: string[];
  technologies: string[];
  link?: string;
  github?: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Portfolio {
  id: string;
  userId: string;
  bio: string;
  skills: string[];
  experience: string;
  education: string;
  projects: Project[];
  socialLinks: {
    linkedin?: string;
    github?: string;
    website?: string;
  };
}

export const portfolioApi = {
  get: async () => {
    const response = await api.get<Portfolio>('/portfolio');
    return response.data;
  },

  update: async (data: Partial<Portfolio>) => {
    const response = await api.put<Portfolio>('/portfolio', data);
    return response.data;
  },

  addProject: async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<Project>('/portfolio/projects', project);
    return response.data;
  },

  updateProject: async (id: string, project: Partial<Project>) => {
    const response = await api.put<Project>(`/portfolio/projects/${id}`, project);
    return response.data;
  },

  deleteProject: async (id: string) => {
    await api.delete(`/portfolio/projects/${id}`);
  },

  uploadProjectImage: async (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post<string>(`/portfolio/projects/${projectId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteProjectImage: async (projectId: string, imageUrl: string) => {
    await api.delete(`/portfolio/projects/${projectId}/images`, {
      data: { imageUrl },
    });
  },
}; 