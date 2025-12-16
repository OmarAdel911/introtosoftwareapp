"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Search, Filter, MoreVertical, Edit, Trash, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";

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

interface JobsResponse {
  jobs: Job[];
  pagination: {
    total: number;
    pages: number;
    current: number;
  };
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [currentPage, searchQuery, statusFilter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<JobsResponse>('/admin/jobs', {
        params: {
          page: currentPage,
          limit: 10,
          status: statusFilter || undefined,
          search: searchQuery || undefined,
        },
      });

      if (response.success && response.data) {
        setJobs(response.data.jobs);
        setTotalPages(response.data.pagination.pages);
        setError(null);
      } else {
        setError(response.error || "Failed to fetch jobs");
        toast.error(response.error || "Failed to fetch jobs");
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError("Failed to fetch jobs");
      toast.error("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const response = await apiClient.patch(`/admin/jobs/${jobId}`, {
        status: newStatus,
      });

      if (response.success && response.data) {
        setJobs((prevJobs) =>
          prevJobs.map((job) =>
            job.id === jobId ? { ...job, status: newStatus } : job
          )
        );
        toast.success("Job status updated successfully");
      } else {
        throw new Error(response.error || "Failed to update job status");
      }
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error("Failed to update job status");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const response = await apiClient.delete(`/admin/jobs/${jobId}`);

      if (response.success) {
        setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
        setIsDeleteDialogOpen(false);
        toast.success("Job deleted successfully");
      } else {
        throw new Error(response.error || "Failed to delete job");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job");
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

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-4">Jobs Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor all jobs in the platform
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Jobs List */}
        <div className="grid gap-6">
          {jobs.map((job) => (
            <Card key={job.id} className="border border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {job.title}
                    </CardTitle>
                    <CardDescription className="text-gray-500 mt-1">
                      Posted by {job.client.name} • Budget: {formatCurrency(job.budget)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(job.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedJob(job);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedJob(job);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Job
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedJob(job);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete Job
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Posted:</span>{" "}
                      {new Date(job.postedAt).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Proposals:</span>{" "}
                      {job._count.proposals}
                    </div>
                    <div>
                      <span className="font-medium">Reviews:</span>{" "}
                      {job._count.reviews}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={job.status}
                      onValueChange={(value) => handleStatusChange(job.id, value)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Change status" />
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
                </div>
              </CardContent>
            </Card>
          ))}

          {jobs.length === 0 && (
            <Card className="border border-gray-200">
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <p className="mt-2 text-sm font-medium text-gray-900">No jobs found</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
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
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedJob && handleDeleteJob(selectedJob.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Job Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedJob?.title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-gray-600">{selectedJob?.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Client Information</h3>
                <p className="text-gray-600">{selectedJob?.client.name}</p>
                <p className="text-gray-600">{selectedJob?.client.email}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Job Details</h3>
                <p className="text-gray-600">Budget: {formatCurrency(selectedJob?.budget || 0)}</p>
                <p className="text-gray-600">Status: {selectedJob?.status}</p>
                <p className="text-gray-600">Posted: {selectedJob?.postedAt ? new Date(selectedJob.postedAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <p className="text-gray-600">Proposals: {selectedJob?._count.proposals}</p>
                <p className="text-gray-600">Reviews: {selectedJob?._count.reviews}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Job Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select
                value={selectedJob?.status}
                onValueChange={(value) => {
                  if (selectedJob) {
                    handleStatusChange(selectedJob.id, value);
                    setIsEditDialogOpen(false);
                  }
                }}
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 