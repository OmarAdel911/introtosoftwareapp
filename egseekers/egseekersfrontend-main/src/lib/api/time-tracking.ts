import { api } from './api';

export interface TimeEntry {
  id: string;
  jobId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  description: string;
  status: 'running' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntrySummary {
  totalHours: number;
  todayHours: number;
  weekHours: number;
  monthHours: number;
  activeEntries: TimeEntry[];
}

export const timeTrackingApi = {
  start: async (jobId: string, description: string) => {
    const response = await api.post<TimeEntry>('/time-entries/start', {
      jobId,
      description,
    });
    return response.data;
  },

  stop: async (entryId: string) => {
    const response = await api.post<TimeEntry>(`/time-entries/${entryId}/stop`);
    return response.data;
  },

  pause: async (entryId: string) => {
    const response = await api.post<TimeEntry>(`/time-entries/${entryId}/pause`);
    return response.data;
  },

  resume: async (entryId: string) => {
    const response = await api.post<TimeEntry>(`/time-entries/${entryId}/resume`);
    return response.data;
  },

  update: async (entryId: string, data: Partial<TimeEntry>) => {
    const response = await api.put<TimeEntry>(`/time-entries/${entryId}`, data);
    return response.data;
  },

  delete: async (entryId: string) => {
    await api.delete(`/time-entries/${entryId}`);
  },

  getActive: async () => {
    const response = await api.get<TimeEntry[]>('/time-entries/active');
    return response.data;
  },

  getByJob: async (jobId: string) => {
    const response = await api.get<TimeEntry[]>(`/time-entries/job/${jobId}`);
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get<TimeEntrySummary>('/time-entries/summary');
    return response.data;
  },

  getReport: async (startDate: string, endDate: string) => {
    const response = await api.get<TimeEntry[]>('/time-entries/report', {
      params: { startDate, endDate },
    });
    return response.data;
  },
}; 