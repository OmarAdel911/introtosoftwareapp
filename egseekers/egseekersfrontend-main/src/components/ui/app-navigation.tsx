"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { 
  Briefcase, 
  User, 
  Settings, 
  FileText, 
  Clock, 
  Award, 
  Users, 
  MessageSquare, 
  Bell, 
  CreditCard, 
  DollarSign, 
  FileCheck, 
  AlertTriangle, 
  Shield, 
  HelpCircle, 
  BarChart, 
  Upload, 
  Webhook, 
  Database, 
  Lock, 
  LogOut,
  Plus
} from "lucide-react"
import axios from "axios"
import { config } from "@/config/env"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "FREELANCER" | "CLIENT" | "ADMIN"
}

export function AppNavigation() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setUser(null)
          setLoading(false)
          return
        }

        const response = await axios.get<User>(
          `${config.apiUrl}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        setUser(response.data)
      } catch (error) {
        console.error('Failed to fetch user:', error)
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem('token')
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem('token')
    setUser(null)
    router.push('/login')
  }

  // Define navigation sections based on user role
  const getNavigationSections = () => {
    if (!user) return [];

    const sections = [
      {
        title: "Overview",
        items: [
          {
            title: "Dashboard",
            href: "/dashboard",
            icon: <BarChart className="h-4 w-4" />,
          },
        ],
      },
    ];

    if (user.role === "FREELANCER") {
      sections.push(
        {
          title: "Jobs",
          items: [
            {
              title: "Find Jobs",
              href: "/jobs",
              icon: <Briefcase className="h-4 w-4" />,
            },
            {
              title: "My Applications",
              href: "/applications",
              icon: <FileText className="h-4 w-4" />,
            },
          ],
        },
        {
          title: "Earnings",
          items: [
            {
              title: "Payment History",
              href: "/payments",
              icon: <CreditCard className="h-4 w-4" />,
            },
            {
              title: "Withdrawals",
              href: "/withdrawals",
              icon: <DollarSign className="h-4 w-4" />,
            },
          ],
        }
      );
    } else if (user.role === "CLIENT") {
      sections.push(
        {
          title: "Jobs",
          items: [
            {
              title: "Post a Job",
              href: "/jobs/post",
              icon: <Plus className="h-4 w-4" />,
            },
            {
              title: "My Jobs",
              href: "/jobs/my-jobs",
              icon: <Briefcase className="h-4 w-4" />,
            },
          ],
        },
        {
          title: "Payments",
          items: [
            {
              title: "Payment History",
              href: "/payments",
              icon: <CreditCard className="h-4 w-4" />,
            },
          ],
        }
      );
    }

    sections.push(
      {
        title: "Account",
        items: [
          {
            title: "Profile",
            href: "/profile",
            icon: <User className="h-4 w-4" />,
          },
          {
            title: "Settings",
            href: "/settings",
            icon: <Settings className="h-4 w-4" />,
          },
        ],
      }
    );

    return sections;
  }

  const navigationSections = getNavigationSections()

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>App Navigation</CardTitle>
        <CardDescription>
          Access all pages in the application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {navigationSections.map((section, index) => (
            <AccordionItem key={index} value={`section-${index}`}>
              <AccordionTrigger>{section.title}</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-2 py-2">
                  {section.items.map((item, itemIndex) => (
                    <Link key={itemIndex} href={item.href} className="w-full">
                      <Button variant="outline" className="w-full justify-start gap-2">
                        {item.icon}
                        {item.title}
                      </Button>
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
          {user && (
            <Button
              variant="destructive"
              className="w-full mt-4"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </Accordion>
      </CardContent>
    </Card>
  )
} 