import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, CheckCircle, Users, Briefcase, Globe, Award, Sparkles, Heart, Zap, Shield } from "lucide-react"

export const metadata: Metadata = {
  title: "About Us | EGSeekers",
  description: "Learn about EGSeekers, Egypt's premier freelancing platform connecting talented freelancers with clients.",
}

export default function AboutPage() {
  return (
    <div className="container py-12 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-primary/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="max-w-4xl mx-auto relative">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-emerald-500">About EGSeekers</h1>
          
          <div className="prose prose-lg dark:prose-invert mb-12">
            <p className="text-xl mb-6">
              EGSeekers is Egypt's premier freelancing platform, connecting talented Egyptian freelancers with clients worldwide. 
              Our mission is to empower Egyptian talent and create opportunities for both freelancers and clients.
            </p>
            
            <p className="mb-6">
              Founded in 2023, EGSeekers has grown to become a trusted platform for freelancers and clients alike. 
              We provide a secure, efficient, and user-friendly environment for connecting, collaborating, and completing projects.
            </p>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-emerald-500">Our Values</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="flex items-start gap-4 p-6 rounded-lg border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg group bg-gradient-to-br from-background to-primary/5 relative overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="p-2 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="relative">
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">Community</h3>
              <p className="text-muted-foreground">
                We believe in building a strong community of freelancers and clients who support and learn from each other.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-6 rounded-lg border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg group bg-gradient-to-br from-background to-primary/5 relative overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="p-2 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 group-hover:scale-110 transition-transform duration-300">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div className="relative">
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">Quality</h3>
              <p className="text-muted-foreground">
                We maintain high standards for both freelancers and clients to ensure the best possible outcomes for all projects.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-6 rounded-lg border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg group bg-gradient-to-br from-background to-primary/5 relative overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="p-2 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div className="relative">
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">Global Reach</h3>
              <p className="text-muted-foreground">
                We connect Egyptian talent with clients from around the world, creating opportunities for international collaboration.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-6 rounded-lg border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg group bg-gradient-to-br from-background to-primary/5 relative overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="p-2 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div className="relative">
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">Excellence</h3>
              <p className="text-muted-foreground">
                We strive for excellence in everything we do, from platform development to customer support.
              </p>
            </div>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-emerald-500">Why Choose EGSeekers?</h2>
        
        <div className="space-y-6 mb-12">
          <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-md group bg-gradient-to-br from-background to-primary/5 relative overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="p-2 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="relative">
              <h3 className="text-xl font-semibold group-hover:text-primary transition-colors duration-300">Egyptian Talent Focus</h3>
              <p className="text-muted-foreground">
                We specialize in connecting Egyptian freelancers with clients, understanding the unique strengths and capabilities of the Egyptian workforce.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-md group bg-gradient-to-br from-background to-primary/5 relative overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="p-2 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 group-hover:scale-110 transition-transform duration-300">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="relative">
              <h3 className="text-xl font-semibold group-hover:text-primary transition-colors duration-300">Secure Payments</h3>
              <p className="text-muted-foreground">
                Our platform ensures secure payments for both freelancers and clients, with escrow protection for all transactions.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-md group bg-gradient-to-br from-background to-primary/5 relative overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.7s" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="p-2 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div className="relative">
              <h3 className="text-xl font-semibold group-hover:text-primary transition-colors duration-300">Dedicated Support</h3>
              <p className="text-muted-foreground">
                Our customer support team is available to help with any issues or questions you may have.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-md group bg-gradient-to-br from-background to-primary/5 relative overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.8s" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="p-2 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="relative">
              <h3 className="text-xl font-semibold group-hover:text-primary transition-colors duration-300">Verified Profiles</h3>
              <p className="text-muted-foreground">
                We verify freelancer profiles to ensure clients can trust the talent they're hiring.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-primary via-primary/90 to-emerald-500 p-8 rounded-lg text-center relative overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.9s" }}>
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          <h2 className="text-2xl font-bold mb-4 text-primary-foreground">Ready to Get Started?</h2>
          <p className="text-primary-foreground/90 mb-6">
            Join our community of freelancers and clients today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="gap-2 bg-white text-primary hover:bg-white/90 transition-all duration-300 hover:scale-105">
                Create an Account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10 transition-all duration-300 hover:scale-105">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 