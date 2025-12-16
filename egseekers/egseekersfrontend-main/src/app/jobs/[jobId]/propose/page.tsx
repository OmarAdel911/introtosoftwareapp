"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, DollarSign, Clock, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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
  }
}

export default function ProposePage() {
  const params = useParams()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    coverLetter: '',
    estimatedDuration: '',
  })

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const token = localStorage.getItem('token')
        console.log('Token exists:', !!token)
        console.log('Job ID:', params.jobId)
        
        if (!token) {
          console.log('No token found, redirecting to login')
          router.push('/login')
          return
        }
        
        console.log('Making API call to fetch job:', `/jobs/${params.jobId}`)
        const response = await apiClient.get(`/jobs/${params.jobId}`)
        console.log('API response:', response)
        
        if (response.success && response.data && (response.data as any).id) {
          console.log('Job data received:', response.data)
          setJob(response.data as Job)
        } else {
          console.log('No job data in response')
          toast.error('Failed to load job details')
          router.push('/jobs')
        }
      } catch (error) {
        console.error('Error fetching job:', error)
        toast.error('Failed to load job details')
        router.push('/jobs')
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [params.jobId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }
      
      await apiClient.post('/proposals', {
        jobId: params.jobId,
        amount: parseFloat(formData.amount),
        coverLetter: formData.coverLetter,
        estimatedDuration: formData.estimatedDuration,
      })

      toast.success('Proposal submitted successfully')
      router.push(`/jobs/${params.jobId}`)
    } catch (error: any) {
      console.error('Error submitting proposal:', error)
      toast.error(error.error || 'Failed to submit proposal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBack = () => {
    router.push(`/jobs/${params.jobId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!job) {
    return null
  }

  return (
    <div className="container max-w-4xl py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={handleBack}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Job Details
      </Button>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Submit Proposal for {job.title}
            </CardTitle>
            <CardDescription className="text-gray-500">
              Make sure to provide a compelling proposal that highlights your expertise and value.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 mb-6">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Budget: ${job.budget}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Posted {formatDistanceToNow(new Date(job.postedAt), { addSuffix: true })}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Deadline: {formatDistanceToNow(new Date(job.deadline), { addSuffix: true })}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Proposed Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter your proposed amount"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedDuration">Estimated Duration</Label>
                <Input
                  id="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                  placeholder="e.g., 2 weeks, 1 month"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverLetter">Cover Letter</Label>
                <Textarea
                  id="coverLetter"
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                  placeholder="Explain why you're the best fit for this job..."
                  className="min-h-[200px]"
                  required
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Proposal'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 