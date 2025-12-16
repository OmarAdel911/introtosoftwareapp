"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, File } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface Contract {
  id: string;
  status: string;
  amount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  freelancer: {
    id: string;
    name: string;
    email: string;
  };
  job: {
    id: string;
    title: string;
  };
}

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchContracts();
  }, [activeTab]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Contract[]>('/admin/contracts');
      
      if (response.success && response.data) {
        setContracts(response.data);
        setError(null);
      } else {
        setError(response.error || "Failed to load contracts");
        toast.error(response.error || "Failed to load contracts");
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
      setError("Failed to load contracts");
      toast.error("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  const handleViewContract = (contractId: string) => {
    window.location.href = `/admin/contracts/${contractId}`;
  };

  const handleUpdateStatus = async (contractId: string, newStatus: string) => {
    try {
      setLoading(true);
      const response = await apiClient.patch(`/admin/contracts/${contractId}`, {
        status: newStatus
      });
      
      if (response.success) {
        toast.success(`Contract status updated to ${newStatus}`);
        fetchContracts();
      } else {
        toast.error(response.error || "Failed to update contract status");
      }
    } catch (error) {
      console.error("Error updating contract status:", error);
      toast.error("Failed to update contract status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "ACTIVE":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredContracts = contracts.filter(contract => {
    // Apply tab filter
    if (activeTab !== "all" && contract.status !== activeTab) {
      return false;
    }
    
    // Apply status filter
    if (statusFilter !== "all" && contract.status !== statusFilter) {
      return false;
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        contract.client.name.toLowerCase().includes(searchLower) ||
        contract.freelancer.name.toLowerCase().includes(searchLower) ||
        contract.job.title.toLowerCase().includes(searchLower) ||
        contract.id.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
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
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-4">Contracts</h1>
          <p className="text-muted-foreground">
            Manage contracts between freelancers and clients
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Filters</CardTitle>
            <CardDescription>Filter contracts by status and search terms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-64">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contracts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                More Filters
              </Button>
              <Button className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto bg-white border border-gray-200">
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              All
            </TabsTrigger>
            <TabsTrigger value="PENDING" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              Pending
            </TabsTrigger>
            <TabsTrigger value="ACTIVE" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              Active
            </TabsTrigger>
            <TabsTrigger value="COMPLETED" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              Completed
            </TabsTrigger>
            <TabsTrigger value="CANCELLED" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              Cancelled
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-6">
              {filteredContracts.map((contract) => (
                <Card key={contract.id} className="border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {contract.job.title}
                        </CardTitle>
                        <CardDescription className="text-gray-500 mt-1">
                          Contract ID: {contract.id}
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
                            <p>Amount: {formatCurrency(contract.amount)}</p>
                            <p>Start Date: {new Date(contract.startDate).toLocaleDateString()}</p>
                            <p>End Date: {new Date(contract.endDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Parties</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Client: {contract.client.name} ({contract.client.email})</p>
                            <p>Freelancer: {contract.freelancer.name} ({contract.freelancer.email})</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleViewContract(contract.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        {contract.status === "PENDING" && (
                          <Button 
                            onClick={() => handleUpdateStatus(contract.id, "ACTIVE")}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Activate
                          </Button>
                        )}
                        {contract.status === "ACTIVE" && (
                          <Button 
                            onClick={() => handleUpdateStatus(contract.id, "COMPLETED")}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Completed
                          </Button>
                        )}
                        {(contract.status === "PENDING" || contract.status === "ACTIVE") && (
                          <Button 
                            onClick={() => handleUpdateStatus(contract.id, "CANCELLED")}
                            variant="outline" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredContracts.length === 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      <File className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No contracts found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No contracts match your current filters.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="PENDING" className="mt-6">
            {/* Same structure as "all" tab, but for pending contracts */}
            <div className="grid gap-6">
              {filteredContracts.map((contract) => (
                <Card key={contract.id} className="border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {contract.job.title}
                        </CardTitle>
                        <CardDescription className="text-gray-500 mt-1">
                          Contract ID: {contract.id}
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
                            <p>Amount: {formatCurrency(contract.amount)}</p>
                            <p>Start Date: {new Date(contract.startDate).toLocaleDateString()}</p>
                            <p>End Date: {new Date(contract.endDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Parties</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Client: {contract.client.name} ({contract.client.email})</p>
                            <p>Freelancer: {contract.freelancer.name} ({contract.freelancer.email})</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleViewContract(contract.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        <Button 
                          onClick={() => handleUpdateStatus(contract.id, "ACTIVE")}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Activate
                        </Button>
                        <Button 
                          onClick={() => handleUpdateStatus(contract.id, "CANCELLED")}
                          variant="outline" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredContracts.length === 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      <File className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No pending contracts</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No pending contracts match your current filters.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ACTIVE" className="mt-6">
            {/* Same structure as "all" tab, but for active contracts */}
            <div className="grid gap-6">
              {filteredContracts.map((contract) => (
                <Card key={contract.id} className="border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {contract.job.title}
                        </CardTitle>
                        <CardDescription className="text-gray-500 mt-1">
                          Contract ID: {contract.id}
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
                            <p>Amount: {formatCurrency(contract.amount)}</p>
                            <p>Start Date: {new Date(contract.startDate).toLocaleDateString()}</p>
                            <p>End Date: {new Date(contract.endDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Parties</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Client: {contract.client.name} ({contract.client.email})</p>
                            <p>Freelancer: {contract.freelancer.name} ({contract.freelancer.email})</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleViewContract(contract.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        <Button 
                          onClick={() => handleUpdateStatus(contract.id, "COMPLETED")}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Completed
                        </Button>
                        <Button 
                          onClick={() => handleUpdateStatus(contract.id, "CANCELLED")}
                          variant="outline" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredContracts.length === 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      <File className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No active contracts</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No active contracts match your current filters.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="COMPLETED" className="mt-6">
            {/* Same structure as "all" tab, but for completed contracts */}
            <div className="grid gap-6">
              {filteredContracts.map((contract) => (
                <Card key={contract.id} className="border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {contract.job.title}
                        </CardTitle>
                        <CardDescription className="text-gray-500 mt-1">
                          Contract ID: {contract.id}
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
                            <p>Amount: {formatCurrency(contract.amount)}</p>
                            <p>Start Date: {new Date(contract.startDate).toLocaleDateString()}</p>
                            <p>End Date: {new Date(contract.endDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Parties</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Client: {contract.client.name} ({contract.client.email})</p>
                            <p>Freelancer: {contract.freelancer.name} ({contract.freelancer.email})</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleViewContract(contract.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredContracts.length === 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      <File className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No completed contracts</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No completed contracts match your current filters.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="CANCELLED" className="mt-6">
            {/* Same structure as "all" tab, but for cancelled contracts */}
            <div className="grid gap-6">
              {filteredContracts.map((contract) => (
                <Card key={contract.id} className="border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {contract.job.title}
                        </CardTitle>
                        <CardDescription className="text-gray-500 mt-1">
                          Contract ID: {contract.id}
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
                            <p>Amount: {formatCurrency(contract.amount)}</p>
                            <p>Start Date: {new Date(contract.startDate).toLocaleDateString()}</p>
                            <p>End Date: {new Date(contract.endDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Parties</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Client: {contract.client.name} ({contract.client.email})</p>
                            <p>Freelancer: {contract.freelancer.name} ({contract.freelancer.email})</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleViewContract(contract.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredContracts.length === 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      <File className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No cancelled contracts</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No cancelled contracts match your current filters.
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
  );
} 