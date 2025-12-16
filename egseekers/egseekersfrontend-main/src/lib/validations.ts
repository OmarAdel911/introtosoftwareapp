import * as z from 'zod';

// User validation schemas
export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['FREELANCER', 'CLIENT']),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Job validation schemas
export const jobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  budget: z.number().min(1, 'Budget must be greater than 0'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  category: z.string().min(1, 'Category is required'),
  deadline: z.date().min(new Date(), 'Deadline must be in the future'),
});

// Proposal validation schemas
export const proposalSchema = z.object({
  coverLetter: z.string().min(50, 'Cover letter must be at least 50 characters'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  estimatedDuration: z.number().min(1, 'Estimated duration is required'),
});

// Profile validation schemas
export const profileSchema = z.object({
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  skills: z.array(z.string()).optional(),
  hourlyRate: z.number().min(0).optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
});

// Types
export type UserFormData = z.infer<typeof userSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type JobFormData = z.infer<typeof jobSchema>;
export type ProposalFormData = z.infer<typeof proposalSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>; 