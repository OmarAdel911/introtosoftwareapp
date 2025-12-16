import { api } from './api';

export interface DashboardStats {
  totalUsers: number;
  totalJobs: number;
  totalPayments: number;
  activeDisputes: number;
  recentUsers: any[];
  recentJobs: any[];
  recentPayments: any[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface UserFilter {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface JobFilter {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  perPage?: number;
}

export interface PaymentFilter {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  perPage?: number;
}

export interface SystemSettings {
  platformFee: number;
  minJobBudget: number;
  maxJobBudget: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  emailSettings: Record<string, any>;
  notificationSettings: Record<string, any>;
}

export const adminApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await api.get('/admin/dashboard');
    return data;
  },

  async getUsers(filters: UserFilter = {}): Promise<PaginatedResponse<any>> {
    const { data } = await api.get('/admin/users', { params: filters });
    return data;
  },

  async updateUser(userId: string, updates: { role?: string; isActive?: boolean }): Promise<any> {
    const { data } = await api.patch(`/admin/users/${userId}`, updates);
    return data;
  },

  async getJobs(filters: JobFilter = {}): Promise<PaginatedResponse<any>> {
    const { data } = await api.get('/admin/jobs', { params: filters });
    return data;
  },

  async updateJobStatus(jobId: string, status: string): Promise<any> {
    const { data } = await api.patch(`/admin/jobs/${jobId}`, { status });
    return data;
  },

  async getPayments(filters: PaymentFilter = {}): Promise<PaginatedResponse<any>> {
    const { data } = await api.get('/admin/payments', { params: filters });
    return data;
  },

  async getSystemSettings(): Promise<SystemSettings> {
    const { data } = await api.get('/admin/settings');
    return data;
  },

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const { data } = await api.patch('/admin/settings', settings);
    return data;
  },

  async getAnalytics(filters: { startDate?: string; endDate?: string } = {}): Promise<any> {
    const { data } = await api.get('/admin/analytics', { params: filters });
    return data;
  },

  async exportData(type: 'users' | 'jobs' | 'payments', filters: Record<string, any> = {}): Promise<Blob> {
    const { data } = await api.get(`/admin/export/${type}`, {
      params: filters,
      responseType: 'blob'
    });
    return data;
  }
}; 