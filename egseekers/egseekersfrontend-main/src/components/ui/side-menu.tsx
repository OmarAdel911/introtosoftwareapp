"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Wallet, 
  Award, 
  Users, 
  Settings, 
  LogOut,
  X,
  Bell,
  MessageSquare,
  CreditCard,
  DollarSign,
  User as UserIcon
} from "lucide-react"
import { User } from "@/contexts/AuthContext"

interface SideMenuProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  credits: number
  connects: number
  unreadCount: number
  notificationCount: number
}

export function SideMenu({ 
  user, 
  isOpen, 
  onClose, 
  credits, 
  connects, 
  unreadCount, 
  notificationCount 
}: SideMenuProps) {
  const router = useRouter()

  const handleSignOut = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isOpen && !target.closest('.side-menu') && !target.closest('.avatar-trigger')) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Side Menu */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50 side-menu transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.image || undefined} alt={user?.name || ''} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {user?.name?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                <p className="text-sm text-gray-500">{user?.role?.toLowerCase()}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 border-b">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50">
              <CreditCard className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600">Credits</p>
                <p className="font-semibold text-green-700">{credits}</p>
              </div>
            </div>
            {user?.role === "FREELANCER" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Connects</p>
                  <p className="font-semibold text-blue-700">{connects}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600">
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Button>
          </Link>

          {user?.role === "FREELANCER" ? (
            <>
              <Link href="/jobs">
                <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600">
                  <Briefcase className="h-5 w-5" />
                  Find Jobs
                </Button>
              </Link>
              <Link href="/my-jobs">
                <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600">
                  <FileText className="h-5 w-5" />
                  My Jobs
                </Button>
              </Link>
              <Link href="/proposals">
                <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600">
                  <FileText className="h-5 w-5" />
                  Proposals
                </Button>
              </Link>
              <Link href="/earnings">
                <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600">
                  <Wallet className="h-5 w-5" />
                  Earnings
                </Button>
              </Link>
              <Link href="/freelancer/portfolio">
                <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600">
                  <FileText className="h-5 w-5" />
                  Portfolio
                </Button>
              </Link>
              <Link href="/freelancer/certifications">
                <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600">
                  <Award className="h-5 w-5" />
                  Certifications
                </Button>
              </Link>
              <Link href={user?.role === "FREELANCER" ? "/freelancer/contracts" : "/client/contracts"}>
                <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600">
                  <FileText className="h-5 w-5" />
                  Contracts
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/freelancers">
                <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600">
                  <Users className="h-5 w-5" />
                  Hire Freelancers
                </Button>
              </Link>
              <Link href="/post-job">
                <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600">
                  <Briefcase className="h-5 w-5" />
                  Post a Job
                </Button>
              </Link>
              <Link href="/client/contracts">
                <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600">
                  <FileText className="h-5 w-5" />
                  Contracts
                </Button>
              </Link>
              <Link href="/job-poster/profile">
                <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600">
                  <UserIcon className="h-5 w-5" />
                  Profile
                </Button>
              </Link>
            </>
          )}

          <Link href="/notifications">
            <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600">
              <Bell className="h-5 w-5" />
              Notifications
              {notificationCount > 0 && (
                <span className="ml-auto bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                  {notificationCount}
                </span>
              )}
            </Button>
          </Link>

          <Link href="/chats">
            <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600">
              <MessageSquare className="h-5 w-5" />
              Messages
              {unreadCount > 0 && (
                <span className="ml-auto bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Button>
          </Link>

          <Link href={user?.role === "FREELANCER" ? "/freelancer/settings" : "/job-poster/settings"}>
            <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600">
              <Settings className="h-5 w-5" />
              Settings
            </Button>
          </Link>

          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-red-600 hover:text-red-600 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </Button>
        </div>
      </div>
    </>
  )
} 