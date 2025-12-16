"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import {
  User as UserIcon,
  MessageSquare,
  HelpCircle,
  Briefcase,
  FileText,
  Settings,
  Users,
  BarChart,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import axios from "axios"
import { config } from "@/config/env"

// Create axios instance
const api = axios.create({
  baseURL: config.apiUrl,
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

interface User {
  id: string
  email: string
  role: string
  name: string
}

export function Navigation() {
  const [user, setUser] = useState<User | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (path: string) => pathname === path

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await api.get<User>('/auth/me')
          setUser(response.data)
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('token')
          setUser(null)
        }
      }
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      setUser(null)
      router.push('/login')
    }
  }

  const commonSections = [
    {
      title: "Account",
      icon: <UserIcon className="h-4 w-4" />,
      items: [
        { label: "Profile", href: "/profile" },
        { 
          label: "Settings", 
          href: user?.role === "FREELANCER" 
            ? "/freelancer/settings" 
            : user?.role === "CLIENT" 
              ? "/job-poster/settings" 
              : "/settings" 
        },
      ],
    },
    {
      title: "Communication",
      icon: <MessageSquare className="h-4 w-4" />,
      items: [
        { label: "Messages", href: "/messages" },
        { label: "Notifications", href: "/notifications" },
      ],
    },
    {
      title: "Support",
      icon: <HelpCircle className="h-4 w-4" />,
      items: [
        { label: "Help Center", href: "/help" },
        { label: "Contact Support", href: "/support" },
      ],
    },
  ]

  const freelancerSections = [
    {
      title: "Freelancer Dashboard",
      icon: <Briefcase className="h-4 w-4" />,
      items: [
        { label: "My Jobs", href: "/freelancer/jobs" },
        { label: "Proposals", href: "/freelancer/proposals" },
        { label: "Earnings", href: "/freelancer/earnings" },
      ],
    },
  ]

  const clientSections = [
    {
      title: "Client Dashboard",
      icon: <FileText className="h-4 w-4" />,
      items: [
        { label: "Post a Job", href: "/jobs/post" },
        { label: "My Jobs", href: "/jobs/my-jobs" },
        { label: "Applications", href: "/jobs/applications" },
        { label: "Contracts", href: "/client/contracts" },
        { label: "Profile", href: "/job-poster/profile" },
      ],
    },
  ]

  const adminSections = [
    {
      title: "Admin Dashboard",
      icon: <Settings className="h-4 w-4" />,
      items: [
        { label: "Users", href: "/admin/users" },
        { label: "Jobs", href: "/admin/jobs" },
        { label: "Reports", href: "/admin/reports" },
        { label: "Settings", href: "/admin/settings" },
        { label: "Analytics", href: "/admin/analytics" },
      ],
    },
  ]

  const publicSections = [
    {
      title: "Authentication",
      icon: <LogIn className="h-4 w-4" />,
      items: [
        { label: "Login", href: "/login" },
        { label: "Sign Up", href: "/signup" },
      ],
    },
    {
      title: "Public Pages",
      icon: <Users className="h-4 w-4" />,
      items: [
        { label: "Home", href: "/" },
        { label: "Jobs", href: "/jobs" },
        { label: "Freelancers", href: "/freelancers" },
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ]

  const renderSection = (section: typeof commonSections[0]) => (
    <AccordionItem key={section.title} value={section.title}>
      <AccordionTrigger className="flex items-center gap-2">
        {section.icon}
        {section.title}
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-1">
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                isActive(item.href) && "bg-accent"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )

  return (
    <Card className="w-full max-w-xs p-4">
      <Accordion type="multiple" className="w-full">
        {user ? (
          <>
            {commonSections.map(renderSection)}
            {user.role === "FREELANCER" && freelancerSections.map(renderSection)}
            {user.role === "CLIENT" && clientSections.map(renderSection)}
            {user.role === "ADMIN" && adminSections.map(renderSection)}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </>
        ) : (
          publicSections.map(renderSection)
        )}
      </Accordion>
    </Card>
  )
} 