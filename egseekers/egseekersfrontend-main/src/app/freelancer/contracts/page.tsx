"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FileText, CheckCircle, XCircle, Clock, AlertCircle, DollarSign, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Contract, ContractStatus, ContractSubmission } from "@/types/contract"
import { ApiResponse } from "@/types/api"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

export default function FreelancerContractsPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("pending")
  const [acceptingContractId, setAcceptingContractId] = useState<string | null>(null)

  // Add helper function to format error messages
  const formatErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error?.message) return error.error.message;
    if (error?.error) return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
    return 'An unexpected error occurred';
  };

  useEffect(() => {
    fetchContracts();
  }, [])

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Contract[]>('/contracts');
      
      if (response.success && response.data) {
        // Ensure response.data is an array
        const contractsData = Array.isArray(response.data) ? response.data : [];
        setContracts(contractsData)
        setError(null)
      } else {
        setContracts([])
        setError(response.error || "Failed to load contracts")
      }
    } catch (error) {
      console.error("Error fetching contracts:", error)
      setContracts([])
      setError(error instanceof Error ? error.message : "Failed to load contracts")
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptContract = async (contractId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setAcceptingContractId(contractId);
      setError(null);
      
      const response = await apiClient.post<Contract>(`/contracts/${contractId}/accept`);
      
      if (response.success && response.data) {
        setContracts(prevContracts => 
          prevContracts.map(contract => 
            contract.id === contractId ? response.data! : contract
          )
        );

        if (response.data.status === "ACTIVE") {
          setActiveTab("active");
        }
        toast.success('Contract accepted successfully');
      } else {
        setError(response.error || "Failed to accept contract");
        toast.error(response.error || "Failed to accept contract");
      }
    } catch (error) {
      console.error("Error accepting contract:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to accept contract";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setAcceptingContractId(null);
    }
  };

  const handleRejectContract = async (contractId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.post<Contract>(`/contracts/${contractId}/decline`, {
        reason: "Declined by freelancer"
      });
      
      if (response.success && response.data) {
        setContracts(prevContracts => 
          prevContracts.map(contract => 
            contract.id === contractId ? response.data! : contract
          )
        );
        toast.success('Contract declined successfully');
      } else {
        setError(response.error || "Failed to decline contract");
        toast.error(response.error || "Failed to decline contract");
      }
    } catch (error) {
      console.error("Error declining contract:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to decline contract";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWork = async (contractId: string, description: string, file: File | null) => {
    try {
      setLoading(true);
      console.log('Starting work submission process...');

      // Validate inputs
      if (!file) {
        throw new Error('Please select a file to upload');
      }

      if (!description.trim()) {
        throw new Error('Please provide a description');
      }

      // Validate description length
      if (description.trim().length < 10) {
        throw new Error('Description must be at least 10 characters long');
      }

      if (description.trim().length > 1000) {
        throw new Error('Description cannot exceed 1000 characters');
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed'
      ];

      const fileType = file.type || '';
      if (!fileType) {
        throw new Error('Could not determine file type. Please ensure you are uploading a valid file.');
      }

      if (!allowedTypes.includes(fileType)) {
        throw new Error('Invalid file type. Only PDF, Word documents, text files, and archives are allowed.');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description.trim()); // Ensure description is trimmed

      const response = await apiClient.post<Contract>(`/contracts/${contractId}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (response.success && response.data) {
        // Update the contracts list with the updated contract
        setContracts(prevContracts =>
          prevContracts.map(contract =>
            contract.id === contractId ? response.data! : contract
          )
        );
        toast.success('Work submitted successfully');
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to submit work');
      }
    } catch (error) {
      console.error('Error submitting work:', error);
      const errorMessage = formatErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (contract: Contract) => {
    try {
      setLoading(true);
      const response = await apiClient.post<{ id: string }>('/tickets', {
        title: `Contract Review Request - ${contract.proposal?.job?.title || 'Untitled Job'}`,
        description: `I would like to submit additional information regarding the rejection of my work for "${contract.proposal?.job?.title || 'Untitled Job'}".`,
        category: 'CONTRACT_REVIEW',
        priority: 'HIGH',
        contractId: contract.id
      });

      if (response.success && response.data?.id) {
        toast.success('Ticket created successfully');
        router.push(`/support/tickets/${response.data.id}`);
      } else {
        throw new Error(response.error || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create ticket';
      setError(errorMessage);
      toast.error(errorMessage);
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
  };

  const filteredContracts = contracts.filter((contract) => {
    switch (activeTab) {
      case "pending":
        return contract.status === "PENDING";
      case "active":
        return ["ACTIVE", "FREELANCER_ACCEPTED", "PENDING_REVIEW", "UNDER_ADMIN_REVIEW"].includes(contract.status);
      case "completed":
        return contract.status === "COMPLETED";
      default:
        return true;
    }
  });

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
            <CardDescription className="text-red-600">{formatErrorMessage(error)}</CardDescription>
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
            Manage your freelance contracts and agreements
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
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {contract.proposal?.job?.title || 'Untitled Job'}
                        </CardTitle>
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
                          <h4 className="font-semibold text-gray-900 mb-2">Client Information</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Client: {contract.proposal?.job?.client?.name || 'Unknown Client'}</p>
                          </div>
                        </div>
                      </div>
                      {contract.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button 
                            onClick={(e) => handleAcceptContract(contract.id, e)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={acceptingContractId === contract.id}
                            type="button"
                          >
                            {acceptingContractId === contract.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Accepting...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Accept Contract
                              </>
                            )}
                          </Button>
                          <Button 
                            onClick={() => handleRejectContract(contract.id)}
                            variant="outline" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={acceptingContractId === contract.id}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Decline Contract
                          </Button>
                        </div>
                      )}
                      {contract.status === "CLIENT_ACCEPTED" && (
                        <div className="flex gap-2">
                          <Button 
                            onClick={(e) => handleAcceptContract(contract.id, e)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={acceptingContractId === contract.id}
                            type="button"
                          >
                            {acceptingContractId === contract.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Accepting...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Accept Contract
                              </>
                            )}
                          </Button>
                          <Button 
                            onClick={() => handleRejectContract(contract.id)}
                            variant="outline" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={acceptingContractId === contract.id}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Decline Contract
                          </Button>
                        </div>
                      )}
                      {contract.status === "FREELANCER_ACCEPTED" && (
                        <div className="text-sm text-blue-600">
                          <CheckCircle className="inline-block mr-1 h-4 w-4" />
                          You have accepted this contract. Waiting for client to accept.
                        </div>
                      )}
                      {contract.status === "ACTIVE" && (
                        <div className="text-sm text-green-600">
                          <CheckCircle className="inline-block mr-1 h-4 w-4" />
                          Contract is active. Work can begin.
                        </div>
                      )}
                      {contract.status === "COMPLETED" && (
                        <div className="text-sm text-gray-600">
                          <CheckCircle className="inline-block mr-1 h-4 w-4" />
                          Contract completed.
                        </div>
                      )}
                      {contract.status === "CANCELLED" && (
                        <div className="text-sm text-red-600">
                          <XCircle className="inline-block mr-1 h-4 w-4" />
                          Contract cancelled.
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
                                <p>This contract has been rejected by the client and is currently under admin review. You can submit additional information or dispute the rejection.</p>
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
                      {contract.submissionData && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900">Submitted Work</h4>
                          <p className="mt-1 text-sm text-gray-500">{contract.submissionData.description}</p>
                          {contract.submissionData.fileUrl && (
                            <div className="mt-2">
                              <a
                                href={contract.submissionData.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download Submitted File
                              </a>
                            </div>
                          )}
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
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {contract.proposal?.job?.title || 'Untitled Job'}
                        </CardTitle>
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
                          <h4 className="font-semibold text-gray-900 mb-2">Client Information</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Client: {contract.proposal?.job?.client?.name || 'Unknown Client'}</p>
                          </div>
                        </div>
                      </div>
                      {contract.status === "ACTIVE" && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Submit Work</h4>
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value;
                            const fileInput = form.elements.namedItem('file') as HTMLInputElement;
                            const file = fileInput.files?.[0] || null;
                            
                            // Validate required fields
                            if (!description.trim()) {
                              toast.error('Please provide a description');
                              return;
                            }
                            if (!file) {
                              toast.error('Please upload a file');
                              return;
                            }
                            
                            handleSubmitWork(contract.id, description, file);
                          }}>
                            <div className="space-y-4">
                              <div>
                                <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                                  Upload File <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="file"
                                  id="file"
                                  name="file"
                                  className="mt-1 block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-blue-50 file:text-blue-700
                                    hover:file:bg-blue-100"
                                  accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                                  required
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                  Accepted formats: PDF, DOC, DOCX, TXT, ZIP, RAR (max 10MB)
                                </p>
                              </div>
                              <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                  Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                  id="description"
                                  name="description"
                                  rows={3}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  placeholder="Describe what you've completed and any notes for the client (minimum 10 characters)"
                                  required
                                  minLength={10}
                                  maxLength={1000}
                                  onChange={(e) => {
                                    const value = e.target.value.trim();
                                    if (value.length < 10) {
                                      e.target.setCustomValidity('Description must be at least 10 characters long');
                                    } else if (value.length > 1000) {
                                      e.target.setCustomValidity('Description cannot exceed 1000 characters');
                                    } else {
                                      e.target.setCustomValidity('');
                                    }
                                  }}
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                  Minimum 10 characters, maximum 1000 characters
                                </p>
                              </div>
                              <Button 
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Submitting...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Submit Work
                                  </>
                                )}
                              </Button>
                            </div>
                          </form>
                        </div>
                      )}
                      {contract.status === "PENDING_REVIEW" && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <Clock className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-blue-800">Work Submitted for Review</h3>
                              <div className="mt-2 text-sm text-blue-700">
                                <p>Your work has been submitted and is waiting for client review. You will be notified once the client has reviewed your submission.</p>
                              </div>
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
                              <h4 className="font-semibold text-gray-900 mb-1">Client Feedback</h4>
                              <p className="text-sm text-gray-600">{contract.clientFeedback}</p>
                            </div>
                          )}
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
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {contract.proposal?.job?.title || 'Untitled Job'}
                        </CardTitle>
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
                          <h4 className="font-semibold text-gray-900 mb-2">Client Information</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Client: {contract.proposal?.job?.client?.name || 'Unknown Client'}</p>
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