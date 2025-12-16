'use client'
import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Search, FileText, MessageSquare, CreditCard, UserPlus, Briefcase, FileCheck, Star, Award } from "lucide-react"
import { useRouter } from "next/navigation"



export default function HowItWorksPage() {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <div className="container py-12 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-primary/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="max-w-4xl mx-auto relative">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-emerald-500">How EGSeekers Works</h1>
          <p className="text-xl text-muted-foreground">
            A simple, efficient process for both freelancers and clients
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          {/* For Freelancers */}
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-primary/20 to-emerald-500/20 rounded-full blur-2xl"></div>
            <div className="bg-card rounded-lg border p-8 relative overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg group bg-gradient-to-br from-background to-primary/5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold group-hover:text-primary transition-colors duration-300">For Freelancers</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 group/item">
                  <div className="p-2 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 group-hover/item:scale-110 transition-transform duration-300">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 group-hover/item:text-primary transition-colors duration-300">1. Create Your Profile</h3>
                    <p className="text-muted-foreground">
                      Sign up and create a detailed profile showcasing your skills, experience, and portfolio.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group/item">
                  <div className="p-2 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 group-hover/item:scale-110 transition-transform duration-300">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 group-hover/item:text-primary transition-colors duration-300">2. Browse Jobs</h3>
                    <p className="text-muted-foreground">
                      Explore available jobs that match your skills and interests.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group/item">
                  <div className="p-2 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover/item:scale-110 transition-transform duration-300">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 group-hover/item:text-primary transition-colors duration-300">3. Submit Proposals</h3>
                    <p className="text-muted-foreground">
                      Send proposals to clients with your approach, timeline, and pricing.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group/item">
                  <div className="p-2 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 group-hover/item:scale-110 transition-transform duration-300">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 group-hover/item:text-primary transition-colors duration-300">4. Get Paid</h3>
                    <p className="text-muted-foreground">
                      Complete projects and receive secure payments through our platform.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <Button 
                  onClick={() => handleNavigate("/signup?role=freelancer")}
                  className="w-full gap-2 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white transition-all duration-300 hover:scale-105"
                >
                  Become a Freelancer 
                </Button>
              </div>
            </div>
          </div>
          
          {/* For Clients */}
          <div className="relative">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-bl from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl"></div>
            <div className="bg-card rounded-lg border p-8 relative overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg group bg-gradient-to-br from-background to-primary/5 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold group-hover:text-primary transition-colors duration-300">For Clients</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 group/item">
                  <div className="p-2 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 group-hover/item:scale-110 transition-transform duration-300">
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 group-hover/item:text-primary transition-colors duration-300">1. Create an Account</h3>
                    <p className="text-muted-foreground">
                      Sign up as a client and create your profile.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group/item">
                  <div className="p-2 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 group-hover/item:scale-110 transition-transform duration-300">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 group-hover/item:text-primary transition-colors duration-300">2. Post a Job</h3>
                    <p className="text-muted-foreground">
                      Create a detailed job posting with requirements, budget, and timeline.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group/item">
                  <div className="p-2 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover/item:scale-110 transition-transform duration-300">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 group-hover/item:text-primary transition-colors duration-300">3. Review Proposals</h3>
                    <p className="text-muted-foreground">
                      Review proposals from qualified freelancers and choose the best fit.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group/item">
                  <div className="p-2 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 group-hover/item:scale-110 transition-transform duration-300">
                    <FileCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 group-hover/item:text-primary transition-colors duration-300">4. Pay Securely</h3>
                    <p className="text-muted-foreground">
                      Pay securely through our platform, with funds held in escrow until work is completed.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <Button 
                  onClick={() => handleNavigate("/signup?role=client")}
                  className="w-full gap-2 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white transition-all duration-300 hover:scale-105"
                >
                  Hire Freelancers 
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-emerald-500">Why Choose EGSeekers?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-card rounded-lg border p-6 relative overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg group bg-gradient-to-br from-background to-primary/5 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="p-3 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">Quality Talent</h3>
            <p className="text-muted-foreground">
              Access a pool of verified Egyptian freelancers with diverse skills and expertise.
            </p>
          </div>
          
          <div className="bg-card rounded-lg border p-6 relative overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg group bg-gradient-to-br from-background to-primary/5 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="p-3 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">Secure Payments</h3>
            <p className="text-muted-foreground">
              Our escrow system ensures your payments are secure until work is completed.
            </p>
          </div>
          
          <div className="bg-card rounded-lg border p-6 relative overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg group bg-gradient-to-br from-background to-primary/5 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">Satisfaction Guaranteed</h3>
            <p className="text-muted-foreground">
              Our platform ensures high-quality work and client satisfaction.
            </p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-primary via-primary/90 to-emerald-500 p-8 rounded-lg text-center relative overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          <h2 className="text-2xl font-bold mb-4 text-primary-foreground">Ready to Get Started?</h2>
          <p className="text-primary-foreground/90 mb-6">
            Join our community of freelancers and clients today.
          </p>
          <div className="flex justify-center">
            <Button 
              onClick={() => handleNavigate("/signup")}
              size="lg" 
              className="gap-2 bg-white text-primary hover:bg-white/90 transition-all duration-300 hover:scale-105"
            >
              Create an Account 
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 