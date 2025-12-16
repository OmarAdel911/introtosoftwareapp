"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Calendar, DollarSign, User, Clock, CheckCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { config } from '@/config/env'

interface Contract {
  id: string
  status: string
  proposal: {
    id: string
    amount: number
    coverLetter: string
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
      deadline: string
      client: {
        id: string
        name: string
      }
    }
  }
}

export default function ContractPage() {
  const params = useParams()
  const router = useRouter()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; role: string } | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isFreelancer, setIsFreelancer] = useState(false)

  useEffect(() => {
    const fetchContractAndUser = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          toast.error('Please log in to view contract')
          router.push('/login')
          return
        }

        // Get current user
        const userResponse = await axios.get(`${config.apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setUser(userResponse.data)

        // Get contract details
        const contractResponse = await axios.get(
          `${config.apiUrl}/contracts/proposal/${params.proposalId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        setContract(contractResponse.data.data)
        setIsClient(userResponse.data.role === 'CLIENT')
        setIsFreelancer(userResponse.data.role === 'FREELANCER')
      } catch (error: any) {
        console.error('Error fetching contract:', error)
        if (error.response?.status === 401) {
          toast.error('Please log in to view contract')
          router.push('/login')
        } else if (error.response?.status === 403) {
          toast.error('You are not authorized to view this contract')
          router.push('/jobs')
        } else if (error.response?.status === 404) {
          toast.error('Contract not found')
          router.push('/jobs')
        } else {
          toast.error(error.response?.data?.error || 'Failed to load contract')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchContractAndUser()
  }, [params.jobId, params.proposalId, router])

  const handleAcceptContract = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      console.log('Accepting contract:', contract?.id);
      
      const response = await axios.post(
        `${config.apiUrl}/contracts/${contract?.id}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      console.log('Accept contract response:', response.data);
      
      if (response.data.success) {
        // Refresh contract data
        const contractResponse = await axios.get(
          `${config.apiUrl}/contracts/proposal/${params.proposalId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setContract(contractResponse.data.data)
        
        toast.success('Contract accepted successfully')
      } else {
        toast.error(response.data.error || 'Failed to accept contract')
      }
    } catch (error: any) {
      console.error('Error accepting contract:', error)
      toast.error(error.response?.data?.error || 'Failed to accept contract')
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

  if (!contract) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Contract Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The contract you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push(`/job-poster/dashboard`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Button>
        </div>
      </div>
    )
  }

  const canAcceptContract = (isClient && contract.status === "PENDING") || 
                          (isFreelancer && contract.status === "CLIENT_ACCEPTED")

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push(`/jobs/${params.jobId}/proposals/${params.proposalId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to proposal
        </Button>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">Contract for {contract.proposal.job.title}</CardTitle>
                  <CardDescription className="flex items-center text-muted-foreground">
                    <User className="mr-2 h-4 w-4" />
                    Between {contract.proposal.freelancer.name} and {contract.proposal.job.client.name}
                  </CardDescription>
                </div>
                <Badge variant={contract.status === "ACTIVE" ? "default" : "secondary"}>
                  {contract.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center bg-muted/50 px-3 py-1.5 rounded-md">
                    <DollarSign className="h-4 w-4 mr-1 text-primary" />
                    <span className="font-medium">Amount: ${contract.proposal.amount}</span>
                  </div>
                  <div className="flex items-center bg-muted/50 px-3 py-1.5 rounded-md">
                    <Clock className="h-4 w-4 mr-1 text-primary" />
                    <span className="font-medium">
                      Deadline: {new Date(contract.proposal.job.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Job Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {contract.proposal.job.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Proposal</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {contract.proposal.coverLetter}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Contract Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${contract.proposal.job.client.id ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span>Client has {contract.proposal.job.client.id ? 'accepted' : 'not accepted'} the contract</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${contract.proposal.freelancer.id ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span>Freelancer has {contract.proposal.freelancer.id ? 'accepted' : 'not accepted'} the contract</span>
                    </div>
                  </div>
                </div>

                {canAcceptContract && contract.status !== "ACTIVE" && (
                  <div className="flex gap-2">
                    <Button onClick={handleAcceptContract}>
                      Accept Contract
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