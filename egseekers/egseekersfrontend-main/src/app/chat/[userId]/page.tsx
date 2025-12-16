"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User, Send, WifiOff } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { useNotifications, Notification } from "@/hooks/useNotifications"
import { useMessages } from "@/hooks/useMessages"
import { messagesApi, Message } from "@/lib/api/messages"
import { toast } from "react-hot-toast"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { api } from "@/lib/api/api"
import wsClient from '@/lib/websocket'

interface User {
  id: string;
  name: string;
  image: string | null;
  role: string;
}

interface WebSocketStatus {
  connected: boolean;
  reconnecting: boolean;
}

// Helper function to transform image URL for Cloudinary
const getImageUrl = (image: string | null) => {
  if (!image) return '';
  
  // If it's already a full URL, return it as is
  if (image.startsWith('http')) return image;
  
  // Otherwise, construct the Cloudinary URL
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'de1mpufjm'}/image/upload/${image}`;
};

export default function ChatPage() {
  const params = useParams()
  const { notifications, markAsRead } = useNotifications()
  const { messages, loading, error, sendMessage } = useMessages(params.userId as string)
  const [otherUser, setOtherUser] = useState<User | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isSending, setIsSending] = useState(false)
  const router = useRouter()
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>({ 
    connected: wsClient.getConnectionStatus() === 'connected', 
    reconnecting: wsClient.getConnectionStatus() === 'connecting' 
  })

  useEffect(() => {
    // Mark chat notifications from this user as read when opening the chat
    notifications
      ?.filter((n: Notification) => n.type === 'CHAT' && n.senderId === params.userId && !n.read)
      .forEach((notification: Notification) => {
        markAsRead(notification.id)
      })
  }, [notifications, params.userId, markAsRead])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  // Add a new effect to scroll to bottom when the component mounts
  useEffect(() => {
    // Initial scroll to bottom
    scrollToBottom();
    
    // Also scroll to bottom after a short delay to ensure content is rendered
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          toast.error('Please log in to continue')
          router.push('/login')
          return
        }

        // Fetch current user
        const userResponse = await api.get<User>('/auth/me')
        setCurrentUser(userResponse.data)

        // Fetch other user details
        try {
          const otherUserResponse = await api.get<User>(`/users/${params.userId}`)
          setOtherUser(otherUserResponse.data)
        } catch (err: any) {
          console.error('Error fetching other user:', err)
          if (err.response?.status === 404) {
            toast.error('User not found')
            router.push('/chat')
          } else {
            toast.error('Failed to load user details')
          }
        }
      } catch (err: any) {
        console.error('Error fetching user data:', err)
        if (err.response?.status === 401) {
          toast.error('Please log in to continue')
          router.push('/login')
        } else {
          toast.error('Failed to load user details')
        }
      }
    }

    fetchUserData()
  }, [params.userId, router])

  useEffect(() => {
    const handleConnectionStatus = (data: any) => {
      if (data.type === 'CONNECTION_STATUS') {
        setWsStatus({ 
          connected: data.status === 'connected', 
          reconnecting: data.status === 'connecting' 
        })
      }
    }

    wsClient.on('CONNECTION_STATUS', handleConnectionStatus)

    return () => {
      wsClient.off('CONNECTION_STATUS', handleConnectionStatus)
    }
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      await sendMessage(newMessage.trim())
      setNewMessage("")
    } catch (err: any) {
      console.error('Error sending message:', err)
      if (err.response?.status === 401) {
        toast.error('Please log in to continue')
      } else if (err.response?.status === 404) {
        toast.error('Recipient not found')
      } else {
        toast.error(`Failed to send message: ${err.message || 'Unknown error'}`)
      }
    } finally {
      setIsSending(false)
    }
  }

  const MessageBubble = ({ message }: { message: Message }) => {
    const isReceived = message.senderId === params.userId;
    const user = isReceived ? message.sender : message.recipient;
    const isCurrentUser = message.senderId === currentUser?.id;

    return (
      <div
        className={`flex items-start gap-3 ${
          isReceived ? 'flex-row' : 'flex-row-reverse'
        }`}
      >
        <Avatar className="h-8 w-8 flex-shrink-0 border-2 border-primary/20">
          <AvatarImage 
            src={isCurrentUser 
              ? getImageUrl(currentUser?.image || null) 
              : getImageUrl(otherUser?.image || null)} 
            alt={isCurrentUser ? currentUser?.name || '' : otherUser?.name || ''} 
          />
          <AvatarFallback className="bg-primary/10 text-primary">
            {isCurrentUser 
              ? currentUser?.name?.[0] || 'U' 
              : otherUser?.name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <div
          className={`flex flex-col max-w-[70%] ${
            isReceived ? 'items-start' : 'items-end'
          }`}
        >
          <div
            className={`rounded-2xl px-4 py-2 ${
              isReceived 
                ? 'bg-white border border-gray-200' 
                : 'bg-primary text-primary-foreground'
            }`}
          >
            <p className="text-sm">{message.content}</p>
          </div>
          <span className="text-xs text-gray-500 mt-1">
            {new Date(message.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading chat..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 mt-16">
      <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          {otherUser && (
            <>
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarImage src={getImageUrl(otherUser.image)} alt={otherUser.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {otherUser.name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold">{otherUser.name}</h2>
                <p className="text-sm text-gray-500 capitalize">{otherUser.role?.toLowerCase()}</p>
              </div>
            </>
          )}
        </div>
        {!wsStatus.connected && (
          <div className="flex items-center text-yellow-500 bg-yellow-50 px-3 py-1.5 rounded-full">
            <WifiOff className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">
              {wsStatus.reconnecting ? 'Reconnecting...' : 'Offline'}
            </span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto pb-4">
          {messages && messages.length > 0 ? (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          ) : (
            <div className="text-center py-8">
              <div className="inline-block p-4 bg-gray-100 rounded-lg">
                <p className="text-gray-500">No messages yet. Start the conversation!</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
        <div className="max-w-3xl mx-auto flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1"
          />
          <Button type="submit" disabled={isSending} className="px-6">
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </form>
    </div>
  )
} 