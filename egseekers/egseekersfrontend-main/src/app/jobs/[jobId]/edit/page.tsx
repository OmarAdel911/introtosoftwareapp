"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, Briefcase, Calendar, DollarSign, MapPin, Clock, User } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { config } from '@/config/env'

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
  client: {
    id: string
    name: string
  }
}

export default function EditJobPage() {
  const params = useParams()
  const jobId = params?.jobId as string
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [job, setJob] = useState<Job | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    skills: '',
    deadline: '',
    jobType: 'fixed',
    experience: 'intermediate',
    duration: '1_to_3_months',
    location: 'remote',
  })

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await axios.get(`${config.apiUrl}/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }   
        })

        const job = response.data
        setJob(job)
        setFormData({
          title: job.title,
          description: job.description,
          category: job.category,
          budget: job.budget.toString(),
          skills: job.skills.join(', '),
          deadline: new Date(job.deadline).toISOString().split('T')[0],
          jobType: job.jobType || 'fixed',
          experience: job.experience || 'intermediate',
          duration: job.duration || '1_to_3_months',
          location: job.location || 'remote',
        })
      } catch (error: any) {
        console.error('Error fetching job:', error)
        if (error.response?.status === 401) {
          toast.error('Please log in to edit job')
          router.push('/login')
        } else {
          toast.error('Failed to load job details')
        }
      } finally {
        setLoading(false)
      }
    }

    if (jobId) {
      fetchJob()
    }
  }, [jobId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const updatedJob = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budget: parseFloat(formData.budget),
        skills: formData.skills.split(',').map(skill => skill.trim()),
        deadline: new Date(formData.deadline).toISOString(),
        jobType: formData.jobType,
        experience: formData.experience,
        duration: formData.duration,
        location: formData.location
      }

      await axios.put(
        `${config.apiUrl}/jobs/${jobId}`,
        updatedJob,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success('Job updated successfully')
      router.push(`/jobs/${jobId}`)
    } catch (error: any) {
      console.error('Error updating job:', error)
      toast.error(error.response?.data?.error || 'Failed to update job')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
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
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
          <p className="text-muted-foreground mb-4">The job you're trying to edit doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/job-poster/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push(`/jobs/${jobId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Job Details
        </Button>

        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="h-2 bg-primary"></div>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Edit Job</CardTitle>
            <CardDescription>
              Update the details of your job posting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter job title"
                  required
                />
                <p className="text-xs text-muted-foreground">A clear, concise title that describes the job</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the job requirements and responsibilities"
                  className="min-h-[150px]"
                  required
                />
                <p className="text-xs text-muted-foreground">Provide detailed information about the job requirements, responsibilities, and expectations</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Web Development">Web Development</SelectItem>
                      <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                      <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                      <SelectItem value="Content Writing">Content Writing</SelectItem>
                      <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                      <SelectItem value="Data Science">Data Science</SelectItem>
                      <SelectItem value="Machine Learning">Machine Learning</SelectItem>
                      <SelectItem value="DevOps">DevOps</SelectItem>
                      <SelectItem value="Cloud Computing">Cloud Computing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="1"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="Enter budget amount"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Required Skills (comma separated)</Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="e.g., React, Node.js, MongoDB"
                  required
                />
                <p className="text-xs text-muted-foreground">List the skills required for this job, separated by commas</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobType">Job Type</Label>
                  <Select
                    value={formData.jobType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, jobType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                      <SelectItem value="hourly">Hourly Rate</SelectItem>
                      <SelectItem value="milestone">Milestone Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experience Level</Label>
                  <Select
                    value={formData.experience}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Project Duration</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="less_than_1_week">Less than 1 week</SelectItem>
                      <SelectItem value="less_than_1_month">Less than 1 month</SelectItem>
                      <SelectItem value="1_to_3_months">1-3 months</SelectItem>
                      <SelectItem value="3_to_6_months">3-6 months</SelectItem>
                      <SelectItem value="more_than_6_months">More than 6 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Work Location</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select work location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Application Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/jobs/${jobId}`)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
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