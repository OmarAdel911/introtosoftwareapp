'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import MyJobs from '@/components/jobs/MyJobs';
import { config } from '@/config/env';

export default function MyJobsPage() {
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await axios.get(`${config.apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.role !== 'FREELANCER') {
          toast.error('Only freelancers can access this page');
          router.push('/dashboard');
          return;
        }

        setIsFreelancer(true);
      } catch (error) {
        console.error('Error checking user role:', error);
        toast.error('Failed to verify your role');
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [router]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!isFreelancer) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto py-8">
      <MyJobs />
    </div>
  );
} 