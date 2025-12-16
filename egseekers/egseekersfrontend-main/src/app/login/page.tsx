"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api-client'
import { ApiResponse } from '@/types/api'
import { config } from '@/config/env'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { toast } from "sonner"
import { LogIn, ArrowRight, AlertCircle, CheckCircle2, Mail, Lock, ArrowLeft, Key } from "lucide-react"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"

interface User {
  id: string
  email: string
  role: "FREELANCER" | "CLIENT"
  name: string
  image: string | null
  bio: string | null
  skills: string[] | null
  hourlyRate: number | null
  title: string | null
  location: string | null
  website: string | null
  linkedin: string | null
  github: string | null
}

interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

interface HealthCheckData {
  status: 'healthy' | 'unhealthy';
  message: string;
  timestamp: string;
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null)

  const checkServer = async (retries = 3): Promise<boolean> => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(`${config.apiUrl}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Health check response:', data);
        
        // Accept 'healthy', 'ok', or success: true
        const isHealthy = response.ok && (
          data.status === 'healthy' || 
          data.status === 'ok' || 
          data.success === true
        );
        setServerAvailable(isHealthy);
        if (!isHealthy) {
          setError(data.message || "Server is currently unavailable. Please try again later.");
        } else {
          setError(null); // Clear error on success
        }
        return isHealthy;
      } catch (err) {
        const isLastAttempt = attempt === retries - 1;
        const isAborted = err instanceof Error && err.name === 'AbortError';
        
        if (isLastAttempt) {
          console.error("Error checking server health:", err);
          setServerAvailable(false);
          const errorMessage = isAborted || (err instanceof Error && err.message.includes('Failed to fetch'))
            ? "Unable to connect to the server. Please ensure the backend is running on http://localhost:5001"
            : err instanceof Error 
              ? `Connection error: ${err.message}`
              : "Unable to connect to the server. Please check your internet connection.";
          setError(errorMessage);
          return false;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
    return false;
  }

  useEffect(() => {
    checkServer()
  }, [])

  const handleKeycloakLogin = () => {
    // Redirect to custom Keycloak login page
    router.push('/auth/keycloak-login')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Check if server is healthy
      const isHealthy = await checkServer()
      if (!isHealthy) {
        setError('Unable to connect to the server. Please try again later.')
        toast.error('Unable to connect to the server. Please try again later.')
        return
      }

      // Validate inputs
      if (!email || !password) {
        setError('Please enter both email and password')
        toast.error('Please enter both email and password')
        return
      }

      // Check if trying to login as admin
      if (email.toLowerCase().includes('admin')) {
        setError('Please use the admin login page')
        toast.error('Please use the admin login page')
        return
      }

      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password
      })

      console.log('Login response:', response);

      if (!response.success) {
        setError(response.error || 'Login failed. Please try again.');
        toast.error(response.error || 'Login failed. Please try again.');
        return;
      }

      const authData = response as unknown as AuthResponse;
      const { user, token } = authData;
      
      if (!user || !token) {
        console.error('Login response missing user or token:', authData);
        setError('An unexpected error occurred. Please try again.');
        toast.error('An unexpected error occurred. Please try again.');
        return;
      }

      // Use the global auth context to login
      login(token, user);
      
      toast.success('Login successful');
      
      // Reload the page to update navbar and all components
      window.location.reload();
      
      // Redirect based on role
      if (user.role === 'FREELANCER') {
        router.push('/freelancer/dashboard');
      } else if (user.role === 'CLIENT') {
        router.push('/job-poster/dashboard');
      }
    } catch (err) {
      console.error("Login error:", err)
      
      if (err instanceof Error) {
        if (err.message === 'Network Error') {
          setError('Unable to connect to the server. Please check your internet connection.')
          toast.error('Unable to connect to the server. Please check your internet connection.')
        } else {
          setError('An unexpected error occurred. Please try again.')
          toast.error('An unexpected error occurred. Please try again.')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Illustration */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/90 to-emerald-500/90 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="flex flex-col justify-center items-center p-12 text-white relative z-10 w-full">
          <div className="mb-8 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center mb-6">
              <LogIn className="h-16 w-16 text-white" />
            </div>
            <div className="w-64 h-64 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path d="M50,10 L90,90 L10,90 Z" fill="none" stroke="white" strokeWidth="0.5" />
                <path d="M30,70 L70,70 L50,30 Z" fill="none" stroke="white" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="20" fill="none" stroke="white" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="10" fill="white" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-center">Welcome Back to EGSeekers</h1>
          <p className="text-lg text-center text-white/80 max-w-md">
            Log in to your account and continue your journey as a freelancer or client.
          </p>
        </div>
      </div>
      
      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-gradient-to-br from-background to-primary/5 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-primary/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to home
            </Link>
          </div>
          
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-2">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/20">
                  <LogIn className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-500">Welcome Back</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Keycloak Login Option */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                  onClick={handleKeycloakLogin}
                  disabled={isLoading}
                >
                  <Key className="mr-2 h-4 w-4 text-primary" />
                  Login with Keycloak
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or use email</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="animate-fade-in">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                      autoComplete="email"
                      className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <Link
                      href={`${config.keycloakUrl}/realms/${config.realm}/login-actions/reset-credential?client_id=egseekers-backend`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      autoComplete="current-password"
                      className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white transition-all duration-300 hover:scale-105" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Logging in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Login</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{" "}
                <Link 
                  href="/signup" 
                  className="text-primary hover:underline font-medium transition-colors duration-300"
                  tabIndex={isLoading ? -1 : 0}
                >
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
} 