"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Calendar } from "lucide-react"
import { Application } from "@/lib/api/dashboard"
import { getRecentApplications } from "@/lib/api/dashboard"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function RecentApplications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getRecentApplications()
        setApplications(data)
      } catch (err) {
        console.error("Error fetching applications:", err)
        setError(err instanceof Error ? err.message : "Failed to load applications")
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Recent Applications</h2>
        <Link href="/applications">
          <Button variant="outline">View All</Button>
        </Link>
      </div>
      <div className="space-y-4">
        {applications.map((application) => (
          <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">{application.jobTitle}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>Client: {application.client.firstName} {application.client.lastName}</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(application.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={
                application.status === "PENDING" ? "default" :
                application.status === "ACCEPTED" ? "secondary" :
                "destructive"
              }>
                {application.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
} 