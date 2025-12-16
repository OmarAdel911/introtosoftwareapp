"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FileText, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Contract } from "@/types"
import { apiClient } from "@/lib/api-client"

export default function ContractsPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem('token')
      console.log('Auth token:', token ? 'Present' : 'Missing');
      console.log('Token value:', token ? `${token.substring(0, 10)}...` : 'None');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/login')
        return
      }

      console.log('About to fetch contracts from API...');
      const response = await apiClient.get<Contract[]>('/contracts')
      console.log('Contracts API Response:', response);
      console.log('Response success:', response.success);
      console.log('Response data type:', typeof response.data);
      console.log('Response data is array:', Array.isArray(response.data));
      
      if (response.success && response.data) {
        console.log('Setting contracts data:', response.data);
        setContracts(response.data)
      } else {
        console.log('API response error:', response.error);
        setError("No contracts data received")
      }
    } catch (error) {
      console.error("Error fetching contracts:", error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Failed to load contracts")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptContract = async (contractId: string) => {
    try {
      const { data } = await apiClient.post<Contract>(`/contracts/${contractId}/accept`)
      if (data) {
        fetchContracts() // Refresh the contracts list
      } else {
        setError("No response received when accepting contract")
      }
    } catch (error) {
      console.error("Error accepting contract:", error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Failed to accept contract")
      }
    }
  }

  const getStatusBadge = (status: Contract["status"]) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
      case "FREELANCER_ACCEPTED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" /> Freelancer Accepted</Badge>
      case "CLIENT_ACCEPTED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" /> Client Accepted</Badge>
      case "ACTIVE":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>
      case "COMPLETED":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>
      case "CANCELLED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>
      default:
        return null
    }
  }

  const filteredContracts = contracts.filter(contract => {
    switch (activeTab) {
      case "pending":
        return ["PENDING", "FREELANCER_ACCEPTED", "CLIENT_ACCEPTED"].includes(contract.status)
      case "active":
        return contract.status === "ACTIVE"
      case "completed":
        return ["COMPLETED", "CANCELLED"].includes(contract.status)
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-4">Contracts</h1>
          <p className="text-muted-foreground">
            Manage your contracts and agreements
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto bg-white border border-gray-200">
            <TabsTrigger value="pending" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              Pending
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              Active
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              Completed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <div className="grid gap-6">
              {filteredContracts.map((contract) => (
                <Card key={contract.id} className="border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">{contract.proposal.job.title}</CardTitle>
                        <CardDescription className="text-gray-500 mt-1">
                          Contract Amount: {formatCurrency(contract.amount)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(contract.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Contract Details</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Start Date: {new Date(contract.startDate).toLocaleDateString()}</p>
                            <p>End Date: {new Date(contract.endDate).toLocaleDateString()}</p>
                            <p>Terms: {contract.terms}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Parties</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Client: {contract.proposal.job.client.name}</p>
                            <p>Freelancer: {contract.proposal.freelancer.name}</p>
                          </div>
                        </div>
                      </div>
                      {contract.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleAcceptContract(contract.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Accept Contract
                          </Button>
                          <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <XCircle className="mr-2 h-4 w-4" />
                            Decline Contract
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredContracts.length === 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No contracts found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {activeTab === "pending" 
                          ? "You don't have any pending contracts at the moment."
                          : activeTab === "active"
                            ? "You don't have any active contracts at the moment."
                            : "You don't have any completed contracts at the moment."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            {/* Same structure as pending tab, but for active contracts */}
            <div className="grid gap-6">
              {filteredContracts.map((contract) => (
                <Card key={contract.id} className="border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">{contract.proposal.job.title}</CardTitle>
                        <CardDescription className="text-gray-500 mt-1">
                          Contract Amount: {formatCurrency(contract.amount)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(contract.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Contract Details</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Start Date: {new Date(contract.startDate).toLocaleDateString()}</p>
                            <p>End Date: {new Date(contract.endDate).toLocaleDateString()}</p>
                            <p>Terms: {contract.terms}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Parties</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Client: {contract.proposal.job.client.name}</p>
                            <p>Freelancer: {contract.proposal.freelancer.name}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredContracts.length === 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No active contracts</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        You don't have any active contracts at the moment.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {/* Same structure as pending tab, but for completed contracts */}
            <div className="grid gap-6">
              {filteredContracts.map((contract) => (
                <Card key={contract.id} className="border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">{contract.proposal.job.title}</CardTitle>
                        <CardDescription className="text-gray-500 mt-1">
                          Contract Amount: {formatCurrency(contract.amount)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(contract.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Contract Details</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Start Date: {new Date(contract.startDate).toLocaleDateString()}</p>
                            <p>End Date: {new Date(contract.endDate).toLocaleDateString()}</p>
                            <p>Terms: {contract.terms}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Parties</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Client: {contract.proposal.job.client.name}</p>
                            <p>Freelancer: {contract.proposal.freelancer.name}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredContracts.length === 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No completed contracts</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        You don't have any completed contracts at the moment.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 