import axios from "axios"
import { config } from '@/config/env';

// Create axios instance
const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface DashboardStats {
  totalJobs: number
  activeJobs: number
  completedJobs: number
  totalApplications: number
  acceptedApplications: number
  pendingApplications: number
  totalEarnings: number
  pendingPayments: number
  completedPayments: number
}

export interface Job {
  id: string
  title: string
  description: string
  status: string
  budget: number
  createdAt: string
  client: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface Application {
  id: string
  jobId: string
  jobTitle: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
  budget?: number
  client: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface Payment {
  id: string
  amount: number
  status: string
  type: string
  createdAt: string
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await api.get<DashboardStats>('/dashboard/stats')
    return response.data
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    throw error
  }
}

export async function getRecentJobs(): Promise<Job[]> {
  try {
    const response = await api.get<Job[]>('/dashboard/jobs/recent')
    return response.data
  } catch (error) {
    console.error("Error fetching recent jobs:", error)
    throw error
  }
}

export async function getRecentApplications(): Promise<Application[]> {
  try {
    const response = await api.get<Application[]>('/dashboard/applications/recent')
    return response.data
  } catch (error) {
    console.error("Error fetching recent applications:", error)
    throw error
  }
}

export async function getRecentPayments(): Promise<Payment[]> {
  try {
    const response = await api.get<Payment[]>('/dashboard/payments/recent')
    return response.data
  } catch (error) {
    console.error("Error fetching recent payments:", error)
    throw error
  }
} 