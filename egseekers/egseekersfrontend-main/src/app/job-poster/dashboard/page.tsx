"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Briefcase, Users, MessageSquare, Bell, DollarSign, User, Calendar, CheckCircle, XCircle, AlertCircle, Clock, FileText, CreditCard } from "lucide-react"
import axios from "axios"
import Link from "next/link"
import { DashboardOverview } from "@/components/dashboard/DashboardOverview"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import type { DashboardStats, Payment } from "@/lib/api/dashboard"
import { JobPosterOverview } from "@/components/dashboard/JobPosterOverview"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { config } from "@/config/env"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "FREELANCER" | "CLIENT" | "ADMIN"
}

interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  createdAt: string;
  _count?: {
    proposals: number;
  };
}

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  status: string;
  createdAt: string;
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

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
    case 'PENDING':
      return <Clock className="h-4 w-4" />;
    case 'ACCEPTED':
      return <CheckCircle className="h-4 w-4" />;
    case 'REJECTED':
      return <XCircle className="h-4 w-4" />;
    default:
      return null;
  }
};

export default function JobPosterDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentJobs, setRecentJobs] = useState<Job[]>([])
  const [recentApplications, setRecentApplications] = useState<Application[]>([])
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const userResponse = await axios.get<User>(
          `${config.apiUrl}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            timeout: 10000, // 10 second timeout
          }
        )

        if (userResponse.data.role !== 'CLIENT') {
          router.push('/dashboard')
          return
        }

        setUser(userResponse.data)
      } catch (error) {
        console.error('Auth check error:', error)
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            localStorage.removeItem('token')
            router.push('/login')
          } else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
            console.error('Network error - backend may be unavailable at:', config.apiUrl)
            toast.error('Cannot connect to server. Please ensure the backend is running.')
          }
        }
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        setError(null)
        
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const headers = {
          Authorization: `Bearer ${token}`
        }

        // Fetch data one by one to better handle errors
        try {
          const statsResponse = await axios.get<DashboardStats>(
            `${config.apiUrl}/dashboard/stats`, 
            { headers }
          )
          setStats(statsResponse.data)
        } catch (err) {
          console.error("Error fetching stats:", err)
          setError("Failed to load dashboard statistics")
        }

        try {
          const jobsResponse = await axios.get<Job[]>(
            `${config.apiUrl}/dashboard/jobs/recent`, 
            { headers }
          )
          setRecentJobs(jobsResponse.data)
        } catch (err) {
          console.error("Error fetching jobs:", err)
          // Don't set error here, just log it
        }

        try {
          const applicationsResponse = await axios.get<Application[]>(
            `${config.apiUrl}/dashboard/applications/recent`, 
            { headers }
          )
          setRecentApplications(applicationsResponse.data)
        } catch (err) {
          console.error("Error fetching applications:", err)
          // Don't set error here, just log it
        }

        try {
          const paymentsResponse = await axios.get<Payment[]>(
                `${config.apiUrl}/dashboard/payments/recent`, 
            { headers }
          )
          setRecentPayments(paymentsResponse.data)
        } catch (err) {
          console.error("Error fetching payments:", err)
          // Don't set error here, just log it
        }
      } catch (err) {
        console.error("Error in dashboard data fetch:", err)
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          localStorage.removeItem('token')
          router.push('/login')
        } else {
          const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard data"
          setError(errorMessage)
          toast.error(errorMessage)
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user, router])

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading dashboard..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.firstName}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <JobPosterOverview 
            stats={stats}
            error={error}
            recentJobs={recentJobs}
          />
        </TabsContent>

        <TabsContent value="jobs">
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-primary/10 pb-6">
              <div>
                <CardTitle className="text-2xl font-bold">Posted Jobs</CardTitle>
                <CardDescription className="text-base mt-1">Manage your job postings and track applications</CardDescription>
              </div>
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md">
                <Link href="/post-job">
                  <Plus className="mr-2 h-5 w-5" />
                  Post New Job
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {recentJobs.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No jobs posted yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">Start by posting your first job to find talented freelancers for your projects.</p>
                  <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md">
                    <Link href="/post-job">Post Your First Job</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentJobs.map((job) => (
                    <Card key={job.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border border-border/50">
                      <div className={`h-2 ${getStatusColor(job.status).split(' ')[0]}`}></div>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">{job.title}</CardTitle>
                          <Badge className={`${getStatusColor(job.status)} flex items-center gap-1`}>
                            {getStatusIcon(job.status)}
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2 mt-2">{job.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <span className="font-medium">Budget: ${job.budget}</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="font-medium">Applications: {job._count?.proposals || 0}</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="font-medium">Posted: {format(new Date(job.createdAt), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2 flex flex-col gap-2">
                        <Link href={`/jobs/${job.id}`} className="w-full">
                          <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm">
                            View Details
                          </Button>
                        </Link>
                        <Link href={`/jobs/${job.id}/applicants`} className="w-full">
                          <Button variant="outline" className="w-full hover:bg-primary/5">
                            Review Applicants ({job._count?.proposals || 0})
                          </Button>
                        </Link>
                        <Link href={`/jobs/${job.id}/edit`} className="w-full">
                          <Button variant="outline" className="w-full hover:bg-primary/5">
                            Edit Job
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-primary/10 pb-6">
              <div>
                <CardTitle className="text-2xl font-bold">Applications</CardTitle>
                <CardDescription className="text-base mt-1">Review and manage job applications from freelancers</CardDescription>
              </div>
              <Button variant="outline" size="lg" className="border-primary/20 hover:bg-primary/5">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                View All Applications
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {recentApplications.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">Applications from freelancers will appear here when they apply to your jobs.</p>
                  <Button asChild variant="outline" size="lg" className="border-primary/20 hover:bg-primary/5">
                    <Link href="/post-job">Post a Job to Get Started</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentApplications.map((application) => (
                    <Card key={application.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border border-border/50">
                      <div className={`h-2 ${getStatusColor(application.status).split(' ')[0]}`}></div>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">{application.jobTitle}</CardTitle>
                          <Badge className={getStatusColor(application.status)}>
                            {application.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{application.freelancer.firstName[0]}{application.freelancer.lastName[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{application.freelancer.firstName} {application.freelancer.lastName}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="font-medium">Submitted: {format(new Date(application.createdAt), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2 flex flex-col gap-2">
                        <Link href={`/jobs/${application.jobId}/proposals/${application.id}`} className="w-full">
                          <Button variant="outline" className="w-full hover:bg-primary/5">Review Application</Button>
                        </Link>
                        <Link href={`/chat/${application.freelancer.id}`} className="w-full">
                          <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Message Freelancer
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-primary/10 pb-6">
              <div>
                <CardTitle className="text-2xl font-bold">Payments</CardTitle>
                <CardDescription className="text-base mt-1">Track and manage your payment history</CardDescription>
              </div>
              <Button variant="outline" size="lg" className="border-primary/20 hover:bg-primary/5">
                <CreditCard className="mr-2 h-5 w-5 text-primary" />
                View All Payments
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {recentPayments.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No payments yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">Payment history will appear here when you make payments to freelancers.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPayments.map((payment) => (
                    <Card key={payment.id} className="overflow-hidden group hover:shadow-md transition-all duration-300 border border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-primary/10 text-primary">
                              <CreditCard className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">${payment.amount.toLocaleString()}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={payment.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                  {payment.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" asChild className="hover:bg-primary/5">
                            <Link href={`/payments/${payment.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 