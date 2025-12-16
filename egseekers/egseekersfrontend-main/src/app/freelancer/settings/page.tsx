"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { X, Upload, FileText } from "lucide-react"
import { freelancerApi } from "@/lib/api/freelancer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IdVerification } from '@/components/verification/IdVerification'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
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
  title?: string
  bio?: string
  skills?: string[]
  hourlyRate?: number
  phone?: string
  location?: string
  website?: string
  linkedin?: string
  github?: string
  availability?: string
  languages?: string[]
  timezone?: string
  preferredPaymentMethod?: string
  taxInfo?: {
    taxId?: string
    country?: string
    state?: string
    routingNumber?: string
    accountType?: string
    bankName?: string
    automaticPayouts?: boolean
    minimumPayout?: number
  }
  verificationStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED'
  resume?: {
    id: string
    filename: string
    path: string
    mimeType: string
    size: number
  }
  resumeUrl?: string
}

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  jobAlerts: boolean
  proposalUpdates: boolean
  paymentNotifications: boolean
  messageNotifications: boolean
  clientMessages: boolean
  contractUpdates: boolean
  milestoneUpdates: boolean
  paymentUpdates: boolean
  reviewRequests: boolean
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  loginAlerts: boolean
  sessionTimeout: number
}

interface PortfolioItem {
  id: string
  title: string
  description: string
  imageUrl?: string
  projectUrl?: string
  skills?: string[]
}

interface AvailabilitySchedule {
  monday: { start: string; end: string; available: boolean }
  tuesday: { start: string; end: string; available: boolean }
  wednesday: { start: string; end: string; available: boolean }
  thursday: { start: string; end: string; available: boolean }
  friday: { start: string; end: string; available: boolean }
  saturday: { start: string; end: string; available: boolean }
  sunday: { start: string; end: string; available: boolean }
}

interface ResumeFile {
  id: string;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  url: string;
}

export default function FreelancerSettingsPage() {
  const router = useRouter()
  const { user: authUser, loading: authLoading } = useAuth()
  const [localUser, setLocalUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    jobAlerts: true,
    proposalUpdates: true,
    paymentNotifications: true,
    messageNotifications: true,
    clientMessages: true,
    contractUpdates: true,
    milestoneUpdates: true,
    paymentUpdates: true,
    reviewRequests: true,
  })
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: 30,
  })
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [deleteAccount, setDeleteAccount] = useState(false)
  const [newSkill, setNewSkill] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NOT_SUBMITTED')
  const [resumeFile, setResumeFile] = useState<ResumeFile | null>(null)
  const [resumePreview, setResumePreview] = useState<{
    id: string
    filename: string
    path: string
    mimeType: string
    size: number
    url: string
  } | null>(null)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      // Use AuthContext instead of localStorage check
      if (authLoading) {
        return // Still loading
      }

      if (!authUser) {
        router.push('/login')
        return
      }

      if (authUser.role !== 'FREELANCER') {
        router.push('/login')
        return
      }

      try {
        // Fetch additional user data if needed
        const response = await api.get('/users/profile')
        
        // Ensure all user fields have default values to prevent undefined
        const userData = {
          ...response.data,
          name: response.data.name || '',
          email: response.data.email || '',
          bio: response.data.bio || '',
          skills: response.data.skills || [],
          hourlyRate: response.data.hourlyRate || 0,
          phone: response.data.phone || '',
          location: response.data.location || '',
          website: response.data.website || '',
          linkedin: response.data.linkedin || '',
          github: response.data.github || '',
          availability: response.data.availability || '',
          languages: response.data.languages || [],
          timezone: response.data.timezone || '',
          preferredPaymentMethod: response.data.preferredPaymentMethod || '',
          taxInfo: response.data.taxInfo || {
            taxId: '',
            country: '',
            state: ''
          }
        }
        
        setLocalUser(userData)
        
        // Fetch verification status
        const verificationResponse = await api.get('/verification/status')
        setVerificationStatus(verificationResponse.data.status)
        
        // Fetch user's resume if exists
        try {
          const filesResponse = await api.get('/files/files')
          const resumeFile = filesResponse.data.find((file: any) => 
            file.mimeType === 'application/pdf' || 
            file.mimeType === 'application/msword' || 
            file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          )
          
          if (resumeFile) {
            setResumePreview(resumeFile)
          }
        } catch (filesError) {
          console.error('Failed to fetch resume:', filesError)
        }

        setPhoneNumber(response.data.phone || '')
        setResumeUrl(response.data.resumeUrl || '')
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    try {
      await api.put('/users/security/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      toast.success('Password updated successfully')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      console.error('Failed to update password:', error)
      toast.error('Failed to update password')
    }
  }

  const handleSecuritySettings = async () => {
    try {
      await api.put('/users/security/2fa', {
        enabled: securitySettings.twoFactorEnabled
      })
      toast.success('Security settings updated')
    } catch (error) {
      console.error('Failed to update security settings:', error)
      toast.error('Failed to update security settings')
    }
  }

  const handlePortfolioUpdate = async () => {
    try {
      await api.put('/users/portfolio', {
        title: localUser?.name || '',
        description: localUser?.bio || '',
        items: portfolio.map(item => ({
          id: item.id || '',
          title: item.title || '',
          description: item.description || '',
          imageUrl: item.imageUrl || '',
          projectUrl: item.projectUrl || '',
          skills: item.skills || []
        }))
      })
      toast.success('Portfolio updated successfully')
    } catch (error) {
      console.error('Failed to update portfolio:', error)
      toast.error('Failed to update portfolio')
    }
  }

  const handleDeleteAccount = async () => {
    if (!deleteAccount) {
      toast.error('Please confirm account deletion')
      return
    }

    try {
      await api.delete('/user/account')
      localStorage.removeItem('token')
      router.push('/login')
      toast.success('Account deleted successfully')
    } catch (error) {
      console.error('Failed to delete account:', error)
      toast.error('Failed to delete account')
    }
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && localUser?.skills) {
      if (!localUser.skills.includes(newSkill.trim())) {
        setLocalUser({
          ...localUser,
          skills: [...localUser.skills, newSkill.trim()]
        })
      }
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    if (localUser?.skills) {
      setLocalUser({
        ...localUser,
        skills: localUser.skills.filter(skill => skill !== skillToRemove)
      })
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      try {
        const formData = new FormData()
        formData.append('avatar', file)
        const response = await api.post('/avatar/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        setLocalUser(prev => prev ? { ...prev, image: response.data.image } : null)
        toast.success('Profile picture updated successfully')
      } catch (error) {
        console.error('Failed to upload avatar:', error)
        toast.error('Failed to upload profile picture')
      }
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify({ type: 'resume' }));

    try {
      setIsLoading(true);
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data, // Prevent axios from transforming FormData
      });

      if (response.data) {
        // Ensure the URL is properly formatted for PDF viewing
        const fileUrl = response.data.url;
        const formattedUrl = fileUrl.includes('raw/upload') 
          ? fileUrl.replace('raw/upload', 'raw/upload/fl_attachment')
          : fileUrl;

        setResumeFile({
          id: response.data.id,
          filename: response.data.filename,
          path: response.data.path,
          mimeType: response.data.mimeType,
          size: response.data.size,
          url: formattedUrl
        });
        toast.success('Resume uploaded successfully');
      }
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Failed to upload resume. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!resumeFile) return;

    try {
      setIsLoading(true);
      await api.delete(`/files/${resumeFile.id}`);
      setResumeFile(null);
      toast.success('Resume deleted successfully');
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error('Failed to delete resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!localUser) return
    
    try {
      const response = await api.put('/users/profile', {
        name: localUser.name,
        bio: localUser.bio,
        skills: localUser.skills,
        hourlyRate: localUser.hourlyRate,
        phone: localUser.phone,
        location: localUser.location,
        website: localUser.website,
        linkedin: localUser.linkedin,
        github: localUser.github,
        availability: localUser.availability,
        languages: localUser.languages,
        timezone: localUser.timezone,
        preferredPaymentMethod: localUser.preferredPaymentMethod,
        taxInfo: localUser.taxInfo
      })
      
      setLocalUser(response.data)
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile')
    }
  }

  const handleSaveNotifications = async () => {
    try {
      await api.put('/users/notifications', {
        email: notificationSettings.emailNotifications,
        push: notificationSettings.pushNotifications,
        marketing: notificationSettings.marketingEmails
      })
      toast.success('Notification preferences updated')
    } catch (error) {
      console.error('Failed to update notification settings:', error)
      toast.error('Failed to update notification settings')
    }
  }

  const handleSaveBilling = async () => {
    if (!localUser) return

    try {
      await api.put('/users/billing', {
        paymentMethod: {
          type: localUser.preferredPaymentMethod || '',
          taxInfo: {
            taxId: localUser.taxInfo?.taxId || '',
            country: localUser.taxInfo?.country || '',
            state: localUser.taxInfo?.state || ''
          }
        }
      })
      toast.success('Billing information updated')
    } catch (error) {
      console.error('Failed to update billing information:', error)
      toast.error('Failed to update billing information')
    }
  }

  const handlePhoneNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhoneNumber = e.target.value;
    setPhoneNumber(newPhoneNumber);

    try {
      await api.put('/users/profile', {
        phone: newPhoneNumber,
      });
      toast.success('Phone number updated successfully');
    } catch (error) {
      console.error('Error updating phone number:', error);
      toast.error('Failed to update phone number');
    }
  };

  if (loading) {
    return <div>Loading...</div>
  }

  if (!localUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Freelancer Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your freelancer profile and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
            <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Profile</TabsTrigger>
            <TabsTrigger value="verification" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Verification</TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Notifications</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Security</TabsTrigger>
            <TabsTrigger value="payout" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Payout</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Profile Information</CardTitle>
                <CardDescription>Update your freelancer profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 ring-4 ring-blue-100">
                      <AvatarImage src={avatarPreview || localUser?.image} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl">
                        {localUser?.name?.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2">
                      <label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow">
                          <Upload className="h-5 w-5 text-blue-600" />
                        </div>
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium mb-2">Profile Picture</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload a professional photo to help build trust with clients
                    </p>
                    {avatarPreview && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAvatarFile(null)
                          setAvatarPreview(null)
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={localUser?.name || ''}
                      onChange={(e) => setLocalUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="bg-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={localUser?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Professional Title</Label>
                    <Input
                      id="title"
                      value={(localUser as any)?.title || ''}
                      onChange={(e) => setLocalUser(prev => (prev ? ({ ...(prev as any), title: e.target.value } as any) : null))}
                      className="bg-white/50"
                      placeholder="e.g. Senior Web Developer"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={localUser?.phone || ''}
                      onChange={(e) => setLocalUser(prev => prev ? { ...prev, phone: e.target.value } : null)}
                      className="bg-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={localUser?.location || ''}
                      onChange={(e) => setLocalUser(prev => prev ? { ...prev, location: e.target.value } : null)}
                      className="bg-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Portfolio Website</Label>
                    <Input
                      id="website"
                      value={localUser?.website || ''}
                      onChange={(e) => setLocalUser(prev => prev ? { ...prev, website: e.target.value } : null)}
                      className="bg-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn Profile</Label>
                    <Input
                      id="linkedin"
                      value={localUser?.linkedin || ''}
                      onChange={(e) => setLocalUser(prev => prev ? { ...prev, linkedin: e.target.value } : null)}
                      className="bg-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub Profile</Label>
                    <Input
                      id="github"
                      value={localUser?.github || ''}
                      onChange={(e) => setLocalUser(prev => prev ? { ...prev, github: e.target.value } : null)}
                      className="bg-white/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">About</Label>
                  <Textarea
                    id="bio"
                    value={localUser?.bio || ''}
                    onChange={(e) => setLocalUser(prev => prev ? { ...prev, bio: e.target.value } : null)}
                    placeholder="Tell clients about your skills, experience, and what you can offer"
                    className="bg-white/50 min-h-[120px]"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {localUser?.skills?.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        {skill}
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 hover:text-blue-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <Input
                      placeholder="Add a skill"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newSkill.trim()) {
                          handleAddSkill()
                          setNewSkill('')
                        }
                      }}
                      className="w-40 bg-white/50"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveProfile}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Identity Verification</CardTitle>
                <CardDescription>Verify your identity to build trust with clients</CardDescription>
              </CardHeader>
              <CardContent>
                <IdVerification />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Email Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors">
                        <div className="space-y-1">
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                        </div>
                        <Switch
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={() => handleNotificationChange('emailNotifications')}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors">
                        <div className="space-y-1">
                          <Label>Marketing Emails</Label>
                          <p className="text-sm text-muted-foreground">Receive marketing and promotional emails</p>
                        </div>
                        <Switch
                          checked={notificationSettings.marketingEmails}
                          onCheckedChange={() => handleNotificationChange('marketingEmails')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Platform Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors">
                        <div className="space-y-1">
                          <Label>Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
                        </div>
                        <Switch
                          checked={notificationSettings.pushNotifications}
                          onCheckedChange={() => handleNotificationChange('pushNotifications')}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors">
                        <div className="space-y-1">
                          <Label>Job Matches</Label>
                          <p className="text-sm text-muted-foreground">Get notified about jobs matching your skills</p>
                        </div>
                        <Switch
                          checked={notificationSettings.jobAlerts}
                          onCheckedChange={() => handleNotificationChange('jobAlerts')}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Communication</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors">
                      <div className="space-y-1">
                        <Label>Message Notifications</Label>
                        <p className="text-sm text-muted-foreground">Get notified about new messages</p>
                      </div>
                      <Switch
                        checked={notificationSettings.messageNotifications}
                        onCheckedChange={() => handleNotificationChange('messageNotifications')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors">
                      <div className="space-y-1">
                        <Label>Client Messages</Label>
                        <p className="text-sm text-muted-foreground">Get notified about messages from clients</p>
                      </div>
                      <Switch
                        checked={notificationSettings.clientMessages}
                        onCheckedChange={() => handleNotificationChange('clientMessages')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors">
                      <div className="space-y-1">
                        <Label>Proposal Updates</Label>
                        <p className="text-sm text-muted-foreground">Get notified about proposal status changes</p>
                      </div>
                      <Switch
                        checked={notificationSettings.proposalUpdates}
                        onCheckedChange={() => handleNotificationChange('proposalUpdates')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors">
                      <div className="space-y-1">
                        <Label>Contract Updates</Label>
                        <p className="text-sm text-muted-foreground">Get notified about contract changes</p>
                      </div>
                      <Switch
                        checked={notificationSettings.contractUpdates}
                        onCheckedChange={() => handleNotificationChange('contractUpdates')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors">
                      <div className="space-y-1">
                        <Label>Milestone Updates</Label>
                        <p className="text-sm text-muted-foreground">Get notified about milestone progress</p>
                      </div>
                      <Switch
                        checked={notificationSettings.milestoneUpdates}
                        onCheckedChange={() => handleNotificationChange('milestoneUpdates')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors">
                      <div className="space-y-1">
                        <Label>Payment Updates</Label>
                        <p className="text-sm text-muted-foreground">Get notified about payment status</p>
                      </div>
                      <Switch
                        checked={notificationSettings.paymentUpdates}
                        onCheckedChange={() => handleNotificationChange('paymentUpdates')}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveNotifications}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="bg-white/50"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handlePasswordChange}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    Update Password
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors">
                    <div className="space-y-1">
                      <Label>Enable 2FA</Label>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={() => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))}
                    />
                  </div>
                  <Button 
                    onClick={handleSecuritySettings}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    Save Security Settings
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-lg text-red-600">Danger Zone</h3>
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-red-600">Delete Account</Label>
                      <p className="text-sm text-red-600/80">Permanently delete your account and all data</p>
                    </div>
                    <Switch
                      checked={deleteAccount}
                      onCheckedChange={setDeleteAccount}
                    />
                  </div>
                  {deleteAccount && (
                    <Button 
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      Delete Account
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payout">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Payout Settings</CardTitle>
                <CardDescription>Manage your payment methods and payout preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Payment Method</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        value={localUser?.taxInfo?.taxId || ''}
                        onChange={(e) => setLocalUser(prev => prev ? { ...prev, taxInfo: { ...prev.taxInfo, taxId: e.target.value } } : null) }
                        className="bg-white/50"
                        placeholder="Enter your bank account number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="routingNumber">Routing Number</Label>
                      <Input
                        id="routingNumber"
                        value={localUser?.taxInfo?.routingNumber || ''}
                        onChange={(e) => setLocalUser(prev => prev ? { ...prev, taxInfo: { ...prev.taxInfo, routingNumber: e.target.value } } : null) }
                        className="bg-white/50"
                        placeholder="Enter your bank routing number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountType">Account Type</Label>
                      <Select
                        value={localUser?.taxInfo?.accountType || ''}
                        onValueChange={(value) => setLocalUser(prev => prev ? { ...prev, taxInfo: { ...prev.taxInfo, accountType: value } } : null) }
                      >
                        <SelectTrigger className="bg-white/50">
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Checking</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={localUser?.taxInfo?.bankName || ''}
                        onChange={(e) => setLocalUser(prev => prev ? { ...prev, taxInfo: { ...prev.taxInfo, bankName: e.target.value } } : null) }
                        className="bg-white/50"
                        placeholder="Enter your bank name"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Payout Schedule</h3>
                  <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors">
                    <div className="space-y-1">
                      <Label>Automatic Payouts</Label>
                      <p className="text-sm text-muted-foreground">Receive automatic payouts when your balance reaches the minimum threshold</p>
                    </div>
                    <Switch
                      checked={localUser?.taxInfo?.automaticPayouts || false}
                      onCheckedChange={(checked) => setLocalUser(prev => prev ? { ...prev, taxInfo: { ...prev.taxInfo, automaticPayouts: checked } } : null) }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimumPayout">Minimum Payout Amount</Label>
                    <Input
                      id="minimumPayout"
                      type="number"
                      value={localUser?.taxInfo?.minimumPayout || ''}
                      onChange={(e) => setLocalUser(prev => prev ? { ...prev, taxInfo: { ...prev.taxInfo, minimumPayout: parseFloat(e.target.value) } } : null) }
                      className="bg-white/50"
                      placeholder="Enter minimum payout amount"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveBilling}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    Save Payout Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}