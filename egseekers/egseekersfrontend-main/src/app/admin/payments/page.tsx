"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, FileText, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number;
  status: string;
  type: string;
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
  contract: {
    id: string;
    job: {
      id: string;
      title: string;
    };
  };
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchPayments();
  }, [activeTab]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Payment[]>('/admin/payments');
      
      if (response.success && response.data) {
        setPayments(response.data);
        setError(null);
      } else {
        setError(response.error || "Failed to load payments");
        toast.error(response.error || "Failed to load payments");
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      setError("Failed to load payments");
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayment = (paymentId: string) => {
    window.location.href = `/admin/payments/${paymentId}`;
  };

  const handleUpdateStatus = async (paymentId: string, newStatus: string) => {
    try {
      setLoading(true);
      const response = await apiClient.patch(`/admin/payments/${paymentId}`, {
        status: newStatus
      });
      
      if (response.success) {
        toast.success(`Payment status updated to ${newStatus}`);
        fetchPayments();
      } else {
        toast.error(response.error || "Failed to update payment status");
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Failed to update payment status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "FAILED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case "REFUNDED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><DollarSign className="w-3 h-3 mr-1" /> Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "CONTRACT_PAYMENT":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Contract Payment</Badge>;
      case "SUBSCRIPTION":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Subscription</Badge>;
      case "WITHDRAWAL":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Withdrawal</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const filteredPayments = payments.filter(payment => {
    // Apply tab filter
    if (activeTab !== "all" && payment.status !== activeTab) {
      return false;
    }
    
    // Apply status filter
    if (statusFilter !== "all" && payment.status !== statusFilter) {
      return false;
    }
    
    // Apply type filter
    if (typeFilter !== "all" && payment.type !== typeFilter) {
      return false;
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        payment.client.name.toLowerCase().includes(searchLower) ||
        payment.freelancer.name.toLowerCase().includes(searchLower) ||
        payment.contract.job.title.toLowerCase().includes(searchLower) ||
        payment.id.toLowerCase().includes(searchLower)
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
          <h1 className="text-3xl font-bold mb-4">Payments</h1>
          <p className="text-muted-foreground">
            Manage payment transactions between clients and freelancers
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Filters</CardTitle>
            <CardDescription>Filter payments by status, type, and search terms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-64">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payments..."
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
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="CONTRACT_PAYMENT">Contract Payment</SelectItem>
                    <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                    <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
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
            <TabsTrigger value="COMPLETED" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              Completed
            </TabsTrigger>
            <TabsTrigger value="FAILED" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              Failed
            </TabsTrigger>
            <TabsTrigger value="REFUNDED" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              Refunded
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-6">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {payment.contract.job.title}
                        </CardTitle>
                        <CardDescription className="text-gray-500 mt-1">
                          Payment ID: {payment.id}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Payment Details</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Amount: {formatCurrency(payment.amount)}</p>
                            <p>Type: {getTypeBadge(payment.type)}</p>
                            <p>Date: {new Date(payment.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Parties</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Client: {payment.client.name} ({payment.client.email})</p>
                            <p>Freelancer: {payment.freelancer.name} ({payment.freelancer.email})</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleViewPayment(payment.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        {payment.status === "PENDING" && (
                          <Button 
                            onClick={() => handleUpdateStatus(payment.id, "COMPLETED")}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Completed
                          </Button>
                        )}
                        {payment.status === "COMPLETED" && (
                          <Button 
                            onClick={() => handleUpdateStatus(payment.id, "REFUNDED")}
                            variant="outline" 
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Refund
                          </Button>
                        )}
                        {payment.status === "PENDING" && (
                          <Button 
                            onClick={() => handleUpdateStatus(payment.id, "FAILED")}
                            variant="outline" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Mark as Failed
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredPayments.length === 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No payments match your current filters.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="PENDING" className="mt-6">
            {/* Same structure as "all" tab, but for pending payments */}
            <div className="grid gap-6">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {payment.contract.job.title}
                        </CardTitle>
                        <CardDescription className="text-gray-500 mt-1">
                          Payment ID: {payment.id}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Payment Details</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Amount: {formatCurrency(payment.amount)}</p>
                            <p>Type: {getTypeBadge(payment.type)}</p>
                            <p>Date: {new Date(payment.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Parties</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Client: {payment.client.name} ({payment.client.email})</p>
                            <p>Freelancer: {payment.freelancer.name} ({payment.freelancer.email})</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleViewPayment(payment.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        <Button 
                          onClick={() => handleUpdateStatus(payment.id, "COMPLETED")}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Completed
                        </Button>
                        <Button 
                          onClick={() => handleUpdateStatus(payment.id, "FAILED")}
                          variant="outline" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Mark as Failed
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredPayments.length === 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No pending payments</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No pending payments match your current filters.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="COMPLETED" className="mt-6">
            {/* Same structure as "all" tab, but for completed payments */}
            <div className="grid gap-6">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {payment.contract.job.title}
                        </CardTitle>
                        <CardDescription className="text-gray-500 mt-1">
                          Payment ID: {payment.id}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Payment Details</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Amount: {formatCurrency(payment.amount)}</p>
                            <p>Type: {getTypeBadge(payment.type)}</p>
                            <p>Date: {new Date(payment.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Parties</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Client: {payment.client.name} ({payment.client.email})</p>
                            <p>Freelancer: {payment.freelancer.name} ({payment.freelancer.email})</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleViewPayment(payment.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        <Button 
                          onClick={() => handleUpdateStatus(payment.id, "REFUNDED")}
                          variant="outline" 
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          Refund
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredPayments.length === 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No completed payments</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No completed payments match your current filters.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="FAILED" className="mt-6">
            {/* Same structure as "all" tab, but for failed payments */}
            <div className="grid gap-6">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {payment.contract.job.title}
                        </CardTitle>
                        <CardDescription className="text-gray-500 mt-1">
                          Payment ID: {payment.id}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Payment Details</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Amount: {formatCurrency(payment.amount)}</p>
                            <p>Type: {getTypeBadge(payment.type)}</p>
                            <p>Date: {new Date(payment.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Parties</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Client: {payment.client.name} ({payment.client.email})</p>
                            <p>Freelancer: {payment.freelancer.name} ({payment.freelancer.email})</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleViewPayment(payment.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        <Button 
                          onClick={() => handleUpdateStatus(payment.id, "COMPLETED")}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Completed
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredPayments.length === 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No failed payments</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No failed payments match your current filters.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="REFUNDED" className="mt-6">
            {/* Same structure as "all" tab, but for refunded payments */}
            <div className="grid gap-6">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {payment.contract.job.title}
                        </CardTitle>
                        <CardDescription className="text-gray-500 mt-1">
                          Payment ID: {payment.id}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Payment Details</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Amount: {formatCurrency(payment.amount)}</p>
                            <p>Type: {getTypeBadge(payment.type)}</p>
                            <p>Date: {new Date(payment.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Parties</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Client: {payment.client.name} ({payment.client.email})</p>
                            <p>Freelancer: {payment.freelancer.name} ({payment.freelancer.email})</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleViewPayment(payment.id)}
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
              {filteredPayments.length === 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No refunded payments</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No refunded payments match your current filters.
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