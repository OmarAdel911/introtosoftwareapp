"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CreditCard, AlertCircle, CheckCircle, Wallet, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { config } from '@/config/env';
import { toast } from "sonner";

interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  description: string;
  sourceType?: string;
  sourceId?: string;
}

export default function FreelancerCreditsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalActiveCredits, setTotalActiveCredits] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);

  useEffect(() => {
    fetchCreditsData();
  }, []);

  // Refresh credits when page becomes visible (e.g., after returning from payment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCreditsData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchCreditsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch freelancer's credits
      const creditsRes = await axios.get(`${config.apiUrl}/credits`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTotalActiveCredits(creditsRes.data.totalActiveCredits || 0);
      setTotalEarned(creditsRes.data.totalEarned || 0);
      // Filter out pending purchases with amount 0 (they'll be updated after payment)
      // But keep completed purchases and all other transactions
      const validTransactions = (creditsRes.data.credits || []).filter(
        (t: CreditTransaction) => {
          // Exclude pending purchases with 0 amount (not yet completed)
          if (t.sourceType === 'CREDIT_PURCHASE_PENDING' && t.amount === 0) {
            return false;
          }
          return true;
        }
      );
      // Sort by date (newest first)
      validTransactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTransactions(validTransactions);
    } catch (err) {
      console.error("Error fetching credits data:", err);
      setError("Failed to load credits data. Please try again later.");
      toast.error("Failed to load credits data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Credits</h1>
          <p className="text-muted-foreground mt-2">
            View your earned credits from completed contracts.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCreditsData}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Available Credits</CardTitle>
            <CardDescription>Your current credit balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{totalActiveCredits.toFixed(2)} EGP</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Earned</CardTitle>
            <CardDescription>Total credits earned from contracts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalEarned.toFixed(2)} EGP</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Total credit transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {transactions.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>Your credit earnings and transaction history</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchCreditsData}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions yet</p>
                    <p className="text-sm mt-2">Complete contracts to start earning credits</p>
                  </div>
                ) : (
                  transactions.map((transaction) => {
                    const isEarned = transaction.type === 'EARNED' && transaction.amount > 0;
                    const isPurchase = transaction.type === 'PURCHASED' && transaction.amount > 0 && transaction.sourceType === 'CREDIT_PURCHASE';
                    const isUsed = transaction.type === 'USED' || (transaction.amount < 0 && transaction.type !== 'PURCHASED');
                    const isPending = transaction.sourceType === 'CREDIT_PURCHASE_PENDING';
                    const isOnHold = transaction.status === 'ON_HOLD' || transaction.sourceType === 'CONTRACT_ESCROW';
                    
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            <span className={
                              isEarned ? "text-blue-600" :
                              isPurchase ? "text-green-600" : 
                              isUsed ? "text-red-600" : 
                              isOnHold ? "text-yellow-600" : 
                              "text-gray-600"
                            }>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} EGP
                            </span>
                            {isEarned && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">Earned</Badge>
                            )}
                            {isPurchase && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Purchase</Badge>
                            )}
                            {isUsed && (
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-700">Used</Badge>
                            )}
                            {isOnHold && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">On Hold</Badge>
                            )}
                            {isPending && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">Pending</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {transaction.description || transaction.type}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {transaction.status === "ACTIVE" && transaction.amount > 0 ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : transaction.status === "ON_HOLD" ? (
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                          ) : transaction.status === "USED" || transaction.amount < 0 ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

