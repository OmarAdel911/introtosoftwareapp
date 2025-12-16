import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"

interface Dispute {
  id: string
  title: string
  description: string
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED"
  createdAt: string
  job: {
    id: string
    title: string
  }
  user: {
    id: string
    name: string
  }
  respondent: {
    id: string
    name: string
  }
}

export default function DisputesPage() {
  // This would be replaced with actual API call
  const disputes: Dispute[] = [
    {
      id: "1",
      title: "Late Payment Issue",
      description: "Payment has been delayed for more than 2 weeks",
      status: "OPEN",
      createdAt: "2024-04-18T10:00:00Z",
      job: {
        id: "1",
        title: "Website Development"
      },
      user: {
        id: "1",
        name: "John Doe"
      },
      respondent: {
        id: "2",
        name: "Jane Smith"
      }
    },
    // Add more mock disputes as needed
  ]

  const getStatusColor = (status: Dispute["status"]) => {
    switch (status) {
      case "OPEN":
        return "bg-red-500"
      case "IN_REVIEW":
        return "bg-yellow-500"
      case "RESOLVED":
        return "bg-green-500"
      case "CLOSED":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: Dispute["status"]) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="h-4 w-4" />
      case "IN_REVIEW":
        return <Clock className="h-4 w-4" />
      case "RESOLVED":
      case "CLOSED":
        return <CheckCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Disputes</h1>
        <Button>Create New Dispute</Button>
      </div>

      <div className="grid gap-4">
        {disputes.map((dispute) => (
          <Card key={dispute.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{dispute.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Job: {dispute.job.title}
                  </p>
                </div>
                <Badge className={getStatusColor(dispute.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(dispute.status)}
                    {dispute.status}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{dispute.description}</p>
              <div className="flex justify-between text-sm text-muted-foreground">
                <div>
                  <p>Raised by: {dispute.user.name}</p>
                  <p>Against: {dispute.respondent.name}</p>
                </div>
                <p>
                  Created: {new Date(dispute.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 