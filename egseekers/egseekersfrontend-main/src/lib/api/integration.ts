import { api } from './api';

export interface Integration {
  id: string;
  provider: string;
  name: string;
  description: string;
  isEnabled: boolean;
  config: Record<string, any>;
  status: 'connected' | 'disconnected' | 'error';
  lastSyncAt?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationConfig {
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  webhookUrl?: string;
  settings?: Record<string, any>;
}

export interface SyncResult {
  status: 'success' | 'partial' | 'error';
  itemsProcessed: number;
  itemsFailed: number;
  error?: string;
  details?: Record<string, any>;
}

export const integrationApi = {
  async getIntegrations(): Promise<Integration[]> {
    const { data } = await api.get('/integrations');
    return data;
  },

  async getIntegration(integrationId: string): Promise<Integration> {
    const { data } = await api.get(`/integrations/${integrationId}`);
    return data;
  },

  async enableIntegration(
    provider: string,
    config: IntegrationConfig
  ): Promise<Integration> {
    const { data } = await api.post('/integrations', { provider, config });
    return data;
  },

  async updateIntegration(
    integrationId: string,
    config: Partial<IntegrationConfig>
  ): Promise<Integration> {
    const { data } = await api.patch(`/integrations/${integrationId}`, { config });
    return data;
  },

  async disableIntegration(integrationId: string): Promise<void> {
    await api.delete(`/integrations/${integrationId}`);
  },

  async syncIntegration(integrationId: string): Promise<SyncResult> {
    const { data } = await api.post(`/integrations/${integrationId}/sync`);
    return data;
  },

  async getIntegrationLogs(
    integrationId: string,
    page = 1,
    perPage = 20
  ): Promise<{ items: any[]; total: number }> {
    const { data } = await api.get(`/integrations/${integrationId}/logs`, {
      params: { page, perPage }
    });
    return data;
  },

  async testIntegration(integrationId: string): Promise<{
    status: 'success' | 'error';
    message: string;
  }> {
    const { data } = await api.post(`/integrations/${integrationId}/test`);
    return data;
  },

  async getAvailableIntegrations(): Promise<{
    id: string;
    name: string;
    description: string;
    features: string[];
    requiredConfig: string[];
  }[]> {
    const { data } = await api.get('/integrations/available');
    return data;
  },

  async getOAuthUrl(provider: string): Promise<{ url: string }> {
    const { data } = await api.get(`/integrations/oauth/${provider}`);
    return data;
  },

  async handleOAuthCallback(
    provider: string,
    code: string
  ): Promise<Integration> {
    const { data } = await api.post(`/integrations/oauth/${provider}/callback`, { code });
    return data;
  }
}; 