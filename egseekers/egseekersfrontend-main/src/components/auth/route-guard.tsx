"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingPage } from '@/components/ui/loading';
import axios from 'axios';
import { config } from '@/config/env';

interface User {
  id: string;
  email: string;
  role: 'FREELANCER' | 'CLIENT' | 'ADMIN';
  firstName: string;
  lastName: string;
}

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: ('FREELANCER' | 'CLIENT' | 'ADMIN')[];
  requireAuth?: boolean;
}

export function RouteGuard({
  children,
  allowedRoles,
  requireAuth = true,
}: RouteGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          if (requireAuth) {
            router.push('/login');
          }
          setLoading(false);
          return;
        }

        const response = await axios.get<User>(
          `${config.apiUrl}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setUser(response.data);

        if (allowedRoles && !allowedRoles.includes(response.data.role)) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem('token');
          if (requireAuth) {
            router.push('/login');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, requireAuth, allowedRoles]);

  if (loading) {
    return <LoadingPage />;
  }

  if (requireAuth && !user) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
} 