export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'FREELANCER' | 'CLIENT' | 'ADMIN';
  skills?: string[];
  hourlyRate?: number;
  location?: string;
  bio?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends Omit<User, 'email' | 'role'> {
  email: string;
  role: 'FREELANCER' | 'CLIENT' | 'ADMIN';
  completedJobs: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
} 