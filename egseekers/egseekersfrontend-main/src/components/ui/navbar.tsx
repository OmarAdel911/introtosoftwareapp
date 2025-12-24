"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from '@/contexts/AuthContext'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, MessageSquare, LayoutDashboard, CreditCard, DollarSign, Users, Briefcase, FileText, Wallet, Award, Plus, Info, HelpCircle, Search, Menu, X } from "lucide-react"
import { api } from "@/lib/api/api"
import { Conversation, messagesApi } from "@/lib/api/messages"
import { formatDistanceToNow } from "date-fns"
import { useNotifications, Notification } from "@/hooks/useNotifications"
import { SideMenu } from "@/components/ui/side-menu"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User } from "@/contexts/AuthContext"

interface ExtendedNotification {
  id: string;
  type: 'CHAT' | 'PROPOSAL' | 'JOB';
  senderId: string;
  read: boolean;
  createdAt: string;
  title: string;
  message: string;
}

interface ExtendedConversation {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientImage: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export function Navbar() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [credits, setCredits] = useState(0)
  const [connects, setConnects] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [conversations, setConversations] = useState<ExtendedConversation[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { notifications, unreadCount: notificationCount, markAsRead, fetchNotifications } = useNotifications()
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)

  // Fetch credits and connects when user changes
  const fetchUserData = async () => {
    if (!user) {
      setCredits(0)
      setConnects(0)
      return
    }

    // Fetch credits for both clients and freelancers
    try {
      const creditsResponse = await api.get('/credits')
      setCredits(creditsResponse.data.totalActiveCredits || 0)
    } catch (creditsError) {
      console.error('Failed to fetch credits:', creditsError)
      setCredits(0)
    }
    
    // If user is a freelancer, get connects
    if (user.role === "FREELANCER") {
      try {
        const connectsResponse = await api.get('/connects')
        setConnects(connectsResponse.data.totalActiveConnects || 0)
      } catch (connectsError) {
        console.error('Failed to fetch connects:', connectsError)
        setConnects(0)
      }
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [user])

  // Refresh credits/connects when page becomes visible (e.g., after returning from payment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchUserData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user])

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return

      try {
        const conversations = await messagesApi.getConversations()
        setConversations(conversations)
        setUnreadCount(conversations.reduce((total, conv) => total + conv.unreadCount, 0))
      } catch (error) {
        console.error('Failed to fetch conversations:', error)
      }
    }

    if (user) {
      fetchConversations()
    }
  }, [user])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleNotificationClick = (notification: ExtendedNotification) => {
    markAsRead(notification.id)
    router.push('/notifications')
  }

  // Get user's initials from name, firstName+lastName, or email
  const getInitials = (user: any) => {
    if (user.name) {
      return user.name.substring(0, 2).toUpperCase();
    }
    if (user.firstName) {
      return (user.firstName.charAt(0) + (user.lastName ? user.lastName.charAt(0) : '')).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  // Get user's display name
  const getDisplayName = (user: any) => {
    if (user.name) {
      return user.name;
    }
    if (user.firstName) {
      return user.firstName + (user.lastName ? ' ' + user.lastName : '');
    }
    return user.email;
  };

  if (loading) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-800">EGSeekers</span>
          </Link>
          <div className="animate-pulse h-6 w-24 bg-muted rounded"></div>
        </div>
      </nav>
    )
  }

  return (
    <>
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 transition-all duration-300 hover:shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-2 group">
              <span className="text-xl font-bold text-gray-800 group-hover:text-primary transition-colors duration-300">EGSeekers</span>
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:block relative w-64 group">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 px-4 pr-10 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-sm"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors duration-300">
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Credits and Connects Display */}
                <div className="hidden md:flex items-center space-x-2">
                  {(user.role === "CLIENT" || user.role === "FREELANCER") && (
                    <Link 
                      href={user.role === "CLIENT" ? "/job-poster/credits" : "/freelancer/credits"}
                      className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 hover:bg-green-100 transition-all duration-300 group cursor-pointer"
                    >
                      <Wallet className="h-4 w-4 text-green-600 group-hover:text-green-700 transition-colors duration-300" />
                      <span className="text-sm font-medium text-green-700 group-hover:text-green-800 transition-colors duration-300">{credits.toFixed(2)} EGP</span>
                    </Link>
                  )}
                  {user.role === "FREELANCER" && (
                    <Link 
                      href="/freelancer/connects"
                      className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 transition-all duration-300 group cursor-pointer"
                    >
                      <DollarSign className="h-4 w-4 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" />
                      <span className="text-sm font-medium text-blue-700 group-hover:text-blue-800 transition-colors duration-300">{connects} Connects</span>
                    </Link>
                  )}
                </div>

                <Link href="/dashboard">
                  <Button variant="ghost" className="hidden md:flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-300">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>

                {user.role === "FREELANCER" && (
                  <>
                    <Link href="/jobs">
                      <Button variant="ghost" className="hidden md:inline-flex hover:bg-primary/10 hover:text-primary transition-all duration-300">Find Jobs</Button>
                    </Link>
                    <Link href="/buy-connects">
                      <Button variant="default" className="hidden md:flex items-center gap-2 bg-gray-800 hover:bg-primary transition-all duration-300 hover:shadow-sm">
                        <DollarSign className="h-4 w-4" />
                        Buy Connects
                      </Button>
                    </Link>
                  </>
                )}

                {user.role === "ADMIN" && (
                  <>
                    <Link href="/admin/dashboard">
                      <Button variant="ghost" className="hidden md:flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-300">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Button>
                    </Link>
                    <Link href="/admin/users">
                      <Button variant="ghost" className="hidden md:flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-300">
                        <Users className="h-4 w-4" />
                        Users
                      </Button>
                    </Link>
                    <Link href="/admin/contracts">
                      <Button variant="ghost" className="hidden md:flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-300">
                        <FileText className="h-4 w-4" />
                        Contracts
                      </Button>
                    </Link>
                  </>
                )}

                {user.role === "CLIENT" && (
                  <>
                    <Link href="/freelancers">
                      <Button variant="default" className="hidden md:flex items-center gap-2 bg-gray-800 hover:bg-primary transition-all duration-300 hover:shadow-sm">
                        <Users className="h-4 w-4" />
                        Hire Freelancers
                      </Button>
                    </Link>
                    <Link href="/post-job">
                      <Button variant="default" className="hidden md:flex items-center gap-2 bg-gray-800 hover:bg-primary transition-all duration-300 hover:shadow-sm">
                        <Plus className="h-4 w-4" />
                        Post a Job
                      </Button>
                    </Link>
                  </>
                )}
                
                {/* Notification and Messages */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {notificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-[10px] font-medium text-white flex items-center justify-center">
                          {notificationCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No notifications
                      </div>
                    ) : (
                      (notifications as ExtendedNotification[]).map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className="flex flex-col items-start p-4 cursor-pointer hover:bg-blue-50"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                            </div>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="relative hover:bg-blue-50 hover:text-blue-600 transition-all duration-300"
                    >
                      <MessageSquare className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-[10px] font-medium text-white flex items-center justify-center animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80" align="end">
                    <DropdownMenuLabel className="flex items-center justify-between">
                      <span>Messages</span>
                      {unreadCount > 0 && (
                        <span className="text-xs text-blue-600 font-medium">
                          {unreadCount} unread
                        </span>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {conversations.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No messages yet
                      </div>
                    ) : (
                      <div className="max-h-[300px] overflow-y-auto">
                        {conversations.slice(0, 5).map((conversation) => (
                          <DropdownMenuItem
                            key={conversation.id}
                            className="flex items-start gap-3 p-3 cursor-pointer hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => router.push(`/chat/${conversation.id}`)}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={conversation.recipientImage || undefined} alt={conversation.recipientName} />
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {conversation.recipientName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium truncate">{conversation.recipientName}</p>
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 truncate mt-1">
                                {conversation.lastMessage}
                              </p>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                      onClick={() => router.push('/chats')}
                    >
                      View all messages
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  variant="ghost" 
                  className="relative h-8 w-8 rounded-full hover:ring-2 hover:ring-blue-200 transition-all duration-300 avatar-trigger"
                  onClick={() => setIsSideMenuOpen(true)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.image || undefined}
                      alt={getDisplayName(user)}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </>
            ) : (
              <>
                {/* Non-signed in navigation */}
                <Link href="/about">
                  <Button variant="ghost" className="hidden md:flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-300">
                    <Info className="h-4 w-4" />
                    About Us
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button variant="ghost" className="hidden md:flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-300">
                    <HelpCircle className="h-4 w-4" />
                    How It Works
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="ghost" className="hidden md:inline-flex hover:bg-primary/10 hover:text-primary transition-all duration-300">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button className="hidden md:inline-flex bg-gray-800 hover:bg-primary transition-all duration-300 hover:shadow-sm">Sign up</Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-primary/10 hover:text-primary transition-all duration-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t animate-in slide-in-from-top duration-300">
            <div className="container py-4 space-y-4">
              {/* Search Bar - Mobile */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 px-4 pr-10 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors duration-300">
                  <Search className="h-4 w-4" />
                </button>
              </form>

              {user ? (
                <>
                  {/* Credits and Connects Display - Mobile */}
                  <div className="flex items-center space-x-2">
                    {(user.role === "CLIENT" || user.role === "FREELANCER") && (
                      <Link 
                        href={user.role === "CLIENT" ? "/job-poster/credits" : "/freelancer/credits"}
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 group hover:bg-green-100 transition-all duration-300 cursor-pointer"
                      >
                        <Wallet className="h-4 w-4 text-green-600 group-hover:text-green-700 transition-colors duration-300" />
                        <span className="text-sm font-medium text-green-700 group-hover:text-green-800 transition-colors duration-300">{credits.toFixed(2)} EGP</span>
                      </Link>
                    )}
                    {user.role === "FREELANCER" && (
                      <Link 
                        href="/freelancer/connects"
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 group hover:bg-blue-100 transition-all duration-300 cursor-pointer"
                      >
                        <DollarSign className="h-4 w-4 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" />
                        <span className="text-sm font-medium text-blue-700 group-hover:text-blue-800 transition-colors duration-300">{connects} Connects</span>
                      </Link>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/dashboard">
                      <Button variant="outline" className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-all duration-300">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Button>
                    </Link>

                    {user.role === "FREELANCER" ? (
                      <>
                        <Link href="/jobs">
                          <Button variant="outline" className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-all duration-300">
                            <Briefcase className="mr-2 h-4 w-4" />
                            Find Jobs
                          </Button>
                        </Link>
                        <Link href="/buy-connects">
                          <Button variant="outline" className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-all duration-300">
                            <DollarSign className="mr-2 h-4 w-4" />
                            Buy Connects
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href="/freelancers">
                          <Button variant="outline" className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-all duration-300">
                            <Users className="mr-2 h-4 w-4" />
                            Hire Freelancers
                          </Button>
                        </Link>
                        <Link href="/post-job">
                          <Button variant="outline" className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-all duration-300">
                            <Plus className="mr-2 h-4 w-4" />
                            Post a Job
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/notifications">
                      <Button variant="outline" className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-all duration-300">
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                      </Button>
                    </Link>
                    <Link href="/chats">
                      <Button variant="outline" className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-all duration-300">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Messages
                      </Button>
                    </Link>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
                    onClick={() => {
                      if (user?.role === 'ADMIN') {
                        localStorage.removeItem('adminToken')
                        localStorage.removeItem('adminUser')
                        router.push('/admin/login')
                      } else {
                        logout()
                      }
                    }}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/about">
                    <Button variant="outline" className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-all duration-300">
                      <Info className="mr-2 h-4 w-4" />
                      About Us
                    </Button>
                  </Link>
                  <Link href="/how-it-works">
                    <Button variant="outline" className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-all duration-300">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      How It Works
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-all duration-300">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="w-full justify-start bg-gray-800 hover:bg-primary transition-all duration-300 hover:shadow-sm">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Side Menu */}
      <SideMenu 
        user={user}
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        credits={credits}
        connects={connects}
        unreadCount={unreadCount}
        notificationCount={notificationCount}
      />
    </>
  )
} 