"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase, DollarSign, Clock, Tag, MapPin, Globe, ArrowLeft, ArrowRight, CheckCircle2, Circle } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { config } from '@/config/env';

export default function PostJobPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    skills: "",
    deadline: "",
    jobType: "fixed",
    experience: "intermediate",
    duration: "1_to_3_months",
    location: "remote",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Format the data for the API
      const jobData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budget: parseFloat(formData.budget),
        skills: formData.skills.split(",").map(skill => skill.trim()),
        deadline: new Date(formData.deadline).toISOString(),
        jobType: formData.jobType,
        experience: formData.experience,
        duration: formData.duration,
        location: formData.location,
        status: "OPEN"
      }

      // Send the request to the backend API
      const response = await axios.post(
        '${config.apiUrl}/jobs',
        jobData,  
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      toast.success("Job posted successfully!")
      router.push(`/jobs/${response.data.data.id}`)
    } catch (error: any) {
      console.error("Error posting job:", error)
      setError(error.response?.data?.error || "Failed to post job")
      toast.error(error.response?.data?.error || "Failed to post job")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="mb-4" 
            onClick={() => router.push('/job-poster/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Post a New Job</h1>
          <p className="text-muted-foreground mt-2">
            Create a detailed job posting to find the perfect freelancer for your project
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          <div className="flex justify-between mt-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex flex-col items-center",
                  i + 1 === currentStep ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center mb-1",
                  i + 1 < currentStep ? "bg-primary text-primary-foreground" : 
                  i + 1 === currentStep ? "border-2 border-primary" : "border-2 border-muted"
                )}>
                  {i + 1 < currentStep ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{i + 1}</span>
                  )}
                </div>
                <span className="text-xs font-medium">
                  {i === 0 ? "Basic Info" : i === 1 ? "Details" : "Review"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Card className="w-full border-0 shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="text-sm text-red-500 text-center p-3 bg-red-50 rounded-md">{error}</div>
              )}

              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in-50 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-base">Job Title</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="title"
                        name="title"
                        placeholder="e.g., Website Development for E-commerce Store"
                        className="pl-9 h-11"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Be specific about the job title to attract the right freelancers</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-base">Job Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe the job requirements, deliverables, and any specific details..."
                      className="min-h-[200px] resize-none"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">Provide clear instructions and expectations for the project</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-base">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleSelectChange("category", value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Web Development">Web Development</SelectItem>
                        <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                        <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                        <SelectItem value="Graphic Design">Graphic Design</SelectItem>
                        <SelectItem value="Content Writing">Content Writing</SelectItem>
                        <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                        <SelectItem value="Data Science">Data Science</SelectItem>
                        <SelectItem value="Video & Animation">Video & Animation</SelectItem>
                        <SelectItem value="Translation">Translation</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 2: Job Details */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in-50 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="budget" className="text-base">Budget ($)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="budget"
                          name="budget"
                          type="number"
                          min="1"
                          placeholder="e.g., 500"
                          className="pl-9 h-11"
                          value={formData.budget}
                          onChange={handleChange}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jobType" className="text-base">Job Type</Label>
                      <Select
                        value={formData.jobType}
                        onValueChange={(value) => handleSelectChange("jobType", value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-full h-11">
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed Price</SelectItem>
                          <SelectItem value="hourly">Hourly Rate</SelectItem>
                          <SelectItem value="milestone">Milestone Based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills" className="text-base">Required Skills (comma separated)</Label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="skills"
                        name="skills"
                        placeholder="e.g., React, Node.js, MongoDB"
                        className="pl-9 h-11"
                        value={formData.skills}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">List the key skills required for this job</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="experience" className="text-base">Experience Level</Label>
                      <Select
                        value={formData.experience}
                        onValueChange={(value) => handleSelectChange("experience", value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-full h-11">
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">Entry Level</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-base">Project Duration</Label>
                      <Select
                        value={formData.duration}
                        onValueChange={(value) => handleSelectChange("duration", value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-full h-11">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="less_than_1_month">Less than 1 month</SelectItem>
                          <SelectItem value="1_to_3_months">1-3 months</SelectItem>
                          <SelectItem value="3_to_6_months">3-6 months</SelectItem>
                          <SelectItem value="more_than_6_months">More than 6 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-base">Work Location</Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value) => handleSelectChange("location", value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder="Select work location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="onsite">On-site</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline" className="text-base">Application Deadline</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="deadline"
                        name="deadline"
                        type="date"
                        className="pl-9 h-11"
                        value={formData.deadline}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in-50 duration-300">
                  <div className="bg-muted/30 p-6 rounded-lg space-y-4">
                    <h3 className="text-lg font-semibold">Job Summary</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Job Title</p>
                        <p className="font-medium">{formData.title || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Category</p>
                        <p className="font-medium">{formData.category || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="font-medium">${formData.budget || "0"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Job Type</p>
                        <p className="font-medium capitalize">{formData.jobType?.replace("_", " ") || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Experience Level</p>
                        <p className="font-medium capitalize">{formData.experience || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium capitalize">{formData.duration?.replace(/_/g, " ") || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium capitalize">{formData.location || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Deadline</p>
                        <p className="font-medium">{formData.deadline ? new Date(formData.deadline).toLocaleDateString() : "Not specified"}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Required Skills</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {formData.skills ? (
                          formData.skills.split(",").map((skill, index) => (
                            <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                              {skill.trim()}
                            </span>
                          ))
                        ) : (
                          <p className="font-medium">Not specified</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="mt-1 whitespace-pre-line">{formData.description || "Not specified"}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                {currentStep > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={prevStep}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                )}
                
                {currentStep < totalSteps ? (
                  <Button 
                    type="button" 
                    className="ml-auto" 
                    onClick={nextStep}
                    disabled={isLoading}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="ml-auto" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Posting Job..." : "Post Job"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 