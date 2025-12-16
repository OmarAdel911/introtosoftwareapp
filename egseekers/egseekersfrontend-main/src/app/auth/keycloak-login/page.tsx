"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { config } from "@/config/env"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { LogIn, ArrowRight, Mail, Lock, ArrowLeft, Key } from "lucide-react"
import Link from "next/link"
import axios from "axios"

export default function KeycloakLoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Validate inputs
      if (!email || !password) {
        setError("Please enter both email and password")
        toast.error("Please enter both email and password")
        setIsLoading(false)
        return
      }

      // Use backend endpoint for direct Keycloak login (bypasses Keycloak UI)
      const response = await axios.post(
        `${config.apiUrl.replace('/api', '')}/api/keycloak/direct-login`,
        {
          email,
          password,
          rememberMe
        }
      )

      if (response.data.success && response.data.user && response.data.token) {
        // Login user with the token
        login(response.data.token, response.data.user)
        
        toast.success("Login successful!")
        
        // Redirect based on role
        const role = response.data.user.role
        if (role === "FREELANCER") {
          router.push("/freelancer/dashboard")
        } else if (role === "CLIENT") {
          router.push("/job-poster/dashboard")
        } else {
          router.push("/")
        }
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (err) {
      console.error("Login error:", err)
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error)
        toast.error(err.response.data.error)
      } else {
        setError("An error occurred. Please try again.")
        toast.error("Login failed. Please try again.")
      }
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    // Redirect to Keycloak password reset
    const resetUrl = `${config.keycloakUrl}/realms/${config.realm}/login-actions/reset-credential?client_id=egseekers-backend`
    window.open(resetUrl, '_blank')
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
              <Key className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-center">Secure Login</h1>
          <p className="text-lg text-center text-white/80 max-w-md">
            Sign in with your Keycloak account for enhanced security and features.
          </p>
        </div>
      </div>
      
      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-gradient-to-br from-background to-primary/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-primary/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="mb-6">
            <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to login options
            </Link>
          </div>
          
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-2">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/20">
                  <Key className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-500">
                Keycloak Login
              </CardTitle>
              <CardDescription className="text-center">
                Sign in with your Keycloak account
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
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
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      Forgot password?
                    </button>
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm font-normal cursor-pointer text-muted-foreground"
                  >
                    Remember me
                  </Label>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
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
                <p className="text-sm text-center text-muted-foreground">
                  Don't have an account?{" "}
                  <Link 
                    href="/auth/keycloak-register" 
                    className="text-primary hover:underline font-medium transition-colors duration-300"
                  >
                    Register with Keycloak
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

