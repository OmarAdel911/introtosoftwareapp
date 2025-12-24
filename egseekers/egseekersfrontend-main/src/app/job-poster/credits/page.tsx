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

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  description: string;
  features: string[];
}

interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  description: string;
}

export default function ClientCreditsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalActiveCredits, setTotalActiveCredits] = useState(0);
  const [totalOnHoldCredits, setTotalOnHoldCredits] = useState(0);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

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

      // Fetch user's credits and available packages
      const [creditsRes, packagesRes] = await Promise.all([
        axios.get(`${config.apiUrl}/credits`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${config.apiUrl}/credit-purchase/packages`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);

      setTotalActiveCredits(creditsRes.data.totalActiveCredits || 0);
      setTotalOnHoldCredits(creditsRes.data.totalOnHoldCredits || 0);
      // Filter out pending purchases with amount 0 (they'll be updated after payment)
      // But keep completed purchases and all other transactions
      const validTransactions = (creditsRes.data.credits || []).filter(
        (t: CreditTransaction) => {
          // Exclude pending purchases with 0 amount (not yet completed)
          // But include if it has been updated with actual amount
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
      setPackages(packagesRes.data);
    } catch (err) {
      console.error("Error fetching credits data:", err);
      setError("Failed to load credits data. Please try again later.");
      toast.error("Failed to load credits data");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCredits = async (packageId: string) => {
    try {
      setPurchasing(true);
      setError(null);
      setSelectedPackage(packageId);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Create Stripe Checkout Session
      const response = await axios.post(
        `${config.apiUrl}/credit-purchase/create-checkout`,
        { packageId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success && response.data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkoutUrl;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err) {
      console.error("Error purchasing credits:", err);
      const errorMessage = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : "Failed to start payment. Please try again later.";
      setError(errorMessage);
      toast.error(errorMessage);
      setPurchasing(false);
      setSelectedPackage(null);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Credits</h1>
        <p className="text-muted-foreground mt-2">
          Purchase credits to use as escrow payments when accepting contracts.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Available Credits</CardTitle>
            <CardDescription>Your current usable credit balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{totalActiveCredits.toFixed(2)} EGP</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>On Hold (Escrow)</CardTitle>
            <CardDescription>Credits held for active contracts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{totalOnHoldCredits.toFixed(2)} EGP</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credits Used</CardTitle>
            <CardDescription>Total transactions where credits were used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {transactions.filter(t => t.type === 'USED' || (t.amount < 0 && t.type !== 'PURCHASED')).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Purchased</CardTitle>
            <CardDescription>Total credits purchased</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {transactions
                .filter(t => t.type === 'PURCHASED' && t.amount > 0 && t.sourceType === 'CREDIT_PURCHASE')
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(2)} EGP
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="purchase" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="purchase">Purchase Credits</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="purchase">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.id} className={selectedPackage === String(pkg.id) ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle>{pkg.credits} EGP</CardTitle>
                  <CardDescription>{pkg.description || pkg.name || 'Credit Package'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">{pkg.price} EGP</div>
                    {pkg.features && pkg.features.length > 0 && (
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start">
                            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handlePurchaseCredits(String(pkg.id))}
                    disabled={purchasing}
                  >
                    {purchasing && selectedPackage === String(pkg.id) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Purchase
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Your credit purchase and usage history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  transactions.map((transaction) => {
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
                              isPurchase ? "text-green-600" : 
                              isUsed ? "text-red-600" : 
                              isOnHold ? "text-yellow-600" : 
                              "text-gray-600"
                            }>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} EGP
                            </span>
                            {isPurchase && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Purchase</Badge>
                            )}
                            {isUsed && (
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-700">Used</Badge>
                            )}
                            {isOnHold && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">On Hold (Escrow)</Badge>
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

