"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Download, Calendar } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface ReportData {
  totalUsers: number;
  activeUsers: number;
  totalJobs: number;
  completedJobs: number;
  totalEarnings: number;
  monthlyEarnings: number;
  userGrowth: {
    date: string;
    count: number;
  }[];
  jobStats: {
    status: string;
    count: number;
  }[];
  revenueStats: {
    date: string;
    amount: number;
  }[];
}

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30"); // days
  const [reportType, setReportType] = useState("overview");

  useEffect(() => {
    fetchReportData();
  }, [dateRange, reportType]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<ReportData>(`/admin/reports?days=${dateRange}&type=${reportType}`);
      
      if (response.success && response.data) {
        setReportData(response.data);
        setError(null);
      } else {
        setError(response.error || "Failed to load report data");
        toast.error(response.error || "Failed to load report data");
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
      setError("Failed to load report data");
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await apiClient.get(`/admin/reports/download?days=${dateRange}&type=${reportType}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportType}-${dateRange}days.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Failed to download report");
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

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-4">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            View and analyze system performance metrics
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
            <CardDescription>Select report type and date range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-48">
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="jobs">Jobs</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleDownloadReport} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData?.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {reportData?.activeUsers} active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData?.totalJobs}</div>
              <p className="text-xs text-muted-foreground">
                {reportData?.completedJobs} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(reportData?.totalEarnings || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(reportData?.monthlyEarnings || 0)} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Job Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reportData?.totalJobs ? Math.round((reportData.completedJobs / reportData.totalJobs) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Of total jobs completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Job Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Job Status Distribution</CardTitle>
            <CardDescription>Breakdown of jobs by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData?.jobStats.map((stat) => (
                <div key={stat.status} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{stat.status}</p>
                    <div className="h-2 w-full bg-gray-100 rounded-full">
                      <div
                        className="h-2 bg-blue-600 rounded-full"
                        style={{
                          width: `${(stat.count / (reportData.totalJobs || 1)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-sm font-medium">{stat.count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Daily revenue for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              {/* Add your preferred charting library here */}
              <p className="text-muted-foreground">Revenue chart visualization</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 