"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CreditCard, AlertCircle, CheckCircle } from "lucide-react";
import { config } from '@/config/env';

interface ConnectPackage {
  id: string;
  amount: number;
  price: number;
  description: string;
  isActive: boolean;
}

interface ConnectTransaction {
  id: string;
  amount: number;
  price: number;
  status: string;
  createdAt: string;
  transactionId: string;
}

export default function FreelancerConnectsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalActiveConnects, setTotalActiveConnects] = useState(0);
  const [packages, setPackages] = useState<ConnectPackage[]>([]);
  const [transactions, setTransactions] = useState<ConnectTransaction[]>([]);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  useEffect(() => {
    fetchConnectsData();
  }, []);

  const fetchConnectsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch user's connects and available packages
      const [connectsRes, packagesRes] = await Promise.all([
        axios.get(`${config.apiUrl}/connects`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${config.apiUrl}/connect-purchase/packages`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);

      setTotalActiveConnects(connectsRes.data.totalActiveConnects);
      setTransactions(connectsRes.data.connects);
      setPackages(packagesRes.data);
    } catch (err) {
      console.error("Error fetching connects data:", err);
      setError("Failed to load connects data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseConnects = async (packageId: string) => {
    try {
      setPurchasing(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Create Stripe Checkout Session
      const response = await axios.post(
        `${config.apiUrl}/connect-purchase/create-checkout`,
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
      console.error("Error purchasing connects:", err);
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to start payment. Please try again later."
      );
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
        <h1 className="text-3xl font-bold">Connects</h1>
        <p className="text-muted-foreground mt-2">
          Manage your connects and purchase more to apply for jobs.
        </p>
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
            <CardTitle>Available Connects</CardTitle>
            <CardDescription>Your current connect balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalActiveConnects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connects Used</CardTitle>
            <CardDescription>Total connects used this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {transactions.filter(t => t.status === "USED").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Spent</CardTitle>
            <CardDescription>Amount spent on connects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${transactions.reduce((sum, t) => sum + t.price, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="purchase" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="purchase">Purchase Connects</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="purchase">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.id} className={selectedPackage === pkg.id ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle>{(pkg.connects || pkg.amount) || 0} Connects</CardTitle>
                  <CardDescription>{pkg.description || pkg.name || 'Connect Package'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pkg.price} EGP</div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handlePurchaseConnects(String(pkg.id))}
                    disabled={purchasing}
                  >
                    {purchasing && selectedPackage === pkg.id ? (
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
              <CardDescription>Your connect purchase and usage history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {transaction.amount} Connects
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">${transaction.price}</div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.transactionId}
                        </div>
                      </div>
                      {transaction.status === "COMPLETED" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 