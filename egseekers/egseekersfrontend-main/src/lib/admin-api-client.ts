import { apiClient } from './api-client';

// Types
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalJobs: number;
  activeJobs: number;
  totalEarnings: number;
  monthlyEarnings: number;
  totalPayments: number;
  pendingPayments: number;
  totalContracts: number;
  activeContracts: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "FREELANCER" | "CLIENT" | "ADMIN";
  createdAt: string;
  lastActive: string;
}

export interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  userName: string;
  status: string;
  changes: any;
  createdAt: Date;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
}

// Admin API Client
export const adminApiClient = {
  // Authentication
  login: async (email: string, password: string) => {
    return apiClient.post<LoginResponse>('/auth/admin/login', { email, password });
  },

  // Dashboard
  getAnalytics: async () => {
    return apiClient.get<AdminStats>('/api/admin/analytics');
  },

  // User Management
  getUsers: async () => {
    return apiClient.get<User[]>('/api/admin/users');
  },

  updateUserRole: async (userId: string, role: string) => {
    return apiClient.patch(`/api/admin/users/${userId}/role`, { role });
  },

  deleteUser: async (userId: string) => {
    return apiClient.delete(`/api/admin/users/${userId}`);
  },

  // Audit Logs
  getAuditLogs: async (params?: {
    search?: string;
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    return apiClient.get<AuditLog[]>('/api/admin/audit-logs', { params });
  },
}; 