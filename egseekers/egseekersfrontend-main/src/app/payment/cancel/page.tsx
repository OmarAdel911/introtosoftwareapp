"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import Link from "next/link"

export default function PaymentCancelPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const transactionId = searchParams.get("transaction_id")
  const paymentId = searchParams.get("payment_id")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/5 p-6">
      <Card className="w-full max-w-md border-0 shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-red-500/20 to-rose-500/20">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-rose-500">
            Payment Cancelled
          </CardTitle>
          <CardDescription className="text-center">
            Your payment was cancelled. No charges were made.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            You can try again anytime or contact support if you need assistance.
          </p>
          <div className="flex gap-2 w-full">
            {transactionId && (
              <Button asChild variant="outline" className="flex-1">
                <Link href="/freelancer/connects">Back to Connects</Link>
              </Button>
            )}
            {paymentId && (
              <Button asChild variant="outline" className="flex-1">
                <Link href="/job-poster/dashboard">Back to Dashboard</Link>
              </Button>
            )}
            <Button asChild className="flex-1">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

