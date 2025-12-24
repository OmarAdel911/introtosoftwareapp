import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api/api';


export interface Notification {
  id: string
  type: 'CHAT' | 'PROPOSAL' | 'JOB'
  senderId: string
  read: boolean
  createdAt: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.log('No token found for notifications')
        setIsLoading(false)
        return
      }

      console.log('Fetching notifications...')
      const response = await api.get('/notifications')

      console.log('Notifications response:', response.data)
      setNotifications(response.data)
      setUnreadCount(response.data.filter((n: Notification) => !n.read).length)
    } catch (error: any) {
      console.error('Error fetching notifications:', error)
      if (error.response) {
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        })
        toast.error(error.response?.data?.message || 'Failed to fetch notifications')
      } else if (error.message === 'Network Error') {
        console.error('Network error - backend may be unavailable')
        // Don't show toast for network errors to avoid spam
      } else {
        toast.error('Failed to fetch notifications')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`, {})

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error: any) {
      console.error('Error marking notification as read:', error)
      if (error.response) {
        toast.error(error.response?.data?.message || 'Failed to mark notification as read')
      }
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    fetchNotifications
  }
}