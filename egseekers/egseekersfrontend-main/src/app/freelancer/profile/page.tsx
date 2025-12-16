"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { toast } from "sonner"
import { config } from "@/config/env"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, MapPin, Mail, Globe, Linkedin, Github, Calendar, Briefcase, Award, FileText } from "lucide-react"
import Link from "next/link"

// Create axios instance
const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for authentication
api.interceptors.request.use((requestConfig) => {
  const token = localStorage.getItem('token')
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`
  }
  return requestConfig
})

interface User {
  id: string
  name: string
  email: string
  role: string
  image?: string
  bio?: string
  skills?: string[]
  hourlyRate?: number
  phone?: string
  location?: string
  website?: string
  linkedin?: string
  github?: string
  portfolio?: {
    id: string
    title: string
    description: string
    imageUrl?: string
    projectUrl?: string
    createdAt: string
  }[]
  reviews?: {
    id: string
    rating: number
    comment: string
    createdAt: string
    user: {
      id: string
      name: string
      image?: string
    }
  }[]
  _count?: {
    jobs: number
    proposals: number
    portfolio: number
    reviews: number
  }
}

export default function FreelancerProfilePage() {
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
        if (response.data.role !== 'FREELANCER') {
          toast.error('Access denied. This page is for freelancers only.')
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

  const totalReviews = user.reviews?.length ?? 0
  const totalRating = user.reviews?.reduce((acc, review) => acc + review.rating, 0) ?? 0
  const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar className="h-32 w-32 mb-4 ring-4 ring-white shadow-xl">
                    <AvatarImage src={user.image} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl">
                      {user.name?.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1 rounded-full border-2 border-white">
                    <div className="h-3 w-3 rounded-full bg-white"></div>
                  </div>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">{user.name}</h1>
                <p className="text-muted-foreground mb-4">Freelancer</p>
                
                {user.hourlyRate && (
                  <Badge variant="secondary" className="mb-4 bg-blue-50 text-blue-700 hover:bg-blue-100">
                    ${user.hourlyRate}/hr
                  </Badge>
                )}

                <div className="flex items-center gap-1 text-yellow-500 mb-4 bg-yellow-50 px-3 py-1 rounded-full">
                  <Star className="fill-yellow-500 h-5 w-5" />
                  <span className="font-medium">{averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({user.reviews?.length || 0} reviews)</span>
                </div>

                <div className="space-y-3 w-full text-left bg-gray-50 p-4 rounded-lg">
                  {user.location && (
                    <div className="flex items-center gap-2 text-muted-foreground hover:text-gray-900 transition-colors">
                      <MapPin className="h-4 w-4" />
                      <span>{user.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-muted-foreground hover:text-gray-900 transition-colors">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>

                  {user.website && (
                    <div className="flex items-center gap-2 text-muted-foreground hover:text-gray-900 transition-colors">
                      <Globe className="h-4 w-4" />
                      <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                        {user.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mt-6">
                  {user.linkedin && (
                    <a href={user.linkedin} target="_blank" rel="noopener noreferrer" 
                       className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {user.github && (
                    <a href={user.github} target="_blank" rel="noopener noreferrer"
                       className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                      <Github className="h-5 w-5" />
                    </a>
                  )}
                </div>

                <Link href="/freelancer/settings" className="w-full mt-6">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all">
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Stats</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      <span className="text-muted-foreground">Jobs Completed</span>
                    </div>
                    <span className="font-medium text-blue-600">{user._count?.jobs || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="text-muted-foreground">Proposals Sent</span>
                    </div>
                    <span className="font-medium text-green-600">{user._count?.proposals || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-purple-600" />
                      <span className="text-muted-foreground">Portfolio Items</span>
                    </div>
                    <span className="font-medium text-purple-600">{user._count?.portfolio || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">About Me</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {user.bio || 'No bio provided'}
                </p>
              </CardContent>
            </Card>

            {user.skills && user.skills.length > 0 && (
              <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-xl bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Skills</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {user.portfolio && user.portfolio.length > 0 && (
              <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-xl bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Portfolio</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.portfolio.map((item) => (
                      <Card key={item.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                        {item.imageUrl && (
                          <div className="aspect-video overflow-hidden">
                            <img 
                              src={item.imageUrl} 
                              alt={item.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2 text-gray-900">{item.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                          {item.projectUrl && (
                            <a 
                              href={item.projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block font-medium"
                            >
                              View Project →
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {user.reviews && user.reviews.length > 0 && (
              <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-xl bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Client Reviews</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="space-y-4">
                    {user.reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-4 mb-2">
                          <Avatar className="h-8 w-8 ring-2 ring-white">
                            <AvatarImage src={review.user.image} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                              {review.user.name?.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{review.user.name}</p>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: review.rating }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground ml-auto">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                      </div>
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