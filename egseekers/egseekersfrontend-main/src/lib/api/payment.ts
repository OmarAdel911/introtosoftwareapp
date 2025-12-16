import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface Payment {
  id: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'REFUNDED';
  type: 'ESCROW' | 'RELEASE' | 'REFUND';
  createdAt: string;
  updatedAt: string;
  proposalId: string;
  userId: string;
  proposal?: {
    job: {
      title: string;
      budget: number;
    };
  };
}

// Get payment history
export async function getPaymentHistory(): Promise<Payment[]> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');

    const response = await axios.get(`${API_BASE_URL}/payments/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch payment history:', error);
    throw error;
  }
}

// Create escrow payment
export async function createEscrowPayment(proposalId: string, amount: number): Promise<Payment> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');

    const response = await axios.post(
      `${API_BASE_URL}/payments/escrow`,
      { proposalId, amount },
      { headers: { Authorization: `Bearer ${token}` }}
    );
    return response.data;
  } catch (error) {
    console.error('Failed to create escrow payment:', error);
    throw error;
  }
}

// Release payment
export async function releasePayment(paymentId: string): Promise<Payment> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');

    const response = await axios.post(
      `${API_BASE_URL}/payments/release/${paymentId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` }}
    );
    return response.data;
  } catch (error) {
    console.error('Failed to release payment:', error);
    throw error;
  }
}

// Request refund
export async function requestRefund(paymentId: string, reason: string): Promise<Payment> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');

    const response = await axios.post(
      `${API_BASE_URL}/payments/refund/${paymentId}`,
      { reason },
      { headers: { Authorization: `Bearer ${token}` }}
    );
    return response.data;
  } catch (error) {
    console.error('Failed to request refund:', error);
    throw error;
  }
} 