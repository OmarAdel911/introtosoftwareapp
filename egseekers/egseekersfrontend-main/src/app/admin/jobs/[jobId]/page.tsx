"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, Edit, Trash, CheckCircle, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  postedAt: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    proposals: number;
    reviews: number;
  };
}

export default function AdminJobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Job>(`/api/admin/jobs/${jobId}`);
      
      if (response.success && response.data) {
        setJob(response.data as Job);
        setError(null);
      } else {
        setError(response.error || "Failed to load job details");
        toast.error(response.error || "Failed to load job details");
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      setError("Failed to load job details");
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!job) return;
    
    try {
      setIsUpdating(true);
      const response = await apiClient.patch(`/api/admin/jobs/${jobId}`, {
        status: newStatus,
      });

      if (response.success && response.data) {
        setJob(response.data as Job);
        toast.success("Job status updated successfully");
      } else {
        throw new Error(response.error || "Failed to update job status");
      }
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error("Failed to update job status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!job) return;
    
    try {
      setIsUpdating(true);
      const response = await apiClient.delete(`/api/admin/jobs/${jobId}`);

      if (response.success) {
        toast.success("Job deleted successfully");
        router.push("/admin/jobs");
      } else {
        throw new Error(response.error || "Failed to delete job");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job");
    } finally {
      setIsUpdating(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; bg: string }> = {
      OPEN: { color: "text-green-700", bg: "bg-green-50" },
      IN_PROGRESS: { color: "text-blue-700", bg: "bg-blue-50" },
      COMPLETED: { color: "text-gray-700", bg: "bg-gray-50" },
      CANCELLED: { color: "text-red-700", bg: "bg-red-50" },
      UNDER_REVIEW: { color: "text-purple-700", bg: "bg-purple-50" },
    };

    const config = statusConfig[status] || { color: "text-gray-700", bg: "bg-gray-50" };

    return (
      <Badge variant="outline" className={`${config.color} ${config.bg}`}>
        {status}
      </Badge>
    );
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

  if (!job) {
    return (
      <div className="container py-8">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Job Not Found
            </CardTitle>
            <CardDescription className="text-yellow-600">
              The job you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/admin/jobs")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push("/admin/jobs")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Button>
            <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
            <p className="text-muted-foreground">
              Manage job details and status
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(job.status)}
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Description</h3>
                  <p className="mt-1">{job.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Budget</h3>
                    <p className="mt-1">{formatCurrency(job.budget)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Posted Date</h3>
                    <p className="mt-1">{new Date(job.postedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Proposals</h3>
                    <p className="mt-1">{job._count.proposals}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Reviews</h3>
                    <p className="mt-1">{job._count.reviews}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Name</h3>
                  <p className="mt-1">{job.client.name}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Email</h3>
                  <p className="mt-1">{job.client.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Manage this job</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Change Status</h3>
                <Select
                  value={job.status}
                  onValueChange={handleStatusChange}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 items-end">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isUpdating}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Job
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this job? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteJob}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 