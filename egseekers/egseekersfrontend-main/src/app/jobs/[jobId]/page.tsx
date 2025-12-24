"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Loader2, Briefcase, Calendar, DollarSign, MapPin, Clock, User, Edit2, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { config } from '@/config/env';

interface Job {
  id: string
  title: string
  description: string
  budget: number
  skills: string[]
  category: string
  status: string
  deadline: string
  jobType: string
  experience: string
  duration: string
  location: string
  postedAt: string
  client: {
    id: string
    name: string
    createdAt: string
    avatar: string
  }
  proposals: {
    id: string
    freelancer: {
      id: string
      name: string
    }
    amount: number
    status: string
  }[]
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Unknown'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString)
      return 'Unknown'
    }
    return formatDistanceToNow(date, { addSuffix: true })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Unknown'
  }
}

export default function JobDetailsPage() {
  const params = useParams()
  const jobId = params?.jobId as string
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [job, setJob] = useState<Job | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [hasActiveContract, setHasActiveContract] = useState(false)
  const [userProposal, setUserProposal] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        // First fetch user role and ID
        const userResponse = await axios.get(`${config.apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setUserRole(userResponse.data.role)
        setUserId(userResponse.data.id)

        // Then fetch job details
        const jobResponse = await axios.get(`${config.apiUrl}/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const jobData = jobResponse.data.success ? jobResponse.data.data : jobResponse.data
        setJob(jobData)

        // Check if user has submitted a proposal for this job
        if (userResponse.data.role === 'FREELANCER') {
          try {
            const proposalResponse = await axios.get(
              `${config.apiUrl}/jobs/${jobId}/applications/status`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
            if (proposalResponse.data.hasApplied && proposalResponse.data.proposal) {
              setUserProposal(proposalResponse.data.proposal)
            }
          } catch (error) {
            // If the endpoint doesn't exist or returns an error, just continue
            console.log('Could not check application status')
          }
        }

        // Finally check for active contract if user is the job owner
        if (jobData?.client?.id === userResponse.data.id) {
          try {
            const contractResponse = await axios.get(
              `${config.apiUrl}/jobs/${jobId}/contract`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
            setHasActiveContract(contractResponse.data.hasActiveContract)
          } catch (error) {
            // If contract endpoint doesn't exist, just continue
            console.log('Could not check contract status')
          }
        }
      } catch (error: any) {
        console.error('Error fetching data:', error)
        if (error.response?.status === 401) {
          toast.error('Please log in to view job details')
          router.push('/login')
        } else {
          toast.error('Failed to load job details')
        }
      } finally {
        setLoading(false)
      }
    }

    if (jobId) {
      fetchData()
    }
  }, [jobId, router])

  const handleSubmitProposal = () => {
    router.push(`/jobs/${jobId}/propose`)
  }

  const handleEditJob = () => {
    router.push(`/jobs/${jobId}/edit`)
  }

  const handleBackToDashboard = () => {
    if (userRole === 'client') {
      router.push('/job-poster/dashboard')
    } else {
      router.push('/freelancer/dashboard')
    }
  }

  const handleCloseJob = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      await axios.patch(
        `${config.apiUrl}/jobs/${jobId}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success('Job closed successfully')
      // Refresh job data
      const response = await axios.get(`${config.apiUrl}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const jobData = response.data.success ? response.data.data : response.data
      setJob(jobData)
    } catch (error: any) {
      console.error('Error closing job:', error)
      toast.error(error.response?.data?.error || 'Failed to close job')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
          <p className="text-muted-foreground mb-4">The job you're looking for doesn't exist or has been removed.</p>
          <Button onClick={handleBackToDashboard}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const isClient = userRole === 'client'
  const isFreelancer = userRole === 'freelancer'
  const isJobOwner = job?.client?.id === userId

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={handleBackToDashboard}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="h-2 bg-primary"></div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-bold">{job.title}</CardTitle>
                    <CardDescription className="mt-2">
                      Posted by {job.client?.name || 'Unknown'} • {formatDate(job.postedAt)}
                    </CardDescription>
                  </div>
                  {isJobOwner && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleEditJob}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit Job
                      </Button>
                      {job.status === 'OPEN' && !hasActiveContract && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={handleCloseJob}
                        >
                          Close Job
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{job.jobType}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{job.experience}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{job.duration}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{job.location}</span>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="about" className="mt-6">
              <TabsList>
                <TabsTrigger value="about">About Client</TabsTrigger>
              </TabsList>
              <TabsContent value="about">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={job.client?.avatar ? 
                              (job.client.avatar.startsWith('http') 
                                ? job.client.avatar 
                                : `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${job.client.avatar}`)
                              : undefined
                            } 
                            alt={job.client?.name || 'Client'} 
                          />
                          <AvatarFallback className="bg-gray-100 text-gray-600">
                            {job.client?.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-gray-900">{job.client?.name || 'Unknown Client'}</h3>
                          <p className="text-sm text-gray-500">
                            Member since {formatDate(job.client?.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Budget</span>
                    <span className="text-lg font-bold">${job.budget}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Category</span>
                    <span className="text-sm">{job.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Deadline</span>
                    <span className="text-sm">
                      {formatDate(job.deadline)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </div>
                </div>

                {isFreelancer && job.status === 'open' && (
                  <Button className="w-full mt-6" onClick={handleSubmitProposal}>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Proposal
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 