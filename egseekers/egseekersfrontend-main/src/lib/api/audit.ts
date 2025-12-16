import { api } from './api';

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userEmail: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface AuditFilter {
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  perPage?: number;
}

export interface AuditSummary {
  totalEvents: number;
  actionCounts: Record<string, number>;
  entityTypeCounts: Record<string, number>;
  userActivityCounts: Record<string, number>;
  timeSeriesData: {
    date: string;
    count: number;
  }[];
}

export const auditApi = {
  async getLogs(filters: AuditFilter = {}): Promise<{
    items: AuditLog[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const { data } = await api.get('/audit/logs', { params: filters });
    return data;
  },

  async getLog(logId: string): Promise<AuditLog> {
    const { data } = await api.get(`/audit/logs/${logId}`);
    return data;
  },

  async getEntityHistory(
    entityType: string,
    entityId: string
  ): Promise<AuditLog[]> {
    const { data } = await api.get(`/audit/history/${entityType}/${entityId}`);
    return data;
  },

  async getUserActivity(
    userId: string,
    filters: Omit<AuditFilter, 'userId'> = {}
  ): Promise<AuditLog[]> {
    const { data } = await api.get(`/audit/user-activity/${userId}`, {
      params: filters
    });
    return data;
  },

  async getSummary(filters: Omit<AuditFilter, 'page' | 'perPage'> = {}): Promise<AuditSummary> {
    const { data } = await api.get('/audit/summary', { params: filters });
    return data;
  },

  async getActions(): Promise<string[]> {
    const { data } = await api.get('/audit/actions');
    return data;
  },

  async getEntityTypes(): Promise<string[]> {
    const { data } = await api.get('/audit/entity-types');
    return data;
  },

  async exportLogs(
    filters: AuditFilter = {},
    format: 'csv' | 'json' = 'csv'
  ): Promise<Blob> {
    const { data } = await api.get('/audit/export', {
      params: { ...filters, format },
      responseType: 'blob'
    });
    return data;
  },

  async getFieldChanges(
    entityType: string,
    field: string,
    filters: Omit<AuditFilter, 'entityType'> = {}
  ): Promise<{
    field: string;
    changes: {
      timestamp: string;
      oldValue: any;
      newValue: any;
      userId: string;
    }[];
  }> {
    const { data } = await api.get(`/audit/field-changes/${entityType}/${field}`, {
      params: filters
    });
    return data;
  },

  async getRelatedLogs(logId: string): Promise<AuditLog[]> {
    const { data } = await api.get(`/audit/logs/${logId}/related`);
    return data;
  }
}; 