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
  Clock,
  Star,
} from "lucide-react"
import Link from "next/link"
import type { DashboardStats } from "@/lib/api/dashboard"

interface FreelancerOverviewProps {
  stats: DashboardStats | null
  error: string | null
}

export function FreelancerOverview({ stats, error }: FreelancerOverviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const safeStats = {
    totalJobs: stats?.totalJobs || 0,
    activeJobs: stats?.activeJobs || 0,
    completedJobs: stats?.completedJobs || 0,
    totalApplications: stats?.totalApplications || 0,
    acceptedApplications: stats?.acceptedApplications || 0,
    pendingApplications: stats?.pendingApplications || 0,
    totalEarnings: stats?.totalEarnings || 0,
    pendingPayments: stats?.pendingPayments || 0,
    completedPayments: stats?.completedPayments || 0,
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-blue-200 bg-white hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Active Contracts</CardTitle>
            <div className="p-2 rounded-full bg-blue-100">
              <Briefcase className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{safeStats.activeJobs}</div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-gray-600">
                {safeStats.completedJobs} completed
              </p>
              <span className="text-xs text-gray-400">•</span>
              <p className="text-xs text-gray-600">
                {safeStats.totalJobs} total contracts
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-blue-200 bg-white hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Proposals</CardTitle>
            <div className="p-2 rounded-full bg-blue-100">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{safeStats.totalApplications}</div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-gray-600">
                {safeStats.acceptedApplications} accepted
              </p>
              <span className="text-xs text-gray-400">•</span>
              <p className="text-xs text-gray-600">
                {safeStats.pendingApplications} pending
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-green-200 bg-white hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Total Earnings</CardTitle>
            <div className="p-2 rounded-full bg-green-100">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(safeStats.totalEarnings)}</div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-gray-600">
                {formatCurrency(safeStats.pendingPayments)} pending
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-blue-200 bg-white hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Completed Payments</CardTitle>
            <div className="p-2 rounded-full bg-blue-100">
              <CreditCard className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{safeStats.completedPayments}</div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-gray-600">
                {formatCurrency(safeStats.totalEarnings - safeStats.pendingPayments)} total
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Quick Actions</CardTitle>
            <CardDescription>Common tasks and actions</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/jobs">
                <Briefcase className="mr-2 h-4 w-4" />
                Browse Jobs
              </Link>
            </Button>
            <Button variant="outline" asChild className="hover:bg-gray-50 border-gray-200">
              <Link href="/proposals">
                <FileText className="mr-2 h-4 w-4" />
                My Proposals
              </Link>
            </Button>
            <Button variant="outline" asChild className="hover:bg-gray-50 border-gray-200">
              <Link href="/earnings">
                <CreditCard className="mr-2 h-4 w-4" />
                View Earnings
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Performance Overview</CardTitle>
            <CardDescription>Your freelancing metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-blue-100">
                  <Star className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Job Success Rate</span>
              </div>
              <span className="text-sm font-medium text-blue-600">
                {safeStats.completedJobs > 0
                  ? Math.round((safeStats.completedJobs / safeStats.totalJobs) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-blue-100">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Proposal Acceptance Rate</span>
              </div>
              <span className="text-sm font-medium text-blue-600">
                {safeStats.totalApplications > 0
                  ? Math.round((safeStats.acceptedApplications / safeStats.totalApplications) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-blue-100">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Average Response Time</span>
              </div>
              <span className="text-sm font-medium text-blue-600">2 hours</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 