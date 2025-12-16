import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { config } from '@/config/env';


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
      const response = await axios.get(`${config.apiUrl}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      console.log('Notifications response:', response.data)
      setNotifications(response.data)
      setUnreadCount(response.data.filter((n: Notification) => !n.read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      if (axios.isAxiosError(error)) {
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        })
        toast.error(error.response?.data?.message || 'Failed to fetch notifications')
      } else {
        toast.error('Failed to fetch notifications')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      await axios.put(
        `${config.apiUrl}/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      if (axios.isAxiosError(error)) {
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