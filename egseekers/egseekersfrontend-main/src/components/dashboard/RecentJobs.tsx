"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { MapPin, Calendar, DollarSign, ArrowRight, Briefcase } from "lucide-react"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api-client"

interface Job {
  id: string
  title: string
  description: string
  budget: number
  location: string
  createdAt: string
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
}

export default function RecentJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await apiClient.get<Job[]>('/jobs/recent');
        if (data) {
          setJobs(data);
        }
      } catch (err) {
        console.error('Error fetching recent jobs:', err);
        setError('Failed to load recent jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

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

  if (loading) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-primary/10 pb-6">
          <div>
            <CardTitle className="text-2xl font-bold">Recent Jobs</CardTitle>
            <CardDescription className="text-base mt-1">Latest job opportunities</CardDescription>
          </div>
          <Button variant="outline" size="lg" className="border-primary/20 hover:bg-primary/5">
            <ArrowRight className="mr-2 h-5 w-5 text-primary" />
            View All
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-primary/10 pb-6">
          <div>
            <CardTitle className="text-2xl font-bold">Recent Jobs</CardTitle>
            <CardDescription className="text-base mt-1">Latest job opportunities</CardDescription>
          </div>
          <Button variant="outline" size="lg" className="border-primary/20 hover:bg-primary/5">
            <ArrowRight className="mr-2 h-5 w-5 text-primary" />
            View All
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-primary/10 pb-6">
        <div>
          <CardTitle className="text-2xl font-bold">Recent Jobs</CardTitle>
          <CardDescription className="text-base mt-1">Latest job opportunities</CardDescription>
        </div>
        <Button variant="outline" size="lg" className="border-primary/20 hover:bg-primary/5" asChild>
          <Link href="/jobs">
            <ArrowRight className="mr-2 h-5 w-5 text-primary" />
            View All
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        {jobs.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No jobs available</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">Check back later for new job opportunities.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="group hover:shadow-md transition-all duration-300 border border-border/50 rounded-lg overflow-hidden">
                <div className={`h-1 ${getStatusColor(job.status).split(' ')[0]}`}></div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{job.title}</h3>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground line-clamp-2 mb-4">{job.description}</p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-1 p-2 bg-muted/30 rounded-md">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-medium">${job.budget}</span>
                    </div>
                    <div className="flex items-center gap-1 p-2 bg-muted/30 rounded-md">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1 p-2 bg-muted/30 rounded-md">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">{format(new Date(job.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button asChild className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm">
                      <Link href={`/jobs/${job.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 