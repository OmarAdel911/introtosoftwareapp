"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Users, Briefcase, FileText, CreditCard, TrendingUp, DollarSign, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/env";

interface AnalyticsOverview {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalJobs: number;
    activeJobs: number;
    totalPayments: number;
    totalEarnings: number;
    totalDisputes: number;
    totalContracts: number;
  };
  recent: {
    users: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      createdAt: string;
    }>;
    jobs: Array<{
      id: string;
      title: string;
      status: string;
      budget: number;
      createdAt: string;
      client: {
        name: string;
      };
    }>;
    payments: Array<{
      id: string;
      amount: number;
      status: string;
      createdAt: string;
    }>;
  };
}

interface UserAnalytics {
  growth: Array<{
    role: string;
    _count: number;
  }>;
  active: Array<{
    role: string;
    _count: number;
  }>;
}

interface RevenueAnalytics {
  total: Array<{
    status: string;
    _sum: {
      amount: number;
    };
  }>;
  monthly: Array<{
    createdAt: string;
    _sum: {
      amount: number;
    };
  }>;
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, userRes, revenueRes] = await Promise.all([
        apiClient.get<AnalyticsOverview>('/admin/analytics'),
        apiClient.get<UserAnalytics>('/admin/analytics/users'),
        apiClient.get<RevenueAnalytics>('/admin/analytics/revenue')
      ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
      }

      if (userRes.success && userRes.data) {
        setUserAnalytics(userRes.data);
      }

      if (revenueRes.success && revenueRes.data) {
        setRevenueAnalytics(revenueRes.data);
      }

      setError(null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  const totalRevenue = revenueAnalytics?.total.reduce((sum, r) => sum + (r._sum.amount || 0), 0) || 0;
  const completedRevenue = revenueAnalytics?.total.find(r => r.status === 'COMPLETED')?._sum.amount || 0;

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-4">Analytics</h1>
          <p className="text-muted-foreground">
            Platform performance and statistics
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.overview.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {overview.overview.activeUsers} active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.overview.totalJobs}</div>
              <p className="text-xs text-muted-foreground">
                {overview.overview.activeJobs} currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.overview.totalContracts}</div>
              <p className="text-xs text-muted-foreground">
                {overview.recent.jobs.length} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(overview.overview.totalEarnings)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(completedRevenue)} completed payments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>Latest user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overview.recent.users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Jobs</CardTitle>
              <CardDescription>Latest job postings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overview.recent.jobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">by {job.client.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(job.budget)}</p>
                      <Badge variant="outline">{job.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overview.recent.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                      <Badge variant="outline">{payment.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Growth */}
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>User registration trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userAnalytics?.growth.map((growth) => (
                  <div key={growth.role} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{growth.role}</p>
                      <p className="text-sm text-muted-foreground">New registrations</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <p className="font-medium">{growth._count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 