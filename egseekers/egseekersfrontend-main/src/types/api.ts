import { User } from './user';

// Generic API Response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

// Paginated Response type
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth Response types
export interface AuthResponse {
  user: User;
  token: string;
}

// Job Response types
export interface JobResponse {
  id: string;
  title: string;
  description: string;
  budget: number;
  skills: string[];
  category: string;
  deadline: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Proposal Response types
export interface ProposalResponse {
  id: string;
  coverLetter: string;
  amount: number;
  estimatedDuration: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  job: {
    id: string;
    title: string;
    budget: number;
  };
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Payment Response types
export interface PaymentResponse {
  id: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  method: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'PAYPAL';
  job: {
    id: string;
    title: string;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Dashboard Response types
export interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalProposals: number;
  acceptedProposals: number;
  pendingProposals: number;
  totalEarnings: number;
  pendingPayments: number;
  completedPayments: number;
}

// Error Response type
export interface ErrorResponse {
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  error: string | ErrorResponse;
  status?: number;
  success: boolean;
} 