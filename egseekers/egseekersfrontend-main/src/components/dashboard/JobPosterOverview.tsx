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
  Users,
  Clock,
  Plus,
  Star,
  TrendingUp,
  Zap,
  Wallet
} from "lucide-react"
import Link from "next/link"
import type { DashboardStats } from "@/lib/api/dashboard"

interface Job {
  id: string
  title: string
  status: string
  createdAt: string
}

interface JobPosterOverviewProps {
  stats: DashboardStats | null
  error: string | null
  recentJobs: Job[]
}

export function JobPosterOverview({ stats, error, recentJobs }: JobPosterOverviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP'
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

  // Get the most recent active job
  const mostRecentActiveJob = recentJobs.find(job => job.status === 'OPEN')

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
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/90 to-emerald-500/90 p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Welcome to Your Dashboard</h2>
          <p className="text-white/80 mb-4">Manage your jobs, applications, and payments all in one place.</p>
          <Button asChild className="bg-white text-primary hover:bg-white/90">
            <Link href="/post-job">
              <Plus className="mr-2 h-4 w-4" />
              Post a New Job
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Posted Jobs</CardTitle>
            <div className="p-2 rounded-full bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform duration-300">
              <Briefcase className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{safeStats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {safeStats.activeJobs} active, {safeStats.completedJobs} completed
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <div className="p-2 rounded-full bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{safeStats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              {safeStats.acceptedApplications} accepted, {safeStats.pendingApplications} pending
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <div className="p-2 rounded-full bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(safeStats.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(safeStats.pendingPayments)} pending
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
            <div className="p-2 rounded-full bg-amber-100 text-amber-600 group-hover:scale-110 transition-transform duration-300">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{safeStats.completedPayments}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(safeStats.totalEarnings - safeStats.pendingPayments)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and actions</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild className="bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white transition-all duration-300 hover:scale-105">
              <Link href="/post-job">
                <Briefcase className="mr-2 h-4 w-4" />
                Post a New Job
              </Link>
            </Button>
            <Button asChild variant="outline" className="transition-all duration-300 hover:scale-105">
              <Link href="/job-poster/credits">
                <Wallet className="mr-2 h-4 w-4" />
                Buy Credits
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 transition-colors duration-300">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none text-blue-700 dark:text-blue-300">
                    {safeStats.activeJobs} Active Jobs
                  </p>
                  <p className="text-sm text-blue-600/70 dark:text-blue-400/70">
                    {safeStats.pendingApplications} applications to review
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 transition-colors duration-300">
                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400">
                  <Star className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none text-emerald-700 dark:text-emerald-300">
                    {safeStats.completedJobs} Completed Jobs
                  </p>
                  <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70">
                    {safeStats.acceptedApplications} freelancers hired
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