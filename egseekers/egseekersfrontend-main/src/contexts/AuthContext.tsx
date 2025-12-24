'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { config } from '@/config/env';
import { api } from '@/lib/api/api';


export interface User {
  id: string;
  email: string;
  name: string;
  role: 'FREELANCER' | 'CLIENT' | 'ADMIN';
  image: string | null;
  bio: string | null;
  skills: string[] | null;
  hourlyRate: number | null;
  title: string | null;
  location: string | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setUser(null);
    
    // Reload the page to update navbar and all components
    window.location.reload();
    
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return;
      }

      // Use the configured api instance which has proper error handling
      const response = await api.get<User>('/auth/me');
      
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error: any) {
      console.error('Failed to refresh user:', error);
      if (error.response) {
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
        });
        
        if (error.response?.status === 401) {
          logout();
        }
      } else if (error.message === 'Network Error' || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
        console.warn('Network error - backend may be unavailable at:', config.apiUrl);
        console.warn('Please ensure:');
        console.warn('1. Backend is running on port 5001');
        console.warn('2. Backend is accessible at:', config.apiUrl);
        console.warn('3. CORS is properly configured');
        // Don't logout on network errors, just use cached data
        // The api instance already has retry logic
      }
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        // If we have stored user data, use it immediately for faster UI updates
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            
            // If user is on login/signup page and is authenticated, redirect to dashboard
            if (typeof window !== 'undefined') {
              const currentPath = window.location.pathname;
              if (currentPath === '/login' || currentPath === '/signup') {
                if (userData.role === 'FREELANCER') {
                  router.push('/freelancer/dashboard');
                } else if (userData.role === 'CLIENT') {
                  router.push('/job-poster/dashboard');
                }
              }
            }
          } catch (error) {
            console.error('Error parsing stored user data:', error);
          }
        }

        // Then refresh from server to ensure data is current
        await refreshUser();
      } catch (error) {
        console.error('Auth initialization error:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen for storage changes (e.g., login from another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        if (e.newValue) {
          refreshUser();
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}