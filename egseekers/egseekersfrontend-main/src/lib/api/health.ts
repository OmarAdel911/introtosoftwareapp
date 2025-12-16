import { api } from './api';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      latency: number;
      lastCheck: string;
      message?: string;
    };
  };
  metrics: {
    cpu: {
      usage: number;
      load: number[];
    };
    memory: {
      total: number;
      used: number;
      free: number;
    };
    disk: {
      total: number;
      used: number;
      free: number;
    };
  };
}

export interface ServiceMetrics {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: {
    requestRate: number;
    errorRate: number;
    latency: {
      p50: number;
      p90: number;
      p99: number;
    };
    activeConnections: number;
  };
  timeSeriesData: {
    timestamp: string;
    requestRate: number;
    errorRate: number;
    latency: number;
  }[];
}

export const healthApi = {
  async getStatus(): Promise<HealthStatus> {
    const { data } = await api.get('/health');
    return data;
  },

  async getServiceMetrics(
    service: string,
    duration: '1h' | '24h' | '7d' = '24h'
  ): Promise<ServiceMetrics> {
    const { data } = await api.get(`/health/services/${service}`, {
      params: { duration }
    });
    return data;
  },

  async getAllServiceMetrics(
    duration: '1h' | '24h' | '7d' = '24h'
  ): Promise<ServiceMetrics[]> {
    const { data } = await api.get('/health/services', {
      params: { duration }
    });
    return data;
  },

  async runHealthCheck(): Promise<{
    status: 'success' | 'failure';
    results: {
      service: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      details: Record<string, any>;
    }[];
  }> {
    const { data } = await api.post('/health/check');
    return data;
  },

  async getAlerts(
    status?: 'active' | 'resolved',
    page = 1,
    perPage = 20
  ): Promise<{
    items: {
      id: string;
      service: string;
      severity: 'critical' | 'warning' | 'info';
      message: string;
      status: 'active' | 'resolved';
      createdAt: string;
      resolvedAt?: string;
    }[];
    total: number;
  }> {
    const { data } = await api.get('/health/alerts', {
      params: { status, page, perPage }
    });
    return data;
  },

  async acknowledgeAlert(alertId: string): Promise<void> {
    await api.post(`/health/alerts/${alertId}/acknowledge`);
  },

  async getMaintenanceWindows(): Promise<{
    id: string;
    service: string;
    startTime: string;
    endTime: string;
    description: string;
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  }[]> {
    const { data } = await api.get('/health/maintenance');
    return data;
  },

  async scheduleMaintenanceWindow(data: {
    service: string;
    startTime: string;
    endTime: string;
    description: string;
  }): Promise<void> {
    await api.post('/health/maintenance', data);
  }
}; 