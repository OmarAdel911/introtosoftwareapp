"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Zap, Crown, Star, Gift, Eye, Rocket, Shield } from "lucide-react"
import { toast } from "sonner"

const subscriptionPlans = [
  {
    name: "Basic",
    price: 9.99,
    period: "month",
    features: [
      "Enhanced profile visibility",
      "Basic job alerts",
      "Standard proposal templates",
      "Email support"
    ],
    popular: false
  },
  {
    name: "Professional",
    price: 19.99,
    period: "month",
    features: [
      "Premium profile placement",
      "Advanced job alerts",
      "Custom proposal templates",
      "Priority support",
      "Featured in search results",
      "Profile analytics"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: 39.99,
    period: "month",
    features: [
      "Top profile placement",
      "Real-time job alerts",
      "AI-powered proposal templates",
      "24/7 Premium support",
      "Featured in all searches",
      "Advanced analytics",
      "Direct client messaging",
      "Portfolio showcase"
    ],
    popular: false
  }
]

export default function SubscriptionsPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async (planName: string) => {
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
            Boost Your Visibility
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stand out to potential clients with our premium subscription plans. Get more job opportunities and increase your earning potential.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {subscriptionPlans.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                plan.popular ? 'border-2 border-yellow-400 shadow-lg' : 'border-0 shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 py-1 rounded-bl-lg font-medium text-sm">
                  Most Popular
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-center">
                  Perfect for {plan.name.toLowerCase()} freelancers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    ${plan.price}
                  </div>
                  <div className="text-muted-foreground">
                    per {plan.period}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white'
                      : 'bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white'
                  }`}
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Subscribe Now"}
                </Button>
              </CardContent>
            </Card>
          ))}
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