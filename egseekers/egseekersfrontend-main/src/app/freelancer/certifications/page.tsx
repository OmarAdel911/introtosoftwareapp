"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { Plus, Trash2, Edit2, Award, Calendar } from "lucide-react"
import { config } from '@/config/env';

interface Certification {
  id: string
  title: string
  issuer: string
  issueDate: string
  expiryDate?: string
  credentialId?: string
  credentialUrl?: string
  description?: string
  createdAt: string
  updatedAt: string
}

export default function CertificationsPage() {
  const router = useRouter()
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingCert, setIsAddingCert] = useState(false)
  const [editingCert, setEditingCert] = useState<Certification | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    issuer: "",
    issueDate: "",
    expiryDate: "",
    credentialId: "",
    credentialUrl: "",
    description: ""
  })

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const response = await axios.get(`${config.apiUrl}/certifications`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setCertifications(response.data)
      } catch (error) {
        console.error('Error fetching certifications:', error)
        setError('Failed to load certifications')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      if (editingCert) {
        await axios.put(`${config.apiUrl}/certifications/${editingCert.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Certification updated successfully')
      } else {
        await axios.post(`${config.apiUrl}/certifications`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Certification added successfully')
      }

      // Refresh certifications
      const response = await axios.get(`${config.apiUrl}/certifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCertifications(response.data)

      // Reset form
      setFormData({
        name: "",
        issuer: "",
        issueDate: "",
        expiryDate: "",
        credentialId: "",
        credentialUrl: "",
        description: ""
      })
      setIsAddingCert(false)
      setEditingCert(null)
    } catch (error) {
      console.error('Error saving certification:', error)
      toast.error('Failed to save certification')
    }
  }

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
        await axios.delete(`${config.apiUrl}/certifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCertifications(prev => prev.filter(cert => cert.id !== id))
      toast.success('Certification deleted successfully')
    } catch (error) {
      console.error('Error deleting certification:', error)
      toast.error('Failed to delete certification')
    }
  }

  const handleEdit = (cert: Certification) => {
    setEditingCert(cert)
    setFormData({
      name: cert.title,
      issuer: cert.issuer,
      issueDate: cert.issueDate.split('T')[0],
      expiryDate: cert.expiryDate ? cert.expiryDate.split('T')[0] : "",
      credentialId: cert.credentialId || "",
      credentialUrl: cert.credentialUrl || "",
      description: cert.description || ""
    })
    setIsAddingCert(true)
  }

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Certifications</h1>
        <Button onClick={() => setIsAddingCert(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Certification
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {isAddingCert && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingCert ? 'Edit Certification' : 'Add Certification'}</CardTitle>
            <CardDescription>
              {editingCert ? 'Update your certification details' : 'Add a new certification to your profile'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Certification Title</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issuer">Issuing Organization</Label>
                <Input
                  id="issuer"
                  value={formData.issuer}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credentialId">Credential ID (Optional)</Label>
                <Input
                  id="credentialId"
                  value={formData.credentialId}
                  onChange={(e) => setFormData(prev => ({ ...prev, credentialId: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credentialUrl">Credential URL (Optional)</Label>
                <Input
                  id="credentialUrl"
                  type="url"
                  value={formData.credentialUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, credentialUrl: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddingCert(false)
                  setEditingCert(null)
                  setFormData({
                    name: "",
                    issuer: "",
                    issueDate: "",
                    expiryDate: "",
                    credentialId: "",
                    credentialUrl: "",
                    description: ""
                  })
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingCert ? 'Update' : 'Add'} Certification
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certifications.map((cert) => (
          <Card key={cert.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span>{cert.title}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(cert)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(cert.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>{cert.issuer}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Issued: {new Date(cert.issueDate).toLocaleDateString()}
                  {cert.expiryDate && ` • Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`}
                </span>
              </div>

              {cert.description && (
                <p className="text-sm text-muted-foreground">{cert.description}</p>
              )}

              {cert.credentialUrl && (
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View Credential
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 