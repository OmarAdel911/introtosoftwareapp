import React from 'react'
import Link from 'next/link'
import { Search, ArrowRight, CheckCircle,
   Users, Globe, Award, Palette, Megaphone,
    FileText, Video, Headphones, Code, Database,
     Building2, Brain, Camera as CameraIcon, PiggyBank, 
     Heart, DollarSign, Gift } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function Home() {
  const categories = [
    {
      title: 'Graphics & Design',
      description: 'Logos, branding, illustrations, and visual content',
      Icon: Palette,
      count: '2,500+',
      color: 'from-pink-500/20 to-purple-500/20'
    },
    {
      title: 'Digital Marketing',
      description: 'SEO, social media, content marketing, and advertising',
      Icon: Megaphone,
      count: '1,800+',
      color: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      title: 'Writing & Translation',
      description: 'Content writing, copywriting, and language translation',
      Icon: FileText,
      count: '3,000+',
      color: 'from-amber-500/20 to-orange-500/20'
    },
    {
      title: 'Video & Animation',
      description: 'Motion graphics, video editing, and 3D animation',
      Icon: Video,
      count: '1,200+',
      color: 'from-red-500/20 to-rose-500/20'
    },
    {
      title: 'Music & Audio',
      description: 'Music production, voice-over, and sound design',
      Icon: Headphones,
      count: '900+',
      color: 'from-indigo-500/20 to-violet-500/20'
    },
    {
      title: 'Programming & Tech',
      description: 'Web development, mobile apps, and software solutions',
      Icon: Code,
      count: '4,000+',
      color: 'from-emerald-500/20 to-teal-500/20'
    },
    {
      title: 'Data Analysis',
      description: 'Data entry, analytics, and business intelligence',
      Icon: Database,
      count: '1,500+',
      color: 'from-sky-500/20 to-blue-500/20'
    },
    {
      title: 'Business',
      description: 'Market research, CRM, and legal services',
      Icon: Building2,
      count: '2,000+',
      color: 'from-amber-500/20 to-yellow-500/20'
    },
    {
      title: 'Personal Growth',
      description: 'Life coaching, fitness training, and self-improvement',
      Icon: Brain,
      count: '800+',
      color: 'from-purple-500/20 to-indigo-500/20'
    },
    {
      title: 'Photography',
      description: 'Portrait, product, and event photography',
      Icon: CameraIcon,
      count: '1,100+',
      color: 'from-rose-500/20 to-pink-500/20'
    },
    {
      title: 'Finance',
      description: 'Financial planning, accounting, and consulting',
      Icon: PiggyBank,
      count: '950+',
      color: 'from-green-500/20 to-emerald-500/20'
    },
    {
      title: 'Hobbies',
      description: 'Art, crafts, and creative workshops',
      Icon: Heart,
      count: '600+',
      color: 'from-red-500/20 to-orange-500/20'
    }
  ]

  const steps = [
    {
      title: 'Post a Project',
      description: 'Describe your project and receive competitive bids from freelancers within minutes',
      icon: '📝'
    },
    {
      title: 'Choose a Freelancer',
      description: 'Browse freelancer profiles, reviews, and portfolios to find the perfect match',
      icon: '👥'
    },
    {
      title: 'Get Work Done',
      description: "Receive your completed project and release payment when you're satisfied",
      icon: '✅'
    }
  ]

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse"></div>
        <div className="container py-20 md:py-28 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-emerald-500">
              Find the perfect  freelance services for your business
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Connect with talented Egyptian freelancers and get your projects done efficiently and affordably.
            </p>
            <div className="relative max-w-2xl">
              <input
                type="text"
                placeholder="Search for any service..."
                className="w-full h-14 px-6 pr-12 rounded-full border border-input bg-background shadow-lg focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button className="absolute right-2 top-2 bg-gradient-to-r from-primary to-emerald-500 text-primary-foreground h-10 px-6 rounded-full flex items-center gap-2 hover:opacity-90 transition-all duration-300 hover:scale-105">
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Benefits Section */}
      <section className="py-16 bg-gradient-to-b from-secondary/30 to-background relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/4 h-1/4 bg-gradient-to-bl from-amber-500/20 to-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-emerald-500">Simple & Affordable</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              EGSeekers makes it easy to get started with our flexible pricing options
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-primary/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-pink-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="flex items-center gap-4 mb-6 relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center transition-transform duration-300 hover:scale-110">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-primary">Post Jobs for Free</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                As a client, you can post unlimited jobs without any upfront costs. Only pay when you're satisfied with the work delivered.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-pink-500 mt-0.5 flex-shrink-0" />
                  <span>No posting fees or hidden charges</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>Access to thousands of qualified freelancers</span>
          </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Secure payment system for your peace of mind</span>
          </li>
              </ul>
            </Card>
            
            <Card className="p-8 border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-primary/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="flex items-center gap-4 mb-6 relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center transition-transform duration-300 hover:scale-110">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-primary">Low Fee for Freelancers</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                As a freelancer, you only pay a small percentage when you successfully complete a project. No monthly fees or subscriptions required.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Pay only when you earn</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-teal-500 mt-0.5 flex-shrink-0" />
                  <span>Competitive platform fees</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Build your portfolio and reputation</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-20 bg-gradient-to-b from-background to-secondary/20 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute top-0 right-0 w-1/4 h-1/4 bg-gradient-to-bl from-amber-500/20 to-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="container relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-emerald-500">Browse Categories</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our comprehensive range of freelance categories and find the perfect talent for your project
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              const Icon = category.Icon
              return (
                <Card key={index} className="p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group bg-gradient-to-br from-background to-primary/5 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <div className="flex items-center gap-4 mb-4 relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-colors duration-300 group-hover:scale-110">
                      <Icon className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors duration-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors duration-300">{category.title}</h3>
                      <p className="text-sm text-muted-foreground">{category.count} Freelancers</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 relative">{category.description}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-secondary/20 to-secondary/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1/4 h-1/4 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-emerald-500">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started with EGSeekers in three simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative group">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-4xl transition-transform duration-300 group-hover:scale-110">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-primary">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-primary transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-secondary/50 to-background relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-1/4 h-1/4 bg-gradient-to-tl from-purple-500/20 to-indigo-500/20 rounded-full blur-3xl translate-y-1/2 translate-x-1/2"></div>
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-emerald-500">Why Choose EGSeekers?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We provide the best platform for Egyptian freelancers and clients
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 group">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-primary">Verified Freelancers</h3>
              <p className="text-muted-foreground">
                All freelancers go through a rigorous verification process to ensure quality
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 group">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-primary">Quality Work</h3>
              <p className="text-muted-foreground">
                Get high-quality work from experienced Egyptian professionals
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 group">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-primary">Global Reach</h3>
              <p className="text-muted-foreground">
                Connect with clients and freelancers from around the world
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-emerald-500/5"></div>
        <div className="container">
          <div className="bg-gradient-to-r from-primary via-primary/90 to-emerald-500 rounded-2xl text-primary-foreground p-12 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            <div className="max-w-2xl mx-auto text-center relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to start your freelancing journey?
              </h2>
              <p className="text-primary-foreground/90 text-lg mb-8">
                Join thousands of Egyptian freelancers and businesses making great things happen.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="bg-white text-primary hover:bg-white/90 px-8 py-3 rounded-full font-semibold inline-flex items-center justify-center transition-all duration-300 hover:scale-105"
                >
                  Join as a Freelancer
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary-foreground/10 hover:bg-primary-foreground/20 border border-primary-foreground/20 px-8 py-3 rounded-full font-semibold inline-flex items-center justify-center transition-all duration-300 hover:scale-105"
                >
                  Hire a Freelancer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
  )
}
