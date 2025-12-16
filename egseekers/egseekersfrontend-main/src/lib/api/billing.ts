import { api } from './api';

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  isPopular?: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  expiryDate?: string;
  isDefault: boolean;
}

export interface BillingHistory {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  description: string;
}

export interface UpdatePlanData {
  planId: string;
  paymentMethodId: string;
}

export const billingApi = {
  getPlans: async () => {
    const response = await api.get<Plan[]>('/billing/plans');
    return response.data;
  },

  getCurrentPlan: async () => {
    const response = await api.get<Plan>('/billing/current-plan');
    return response.data;
  },

  getPaymentMethods: async () => {
    const response = await api.get<PaymentMethod[]>('/billing/payment-methods');
    return response.data;
  },

  addPaymentMethod: async (paymentMethod: Partial<PaymentMethod>) => {
    const response = await api.post<PaymentMethod>('/billing/payment-methods', paymentMethod);
    return response.data;
  },

  removePaymentMethod: async (id: string) => {
    await api.delete(`/billing/payment-methods/${id}`);
  },

  setDefaultPaymentMethod: async (id: string) => {
    const response = await api.put<PaymentMethod>(`/billing/payment-methods/${id}/default`);
    return response.data;
  },

  getBillingHistory: async () => {
    const response = await api.get<BillingHistory[]>('/billing/history');
    return response.data;
  },

  updatePlan: async (data: UpdatePlanData) => {
    const response = await api.put<Plan>('/billing/plan', data);
    return response.data;
  },

  cancelSubscription: async () => {
    await api.post('/billing/cancel');
  },
}; 