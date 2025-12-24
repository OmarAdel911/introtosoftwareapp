"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { config } from "@/config/env"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { toast } from "sonner"
import { UserPlus, ArrowRight, Mail, Lock, User, Briefcase, ArrowLeft, Key } from "lucide-react"
import Link from "next/link"
import axios from "axios"

export default function KeycloakRegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "FREELANCER" as "FREELANCER" | "CLIENT"
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value as "FREELANCER" | "CLIENT"
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError("All fields are required")
      toast.error("Please fill in all fields")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      toast.error("Password must be at least 6 characters long")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      toast.error("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      // Clear any existing Keycloak cookies to prevent session conflicts
      const cookiesToClear = [
        'KEYCLOAK_SESSION',
        'KEYCLOAK_SESSION_LEGACY',
        'KEYCLOAK_IDENTITY',
        'KEYCLOAK_IDENTITY_LEGACY',
        'AUTH_SESSION_ID',
        'KC_RESTART'
      ]
      
      cookiesToClear.forEach(cookieName => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost`
      })

      // Register directly via backend API (no Keycloak redirect)
      // This creates the user in Keycloak and logs them in all in one step
      const backendUrl = config.apiUrl.replace('/api', '') || 'http://localhost:5001'
      const response = await axios.post(
        `${backendUrl}/api/keycloak/direct-register`,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }
      )

      if (response.data.success && response.data.user && response.data.token) {
        // Login user with the token (no cookies set until now)
        login(response.data.token, response.data.user)
        
        toast.success("Registration successful! Welcome to EGSeekers!")
        
        // Redirect based on role
        setTimeout(() => {
          const role = response.data.user.role
          if (role === "FREELANCER") {
            router.push("/freelancer/dashboard")
          } else if (role === "CLIENT") {
            router.push("/job-poster/dashboard")
          } else {
            router.push("/")
          }
        }, 500)
      } else if (response.data.requiresLogin) {
        // User created but needs to log in manually
        toast.success("Account created! Please log in.")
        router.push("/auth/keycloak-login")
      } else {
        throw new Error("Registration failed")
      }
    } catch (err) {
      console.error("Registration error:", err)
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.error || err.response?.data?.message || "Registration failed. Please try again."
        setError(errorMessage)
        toast.error(errorMessage)
      } else {
        setError("An error occurred. Please try again.")
        toast.error("Registration failed. Please try again.")
      }
      setIsLoading(false)
    }
  }

  // Helper function to get admin token (for backend use)
  const getAdminToken = async () => {
    // This would typically be done on the backend
    // For now, we'll use the registration redirect approach
    return null
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
              <UserPlus className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-center">Join EGSeekers</h1>
          <p className="text-lg text-center text-white/80 max-w-md">
            Create your account with Keycloak for secure authentication and enhanced features.
          </p>
        </div>
      </div>
      
      {/* Right side - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-gradient-to-br from-background to-primary/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-primary/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="mb-6">
            <Link href="/signup" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to signup options
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
                Keycloak Registration
              </CardTitle>
              <CardDescription className="text-center">
                Fill in your details to create a secure account
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
                  <Label htmlFor="role" className="text-sm font-medium">I want to</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer group ${
                        formData.role === "FREELANCER" 
                          ? "border-primary bg-gradient-to-br from-primary/20 to-emerald-500/20 shadow-lg" 
                          : "border-muted hover:border-primary/50 hover:bg-primary/5"
                      }`}
                      onClick={() => handleRoleChange("FREELANCER")}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="p-4 flex flex-col items-center text-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                          formData.role === "FREELANCER" 
                            ? "bg-gradient-to-br from-primary to-emerald-500 text-white" 
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        }`}>
                          <Briefcase className="h-6 w-6" />
                        </div>
                        <h3 className={`font-medium mb-1 transition-colors duration-300 ${
                          formData.role === "FREELANCER" ? "text-primary" : "text-foreground"
                        }`}>Find Work</h3>
                        <p className="text-xs text-muted-foreground">Join as a freelancer</p>
                        {formData.role === "FREELANCER" && (
                          <div className="absolute top-2 right-2">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div 
                      className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer group ${
                        formData.role === "CLIENT" 
                          ? "border-primary bg-gradient-to-br from-primary/20 to-emerald-500/20 shadow-lg" 
                          : "border-muted hover:border-primary/50 hover:bg-primary/5"
                      }`}
                      onClick={() => handleRoleChange("CLIENT")}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="p-4 flex flex-col items-center text-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                          formData.role === "CLIENT" 
                            ? "bg-gradient-to-br from-primary to-emerald-500 text-white" 
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        }`}>
                          <User className="h-6 w-6" />
                        </div>
                        <h3 className={`font-medium mb-1 transition-colors duration-300 ${
                          formData.role === "CLIENT" ? "text-primary" : "text-foreground"
                        }`}>Hire Talent</h3>
                        <p className="text-xs text-muted-foreground">Join as a client</p>
                        {formData.role === "CLIENT" && (
                          <div className="absolute top-2 right-2">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        required
                        className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        required
                        className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      required
                      autoComplete="email"
                      className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      required
                      autoComplete="new-password"
                      className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      required
                      autoComplete="new-password"
                      className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
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
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Create Account</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  Already have an account?{" "}
                  <Link 
                    href="/auth/keycloak-login" 
                    className="text-primary hover:underline font-medium transition-colors duration-300"
                  >
                    Log in
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

