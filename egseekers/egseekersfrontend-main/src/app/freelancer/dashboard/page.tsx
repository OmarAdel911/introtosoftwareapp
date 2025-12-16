"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, MessageSquare, DollarSign, User, Calendar, Clock, AlertCircle, CheckCircle, XCircle, FileText, Briefcase, CreditCard } from "lucide-react"
import { getDashboardStats, getRecentJobs, getRecentApplications, getRecentPayments } from "@/lib/api/dashboard"
import type { DashboardStats, Application, Payment } from "@/lib/api/dashboard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import axios from "axios"
import Link from "next/link"
import { toast } from "sonner"
import { config } from "@/config/env"
import { FreelancerOverview } from "../../../components/dashboard/FreelancerOverview"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Contract, ContractStatus } from "@/types/contract"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "FREELANCER" | "CLIENT" | "ADMIN"
}

interface DashboardJob {
  id: string;
  title: string;
  description: string;
  status: string;
  budget: number;
  createdAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
  proposal?: {
    id: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  };
  contract?: Contract;
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

export default function FreelancerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentJobs, setRecentJobs] = useState<DashboardJob[]>([])
  const [recentApplications, setRecentApplications] = useState<Application[]>([])
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
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
            }
          }
        )

        if (userResponse.data.role !== 'FREELANCER') {
          router.push('/dashboard')
          return
        }

        setUser(userResponse.data)
      } catch (error) {
        console.error('Auth check error:', error)
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem('token')
          router.push('/login')
        }
      }
    } 

    checkAuth()
  }, [router]) 

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)
        
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        // Fetch all data in parallel
        const [statsData, jobsData, applicationsData, paymentsData] = await Promise.all([
          getDashboardStats(),
          getRecentJobs(),
          getRecentApplications(),
          getRecentPayments()
        ])
        
        setStats(statsData)
        // Filter out jobs with rejected proposals before setting in state
        const filteredJobs = jobsData.filter((job: DashboardJob) => 
          !job.proposal || job.proposal.status !== 'REJECTED'
        )
        setRecentJobs(filteredJobs)
        setRecentApplications(applicationsData)
        setRecentPayments(paymentsData)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          localStorage.removeItem('token')
          router.push('/login')
        } else {
          const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard data"
          setError(errorMessage)
          toast.error(errorMessage)
        }
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user, router])

  if (loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
              Freelancer Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.firstName}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="border-gray-200 hover:bg-gray-50">
              <Link href="/jobs">
                <Briefcase className="mr-2 h-4 w-4 text-gray-600" />
                Browse Jobs
              </Link>
            </Button>
            <Button asChild className="bg-gray-800 hover:bg-gray-900">
              <Link href="/freelancer/profile">
                <User className="mr-2 h-4 w-4" />
                View Profile
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto bg-white border border-gray-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              Overview
            </TabsTrigger>
            <TabsTrigger value="jobs" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              My Jobs
            </TabsTrigger>
            <TabsTrigger value="proposals" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              Proposals
            </TabsTrigger>
            <TabsTrigger value="earnings" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              Earnings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <FreelancerOverview 
              stats={stats}
              error={error}
            />
          </TabsContent>

          <TabsContent value="jobs" className="mt-6">
            <Card className="border border-gray-200 bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-800">My Jobs</CardTitle>
                    <CardDescription className="text-gray-500">View and manage your active jobs</CardDescription>
                  </div>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Link href="/jobs">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Find More Jobs
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {recentJobs.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="mb-4">
                      <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                        <Briefcase className="h-8 w-8 text-blue-500" />
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2 font-medium">No active jobs found</p>
                    <p className="text-gray-500 mb-6">Start by browsing available jobs and submitting proposals</p>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Link href="/jobs">Browse Available Jobs</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {recentJobs.map((job: DashboardJob) => (
                      <Card key={job.id} className="group hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white overflow-hidden">
                        <div className={`h-1.5 ${getStatusBarColor(job.status)}`}></div>
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start gap-6">
                            {/* Left section - Job details */}
                            <div className="flex-1 space-y-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {job.title}
                                  </h3>
                                  <p className="text-gray-500 mt-1">
                                    Posted by {job.client.firstName} {job.client.lastName}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex items-center gap-2">
                                    {job.proposal && (
                                      <Badge variant={getStatusBadgeColor(job.proposal.status)} className="px-3 py-1">
                                        {job.proposal.status}
                                      </Badge>
                                    )}
                                    {job.contract && (
                                      <Badge variant={getContractStatusBadgeColor(job.contract.status)} className="px-3 py-1">
                                        Contract: {job.contract.status}
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {format(new Date(job.createdAt), 'MMM d, yyyy')}
                                  </span>
                                </div>
                              </div>
                              
                              <p className="text-gray-600 line-clamp-2">{job.description}</p>
                              
                              <div className="flex items-center gap-6 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  <span className="font-medium">${job.budget}</span>
                                </div>
                                {job.contract && (
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span>Contract #{job.contract.id.slice(0, 8)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right section - Actions */}
                            <div className="flex flex-col gap-3 min-w-[200px]">
                              <Link href={`/jobs/${job.id}`} className="w-full">
                                <Button variant="outline" className="w-full hover:bg-blue-50 border-blue-200 text-blue-700">
                                  View Details
                                </Button>
                              </Link>
                              <Link href={`/chat/${job.client.id}`} className="w-full">
                                <Button className="w-full bg-gray-800 hover:bg-gray-900">
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Message Client
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="proposals" className="mt-6">
            <Card className="border border-gray-200 bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-800">Proposals</CardTitle>
                    <CardDescription className="text-gray-500">Track your job proposals and their status</CardDescription>
                  </div>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Link href="/jobs">
                      <FileText className="mr-2 h-4 w-4" />
                      Submit New Proposal
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {recentApplications.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="mb-4">
                      <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                        <FileText className="h-8 w-8 text-blue-500" />
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2 font-medium">No proposals found</p>
                    <p className="text-gray-500 mb-6">Start by browsing available jobs and submitting proposals</p>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Link href="/jobs">Browse Jobs to Apply</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentApplications.map((application) => (
                      <Card key={application.id} className="group hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white overflow-hidden">
                        <div className={`h-1.5 ${getStatusBarColor(application.status)}`}></div>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                              {application.jobTitle}
                            </CardTitle>
                            <Badge className={`${getStatusBadgeColor(application.status)}`}>
                              {application.status}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="p-1.5 rounded-full bg-gray-100">
                              <User className="h-3.5 w-3.5 text-gray-600" />
                            </div>
                            <span className="text-sm text-gray-600">
                              {application.client.firstName} {application.client.lastName}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>Submitted: {format(new Date(application.createdAt), 'MMM d, yyyy')}</span>
                            </div>
                            {application.budget && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <DollarSign className="h-4 w-4" />
                                <span>Budget: ${application.budget}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="pt-2 flex flex-col gap-2">
                          <Link href={`/jobs/${application.jobId}/proposals/${application.id}`} className="w-full">
                            <Button variant="outline" className="w-full hover:bg-blue-50 border-blue-200 text-blue-700">
                              View Details
                            </Button>
                          </Link>
                          <Link href={`/chat/${application.client.id}`} className="w-full">
                            <Button className="w-full bg-gray-800 hover:bg-gray-900">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Message Client
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

          <TabsContent value="earnings" className="mt-6">
            <Card className="border border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800">Earnings</CardTitle>
                <CardDescription className="text-gray-500">Track your earnings and payment history</CardDescription>
              </CardHeader>
              <CardContent>
                {recentPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mb-4">
                      <CreditCard className="h-12 w-12 text-gray-300 mx-auto" />
                    </div>
                    <p className="text-gray-500 mb-2">No payment history found</p>
                    <p className="text-sm text-gray-500">Complete jobs to start earning</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:shadow-md transition-all duration-300 border-gray-200">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-full bg-gray-100">
                            <CreditCard className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Payment {payment.type}</p>
                            <p className="text-sm text-gray-600">
                              Amount: ${payment.amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Date: {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" asChild className="border-gray-200 hover:bg-gray-50">
                          <Link href={`/payments/${payment.id}`}>View Details</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

const getStatusBarColor = (status: string) => {
  switch (status) {
    case 'OPEN':
      return 'bg-blue-500';
    case 'IN_PROGRESS':
      return 'bg-yellow-500';
    case 'COMPLETED':
      return 'bg-green-500';
    case 'CANCELLED':
      return 'bg-red-500';
    case 'PENDING':
      return 'bg-yellow-500';
    case 'ACCEPTED':
      return 'bg-green-500';
    case 'REJECTED':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusBadgeColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'default';
    case 'in_progress':
      return 'secondary';
    case 'completed':
      return 'outline';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getContractStatusBadgeColor = (status: ContractStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "PENDING":
      return "default"
    case "FREELANCER_ACCEPTED":
    case "CLIENT_ACCEPTED":
      return "secondary"
    case "ACTIVE":
      return "outline"
    case "CANCELLED":
      return "destructive"
    default:
      return "default"
  }
} 