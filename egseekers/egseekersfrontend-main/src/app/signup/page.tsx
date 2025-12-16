"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { AuthResponse } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";
import { UserPlus, ArrowRight, AlertCircle, CheckCircle2, Mail, Lock, User, Briefcase, ArrowLeft, Key } from "lucide-react";
import Image from "next/image";
import { logApiError } from "@/lib/utils/error-logger";
import { config } from "@/config/env";
import { Separator } from "@/components/ui/separator";

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "FREELANCER" | "CLIENT";
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  const [formData, setFormData] = useState<RegisterData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "FREELANCER"
  });

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Health check response:', data);
        
        // Accept both 'healthy' and 'ok' status responses
        const isHealthy = data.status === 'healthy' || data.status === 'ok' || data.success === true;
        setServerAvailable(isHealthy);
        if (isHealthy) {
          setError(null); // Clear any previous errors
        } else {
          setError(data.message || "Server is currently unavailable. Please try again later.");
        }
      } catch (err) {
        logApiError(err, 'Server Health Check');
        setServerAvailable(false);
        // Don't show blocking error - backend might still be starting
        // The form will show error when user tries to submit if server is still down
        setError(null);
      }
    };
    
    // Check server health
    checkServer();
    
    // Retry every 5 seconds if server is not available (up to 1 minute)
    const interval = setInterval(() => {
      checkServer();
    }, 5000);
    
    // Stop retrying after 1 minute
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 60000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const role = searchParams.get('role');
    if (role === 'client' || role === 'freelancer') {
      setFormData(prev => ({
        ...prev,
        role: role === 'client' ? 'CLIENT' : 'FREELANCER'
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Validate email format
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate password
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      toast.error('Password must be at least 6 characters long');
      return;
    }

    // Validate names
    if (!formData.firstName || formData.firstName.length < 2) {
      setError('First name must be at least 2 characters long');
      toast.error('First name must be at least 2 characters long');
      return;
    }

    if (!formData.lastName || formData.lastName.length < 2) {
      setError('Last name must be at least 2 characters long');
      toast.error('Last name must be at least 2 characters long');
      return;
    }

    // Check if server is available before submitting
    if (serverAvailable === false) {
      setError("Unable to connect to the server. Please ensure the backend is running on http://localhost:5001");
      toast.error("Unable to connect to the server. Please check if the backend is running.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', formData);

      console.log('Registration response:', response);

      if (!response.success) {
        setError(response.error || 'Failed to create account. Please try again.');
        toast.error(response.error || 'Failed to create account. Please try again.');
        return;
      }

      const authData = response as unknown as AuthResponse;
      const { user, token } = authData;
      
      if (!user || !token) {
        logApiError(new Error('Registration response missing user or token'), 'User Registration', '/auth/register');
        setError('An unexpected error occurred. Please try again.');
        toast.error('An unexpected error occurred. Please try again.');
        return;
      }

      // Store token in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      // Show success message
      toast.success('Account created successfully! Redirecting...');
      
      // Reload the page to update navbar and all components
      window.location.reload();
      
      // Redirect based on role
      if (user.role === 'FREELANCER') {
        router.push('/freelancer/dashboard');
      } else if (user.role === 'CLIENT') {
        router.push('/job-poster/dashboard');
      }
    } catch (err) {
      logApiError(err, 'User Registration', '/auth/register');
      
      if (err instanceof Error) {
        if (err.message === 'Network Error') {
          setError('Unable to connect to the server. Please check your internet connection.');
          toast.error('Unable to connect to the server. Please check your internet connection.');
        } else {
          setError('An unexpected error occurred. Please try again.');
          toast.error('An unexpected error occurred. Please try again.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value as "FREELANCER" | "CLIENT"
    }));
  };

  const handleKeycloakRegister = () => {
    // Redirect to custom Keycloak registration page
    router.push('/auth/keycloak-register')
  };

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
            <div className="w-64 h-64 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2,2" />
                <circle cx="50" cy="50" r="35" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="3,3" />
                <circle cx="50" cy="50" r="25" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="4,4" />
                <circle cx="50" cy="50" r="15" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="5,5" />
                <circle cx="50" cy="50" r="5" fill="white" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-center">Join EGSeekers Today</h1>
          <p className="text-lg text-center text-white/80 max-w-md">
            Create your account and start your journey as a freelancer or client.
          </p>
        </div>
      </div>
      
      {/* Right side - Signup Form */}
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
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-500">Create Account</CardTitle>
              <CardDescription className="text-center">
                Join our community of freelancers and clients
              </CardDescription>
          
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Keycloak Registration Options */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                  onClick={handleKeycloakRegister}
                  disabled={isLoading}
                >
                  <Key className="mr-2 h-4 w-4 text-primary" />
                  Register with Keycloak
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
                        placeholder=" first name"
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
                        placeholder="last name"
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
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link 
                  href="/login" 
                  className="text-primary hover:underline font-medium transition-colors duration-300"
                  tabIndex={isLoading ? -1 : 0}
                >
                  Log in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
