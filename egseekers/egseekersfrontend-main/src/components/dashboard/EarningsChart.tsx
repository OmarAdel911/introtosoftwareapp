"use client"

import { useEffect, useState } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { getRecentPayments } from "@/lib/api/dashboard"
import { Payment } from "@/lib/api/dashboard"

interface EarningsData {
  date: string
  amount: number
}

export default function EarningsChart() {
  const [data, setData] = useState<EarningsData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEarningsData = async () => {
      try {
        setLoading(true)
        setError(null)
        const payments = await getRecentPayments()
        
        // Process payments into daily earnings
        const earningsByDate = payments.reduce((acc: { [key: string]: number }, payment: Payment) => {
          if (payment.type === 'EARNING') {
            const date = new Date(payment.createdAt).toLocaleDateString()
            acc[date] = (acc[date] || 0) + payment.amount
          }
          return acc
        }, {})

        // Convert to array format for chart
        const chartData = Object.entries(earningsByDate).map(([date, amount]) => ({
          date,
          amount
        }))

        setData(chartData)
      } catch (err) {
        console.error("Error fetching earnings data:", err)
        setError(err instanceof Error ? err.message : "Failed to load earnings data")
      } finally {
        setLoading(false)
      }
    }

    fetchEarningsData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 