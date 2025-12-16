"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, MessageSquare, Calendar, DollarSign, User, CheckCircle2, XCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { format } from 'date-fns'
import { config } from '@/config/env'

interface Proposal {
  id: string
  freelancer: {
    id: string
    name: string
    image?: string
    bio?: string
    skills?: string[]
    hourlyRate?: number
    title?: string
    location?: string
    website?: string
    linkedin?: string
    github?: string
  }
  amount: number
  coverLetter: string
  status: string
  createdAt: string
}

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
    image?: string
  }
  createdAt: string
  deadline: string
}

export default function ProposalDetailsPage() {
  const params = useParams()
  const jobId = params?.jobId as string
  const proposalId = params?.proposalId as string
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [isJobPoster, setIsJobPoster] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        // Get current user
        const userResponse = await axios.get(`${config.apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        // Get job details
        const jobResponse = await axios.get(`${config.apiUrl}/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setJob(jobResponse.data)
        
        // Check if current user is the job poster
        setIsJobPoster(userResponse.data.role === 'CLIENT' && jobResponse.data.client.id === userResponse.data.id)

        // Get proposal details
        const proposalResponse = await axios.get(`${config.apiUrl}/proposals/${proposalId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setProposal(proposalResponse.data)
      } catch (error: any) {
        console.error('Error fetching data:', error)
        if (error.response?.status === 401) {
          toast.error('Please log in to view proposal details')
          router.push('/login')
        } else if (error.response?.status === 404) {
          toast.error('Proposal not found')
          router.push(`/jobs/${jobId}/applicants`)
        } else {
          toast.error('Failed to load proposal details')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [jobId, proposalId, router])

  const handleUpdateProposalStatus = async (status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const response = await axios.patch(
        `${config.apiUrl}/proposals/${proposalId}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Update the proposal status
      setProposal(prev => prev ? { ...prev, status } : null);

      // If proposal was accepted, update job status
      if (status === 'ACCEPTED' && job) {
        setJob(prev => prev ? { ...prev, status: 'IN_PROGRESS' } : null);
      }

      toast.success(`Proposal ${status.toLowerCase()} successfully`);
      
      // Redirect back to applicants page after a short delay
      setTimeout(() => {
        router.push(`/jobs/${jobId}/applicants`);
      }, 1500);
    } catch (error: any) {
      console.error('Error updating proposal status:', error);
      toast.error(error.response?.data?.error || 'Failed to update proposal status');
    }
  };

  // Function to get the correct image URL
  const getImageUrl = (image: string | undefined) => {
    if (!image) return '';
    
    // Check if it's already a full URL
    if (image.startsWith('http')) {
      return image;
    }
    
    // Check if it's a Cloudinary URL
    if (image.includes('cloudinary')) {
      return image;
    }
    
    // Otherwise, assume it's a Cloudinary ID and construct the URL
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'egseekers';
    return `https://res.cloudinary.com/${cloudName}/image/upload/${image}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!job || !proposal) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Proposal Not Found</h1>
          <p className="text-muted-foreground mb-4">The proposal you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push(`/jobs/${jobId}/applicants`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applicants
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/job-poster/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Badge variant={proposal.status === "PENDING" ? "default" : proposal.status === "ACCEPTED" ? "secondary" : "destructive"}>
            {proposal.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Proposal Details</CardTitle>
                <CardDescription>
                  Review the proposal for {job.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={getImageUrl(proposal.freelancer.image)} alt={proposal.freelancer.name} />
                      <AvatarFallback>{proposal.freelancer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-semibold">{proposal.freelancer.name}</h2>
                      <p className="text-muted-foreground">{proposal.freelancer.title || 'Freelancer'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center bg-muted/50 px-3 py-1.5 rounded-md">
                      <DollarSign className="h-4 w-4 mr-1 text-primary" />
                      <span className="font-medium">${proposal.amount}</span>
                    </div>
                    <div className="flex items-center bg-muted/50 px-3 py-1.5 rounded-md">
                      <Calendar className="h-4 w-4 mr-1 text-primary" />
                      <span className="font-medium">Submitted: {format(new Date(proposal.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Cover Letter</h3>
                    <div className="bg-muted/30 p-4 rounded-md">
                      <p className="text-muted-foreground whitespace-pre-wrap">{proposal.coverLetter}</p>
                    </div>
                  </div>

                  {proposal.status === "PENDING" && isJobPoster && (
                    <div className="flex gap-2">
                      <Button 
                        variant="default"
                        className="flex-1"
                        onClick={() => handleUpdateProposalStatus("ACCEPTED")}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Accept Proposal
                      </Button>
                      <Button 
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleUpdateProposalStatus("REJECTED")}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Proposal
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Freelancer Profile</CardTitle>
                <CardDescription>
                  Information about the freelancer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {proposal.freelancer.bio && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Bio</h3>
                      <p className="text-sm text-muted-foreground">{proposal.freelancer.bio}</p>
                    </div>
                  )}

                  {proposal.freelancer.skills && proposal.freelancer.skills.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Skills</h3>
                      <div className="flex flex-wrap gap-1">
                        {proposal.freelancer.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {proposal.freelancer.hourlyRate && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Hourly Rate</h3>
                      <p className="text-sm text-muted-foreground">${proposal.freelancer.hourlyRate}/hour</p>
                    </div>
                  )}

                  {proposal.freelancer.location && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Location</h3>
                      <p className="text-sm text-muted-foreground">{proposal.freelancer.location}</p>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/chat/${proposal.freelancer.id}`}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Message Freelancer
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
                <CardDescription>
                  Information about the job
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Budget</h3>
                    <p className="text-sm text-muted-foreground">${job.budget}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Category</h3>
                    <p className="text-sm text-muted-foreground">{job.category}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Deadline</h3>
                    <p className="text-sm text-muted-foreground">{format(new Date(job.deadline), 'MMM d, yyyy')}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Required Skills</h3>
                    <div className="flex flex-wrap gap-1">
                      {job.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 