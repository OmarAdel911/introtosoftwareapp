"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, MessageSquare, Search, DollarSign, Calendar, Filter, Briefcase, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { ApiResponse } from "@/types/api"
import { Contract, ContractStatus } from "@/types/contract"
import { config } from "@/config/env"

const API_BASE_URL = config.apiUrl

interface Job {
  id: string
  title: string
  description: string
  status: string
  budget: number
  createdAt: string
  client: {
    id: string
    name: string
    email: string
  }
  proposal?: {
    id: string
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  }
  contract?: Contract
}

const getStatusBadgeColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'default'
    case 'in_progress':
      return 'secondary'
    case 'completed':
      return 'outline'
    case 'cancelled':
      return 'destructive'
    case 'pending':
      return 'default'
    case 'accepted':
      return 'secondary'
    case 'rejected':
      return 'destructive'
    default:
      return 'outline'
  }
}

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

export default function MyJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

          const response = await fetch(`${config.apiUrl}/dashboard/jobs/recent`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch jobs')
        }

        const data = await response.json()
        setJobs(data)
      } catch (err) {
        console.error('Error fetching jobs:', err)
        setError('Failed to load jobs')
        toast.error('Failed to load jobs')
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [router])

  const filteredJobs = jobs
    .filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'with_contract' && job.contract) ||
        (statusFilter === 'no_contract' && !job.contract)
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'highest_budget':
          return b.budget - a.budget
        case 'lowest_budget':
          return a.budget - b.budget
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading jobs..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">My Jobs</h1>
              <p className="text-gray-600 mt-1">Manage and track your jobs and contracts</p>
            </div>
            <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md">
              <Link href="/jobs">
                <Briefcase className="mr-2 h-4 w-4" />
                Find More Jobs
              </Link>
            </Button>
          </div>

          {/* Filters and Search */}
          <Card className="border border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-500" />
                    <Input
                      placeholder="Search jobs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500">
                      <Filter className="mr-2 h-4 w-4 text-indigo-500" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Jobs</SelectItem>
                      <SelectItem value="with_contract">With Contract</SelectItem>
                      <SelectItem value="no_contract">No Contract</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px] border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="highest_budget">Highest Budget</SelectItem>
                      <SelectItem value="lowest_budget">Lowest Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jobs List */}
          <div className="grid grid-cols-1 gap-6">
            {filteredJobs.length === 0 ? (
              <Card className="border border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-indigo-500" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No jobs found</h3>
                    <p className="mt-1 text-gray-500">
                      {searchQuery || statusFilter !== 'all'
                        ? "Try adjusting your search or filters"
                        : "Start by browsing available jobs"}
                    </p>
                    <div className="mt-6">
                      <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md">
                        <Link href="/jobs">Browse Jobs</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredJobs.map((job) => (
                <Card key={job.id} className="group hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white/80 backdrop-blur-sm">
                  <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                      {/* Left section - Job details */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {job.title}
                            </h3>
                            <p className="text-gray-500 mt-1">
                              Posted by {job.client.name}
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
                            <div className="p-1.5 rounded-full bg-indigo-100">
                              <DollarSign className="h-4 w-4 text-indigo-600" />
                            </div>
                            <span className="font-medium">${job.budget}</span>
                          </div>
                          {job.contract && (
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-full bg-purple-100">
                                <FileText className="h-4 w-4 text-purple-600" />
                              </div>
                              <span>Contract #{job.contract.id.slice(0, 8)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right section - Actions */}
                      <div className="flex flex-col gap-3 min-w-[200px]">
                        <Link href={`/jobs/${job.id}`} className="w-full">
                          <Button variant="outline" className="w-full hover:bg-indigo-50 border-indigo-200 text-indigo-700">
                            View Details
                          </Button>
                        </Link>
                        <Link href={`/chat/${job.client.id}`} className="w-full">
                          <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Message Client
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 