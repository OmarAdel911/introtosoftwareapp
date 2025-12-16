'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Clock, CheckCircle, XCircle, User, Calendar } from "lucide-react"
import { config } from '@/config/env';

interface Proposal {
  id: string
  coverLetter: string
  amount: number
  status: "PENDING" | "ACCEPTED" | "REJECTED"
  createdAt: string
  job: {
    id: string
    title: string
    budget: number
    status: string
    client: {
      id: string
      name: string
      avatar: string | null
    }
  }
  notification?: {
    type: string
    message: string
    jobId: string
    proposalId: string
  }
}

const ProposalsPage = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchProposals();
    fetchUnreadNotifications();
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${config.apiUrl}/notifications/unread/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUnreadNotifications(response.data.count);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  };

  const fetchProposals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // First, get the user's profile to get their ID and role
      const userResponse = await axios.get(`${config.apiUrl}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { id: userId, role: userRole } = userResponse.data;

      // Check if user is a freelancer
      if (userRole !== 'FREELANCER') {
        toast.error('Only freelancers can view proposals');
        router.push('/dashboard');
        return;
      }

      // Use the correct endpoint with the user ID
      const response = await axios.get(`${config.apiUrl}/proposals/freelancer/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProposals(response.data);

      // Check for any rejected proposals and show notifications
      response.data.forEach((proposal: Proposal) => {
        if (proposal.status === 'REJECTED' && proposal.notification) {
          toast.error(proposal.notification.message, {
            duration: 5000,
            position: 'top-right',
            style: {
              background: '#FEE2E2',
              color: '#991B1B',
              border: '1px solid #FCA5A5',
            },
          });
        }
      });
    } catch (error: any) {
      console.error('Error fetching proposals:', error);
      if (error.response?.status === 403) {
        toast.error('You are not authorized to view proposals');
        router.push('/dashboard');
      } else if (error.response?.status === 401) {
        toast.error('Please log in to view proposals');
        router.push('/login');
      } else {
        toast.error('Failed to load proposals');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Proposal["status"]) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />
      case "ACCEPTED":
        return <CheckCircle className="h-4 w-4" />
      case "REJECTED":
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Proposals</h1>
        </div>

        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Proposals</h1>
        <div className="flex items-center gap-4">
          <Link href="/notifications" className="relative">
            <Button variant="outline">
              Notifications
              {unreadNotifications > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No proposals yet</p>
          <Link href="/jobs">
            <Button className="mt-4">Browse Jobs</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{proposal.job.title}</CardTitle>
                  <div className="flex flex-col gap-2">
                    <Badge className={getStatusColor(proposal.status)}>
                      {proposal.status}
                    </Badge>
                    <Badge className={getJobStatusColor(proposal.job.status)}>
                      Job: {proposal.job.status}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">{proposal.coverLetter}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span>Your Bid: ${proposal.amount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>Client: {proposal.job.client.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Submitted: {format(new Date(proposal.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Link href={`/jobs/${proposal.job.id}`} className="w-full">
                  <Button variant="outline" className="w-full">View Job Details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProposalsPage; 