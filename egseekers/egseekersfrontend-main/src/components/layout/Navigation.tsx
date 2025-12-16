"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Home,
  Briefcase,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  User,
  FileText,
  Clock,
  Award,
  CreditCard,
  Bell,
  Menu,
  X,
  Search,
  Plus,
  Bookmark,
  Star,
  BarChart,
  HelpCircle,
  Info,
  Mail,
  LogIn,
  UserPlus,
} from "lucide-react"

// Define user roles
type UserRole = "ADMIN" | "FREELANCER" | "CLIENT" | "GUEST"

// Define navigation items based on user role
const getNavigationItems = (role: UserRole) => {
  const commonItems = [
    {
      title: "Home",
      href: "/",
      icon: Home,
    },
    {
      title: "Jobs",
      href: "/jobs",
      icon: Briefcase,
    },
    {
      title: "Freelancers",
      href: "/freelancers",
      icon: Users,
    },
    {
      title: "Messages",
      href: "/messages",
      icon: MessageSquare,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ]

  const freelancerItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: BarChart,
    },
    {
      title: "My Applications",
      href: "/applications",
      icon: FileText,
    },
    {
      title: "Teams",
      href: "/teams",
      icon: Users,
    },
    {
      title: "Time Tracking",
      href: "/time-tracking",
      icon: Clock,
    },
    {
      title: "Portfolio",
      href: "/portfolio",
      icon: FileText,
    },
    {
      title: "Certifications",
      href: "/certifications",
      icon: Award,
    },
    {
      title: "Earnings",
      href: "/earnings",
      icon: CreditCard,
    },
    {
      title: "Saved Jobs",
      href: "/saved-jobs",
      icon: Bookmark,
    },
  ]

  const clientItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: BarChart,
    },
    {
      title: "Post Job",
      href: "/post-job",
      icon: Plus,
    },
    {
      title: "My Jobs",
      href: "/my-jobs",
      icon: Briefcase,
    },
    {
      title: "Teams",
      href: "/teams",
      icon: Users,
    },
    {
      title: "Hired Freelancers",
      href: "/hired-freelancers",
      icon: Users,
    },
    {
      title: "Reviews",
      href: "/reviews",
      icon: Star,
    },
  ]

  const guestItems = [
    {
      title: "About",
      href: "/about",
      icon: Info,
    },
    {
      title: "Contact",
      href: "/contact",
      icon: Mail,
    },
    {
      title: "Help",
      href: "/help",
      icon: HelpCircle,
    },
  ]

  switch (role) {
    case "FREELANCER":
      return [...commonItems, ...freelancerItems]
    case "CLIENT":
      return [...commonItems, ...clientItems]
    case "ADMIN":
      return [...commonItems, ...freelancerItems, ...clientItems]
    case "GUEST":
    default:
      return [...commonItems, ...guestItems]
  }
}

interface NavigationProps {
  userRole?: UserRole
  userName?: string
  userImage?: string
  onLogout?: () => void
}

export default function Navigation({
  userRole = "GUEST",
  userName = "Guest User",
  userImage,
  onLogout,
}: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const navigationItems = getNavigationItems(userRole)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <nav className="border-b bg-background">
      <div className="container flex h-16 items-center px-4">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              EgSeekers
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search..."
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-8 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:w-[200px] lg:w-[300px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {userRole !== "GUEST" && (
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  3
                </span>
              </Button>
            )}

            {userRole === "GUEST" ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Register</Link>
                </Button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    {userImage ? (
                      <img
                        src={userImage}
                        alt={userName}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userRole.toLowerCase()}@example.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-base font-medium",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/60 hover:bg-primary/5 hover:text-foreground/80"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.title}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
} 