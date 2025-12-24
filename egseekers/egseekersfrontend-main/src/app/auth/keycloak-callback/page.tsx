"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { config } from "@/config/env"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import axios from "axios"

export default function KeycloakCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Processing authentication...")

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we have a temporary token from backend
        const tempToken = searchParams.get("token")
        const authStatus = searchParams.get("auth")
        const errorParam = searchParams.get("error")
        
        if (authStatus === "error" || errorParam) {
          setStatus("error")
          setMessage(errorParam || "Authentication failed. Please try again.")
          setTimeout(() => {
            router.push("/login")
          }, 3000)
          return
        }

        if (tempToken) {
          // Exchange temporary token for JWT token
          const response = await axios.get(
            `${config.apiUrl.replace('/api', '')}/api/keycloak/exchange-token`,
            {
              params: { token: tempToken }
            }
          )

          if (response.data.success && response.data.user && response.data.token) {
            // Check if we have registration data stored (from custom registration page)
            const registrationData = typeof window !== 'undefined' 
              ? sessionStorage.getItem('keycloak_registration_data') 
              : null
            
            let finalUser = response.data.user
            let isNewRegistration = false
            
            // If we have registration data with role preference, update user role
            if (registrationData) {
              try {
                const regData = JSON.parse(registrationData)
                isNewRegistration = true
                
                // Update user role if different from what was selected during registration
                if (regData.role && regData.role !== response.data.user.role) {
                  try {
                    // Update role via backend API
                    const updateResponse = await axios.patch(
                      `${config.apiUrl}/users/${response.data.user.id}/role`,
                      { role: regData.role },
                      {
                        headers: { Authorization: `Bearer ${response.data.token}` }
                      }
                    )
                    
                    if (updateResponse.data.success && updateResponse.data.user) {
                      finalUser = updateResponse.data.user
                      // Generate new token with updated role (backend will need to regenerate)
                      // For now, we'll update the user object and login
                      // The token will be refreshed on next request if needed
                      login(response.data.token, finalUser)
                    } else {
                      // If update fails, use original user data
                      login(response.data.token, response.data.user)
                    }
                  } catch (updateError) {
                    console.error('Error updating user role:', updateError)
                    // Continue with original user data if update fails
                    login(response.data.token, response.data.user)
                  }
                } else {
                  // Role matches, just login
                  login(response.data.token, response.data.user)
                }
                
                // Clear registration data
                sessionStorage.removeItem('keycloak_registration_data')
              } catch (e) {
                console.error('Error parsing registration data:', e)
                sessionStorage.removeItem('keycloak_registration_data')
                login(response.data.token, response.data.user)
              }
            } else {
              // No registration data, just login normally
              login(response.data.token, response.data.user)
            }
            
            setStatus("success")
            setMessage(
              isNewRegistration 
                ? "Registration successful! Welcome to EGSeekers. Redirecting..." 
                : "Authentication successful! Redirecting..."
            )
            
            // Redirect based on role
            setTimeout(() => {
              const role = finalUser.role
              if (role === "FREELANCER") {
                router.push("/freelancer/dashboard")
              } else if (role === "CLIENT") {
                router.push("/job-poster/dashboard")
              } else {
                router.push("/")
              }
            }, 1500)
          } else {
            throw new Error("Failed to exchange token")
          }
        } else {
          // No token, authentication failed
          setStatus("error")
          setMessage("Authentication failed. No token received.")
          setTimeout(() => {
            router.push("/login")
          }, 3000)
        }
      } catch (error) {
        console.error("Keycloak callback error:", error)
        setStatus("error")
        setMessage(
          axios.isAxiosError(error) && error.response?.data?.error
            ? error.response.data.error
            : "Authentication failed. Please try logging in again."
        )
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      }
    }

    handleCallback()
  }, [searchParams, router, login])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/5 p-6">
      <Card className="w-full max-w-md border-0 shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-2">
          <div className="flex justify-center mb-4">
            {status === "loading" && (
              <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/20">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            )}
            {status === "success" && (
              <div className="p-3 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
            )}
            {status === "error" && (
              <div className="p-3 rounded-full bg-gradient-to-br from-red-500/20 to-rose-500/20">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-500">
            {status === "loading" && "Authenticating..."}
            {status === "success" && "Success!"}
            {status === "error" && "Error"}
          </CardTitle>
          <CardDescription className="text-center">{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="lg" />
            </div>
          )}
          {status === "error" && (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

