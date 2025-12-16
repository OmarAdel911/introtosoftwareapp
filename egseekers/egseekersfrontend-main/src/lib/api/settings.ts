import { api } from './api';

export interface UserSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorEnabled: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  currency: string;
  updatedAt: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'authenticator' | 'sms' | 'email';
  loginNotifications: boolean;
  sessionTimeout: number;
}

export interface NotificationSettings {
  email: {
    jobs: boolean;
    messages: boolean;
    payments: boolean;
    system: boolean;
  };
  push: {
    jobs: boolean;
    messages: boolean;
    payments: boolean;
    system: boolean;
  };
}

export const settingsApi = {
  getUserSettings: async () => {
    const response = await api.get<UserSettings>('/settings');
    return response.data;
  },

  updateUserSettings: async (data: Partial<UserSettings>) => {
    const response = await api.put<UserSettings>('/settings', data);
    return response.data;
  },

  getSecuritySettings: async () => {
    const response = await api.get<SecuritySettings>('/settings/security');
    return response.data;
  },

  updateSecuritySettings: async (data: Partial<SecuritySettings>) => {
    const response = await api.put<SecuritySettings>('/settings/security', data);
    return response.data;
  },

  getNotificationSettings: async () => {
    const response = await api.get<NotificationSettings>('/settings/notifications');
    return response.data;
  },

  updateNotificationSettings: async (data: Partial<NotificationSettings>) => {
    const response = await api.put<NotificationSettings>('/settings/notifications', data);
    return response.data;
  },

  enableTwoFactor: async (method: 'authenticator' | 'sms' | 'email') => {
    const response = await api.post<{ secret?: string; qrCode?: string }>('/settings/2fa/enable', {
      method,
    });
    return response.data;
  },

  disableTwoFactor: async (code: string) => {
    await api.post('/settings/2fa/disable', { code });
  },

  verifyTwoFactor: async (code: string) => {
    const response = await api.post<{ verified: boolean }>('/settings/2fa/verify', { code });
    return response.data;
  },
}; 