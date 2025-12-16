"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import axios from "axios"
import { config } from "@/config/env"

// Create axios instance
const api = axios.create({
  baseURL:  config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

interface ProfileData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  website?: string;
  hourlyRate?: number;
  twoFactorEnabled?: boolean;
}

interface ProfileSettingsProps {
  profile: ProfileData | null;
  onProfileChange: (profile: ProfileData) => void;
}

export default function ProfileSettings({ profile, onProfileChange }: ProfileSettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      await api.put('/users/profile', profile)
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile. Please try again.")
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.put('/users/password', {
        currentPassword,
        newPassword
      })
      setCurrentPassword("")
      setNewPassword("")
      toast.success("Password updated successfully")
    } catch (error) {
      console.error("Error updating password:", error)
      toast.error("Failed to update password. Please try again.")
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <>
      <Card className="p-6">
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={profile.name || ''}
                onChange={(e) => onProfileChange({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email || ''}
                onChange={(e) => onProfileChange({ ...profile, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profile.phone || ''}
                onChange={(e) => onProfileChange({ ...profile, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profile.location || ''}
                onChange={(e) => onProfileChange({ ...profile, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={profile.website || ''}
                onChange={(e) => onProfileChange({ ...profile, website: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={profile.hourlyRate || ''}
                onChange={(e) => onProfileChange({ ...profile, hourlyRate: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              className="w-full min-h-[100px] p-2 border rounded-md"
              value={profile.bio || ''}
              onChange={(e) => onProfileChange({ ...profile, bio: e.target.value })}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="twoFactor"
              checked={profile.twoFactorEnabled || false}
              onCheckedChange={(checked) => onProfileChange({ ...profile, twoFactorEnabled: checked })}
            />
            <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
          </div>
          <Button type="submit">Save Profile</Button>
        </form>
      </Card>

      <Card className="p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <Button type="submit">Update Password</Button>
        </form>
      </Card>
    </>
  )
} 