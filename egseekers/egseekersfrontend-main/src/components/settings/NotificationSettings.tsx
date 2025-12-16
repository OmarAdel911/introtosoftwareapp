"use client"

import { Card } from "@/components/ui/card"
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

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
}

interface NotificationSettingsProps {
  settings: NotificationSettings | null;
  onSettingsChange: (settings: NotificationSettings) => void;
}

export default function NotificationSettings({ settings, onSettingsChange }: NotificationSettingsProps) {

  const handleNotificationUpdate = async (updatedSettings: Partial<NotificationSettings>) => {
    if (!settings) return

    try {
      await api.put('/users/notifications', updatedSettings)
      onSettingsChange({ ...settings, ...updatedSettings })
      toast.success("Notification settings updated successfully")
    } catch (error) {
      console.error("Error updating notifications:", error)
      toast.error("Failed to update notification settings. Please try again.")
    }
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Email Notifications</Label>
            <p className="text-sm text-gray-500">Receive notifications via email</p>
          </div>
          <Switch
            checked={settings.emailNotifications}
            onCheckedChange={(checked) => handleNotificationUpdate({ emailNotifications: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Push Notifications</Label>
            <p className="text-sm text-gray-500">Receive push notifications</p>
          </div>
          <Switch
            checked={settings.pushNotifications}
            onCheckedChange={(checked) => handleNotificationUpdate({ pushNotifications: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Marketing Emails</Label>
            <p className="text-sm text-gray-500">Receive marketing and promotional emails</p>
          </div>
          <Switch
            checked={settings.marketingEmails}
            onCheckedChange={(checked) => handleNotificationUpdate({ marketingEmails: checked })}
          />
        </div>
      </div>
    </Card>
  )
} 