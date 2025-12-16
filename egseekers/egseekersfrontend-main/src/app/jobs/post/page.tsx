"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PostJobRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/post-job")
  }, [router])

  return (
    <div className="container py-8 text-center">
      <p>Redirecting to job posting page...</p>
    </div>
  )
} 