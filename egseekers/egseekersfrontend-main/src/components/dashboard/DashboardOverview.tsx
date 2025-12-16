"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Briefcase, 
  FileText, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import type { DashboardStats } from "@/lib/api/dashboard"

interface DashboardOverviewProps {
  stats: DashboardStats | null
  error: string | null
}

export function DashboardOverview({ stats, error }: DashboardOverviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Handle case when stats is null
  const safeStats = stats || {
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalApplications: 0,
    acceptedApplications: 0,
    pendingApplications: 0,
    totalEarnings: 0,
    pendingPayments: 0,
    completedPayments: 0
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeStats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {safeStats.activeJobs} active, {safeStats.completedJobs} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeStats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              {safeStats.acceptedApplications} accepted, {safeStats.pendingApplications} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(safeStats.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(safeStats.pendingPayments)} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeStats.completedPayments}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(safeStats.totalEarnings - safeStats.pendingPayments)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and actions</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button asChild>
              <Link href="/post-job">
                <Briefcase className="mr-2 h-4 w-4" />
                Post a New Job
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/applications">
                <FileText className="mr-2 h-4 w-4" />
                View Applications
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/payments">
                <CreditCard className="mr-2 h-4 w-4" />
                View Payments
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Badge variant="outline">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </Badge>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {safeStats.activeJobs} Active Jobs
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {safeStats.pendingApplications} pending applications
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline">
                  <DollarSign className="h-4 w-4 text-green-500" />
                </Badge>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {formatCurrency(safeStats.totalEarnings)} Total Earnings
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(safeStats.pendingPayments)} pending
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 