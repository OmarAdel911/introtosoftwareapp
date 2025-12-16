"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { config } from '@/config/env'

interface Proposal {
  id: string
  freelancer: {
    id: string
    name: string
    image?: string
  }
  amount: number
  coverLetter: string
  status: string
  createdAt: string
}

interface Job {
  id: string
  title: string
  status: string
  proposals?: Proposal[]
}

export default function JobApplicantsPage() {
  const params = useParams()
  const jobId = params?.jobId as string
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const jobResponse = await axios.get(`${config.apiUrl}/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        setJob(jobResponse.data)
      } catch (error: any) {
        console.error('Error fetching job:', error)
        if (error.response?.status === 401) {
          toast.error('Please log in to view applicants')
          router.push('/login')
        } else {
          toast.error('Failed to load job details')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [jobId, router])

  const handleUpdateProposalStatus = async (proposalId: string, status: 'ACCEPTED' | 'REJECTED') => {
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

      // Update the proposals list with the updated proposal
      setJob(prevJob =>
        prevJob ? {
          ...prevJob,
          proposals: prevJob.proposals?.map(proposal =>
            proposal.id === proposalId ? { ...proposal, status } : proposal
          )
        } : null
      );

      // If proposal was accepted, update job status
      if (status === 'ACCEPTED') {
        setJob(prevJob =>
          prevJob ? { ...prevJob, status: 'IN_PROGRESS' } : null
        );
      }

      toast.success(`Proposal ${status.toLowerCase()} successfully`);
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
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
          <p className="text-muted-foreground mb-4">The job you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/jobs')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
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
          <Badge variant={job.status === "OPEN" ? "default" : "secondary"}>
            {job.status}
          </Badge>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Applicants for {job.title}</CardTitle>
            <CardDescription>
              Review and manage proposals for this job
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {job.proposals && job.proposals.length > 0 ? (
            job.proposals.map((proposal) => (
              <Card key={proposal.id}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getImageUrl(proposal.freelancer.image)} alt={proposal.freelancer.name} />
                      <AvatarFallback>{proposal.freelancer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{proposal.freelancer.name}</CardTitle>
                      <CardDescription>
                        Submitted on {new Date(proposal.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className="ml-auto">{proposal.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 line-clamp-3">{proposal.coverLetter}</p>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Proposed Amount: ${proposal.amount}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  {proposal.status === "PENDING" && (
                    <div className="flex gap-2">
                      <Button 
                        variant="default"
                        onClick={() => handleUpdateProposalStatus(proposal.id, "ACCEPTED")}
                      >
                        Accept
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => handleUpdateProposalStatus(proposal.id, "REJECTED")}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" asChild>
                      <Link href={`/chat/${proposal.freelancer.id}`}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Message
                      </Link>
                    </Button>
                    <Button variant="secondary" asChild>
                      <Link href={`/jobs/${jobId}/applicants/${proposal.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No proposals yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 