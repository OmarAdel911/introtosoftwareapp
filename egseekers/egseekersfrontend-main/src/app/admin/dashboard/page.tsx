"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Briefcase, DollarSign, Settings, AlertCircle } from "lucide-react"
import axios from "axios"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { config } from '@/config/env'

// Configure axios defaults
const API_BASE_URL = config.apiUrl;
axios.defaults.baseURL = API_BASE_URL;

interface User {
  id: string
  email: string
  name: string
  role: "FREELANCER" | "CLIENT" | "ADMIN"
  createdAt: string
  image: string | null
  _count?: {
    jobs: number
    proposals: number
    payments: number
    reviews: number
  }
}

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalJobs: number
  activeJobs: number
  totalEarnings: number
  monthlyEarnings: number
  totalPayments: number
  pendingPayments: number
  totalContracts: number
  activeContracts: number
}

interface UserSummary {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  createdAt: string
}

interface JobSummary {
  id: string
  title: string
  status: string
  budget: number
  client: {
    name: string
  }
  createdAt: string
}

interface PaymentSummary {
  id: string
  amount: number
  status: string
  createdAt: string
  type: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<UserSummary[]>([])
  const [recentJobs, setRecentJobs] = useState<JobSummary[]>([])
  const [recentPayments, setRecentPayments] = useState<PaymentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('adminToken')
        if (!token) {
          router.push('/admin/login')
          return
        }

        const userResponse = await axios.get<User>('/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (userResponse.data.role !== 'ADMIN') {
          router.push('/')
          return
        }

        setUser(userResponse.data)
      } catch (error) {
        console.error('Auth check error:', error)
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem('adminToken')
          router.push('/admin/login')
        }
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        setError(null)
        
        const token = localStorage.getItem('adminToken')
        if (!token) {
          router.push('/admin/login')
          return
        }

        const headers = {
          Authorization: `Bearer ${token}`
        }

        const response = await axios.get<{ 
          success: boolean;
          data: {
            statistics: {
              totalUsers: number;
              totalJobs: number;
              totalPayments: number;
              activeDisputes: number;
              activeUsers: number;
              activeJobs: number;
              totalEarnings: number;
              monthlyEarnings: number;
              pendingPayments: number;
              totalContracts: number;
              activeContracts: number;
            };
            recent: {
              users: UserSummary[];
              jobs: JobSummary[];
              payments: PaymentSummary[];
            };
          };
        }>('/admin/dashboard', { headers })

        if (response.data.success) {
          const { statistics, recent } = response.data.data
          setStats({
            totalUsers: statistics.totalUsers,
            activeUsers: statistics.activeUsers,
            totalJobs: statistics.totalJobs,
            activeJobs: statistics.activeJobs,
            totalEarnings: statistics.totalEarnings,
            monthlyEarnings: statistics.monthlyEarnings,
            totalPayments: statistics.totalPayments,
            pendingPayments: statistics.pendingPayments,
            totalContracts: statistics.totalContracts,
            activeContracts: statistics.activeContracts
          })
          setRecentUsers(recent.users)
          setRecentJobs(recent.jobs)
          setRecentPayments(recent.payments)
        } else {
          throw new Error('Failed to fetch dashboard data')
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          localStorage.removeItem('adminToken')
          router.push('/admin/login')
        } else {
          const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard data"
          setError(errorMessage)
          toast.error(errorMessage)
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user, router])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`
      };

      const [usersResponse, statsResponse] = await Promise.all([
        axios.get<{ success: boolean; data: { users: User[] } }>('/admin/users', { headers }),
        axios.get<{ success: boolean; data: AdminStats }>('/admin/dashboard', { headers })
      ]);

      if (usersResponse.data.success && Array.isArray(usersResponse.data.data.users)) {
        setUsers(usersResponse.data.data.users);
      } else {
        setUsers([]);
      }
      
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
      } else {
        toast.error('Failed to fetch data');
        setUsers([]); // Set empty array on error
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData()
  }, [router])

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await axios.patch(
        `/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole as "FREELANCER" | "CLIENT" | "ADMIN" } : user
        ))
        toast.success('User role updated successfully')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
      } else {
        toast.error('Failed to update user role')
      }
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await axios.delete(`/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setUsers(users.filter(user => user.id !== userId))
        toast.success('User deleted successfully')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
      } else {
        toast.error('Failed to delete user')
      }
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading dashboard..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System Overview and Management</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeUsers} active users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalJobs}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeJobs} active jobs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats?.totalEarnings || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats?.monthlyEarnings || 0)} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Payments</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalPayments}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.pendingPayments} pending
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <div className="mt-4">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value as "FREELANCER" | "CLIENT" | "ADMIN")}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FREELANCER">Freelancer</SelectItem>
                            <SelectItem value="CLIENT">Client</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>Jobs: {user._count?.jobs || 0}</p>
                          <p>Proposals: {user._count?.proposals || 0}</p>
                          <p>Payments: {user._count?.payments || 0}</p>
                          <p>Reviews: {user._count?.reviews || 0}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Jobs</CardTitle>
              <CardDescription>Monitor and manage jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Client: {job.client?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Budget: {formatCurrency(job.budget)} - Status: {job.status}
                      </p>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href={`/admin/jobs/${job.id}`}>Manage</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Monitor system payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        Type: {payment.type} - Status: {payment.status}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Date: {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href={`/admin/payments/${payment.id}`}>View Details</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 