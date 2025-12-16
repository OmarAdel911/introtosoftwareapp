"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { useAuth } from "@/contexts/AuthContext"

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
        return
      }

      // Redirect based on user role
      if (user.role === "FREELANCER") {
        router.push("/freelancer/dashboard")
      } else if (user.role === "CLIENT") {
        router.push("/job-poster/dashboard")
      }
    }
  }, [user, loading, router])

  if (loading) {
    return <LoadingSpinner />
  }

  return null
} 