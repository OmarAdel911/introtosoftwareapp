"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Award, ExternalLink, Calendar, Edit, Trash } from "lucide-react"

interface Certification {
  id: string
  name: string
  issuer: string
  issueDate: Date
  expiryDate?: Date
  credentialId?: string
  credentialUrl?: string
}

export default function CertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([
    {
      id: "1",
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      issueDate: new Date("2023-01-15"),
      expiryDate: new Date("2026-01-15"),
      credentialId: "AWS-123456",
      credentialUrl: "https://aws.amazon.com/verification"
    },
    {
      id: "2",
      name: "Professional Scrum Master I",
      issuer: "Scrum.org",
      issueDate: new Date("2023-03-20"),
      credentialId: "PSM-789012",
      credentialUrl: "https://scrum.org/certificates/verify"
    }
  ])

  const [isEditing, setIsEditing] = useState(false)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date)
  }

  const isExpired = (certification: Certification) => {
    if (!certification.expiryDate) return false
    return new Date() > certification.expiryDate
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Certifications</h1>
          <p className="text-muted-foreground">
            Showcase your professional certifications and achievements
          </p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setIsEditing(!isEditing)}>
            <Edit className="w-4 h-4 mr-2" />
            {isEditing ? "Done" : "Edit"}
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Certification
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {certifications.map((cert) => (
          <Card key={cert.id}>
            <CardHeader className="relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    {cert.name}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">{cert.issuer}</p>
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Issued: {formatDate(cert.issueDate)}</span>
                  </div>
                  {cert.expiryDate && (
                    <Badge variant={isExpired(cert) ? "destructive" : "secondary"}>
                      {isExpired(cert) ? "Expired" : "Valid"} until {formatDate(cert.expiryDate)}
                    </Badge>
                  )}
                </div>

                {cert.credentialId && (
                  <p className="text-sm text-muted-foreground">
                    Credential ID: {cert.credentialId}
                  </p>
                )}

                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-primary hover:underline text-sm mt-2"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Verify Certificate
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 