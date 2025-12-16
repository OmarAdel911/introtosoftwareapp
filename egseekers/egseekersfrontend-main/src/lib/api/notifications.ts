import { api } from './api';

export interface Notification {
  id: string;
  type: 'job' | 'message' | 'payment' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  types: {
    job: boolean;
    message: boolean;
    payment: boolean;
    system: boolean;
  };
}

export const notificationsApi = {
  getAll: async () => {
    const response = await api.get<Notification[]>('/notifications');
    return response.data;
  },

  getUnread: async () => {
    const response = await api.get<Notification[]>('/notifications/unread');
    return response.data;
  },

  markAsRead: async (id: string) => {
    await api.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    await api.put('/notifications/read-all');
  },

  getPreferences: async () => {
    const response = await api.get<NotificationPreferences>('/notifications/preferences');
    return response.data;
  },

  updatePreferences: async (preferences: Partial<NotificationPreferences>) => {
    const response = await api.put<NotificationPreferences>('/notifications/preferences', preferences);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/notifications/${id}`);
  },
}; 