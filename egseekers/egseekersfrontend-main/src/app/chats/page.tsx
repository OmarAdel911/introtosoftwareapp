"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, MessageSquare, User } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { config } from '@/config/env';

interface Chat {
  id: string
  recipientId: string
  recipientName: string
  recipientImage: string | null
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export default function ChatsPage() {
  const router = useRouter()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        console.log('Fetching chats...')
        const response = await fetch('${config.apiUrl}/messages/conversations', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        console.log('Response status:', response.status)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          console.error('Error response:', errorData)
          throw new Error(`Failed to fetch chats: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log('Chats data:', data)
        setChats(data)
      } catch (err) {
        console.error('Error fetching chats:', err)
        setError(err instanceof Error ? err.message : 'Failed to load chats')
        toast.error('Failed to load chats')
      } finally {
        setLoading(false)
      }
    }

    fetchChats()
  }, [router])

  const filteredChats = chats.filter(chat => 
    chat.recipientName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading chats..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Messages</h1>
            <p className="text-gray-600">Chat with your clients and freelancers</p>
          </div>

          {/* Search */}
          <Card className="border border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-500" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Chats List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredChats.length === 0 ? (
              <Card className="border border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-indigo-500" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No conversations found</h3>
                    <p className="mt-1 text-gray-500">
                      {searchQuery
                        ? "Try adjusting your search"
                        : "Start a conversation with your clients or freelancers"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredChats.map((chat) => (
                <Card 
                  key={chat.id} 
                  className="group hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white/80 backdrop-blur-sm cursor-pointer"
                  onClick={() => router.push(`/chat/${chat.recipientId}`)}
                >
                  <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        {chat.recipientImage ? (
                          <img
                            src={chat.recipientImage}
                            alt={chat.recipientName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-indigo-500" />
                          </div>
                        )}
                        {chat.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                            {chat.unreadCount}
                          </div>
                        )}
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {chat.recipientName}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {format(new Date(chat.lastMessageTime), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-gray-600 truncate mt-1">
                          {chat.lastMessage}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 