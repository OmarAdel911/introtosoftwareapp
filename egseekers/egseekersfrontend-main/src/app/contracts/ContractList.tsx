import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Contract, ContractStatus } from '@/types/contract';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/config/env';
import { toast } from 'react-hot-toast';

interface ContractListProps {
  userRole: 'client' | 'freelancer';
  filter?: (contract: Contract) => boolean;
}

export function ContractList({ userRole, filter }: ContractListProps) {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setError(null);
      const response = await apiClient.get<Contract[]>(API_ENDPOINTS.contracts.base);
      
      if (response.success && response.data) {
        setContracts(filter ? response.data.filter(filter) : response.data);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load contracts');
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptContract = async (contractId: string) => {
    try {
      setProcessingId(contractId);
      setError(null);

      const response = await apiClient.post<Contract>(
        API_ENDPOINTS.contracts.accept(contractId)
      );

      if (response.success && response.data) {
        setContracts(prevContracts =>
          prevContracts.map(contract =>
            contract.id === contractId ? response.data! : contract
          )
        );
        toast.success('Contract accepted successfully');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to accept contract');
      toast.error('Failed to accept contract');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineContract = async (contractId: string) => {
    try {
      setProcessingId(contractId);
      setError(null);

      const response = await apiClient.post<Contract>(
        API_ENDPOINTS.contracts.decline(contractId)
      );

      if (response.success && response.data) {
        setContracts(prevContracts =>
          prevContracts.map(contract =>
            contract.id === contractId ? response.data! : contract
          )
        );
        toast.success('Contract declined successfully');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to decline contract');
      toast.error('Failed to decline contract');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'FREELANCER_ACCEPTED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" /> Freelancer Accepted</Badge>;
      case 'CLIENT_ACCEPTED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" /> Client Accepted</Badge>;
      case 'ACTIVE':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      case 'UNDER_ADMIN_REVIEW':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200"><AlertCircle className="w-3 h-3 mr-1" /> Under Admin Review</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error
          </CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No contracts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any contracts at the moment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {contracts.map((contract) => (
        <Card key={contract.id} className="border border-gray-200">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  {contract.proposal.job.title}
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
                  <h4 className="font-semibold text-gray-900 mb-2">Parties</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Client: {contract.proposal.job.client.name}</p>
                    <p>Freelancer: {contract.proposal.freelancer.name}</p>
                  </div>
                </div>
              </div>
              {contract.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAcceptContract(contract.id)}
                    disabled={processingId === contract.id}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept Contract
                  </Button>
                  <Button
                    onClick={() => handleDeclineContract(contract.id)}
                    disabled={processingId === contract.id}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Decline Contract
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 