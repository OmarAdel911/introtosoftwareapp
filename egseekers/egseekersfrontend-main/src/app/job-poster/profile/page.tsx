"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building, MapPin, Mail, Globe, Linkedin, Users, DollarSign, Calendar, CheckCircle, Briefcase, FileText } from "lucide-react"
import Link from "next/link"
import { config } from "@/config/env"

// Create axios instance
const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

interface User {
  id: string
  name: string
  email: string
  role: string
  image?: string
  bio?: string
  company?: string
  position?: string
  phone?: string
  location?: string
  website?: string
  linkedin?: string
  jobs?: {
    id: string
    title: string
    status: string
    budget: number
    createdAt: string
    _count: {
      proposals: number
    }
  }[]
  _count?: {
    jobs: number
    activeJobs: number
    completedJobs: number
  }
}

export default function JobPosterProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await api.get('/users/profile')
        if (response.data.role !== 'CLIENT') {
          toast.error('Access denied. This page is for job posters only.')
          router.push('/login')
          return
        }

        // Transform the image URL if it's a Cloudinary public ID
        const userData = {
          ...response.data,
          image: response.data.image && !response.data.image.startsWith('http') 
            ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${response.data.image}`
            : response.data.image
        }

        setUser(userData)
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  if (loading) {
    return (
      <div className="container py-8 flex justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-4xl">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
        <p className="text-muted-foreground mb-6">We couldn't load your profile data.</p>
        <Button onClick={() => router.push('/login')}>Go to Login</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar className="h-32 w-32 mb-4 ring-4 ring-blue-100">
                    <AvatarImage src={user.image} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl">
                      {user.name?.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{user.name}</h1>
                <p className="text-muted-foreground mb-4">Job Poster</p>

                {user.company && (
                  <div className="flex items-center gap-2 text-blue-600 mb-4 bg-blue-50 px-4 py-2 rounded-full">
                    <Building className="h-5 w-5" />
                    <span className="font-medium">{user.company}</span>
                  </div>
                )}

                {user.position && (
                  <Badge variant="secondary" className="mb-4 bg-purple-100 text-purple-700 hover:bg-purple-200">
                    {user.position}
                  </Badge>
                )}

                <div className="space-y-3 w-full text-left bg-gray-50 p-4 rounded-lg">
                  {user.location && (
                    <div className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                      <MapPin className="h-4 w-4" />
                      <span>{user.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>

                  {user.website && (
                    <div className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                      <Globe className="h-4 w-4" />
                      <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {user.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>

                {user.linkedin && (
                  <a 
                    href={user.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mt-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                    <span>Connect on LinkedIn</span>
                  </a>
                )}

                <Link href="/job-poster/settings" className="w-full mt-6">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all">
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Hiring Stats</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg hover:bg-blue-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      <span className="text-muted-foreground">Total Jobs Posted</span>
                    </div>
                    <span className="font-medium text-blue-600">{user._count?.jobs || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg hover:bg-green-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-muted-foreground">Active Jobs</span>
                    </div>
                    <span className="font-medium text-green-600">{user._count?.activeJobs || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg hover:bg-purple-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <span className="text-muted-foreground">Completed Jobs</span>
                    </div>
                    <span className="font-medium text-purple-600">{user._count?.completedJobs || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">About</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {user.bio || 'No bio provided'}
                </p>
              </CardContent>
            </Card>

            {user.jobs && user.jobs.length > 0 && (
              <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Recent Job Postings</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="space-y-4">
                    {user.jobs.map((job) => (
                      <Card key={job.id} className="p-4 border border-gray-100 hover:border-blue-100 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                          <Badge 
                            variant={job.status === 'OPEN' ? 'default' : 'secondary'}
                            className={job.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                          >
                            {job.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                            <span>${job.budget.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-purple-50 px-3 py-1 rounded-full">
                            <Users className="h-4 w-4 text-purple-600" />
                            <span>{job._count.proposals} proposals</span>
                          </div>
                          <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full">
                            <Calendar className="h-4 w-4 text-gray-600" />
                            <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Link href={`/jobs/${job.id}`}>
                            <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600 transition-colors">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 