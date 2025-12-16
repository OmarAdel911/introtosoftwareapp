'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle, XCircle, AlertCircle, DollarSign, Calendar } from "lucide-react";
import { config } from '@/config/env';

interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  postedAt: string;
  deadline?: string;
  client: {
    id: string;
    name: string;
    avatar?: string;
  };
  proposal?: {
    id: string;
    amount: number;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  };
}

const MyJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const router = useRouter();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // First get the user's ID
      const userResponse = await axios.get(`${config.apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const userId = userResponse.data.id;

      // Then fetch the jobs using the user's ID
      const response = await axios.get(`${config.apiUrl}/jobs/freelancer/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setJobs(response.data);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in to view your jobs');
        router.push('/login');
      } else {
        toast.error('Failed to load jobs');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Clock className="h-4 w-4" />;
      case 'IN_PROGRESS':
        return <AlertCircle className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getProposalStatusColor = (status: string) => {
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

  const filteredJobs = jobs.filter(job => {
    switch (activeTab) {
      case 'active':
        return job.status === 'OPEN' || job.status === 'IN_PROGRESS';
      case 'completed':
        return job.status === 'COMPLETED';
      case 'cancelled':
        return job.status === 'CANCELLED';
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Jobs</h1>
        <Link href="/jobs">
          <Button>Find More Jobs</Button>
        </Link>
      </div>

      <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No active jobs</p>
              <Link href="/jobs">
                <Button className="mt-4">Browse Available Jobs</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <Badge className={`${getStatusColor(job.status)} flex items-center gap-1`}>
                        {getStatusIcon(job.status)}
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{job.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span>Budget: ${job.budget}</span>
                      </div>
                      {job.deadline && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>Deadline: {format(new Date(job.deadline), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      {job.proposal && (
                        <div className="flex items-center gap-2">
                          <Badge className={getProposalStatusColor(job.proposal.status)}>
                            Your Bid: ${job.proposal.amount}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Link href={`/jobs/${job.id}`} className="w-full">
                      <Button variant="outline" className="w-full">View Details</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No completed jobs</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <Badge className={`${getStatusColor(job.status)} flex items-center gap-1`}>
                        {getStatusIcon(job.status)}
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{job.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span>Budget: ${job.budget}</span>
                      </div>
                      {job.proposal && (
                        <div className="flex items-center gap-2">
                          <Badge className={getProposalStatusColor(job.proposal.status)}>
                            Your Bid: ${job.proposal.amount}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Link href={`/jobs/${job.id}`} className="w-full">
                      <Button variant="outline" className="w-full">View Details</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="cancelled" className="mt-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No cancelled jobs</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <Badge className={`${getStatusColor(job.status)} flex items-center gap-1`}>
                        {getStatusIcon(job.status)}
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{job.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span>Budget: ${job.budget}</span>
                      </div>
                      {job.proposal && (
                        <div className="flex items-center gap-2">
                          <Badge className={getProposalStatusColor(job.proposal.status)}>
                            Your Bid: ${job.proposal.amount}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Link href={`/jobs/${job.id}`} className="w-full">
                      <Button variant="outline" className="w-full">View Details</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyJobs; 