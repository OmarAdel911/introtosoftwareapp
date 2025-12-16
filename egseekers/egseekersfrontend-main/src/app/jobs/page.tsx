"use client"

import { Suspense, useState, useEffect } from "react"
import { Search, Filter, MapPin, Clock, DollarSign, Briefcase, ChevronLeft, ChevronRight, Tag, Building, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import axios from "axios"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { config } from '@/config/env';

// Job categories
const categories = [
  "All Categories",
  "Web Development",
  "Mobile Development",
  "UI/UX Design",
  "Content Writing",
  "Digital Marketing",
  "Data Science",
  "Machine Learning",
  "DevOps",
  "Cloud Computing"
]

// Job types
const types = [
  "All Types",
  "Fixed Price",
  "Hourly Rate",
  "Milestone Based"
]

// Job durations
const durations = [
  "All Durations",
  "Less than 1 week",
  "Less than 1 month",
  "1-3 months",
  "3-6 months",
  "More than 6 months"
]

// Job locations
const locations = [
  "All Locations",
  "Remote",
  "On-site",
  "Hybrid"
]

interface Job {
  id: string
  title: string
  description: string
  budget: number
  skills: string[]
  category: string
  status: string
  client: {
    id: string
    name: string
  }
  createdAt: string
}

// Add the formatDate function before the JobCard component
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Unknown';
    }
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown';
  }
};

// Job card component
function JobCard({ job }: { job: any }) {
  const router = useRouter()
  const [hasApplied, setHasApplied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user has already applied to this job
    const checkApplicationStatus = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setIsLoading(false)
          return
        }

        // Try to check application status, but handle 404 gracefully
        try {
          const response = await axios.get(`${config.apiUrl}/jobs/${job.id}/applications/status`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          setHasApplied(response.data.hasApplied)
        } catch (error) {
          // If the endpoint doesn't exist (404), just assume not applied
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            console.log('Application status endpoint not available, assuming not applied')
            setHasApplied(false)
          } else {
            console.error('Error checking application status:', error)
            setHasApplied(false)
          }
        }
      } catch (error) {
        console.error('Error in application check:', error)
        setHasApplied(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkApplicationStatus()
  }, [job.id])

  const handleCardClick = (e: React.MouseEvent) => {
    // Navigate to job details page
    router.push(`/jobs/${job.id}`)
  }

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent the card click event from firing
    if (hasApplied) {
      // If already applied, go to job details to view application
      router.push(`/jobs/${job.id}`)
    } else {
      // If not applied, go to the proposal page
      router.push(`/jobs/${job.id}/propose`)
    }
  }

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 overflow-hidden group"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl group-hover:text-gray-700 transition-colors">{job.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <div className="p-1 rounded-full bg-gray-100">
                <Building className="h-3 w-3 text-gray-600" />
              </div>
              <CardDescription>
                {job.client.name} • {formatDate(job.createdAt)}
              </CardDescription>
            </div>
          </div>
          {!isLoading && (
            <Badge className={hasApplied ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-800 border border-gray-200'}>
              {hasApplied ? 'Submitted' : 'Open'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{job.description}</p>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-700">${job.budget}</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
            <Tag className="h-4 w-4 text-gray-600" />
            <span className="text-gray-700">{job.category}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {job.skills.slice(0, 3).map((skill: string) => (
            <Badge key={skill} variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
              {skill}
            </Badge>
          ))}
          {job.skills.length > 3 && (
            <Badge variant="outline" className="border-gray-200 text-gray-500">
              +{job.skills.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          className={`w-full ${hasApplied ? 'bg-gray-600 hover:bg-gray-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
          onClick={handleApplyClick}
        >
          {hasApplied ? 'View Application' : 'Apply Now'}
        </Button>
      </CardFooter>
    </Card>
  )
}

// Loading skeleton for job cards
function JobCardSkeleton() {
  return (
    <Card className="border border-gray-200 overflow-hidden">
      <div className="h-1.5 bg-gray-200"></div>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-2" />
        <div className="mt-4 flex justify-between">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-6 w-16" />
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  )
}

// Helper functions for status colors
const getStatusBarColor = (status: string) => {
  switch (status) {
    case 'OPEN':
      return 'bg-gray-500';
    case 'SUBMITTED':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'OPEN':
      return 'bg-gray-100 text-gray-800 border border-gray-200';
    case 'SUBMITTED':
      return 'bg-green-100 text-green-800 border border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

// Jobs page component
export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const router = useRouter()

  useEffect(() => {
    fetchJobs()
  }, [page, selectedCategory])

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token')
      console.log('Token exists:', !!token)
      
      if (!token) {
        router.push('/login')
        return
      }

      console.log('Fetching jobs with params:', {
        page,
        limit: 9,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined
      })

      const response = await axios.get(`${config.apiUrl}/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: 9,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          search: searchQuery || undefined
        }
      })

      console.log('API response:', response.data)

      // Filter out cancelled jobs
      const filteredJobs = response.data.data.jobs.filter((job: Job) => job.status !== 'CANCELLED')
      console.log('Filtered jobs:', filteredJobs.length)
      
      setJobs(filteredJobs)
      setTotalPages(response.data.data.pagination.pages)
    } catch (error: any) {
      console.error('Error fetching jobs:', error)
      if (error.response?.status === 401) {
        toast.error('Please log in to view jobs')
        router.push('/login')
      } else {
        toast.error('Failed to load jobs')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchJobs()
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container py-8">
          <div className="flex flex-col gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h1 className="text-3xl font-bold text-gray-800">Find Jobs</h1>
              <p className="text-gray-500 mt-2">
                Browse through thousands of job postings and find your next opportunity
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => <JobCardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container py-8">
        <div className="flex flex-col gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-800">Find Jobs</h1>
            <p className="text-gray-500 mt-2">
              Browse through thousands of job postings and find your next opportunity
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search jobs..."
                      className="pl-9 border-gray-200 focus:border-gray-300 focus:ring-gray-200"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="bg-gray-800 hover:bg-gray-900 text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="border-gray-200 focus:border-gray-300 focus:ring-gray-200">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger className="border-gray-200 focus:border-gray-300 focus:ring-gray-200">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger className="border-gray-200 focus:border-gray-300 focus:ring-gray-200">
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((duration) => (
                      <SelectItem key={duration} value={duration.toLowerCase()}>
                        {duration}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger className="border-gray-200 focus:border-gray-300 focus:ring-gray-200">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location.toLowerCase()}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="mb-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <Briefcase className="h-8 w-8 text-gray-500" />
                  </div>
                </div>
                <p className="text-gray-600 mb-2 font-medium">No jobs found matching your criteria</p>
                <p className="text-gray-500 mb-6">Try adjusting your search filters</p>
                <Button 
                  variant="outline" 
                  className="border-gray-200 text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setPage(1);
                    fetchJobs();
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="border-gray-200 hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className={pageNum === page ? "bg-gray-800 hover:bg-gray-900" : "border-gray-200 hover:bg-gray-50"}
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="border-gray-200 hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 