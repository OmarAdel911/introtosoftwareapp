import { api } from './api';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  requestPayload: Record<string, any>;
  responseStatus: number;
  responseBody?: string;
  error?: string;
  timestamp: string;
}

export interface CreateWebhookData {
  name: string;
  url: string;
  events: string[];
  isActive?: boolean;
}

export interface UpdateWebhookData {
  name?: string;
  url?: string;
  events?: string[];
  isActive?: boolean;
}

export const webhookApi = {
  async createWebhook(data: CreateWebhookData): Promise<Webhook> {
    const { data: response } = await api.post('/webhooks', data);
    return response;
  },

  async getWebhooks(): Promise<Webhook[]> {
    const { data } = await api.get('/webhooks');
    return data;
  },

  async getWebhook(webhookId: string): Promise<Webhook> {
    const { data } = await api.get(`/webhooks/${webhookId}`);
    return data;
  },

  async updateWebhook(webhookId: string, data: UpdateWebhookData): Promise<Webhook> {
    const { data: response } = await api.patch(`/webhooks/${webhookId}`, data);
    return response;
  },

  async deleteWebhook(webhookId: string): Promise<void> {
    await api.delete(`/webhooks/${webhookId}`);
  },

  async getWebhookLogs(webhookId: string): Promise<WebhookLog[]> {
    const { data } = await api.get(`/webhooks/${webhookId}/logs`);
    return data;
  },

  async getAvailableEvents(): Promise<string[]> {
    const { data } = await api.get('/webhooks/events');
    return data;
  },

  async regenerateSecret(webhookId: string): Promise<{ secret: string }> {
    const { data } = await api.post(`/webhooks/${webhookId}/regenerate-secret`);
    return data;
  },

  async testWebhook(webhookId: string): Promise<WebhookLog> {
    const { data } = await api.post(`/webhooks/${webhookId}/test`);
    return data;
  }
}; 