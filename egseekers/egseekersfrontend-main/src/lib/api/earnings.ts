import { api } from './api';

export interface Transaction {
  id: string;
  amount: number;
  type: 'payment' | 'refund' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
}

export interface EarningsSummary {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingPayments: number;
  availableForWithdrawal: number;
  growthRate: number;
}

export interface EarningsFilter {
  startDate?: string;
  endDate?: string;
  type?: Transaction['type'];
  status?: Transaction['status'];
}

export const earningsApi = {
  getSummary: async () => {
    const response = await api.get<EarningsSummary>('/earnings/summary');
    return response.data;
  },

  getTransactions: async (filters?: EarningsFilter) => {
    const response = await api.get<Transaction[]>('/earnings/transactions', {
      params: filters,
    });
    return response.data;
  },

  getTransactionById: async (id: string) => {
    const response = await api.get<Transaction>(`/earnings/transactions/${id}`);
    return response.data;
  },

  requestWithdrawal: async (amount: number) => {
    const response = await api.post<Transaction>('/earnings/withdraw', { amount });
    return response.data;
  },

  downloadReport: async (filters?: EarningsFilter) => {
    const response = await api.get('/earnings/report', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
}; 