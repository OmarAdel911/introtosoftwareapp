import { useState, useEffect } from 'react'
import { messagesApi, Message as ApiMessage } from '@/lib/api/messages'
import { toast } from 'react-hot-toast'
import wsClient from '@/lib/websocket'

export type Message = ApiMessage;

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await messagesApi.getCurrentUser()
        setCurrentUserId(user.id)
      } catch (err) {
        console.error('Error fetching current user:', err)
      }
    }

    fetchCurrentUser()
  }, [])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await messagesApi.getMessages(conversationId)
        setMessages(data)
      } catch (err: any) {
        console.error('Error fetching messages:', err)
        if (err.response?.status === 404) {
          setError('Conversation not found')
          toast.error('Conversation not found')
        } else if (err.response?.status === 401) {
          setError('Please log in to continue')
          toast.error('Please log in to continue')
        } else {
          setError('Failed to load messages')
          toast.error(`Failed to load messages: ${err.message || 'Unknown error'}`)
        }
      } finally {
        setLoading(false)
      }
    }

    if (currentUserId) {
      fetchMessages()

      // Connect to WebSocket when the hook mounts
      wsClient.connect()

      // Handle incoming chat messages
      const handleChatMessage = (data: any) => {
        if (data.type === 'CHAT_MESSAGE' && data.message) {
          const message = data.message
          
          // Check if the message belongs to this conversation
          if (
            (message.senderId === conversationId && message.recipientId === currentUserId) ||
            (message.senderId === currentUserId && message.recipientId === conversationId)
          ) {
            // Check if message already exists to avoid duplicates
            const messageExists = messages.some(m => m.id === message.id)
            if (!messageExists) {
              setMessages(prev => [...prev, message])
            }
          }
        }
      }

      // Subscribe to chat messages
      wsClient.on('CHAT_MESSAGE', handleChatMessage)

      // Cleanup function
      return () => {
        wsClient.off('CHAT_MESSAGE', handleChatMessage)
      }
    }
  }, [conversationId, currentUserId, messages])

  const sendMessage = async (content: string) => {
    if (!currentUserId) {
      toast.error('Please log in to continue')
      throw new Error('Not authenticated')
    }

    try {
      // Send message through REST API
      const newMessage = await messagesApi.sendMessage(conversationId, content)
      
      // Also send through WebSocket for real-time delivery
      try {
        wsClient.sendChatMessage(conversationId, content)
      } catch (wsError) {
        console.error('WebSocket send error:', wsError)
        // Don't throw here as the REST API call succeeded
      }

      // Add the message to the local state
      setMessages(prev => [...prev, newMessage])
      return newMessage
    } catch (err: any) {
      console.error('Error sending message:', err)
      if (err.response?.status === 401) {
        toast.error('Please log in to continue')
      } else if (err.response?.status === 404) {
        toast.error('Recipient not found')
      } else {
        toast.error(`Failed to send message: ${err.message || 'Unknown error'}`)
      }
      throw err
    }
  }

  return {
    messages,
    loading,
    error,
    sendMessage
  }
} 