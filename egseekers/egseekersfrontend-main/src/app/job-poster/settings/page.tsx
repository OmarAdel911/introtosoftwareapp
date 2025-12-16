"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, CreditCard, X } from "lucide-react"
import { IdVerification } from '@/components/verification/IdVerification'
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
  avatar?: string
  bio?: string
  phone?: string
  location?: string
  website?: string
  linkedin?: string
  company?: string
  position?: string
  role: 'CLIENT' | 'FREELANCER' | 'ADMIN'
  billingAddress?: {
    street: string
    city: string
    state: string
    country: string
    zipCode: string
  }
  paymentMethods?: Array<{
    id: string
    type: string
    last4: string
    expiryMonth: number
    expiryYear: number
  }>
  verificationStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED'
  image?: string
}

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  proposalUpdates: boolean
  paymentNotifications: boolean
  messageNotifications: boolean
  freelancerMessages: boolean
  milestoneUpdates: boolean
  reviewRequests: boolean
  jobApplications: boolean
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  loginAlerts: boolean
  sessionTimeout: number
}

interface BillingInfo {
  cardNumber: string
  expiryDate: string
  cvv: string
  nameOnCard: string
  address: {
    street: string
    city: string
    state: string
    country: string
    zipCode: string
  }
}

export default function JobPosterSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    proposalUpdates: true,
    paymentNotifications: true,
    messageNotifications: true,
    freelancerMessages: true,
    milestoneUpdates: true,
    reviewRequests: true,
    jobApplications: true,
  })
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: 30,
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [deleteAccount, setDeleteAccount] = useState(false)
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    nameOnCard: "",
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    }
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NOT_SUBMITTED')

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const response = await api.get('/users/profile')
        if (response.data.role !== 'CLIENT') {
          toast.error('Access denied. This page is for job posters only.')
          router.push('/login')
          return
        }
        const userData = {
          ...response.data,
          billingAddress: response.data.billingAddress || {
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: ''
          },
          paymentMethods: response.data.paymentMethods || []
        }
        setUser(userData)
        
        // Fetch verification status
        try {
          const verificationResponse = await api.get('/verification/status')
          setVerificationStatus(verificationResponse.data.status)
        } catch (verificationError) {
          console.error('Failed to fetch verification status:', verificationError)
          // Don't redirect on verification status error
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          toast.error('Your session has expired. Please login again.')
          localStorage.removeItem('token')
          router.push('/login')
        } else {
          toast.error('Failed to load user data. Please try again.')
        }
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
        setUser(prev => prev ? { ...prev, image: response.data.image } : null)
        toast.success('Profile picture updated successfully')
      } catch (error) {
        console.error('Failed to upload avatar:', error)
        toast.error('Failed to upload profile picture')
      }
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      const response = await api.put('/users/profile', {
        name: user.name,
        bio: user.bio,
        phone: user.phone,
        location: user.location,
        website: user.website,
        linkedin: user.linkedin,
        company: user.company,
        position: user.position
      })

      setUser(response.data)
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Failed to update profile:', error)
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
    try {
      await api.put('/users/billing', {
        paymentMethod: {
          cardNumber: billingInfo.cardNumber,
          expiryDate: billingInfo.expiryDate,
          nameOnCard: billingInfo.nameOnCard,
          address: billingInfo.address
        }
      })
      toast.success('Billing information updated')
    } catch (error) {
      console.error('Failed to update billing information:', error)
      toast.error('Failed to update billing information')
    }
  }

  const handleRemovePaymentMethod = async (id: string) => {
    if (!user) return;
    
    try {
      await api.delete(`/user/payment-methods/${id}`);
      const updatedUser: User = {
        ...user,
        paymentMethods: user.paymentMethods?.filter((method) => method.id !== id) || []
      };
      setUser(updatedUser);
      toast.success('Payment method removed successfully');
    } catch (error) {
      console.error('Failed to remove payment method:', error);
      toast.error('Failed to remove payment method');
    }
  };

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Client Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your client profile and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
            <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Profile</TabsTrigger>
            <TabsTrigger value="verification" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Verification</TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Notifications</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Security</TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Profile Information</CardTitle>
                <CardDescription>Update your client profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 ring-4 ring-blue-100">
                      <AvatarImage src={avatarPreview || user?.image} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl">
                        {user?.name?.split(" ").map((n) => n[0]).join("")}
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
                      Upload a professional photo to help build trust with freelancers
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
                      value={user?.name || ''}
                      onChange={(e) => setUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="bg-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      value={user?.company || ''}
                      onChange={(e) => setUser(prev => prev ? { ...prev, company: e.target.value } : null)}
                      className="bg-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={user?.position || ''}
                      onChange={(e) => setUser(prev => prev ? { ...prev, position: e.target.value } : null)}
                      className="bg-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={user?.phone || ''}
                      onChange={(e) => setUser(prev => prev ? { ...prev, phone: e.target.value } : null)}
                      className="bg-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={user?.location || ''}
                      onChange={(e) => setUser(prev => prev ? { ...prev, location: e.target.value } : null)}
                      className="bg-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={user?.website || ''}
                      onChange={(e) => setUser(prev => prev ? { ...prev, website: e.target.value } : null)}
                      className="bg-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn Profile</Label>
                    <Input
                      id="linkedin"
                      value={user?.linkedin || ''}
                      onChange={(e) => setUser(prev => prev ? { ...prev, linkedin: e.target.value } : null)}
                      className="bg-white/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">About</Label>
                  <Textarea
                    id="bio"
                    value={user?.bio || ''}
                    onChange={(e) => setUser(prev => prev ? { ...prev, bio: e.target.value } : null)}
                    placeholder="Tell freelancers about your company and projects"
                    className="bg-white/50 min-h-[120px]"
                  />
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
                <CardDescription>Verify your identity to build trust with freelancers</CardDescription>
              </CardHeader>
              <CardContent>
                <IdVerification
                  
                 
                />
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
                          <Label>Proposal Updates</Label>
                          <p className="text-sm text-muted-foreground">Get notified about new proposals</p>
                        </div>
                        <Switch
                          checked={notificationSettings.proposalUpdates}
                          onCheckedChange={() => handleNotificationChange('proposalUpdates')}
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
                        <Label>Freelancer Messages</Label>
                        <p className="text-sm text-muted-foreground">Get notified about messages from freelancers</p>
                      </div>
                      <Switch
                        checked={notificationSettings.freelancerMessages}
                        onCheckedChange={() => handleNotificationChange('freelancerMessages')}
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
                        <Label>Review Requests</Label>
                        <p className="text-sm text-muted-foreground">Get notified about review requests</p>
                      </div>
                      <Switch
                        checked={notificationSettings.reviewRequests}
                        onCheckedChange={() => handleNotificationChange('reviewRequests')}
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

          <TabsContent value="billing">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Billing Information</CardTitle>
                <CardDescription>Manage your billing details and payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Payment Method</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        value={billingInfo.cardNumber}
                        onChange={(e) => setBillingInfo(prev => ({ ...prev, cardNumber: e.target.value }))}
                        className="bg-white/50"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nameOnCard">Name on Card</Label>
                      <Input
                        id="nameOnCard"
                        value={billingInfo.nameOnCard}
                        onChange={(e) => setBillingInfo(prev => ({ ...prev, nameOnCard: e.target.value }))}
                        className="bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        value={billingInfo.expiryDate}
                        onChange={(e) => setBillingInfo(prev => ({ ...prev, expiryDate: e.target.value }))}
                        className="bg-white/50"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="password"
                        value={billingInfo.cvv}
                        onChange={(e) => setBillingInfo(prev => ({ ...prev, cvv: e.target.value }))}
                        className="bg-white/50"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Billing Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        value={billingInfo.address.street}
                        onChange={(e) => setBillingInfo(prev => ({
                          ...prev,
                          address: { ...prev.address, street: e.target.value }
                        }))}
                        className="bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={billingInfo.address.city}
                        onChange={(e) => setBillingInfo(prev => ({
                          ...prev,
                          address: { ...prev.address, city: e.target.value }
                        }))}
                        className="bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={billingInfo.address.state}
                        onChange={(e) => setBillingInfo(prev => ({
                          ...prev,
                          address: { ...prev.address, state: e.target.value }
                        }))}
                        className="bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={billingInfo.address.country}
                        onChange={(e) => setBillingInfo(prev => ({
                          ...prev,
                          address: { ...prev.address, country: e.target.value }
                        }))}
                        className="bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={billingInfo.address.zipCode}
                        onChange={(e) => setBillingInfo(prev => ({
                          ...prev,
                          address: { ...prev.address, zipCode: e.target.value }
                        }))}
                        className="bg-white/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveBilling}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    Save Billing Information
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