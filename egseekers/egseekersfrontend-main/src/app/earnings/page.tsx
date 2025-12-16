"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import axios from "axios"
import { config } from "@/config/env"

// Create axios instance
const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for auth token
api.interceptors.request.use((requestConfig) => {
  const token = localStorage.getItem('token')
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`
  }
  return requestConfig
})

interface Transaction {
  id: string
  amount: number
  type: string
  status: string
  createdAt: string
  description: string
}

interface EarningsSummary {
  totalEarnings: number
  monthlyEarnings: number
  pendingPayments: number
  availableBalance: number
}

export default function EarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEarningsData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch summary data
        const summaryResponse = await api.get<EarningsSummary>('/earnings/summary')
        setSummary(summaryResponse.data)

        // Fetch transactions
        const transactionsResponse = await api.get<Transaction[]>('/earnings/transactions', {
          params: {
            limit: 10,
            offset: 0
          }
        })
        setTransactions(transactionsResponse.data)
      } catch (err) {
        console.error("Error fetching earnings data:", err)
        setError(err instanceof Error ? err.message : "Failed to load earnings data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEarningsData()
  }, [])

  const handleDownloadReport = async () => {
    try {
      const response = await api.get('/earnings/report', {
        responseType: 'blob',
        params: {
          format: 'pdf'
        }
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `earnings-report-${new Date().toISOString().split('T')[0]}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error downloading report:", err)
      setError(err instanceof Error ? err.message : "Failed to download report")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" label="Loading earnings data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Earnings</h1>
        <Button onClick={handleDownloadReport}>
          Download Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <CardDescription>Lifetime earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary?.totalEarnings.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
            <CardDescription>Current month earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary?.monthlyEarnings.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CardDescription>Awaiting processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary?.pendingPayments.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <CardDescription>Ready to withdraw</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary?.availableBalance.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest earnings and payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    ${transaction.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">{transaction.status}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 