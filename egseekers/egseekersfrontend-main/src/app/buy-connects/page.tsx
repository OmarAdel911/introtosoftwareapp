"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Zap, Crown, Star, Gift, Eye, Rocket, Shield, Coins } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"
import { config } from '@/config/env';

const connectPackages = [
  {
    id: 1,
    name: "Starter",
    connects: 10,
    price: 100,
    features: [
      "10 Connects",
      "Valid for 6 months",
      "Basic support",
      "Standard proposal templates"
    ],
    popular: false
  },
  {
    id: 2,
    name: "Professional",
    connects: 40,
    price: 350,
    features: [
      "40 Connects",
      "Valid for 12 months",
      "Priority support",
      "Advanced proposal templates",
      "Featured in search results"
    ],
    popular: true
  },
  {
    id: 3,
    name: "Premium",
    connects: 80,
    price: 600,
    features: [
      "80 Connects",
      "Valid for 12 months",
      "24/7 Premium support",
      "Custom proposal templates",
      "Top placement in search",
      "Exclusive job alerts"
    ],
    popular: false
  }
]

const visibilitySubscription = {
  name: "Premium Visibility",
  price: 29.99,
  period: "month",
  features: [
    "Top placement in freelancer search results",
    "Direct client messaging access",
    "Featured profile badge",
    "Priority in client searches",
    "Advanced profile analytics",
    "Custom portfolio showcase",
    "24/7 Premium support",
    "Exclusive job alerts"
  ],
  popular: true
}

export default function BuyConnectsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handlePurchase = async (packageId: number) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please log in to purchase connects')
        router.push('/login')
        return
      }

      // Find the package details
      const selectedPackage = connectPackages.find(pkg => pkg.id === packageId)
      if (!selectedPackage) {
        toast.error('Invalid package selected')
        return
      }

      // Create Stripe Checkout Session
      const response = await axios.post(
        `${config.apiUrl}/connect-purchase/create-checkout`,
        {
          packageId: selectedPackage.id
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success && response.data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkoutUrl
      } else {
        toast.error('Failed to create checkout session. Please try again.')
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Error purchasing connects:', error)
      toast.error(error.response?.data?.error || 'Failed to start payment. Please try again.')
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      // TODO: Implement subscription processing
      toast.success("Subscription successful! Your profile is now enhanced.")
      router.push("/dashboard")
    } catch (error) {
      toast.error("Failed to process subscription. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">
            Boost Your Success
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose between buying connects for proposals or subscribing for enhanced visibility. Both options help you succeed on our platform.
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-12">
          {/* Connects Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-center">Buy Connects</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {connectPackages.map((pkg) => (
                <Card 
                  key={pkg.name}
                  className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                    pkg.name === "Premium" 
                      ? 'border-2 border-purple-400 shadow-xl bg-gradient-to-br from-gray-900 to-gray-800' 
                      : pkg.popular 
                        ? 'border-2 border-yellow-400 shadow-lg' 
                        : 'border-0 shadow-md'
                  }`}
                >
                  {pkg.popular && pkg.name !== "Premium" && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 py-1 rounded-bl-lg font-medium text-sm">
                      Most Popular
                    </div>
                  )}
                  {pkg.name === "Premium" && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-1 rounded-bl-lg font-medium text-sm">
                      Premium
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className={`text-2xl font-bold text-center ${
                      pkg.name === "Premium"
                        ? 'bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent'
                        : 'bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent'
                    }`}>
                      {pkg.name}
                    </CardTitle>
                    <CardDescription className={`text-center ${
                      pkg.name === "Premium" ? 'text-gray-300' : ''
                    }`}>
                      Perfect for {pkg.name.toLowerCase()} freelancers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-6">
                      <div className={`text-4xl font-bold mb-2 ${
                        pkg.name === "Premium" ? 'text-white' : 'text-gray-900'
                      }`}>
                        {pkg.price} EGP
                      </div>
                      <div className={pkg.name === "Premium" ? 'text-gray-300' : 'text-muted-foreground'}>
                        {pkg.connects} Connects
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className={`flex items-center gap-2 ${
                          pkg.name === "Premium" ? 'text-gray-200' : 'text-muted-foreground'
                        }`}>
                          <Check className={`h-5 w-5 flex-shrink-0 ${
                            pkg.name === "Premium" ? 'text-purple-400' : 'text-green-500'
                          }`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full ${
                        pkg.name === "Premium"
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-purple-500/25'
                          : pkg.popular
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white'
                            : 'bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white'
                      } transition-all duration-300`}
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Purchase Now"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Visibility Subscription Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-center">Premium Visibility</h2>
            <div className="max-w-3xl mx-auto">
              <Card className="relative overflow-hidden transition-all duration-300 hover:scale-105 border-2 border-purple-400 shadow-xl bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-1 rounded-bl-lg font-medium text-sm">
                  Premium
                </div>
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                    {visibilitySubscription.name}
                  </CardTitle>
                  <CardDescription className="text-center text-gray-300">
                    Get discovered by clients and receive direct job offers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-white mb-2">
                      ${visibilitySubscription.price}
                    </div>
                    <div className="text-gray-300">
                      per {visibilitySubscription.period}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {visibilitySubscription.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-gray-200">
                        <Check className="h-5 w-5 text-purple-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                    onClick={handleSubscribe}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Subscribe Now"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-white/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Eye className="h-8 w-8 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Increased Visibility</h3>
                  <p className="text-gray-300">Get seen by more potential clients</p>
                </div>
                <div className="text-center">
                  <div className="bg-white/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Rocket className="h-8 w-8 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Premium Features</h3>
                  <p className="text-gray-300">Access exclusive tools and resources</p>
                </div>
                <div className="text-center">
                  <div className="bg-white/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Priority Support</h3>
                  <p className="text-gray-300">24/7 dedicated assistance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            All plans include a 14-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
} 