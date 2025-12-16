"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Calendar, DollarSign, User, Clock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { config } from '@/config/env'

interface Proposal {
  id: string
  coverLetter: string
  amount: number
  status: string
  createdAt: string
  freelancer: {
    id: string
    name: string
    image?: string
  }
  job: {
    id: string
    title: string
    description: string
    budget: number
    status: string
    deadline: string
    client: {
      id: string
      name: string
    }
  }
}

export default function ProposalDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [isJobPoster, setIsJobPoster] = useState(false)
  const [user, setUser] = useState<{ id: string; role: string } | null>(null)

  useEffect(() => {
    const fetchProposalAndUser = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          toast.error('Please log in to view proposal details')
          router.push('/login')
          return
        }

        // Get current user
        const userResponse = await axios.get(`${config.apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setUser(userResponse.data)

        // Get proposal details
        console.log('Fetching proposal:', params.proposalId)
        const proposalResponse = await axios.get(
          `${config.apiUrl}/proposals/${params.proposalId}`,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        )
        console.log('Proposal response:', proposalResponse.data)

        setProposal(proposalResponse.data)
        setIsJobPoster(
          userResponse.data.role === 'CLIENT' && 
          proposalResponse.data.job.client.id === userResponse.data.id
        )
      } catch (error: any) {
        console.error('Error fetching proposal details:', error)
        if (error.response?.status === 401) {
          toast.error('Please log in to view proposal details')
          router.push('/login')
        } else if (error.response?.status === 403) {
          toast.error('You are not authorized to view this proposal')
          router.push('/jobs')
        } else if (error.response?.status === 404) {
          toast.error('Proposal not found')
          router.push('/jobs')
        } else {
          toast.error(error.response?.data?.error || 'Failed to load proposal details')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProposalAndUser()
  }, [params.jobId, params.proposalId, router])

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Use the new accept/reject endpoints
      const endpoint = newStatus === 'ACCEPTED' 
        ? `${config.apiUrl}/proposals/${params.proposalId}/accept`
          : `${config.apiUrl}/proposals/${params.proposalId}/reject`;
      
      await axios.put(
        endpoint,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Refresh the proposal data to get updated status
      const proposalResponse = await axios.get(
            `${config.apiUrl}/proposals/${params.proposalId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setProposal(proposalResponse.data)
      
      toast.success(`Proposal ${newStatus.toLowerCase()} successfully`)
    } catch (error: any) {
      console.error('Error updating proposal status:', error)
      toast.error(error.response?.data?.error || 'Failed to update proposal status')
    }
  }

  const handleAcceptProposal = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Accept proposal (this will also create the contract)
      await axios.post(
        `${config.apiUrl}/proposals/${params.proposalId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success('Proposal accepted successfully')
      router.push(`/jobs/${params.jobId}/proposals/${params.proposalId}/contract`)
    } catch (error: any) {
      console.error('Error accepting proposal:', error)
      toast.error(error.response?.data?.error || 'Failed to accept proposal')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Proposal Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The proposal you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push(`/job-poster/dashboard`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push(`/job-poster/dashboard`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Button>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">Proposal for {proposal.job.title}</CardTitle>
                  <CardDescription className="flex items-center text-muted-foreground">
                    <User className="mr-2 h-4 w-4" />
                    By {proposal.freelancer.name}
                  </CardDescription>
                </div>
                <Badge variant={proposal.status === "PENDING" ? "secondary" : "default"}>
                  {proposal.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center bg-muted/50 px-3 py-1.5 rounded-md">
                    <DollarSign className="h-4 w-4 mr-1 text-primary" />
                    <span className="font-medium">Bid Amount: ${proposal.amount}</span>
                  </div>
                  <div className="flex items-center bg-muted/50 px-3 py-1.5 rounded-md">
                    <Clock className="h-4 w-4 mr-1 text-primary" />
                    <span className="font-medium">
                      Submitted on {new Date(proposal.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Cover Letter</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {proposal.coverLetter}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Job Details</h3>
                  <div className="space-y-2">
                    <p><strong>Budget:</strong> ${proposal.job.budget}</p>
                    <p><strong>Status:</strong> {proposal.job.status}</p>
                    <p><strong>Deadline:</strong> {new Date(proposal.job.deadline).toLocaleDateString()}</p>
                    <p><strong>Client:</strong> {proposal.job.client.name}</p>
                  </div>
                </div>

                {isJobPoster && proposal.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button onClick={handleAcceptProposal}>
                      Accept Proposal
                    </Button>
                    <Button variant="outline" onClick={() => handleUpdateStatus("REJECTED")}>
                      Reject Proposal
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 