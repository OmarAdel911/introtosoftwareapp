"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FileText, CheckCircle, XCircle, Clock, AlertCircle, DollarSign, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { ApiResponse } from "@/types/api"
import { Contract, ContractStatus, ContractSubmission } from "@/types/contract"
import { Ticket, TicketPriority } from "@/types/ticket"
import { toast } from "sonner"
import { config } from "@/config/env"

const API_BASE_URL =  config.apiUrl

interface FileUrlObject {
  url?: string;
  toString?: () => string;
}

interface ExtendedContract extends Omit<Contract, 'proposal'> {
  proposal: {
    id: string;
    job: {
      id: string;
      title: string;
      description: string;
      client: {
        id: string;
        name: string;
        email: string;
      };
    };
    freelancer: {
      id: string;
      name: string;
      email: string;
    };
  };
  client: {
    id: string;
    name: string;
    email: string;
  };
  submissionDescription?: string;
  clientFeedback?: string;
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`
  const token = localStorage.getItem('token')
  
  console.log('fetchApi called with:', { endpoint, url, hasToken: !!token });
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  try {
    console.log('Making request to:', url, 'with headers:', headers);
    const response = await fetch(url, {
      ...options,
      headers,
    })

    console.log('Response status:', response.status, response.statusText);
    const data = await response.json()
    console.log('Response data:', data);

    // Check if the response was successful
    if (!response.ok) {
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        data
      })
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`
      }
    }

    return {
      success: true,
      data: data.data || data
    }
  } catch (error) {
    console.error('API Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while fetching data'
    }
  }
}

export default function ClientContractsPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<ExtendedContract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    try {
      console.log('Fetching contracts...');
      const response = await fetchApi<ExtendedContract[]>('/contracts')
      console.log('Contracts response:', response);
      
      if (response.success && response.data) {
        console.log('Contracts data received:', response.data);
        setContracts(response.data)
      } else {
        console.log('Contracts API error:', response.error);
        setError(response.error || "Failed to load contracts")
      }
      setLoading(false)
    } catch (error) {
      console.error("Error fetching contracts:", error)
      setError("Failed to load contracts")
      setLoading(false)
    }
  }

  const handleAcceptContract = async (contractId: string) => {
    try {
      setLoading(true);
      const response = await fetchApi<ExtendedContract>(`/contracts/${contractId}/accept`, {
        method: 'POST',
      });
      
      if (response.success) {
        // Refresh the contracts list
        await fetchContracts();
        
        // If the contract is now active, switch to the active tab
        const updatedContract = response.data;
        if (updatedContract && updatedContract.status === "ACTIVE") {
          setActiveTab("active");
        }
      } else {
        setError(response.error || "Failed to accept contract");
      }
    } catch (error) {
      console.error("Error accepting contract:", error);
      setError("Failed to accept contract");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectAndCreateTicket = async (contract: ExtendedContract) => {
    try {
      setLoading(true);
      
      // First, create a ticket for admin review
      const ticketResponse = await fetchApi<{ id: string }>('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          title: `Contract Rejection - ${contract.proposal.job.title}`,
          description: `Contract ID: ${contract.id}\nJob Title: ${contract.proposal.job.title}\nFreelancer: ${contract.proposal.freelancer.name}\nAmount: ${formatCurrency(contract.amount)}\n\nPlease provide details about why you are rejecting this contract.`,
          contractId: contract.id,
          priority: 'HIGH'
        })
      });

      if (!ticketResponse.success || !ticketResponse.data?.id) {
        throw new Error(ticketResponse.error || 'Failed to create ticket');
      }

      // Then update the contract status to indicate it's under review
      const contractResponse = await fetchApi<ExtendedContract>(`/contracts/${contract.id}/decline`, {
        method: 'POST',
        body: JSON.stringify({
          reason: "Contract rejected by client for admin review"
        })
      });

      if (!contractResponse.success) {
        throw new Error(contractResponse.error || 'Failed to reject contract');
      }

      if (contractResponse.data) {
        // Update the contracts list with the updated contract
        setContracts(prevContracts => 
          prevContracts.map(c => 
            c.id === contract.id ? contractResponse.data! : c
          )
        );
        toast.success('Contract rejected and ticket created for admin review');
      }
    } catch (error) {
      console.error('Error rejecting contract:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject contract and create ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewWork = async (contractId: string, accepted: boolean, feedback: string) => {
    try {
      setLoading(true);
      const response = await fetchApi<ExtendedContract>(`/contracts/${contractId}/review`, {
        method: 'POST',
        body: JSON.stringify({ accepted, feedback })
      });
      
      if (response.success && response.data) {
        // Update the contracts list with the updated contract
        setContracts(prevContracts => 
          prevContracts.map(contract => 
            contract.id === contractId ? response.data! : contract
          )
        );
        toast.success(accepted ? 'Work accepted successfully' : 'Work rejected and ticket created');
      } else {
        setError(response.error || "Failed to review work");
      }
    } catch (error) {
      console.error("Error reviewing work:", error);
      setError("Failed to review work");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSubmission = async (contractId: string) => {
    try {
      setLoading(true);
      const response = await fetchApi<ExtendedContract>(`/contracts/${contractId}/accept-submission`, {
        method: 'POST',
        body: JSON.stringify({
          accepted: true,
          feedback: (document.getElementById('feedback') as HTMLTextAreaElement)?.value || ''
        })
      });

      if (response.success && response.data) {
        setContracts(prevContracts =>
          prevContracts.map(contract =>
            contract.id === contractId && response.data ? response.data : contract
          )
        );
        toast.success('Submission accepted successfully');
      } else {
        throw new Error(response.error || 'Failed to accept submission');
      }
    } catch (error) {
      console.error('Error accepting submission:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to accept submission');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubmission = async (contractId: string) => {
    try {
      setLoading(true);
      const response = await fetchApi<ExtendedContract>(`/contracts/${contractId}/reject-submission`, {
        method: 'POST',
        body: JSON.stringify({
          feedback: (document.getElementById('feedback') as HTMLTextAreaElement)?.value || ''
        })
      });

      if (response.success && response.data) {
        setContracts(prevContracts =>
          prevContracts.map(contract =>
            contract.id === contractId && response.data ? response.data : contract
          )
        );
        toast.success('Submission rejected successfully');
      } else {
        throw new Error(response.error || 'Failed to reject submission');
      }
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject submission');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (contract: ExtendedContract) => {
    try {
      setLoading(true);
      const response = await fetchApi<{ id: string }>('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          title: `Contract Review Request - ${contract.proposal.job.title}`,
          description: `I would like to submit additional information regarding the rejection of my work for "${contract.proposal.job.title}".`,
          category: 'CONTRACT_REVIEW',
          priority: 'HIGH',
          contractId: contract.id
        })
      });

      if (response.success && response.data?.id) {
        toast.success('Ticket created successfully');
        router.push(`/support/tickets/${response.data.id}`);
      } else {
        throw new Error(response.error || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ContractStatus) => {
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
      case "PENDING_REVIEW":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200"><Clock className="w-3 h-3 mr-1" /> Pending Review</Badge>
      case "UNDER_ADMIN_REVIEW":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><AlertCircle className="w-3 h-3 mr-1" /> Under Admin Review</Badge>
      default:
        return null
    }
  }

  const handleFileAction = async (url: string | undefined, action: 'view' | 'download') => {
    if (!url) {
      toast.error('No file URL available');
      return;
    }

    try {
      if (action === 'view') {
        window.open(url, '_blank');
      } else {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = 'contract-submission';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error('Error handling file:', error);
      toast.error(`Failed to ${action} file`);
    }
  };

  const getSubmissionData = (data: ContractSubmission | string | undefined): ContractSubmission | null => {
    if (!data) return null;
    console.log('Raw submission data:', data);
    
    if (typeof data === 'string') {
      // Check if the string is a URL
      if (data.startsWith('http')) {
        console.log('Direct URL found:', data);
        return {
          description: 'Submitted work',
          fileUrl: data
        };
      }
      // Try parsing as JSON
      try {
        const parsed = JSON.parse(data) as ContractSubmission;
        console.log('Parsed JSON data:', parsed);
        // Ensure fileUrl is a string and not an object
        if (parsed.fileUrl && typeof parsed.fileUrl === 'object') {
          const fileUrlObj = parsed.fileUrl as FileUrlObject;
          console.log('File URL object:', fileUrlObj);
          // If it's a Cloudinary object, construct the URL properly
          if (fileUrlObj.url) {
            parsed.fileUrl = fileUrlObj.url;
          } else if (typeof fileUrlObj === 'object') {
            // Try to extract the URL from various possible Cloudinary object structures
            const cloudinaryObj = fileUrlObj as any;
            if (cloudinaryObj.secure_url) {
              parsed.fileUrl = cloudinaryObj.secure_url;
            } else if (cloudinaryObj.public_id) {
              const format = cloudinaryObj.format || '';
              const version = cloudinaryObj.version || 'v1745518142';
              parsed.fileUrl = `https://res.cloudinary.com/de1mpufjm/image/upload/${version}/${cloudinaryObj.public_id}${format ? '.' + format : ''}`;
            } else if (cloudinaryObj.asset_id) {
              const version = cloudinaryObj.version || 'v1745518142';
              parsed.fileUrl = `https://res.cloudinary.com/de1mpufjm/image/upload/${version}/${cloudinaryObj.asset_id}`;
            } else {
              // Try to find any URL-like property in the object
              const urlProperty = Object.entries(cloudinaryObj).find(([_, value]) => 
                typeof value === 'string' && value.startsWith('http')
              );
              if (urlProperty) {
                parsed.fileUrl = urlProperty[1] as string;
              } else {
                parsed.fileUrl = String(fileUrlObj);
              }
            }
          }
          console.log('Processed file URL:', parsed.fileUrl);
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing submission data:', e);
        return null;
      }
    }
    // If data is an object, ensure fileUrl is a string
    if (data.fileUrl && typeof data.fileUrl === 'object') {
      const fileUrlObj = data.fileUrl as FileUrlObject;
      console.log('Object file URL:', fileUrlObj);
      // If it's a Cloudinary object, construct the URL properly
      if (fileUrlObj.url) {
        return {
          ...data,
          fileUrl: fileUrlObj.url
        };
      } else if (typeof fileUrlObj === 'object') {
        // Try to extract the URL from various possible Cloudinary object structures
        const cloudinaryObj = fileUrlObj as any;
        if (cloudinaryObj.secure_url) {
          return {
            ...data,
            fileUrl: cloudinaryObj.secure_url
          };
        } else if (cloudinaryObj.public_id) {
          const format = cloudinaryObj.format || '';
          const version = cloudinaryObj.version || 'v1745518142';
          return {
            ...data,
            fileUrl: `https://res.cloudinary.com/de1mpufjm/image/upload/${version}/${cloudinaryObj.public_id}${format ? '.' + format : ''}`
          };
        } else if (cloudinaryObj.asset_id) {
          const version = cloudinaryObj.version || 'v1745518142';
          return {
            ...data,
            fileUrl: `https://res.cloudinary.com/de1mpufjm/image/upload/${version}/${cloudinaryObj.asset_id}`
          };
        } else {
          // Try to find any URL-like property in the object
          const urlProperty = Object.entries(cloudinaryObj).find(([_, value]) => 
            typeof value === 'string' && value.startsWith('http')
          );
          if (urlProperty) {
            return {
              ...data,
              fileUrl: urlProperty[1] as string
            };
          }
        }
      }
      return {
        ...data,
        fileUrl: String(fileUrlObj)
      };
    }
    return data;
  };

  const filteredContracts = contracts.filter(contract => {
    switch (activeTab) {
      case "pending":
        return ["PENDING", "FREELANCER_ACCEPTED", "CLIENT_ACCEPTED"].includes(contract.status)
      case "active":
        return ["ACTIVE", "PENDING_REVIEW", "UNDER_ADMIN_REVIEW"].includes(contract.status)
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
          <h1 className="text-3xl font-bold mb-4">My Contracts</h1>
          <p className="text-muted-foreground">
            Manage your client contracts and agreements
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
                          <h4 className="font-semibold text-gray-900 mb-2">Freelancer Information</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Freelancer: {contract.proposal.freelancer.name}</p>
                          </div>
                        </div>
                      </div>
                      {(contract.status === "PENDING" || contract.status === "FREELANCER_ACCEPTED") && (
                        <div className="flex gap-2 mt-4">
                          <Button 
                            onClick={() => handleAcceptContract(contract.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Accept Contract
                          </Button>
                          <Button 
                            onClick={() => handleRejectAndCreateTicket(contract)}
                            variant="outline" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {contract.status === "PENDING_REVIEW" && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Review Submitted Work</h4>
                          <div className="space-y-4">
                            <div>
                              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">
                                Feedback
                              </label>
                              <textarea
                                id="feedback"
                                name="feedback"
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="Provide feedback on the submitted work"
                              />
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="acceptSubmission"
                                name="acceptSubmission"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <label htmlFor="acceptSubmission" className="ml-2 block text-sm text-gray-900">
                                Accept this submission
                              </label>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleAcceptSubmission(contract.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Accepting...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Accept Submission
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={() => handleRejectSubmission(contract.id)}
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={loading}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      {contract.status === "COMPLETED" && (
                        <div className="mt-4">
                          <div className="text-sm text-green-600">
                            <CheckCircle className="inline-block mr-1 h-4 w-4" />
                            Contract completed successfully
                          </div>
                          {contract.clientFeedback && (
                            <div className="mt-2">
                              <h4 className="font-semibold text-gray-900 mb-1">Your Feedback</h4>
                              <p className="text-sm text-gray-600">{contract.clientFeedback}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {contract.status === 'COMPLETED' && (
                        <div className="mt-4">
                          <h3 className="text-lg font-semibold mb-2">Submission</h3>
                          {contract.submissionData && (
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium text-gray-700">Description</h4>
                                <p className="mt-1 text-gray-600">
                                  {getSubmissionData(contract.submissionData)?.description || 'No description provided'}
                                </p>
                              </div>
                              {getSubmissionData(contract.submissionData)?.fileUrl && (
                                <div className="mt-2 flex gap-2">
                                  <button
                                    onClick={() => handleFileAction(getSubmissionData(contract.submissionData)?.fileUrl, 'download')}
                                    className="text-green-600 hover:text-green-800 flex items-center gap-2"
                                    disabled={!getSubmissionData(contract.submissionData)?.fileUrl}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download File
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {contract.status === "UNDER_ADMIN_REVIEW" && (
                        <div className="mt-4 p-4 bg-orange-50 rounded-md border border-orange-200">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <AlertCircle className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-orange-800">Contract Under Admin Review</h3>
                              <div className="mt-2 text-sm text-orange-700">
                                <p>This contract has been rejected and is currently under admin review. You can submit additional information or dispute the rejection.</p>
                              </div>
                              <div className="mt-4">
                                <Button
                                  onClick={() => handleCreateTicket(contract)}
                                  variant="outline"
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                >
                                  <AlertCircle className="mr-2 h-4 w-4" />
                                  Submit Additional Information
                                </Button>
                              </div>
                            </div>
                          </div>
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
                          <h4 className="font-semibold text-gray-900 mb-2">Freelancer Information</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Freelancer: {contract.proposal.freelancer.name}</p>
                          </div>
                        </div>
                      </div>
                      {contract.status === "PENDING_REVIEW" && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Review Submitted Work</h4>
                          <div className="space-y-4">
                            <div>
                              <h5 className="text-sm font-medium text-gray-700">Submission Data</h5>
                              {(() => {
                                const submissionData = getSubmissionData(contract.submissionData);
                                if (!submissionData) {
                                  return <p className="mt-1 text-sm text-gray-600">No submission data available</p>;
                                }
                                return (
                                  <>
                                    <p className="mt-1 text-sm text-gray-600">{submissionData.description}</p>
                                    {submissionData.fileUrl && (
                                      <div className="mt-2 flex gap-2">
                                        <button
                                          onClick={() => handleFileAction(submissionData.fileUrl || '', 'download')}
                                          className="text-green-600 hover:text-green-800 flex items-center gap-2"
                                          disabled={!submissionData.fileUrl}
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                          </svg>
                                          Download File
                                        </button>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-gray-700">Description</h5>
                              <p className="mt-1 text-sm text-gray-600">{contract.submissionDescription}</p>
                            </div>
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              const form = e.target as HTMLFormElement;
                              const feedback = (form.elements.namedItem('feedback') as HTMLTextAreaElement).value;
                              const accepted = (form.elements.namedItem('accepted') as HTMLInputElement).checked;
                              handleReviewWork(contract.id, accepted, feedback);
                            }}>
                              <div className="space-y-4">
                                <div>
                                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">
                                    Feedback
                                  </label>
                                  <textarea
                                    id="feedback"
                                    name="feedback"
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="Provide feedback about the submitted work"
                                    required
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id="accepted"
                                    name="accepted"
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <label htmlFor="accepted" className="text-sm font-medium text-gray-700">
                                    Accept this submission
                                  </label>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    type="submit"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    disabled={loading}
                                  >
                                    {loading ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                        Submitting Review...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Accept & Submit Review
                                      </>
                                    )}
                                  </Button>
                                  <Button 
                                    type="button"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const form = e.currentTarget.closest('form') as HTMLFormElement;
                                      const feedback = (form.elements.namedItem('feedback') as HTMLTextAreaElement).value;
                                      handleReviewWork(contract.id, false, feedback);
                                    }}
                                    disabled={loading}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject & Create Ticket
                                  </Button>
                                </div>
                              </div>
                            </form>
                          </div>
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
                          <h4 className="font-semibold text-gray-900 mb-2">Freelancer Information</h4>
                          <div className="space-y-2 text-sm text-gray-600">
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