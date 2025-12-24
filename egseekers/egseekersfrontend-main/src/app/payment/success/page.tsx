"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { config } from "@/config/env"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Verifying payment...")

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = searchParams.get("session_id")
        const transactionId = searchParams.get("transaction_id")
        const paymentId = searchParams.get("payment_id")

        if (!sessionId) {
          setStatus("error")
          setMessage("No session ID provided")
          return
        }

        const token = localStorage.getItem("token")
        if (!token) {
          router.push("/login")
          return
        }

        // Verify payment with backend
        if (transactionId) {
          // Connect purchase
          try {
            const response = await axios.post(
              `${config.apiUrl}/connect-purchase/verify-payment`,
              { sessionId, transactionId },
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            )

            if (response.data.success) {
              setStatus("success")
              setMessage("Payment successful! Your connects have been added to your account.")
              toast.success("Payment successful!")
              
              // Redirect after 3 seconds
              setTimeout(() => {
                router.push("/freelancer/connects")
              }, 3000)
            } else {
              throw new Error(response.data.message || "Payment verification failed")
            }
          } catch (verifyError) {
            // If payment was already processed (by webhook), still show success
            if (axios.isAxiosError(verifyError) && verifyError.response?.status === 404) {
              const errorMessage = verifyError.response?.data?.message || "";
              if (errorMessage.includes("already processed") || errorMessage.includes("webhook")) {
                setStatus("success")
                setMessage("Payment successful! Your connects have been added to your account.")
                toast.success("Payment successful!")
                
                setTimeout(() => {
                  router.push("/freelancer/connects")
                }, 3000)
                return
              }
            }
            throw verifyError
          }
        } else if (paymentId || searchParams.get("creditTransactionId")) {
          // Check if it's a credit purchase
          const paymentType = searchParams.get("type")
          const creditTransactionId = searchParams.get("creditTransactionId")
          
          if (paymentType === "credit" || creditTransactionId) {
            // Credit purchase - verify payment
            try {
              const response = await axios.post(
                `${config.apiUrl}/credit-purchase/verify-payment`,
                { sessionId, creditTransactionId },
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              )

              if (response.data.success) {
                setStatus("success")
                setMessage("Payment successful! Your credits have been added to your account.")
                toast.success("Credits purchased successfully!")
                
                // Refresh credits data immediately
                setTimeout(() => {
                  router.push("/job-poster/credits")
                  // Force a page reload to ensure fresh data
                  window.location.href = "/job-poster/credits"
                }, 2000)
              } else {
                throw new Error(response.data.message || "Payment verification failed")
              }
            } catch (verifyError) {
              // If payment was already processed (by webhook), still show success
              if (axios.isAxiosError(verifyError) && verifyError.response?.status === 404) {
                const errorMessage = verifyError.response?.data?.message || "";
                if (errorMessage.includes("already processed") || errorMessage.includes("webhook")) {
                  setStatus("success")
                  setMessage("Payment successful! Your credits have been added to your account.")
                  toast.success("Credits purchased successfully!")
                  
                  setTimeout(() => {
                    router.push("/job-poster/credits")
                  }, 3000)
                  return
                }
              }
              throw verifyError
            }
          } else {
            // Escrow payment - just show success, webhook will handle it
            setStatus("success")
            setMessage("Payment successful! Your payment has been processed.")
            toast.success("Payment successful!")
            
            setTimeout(() => {
              router.push("/job-poster/dashboard")
            }, 3000)
          }
        } else {
          throw new Error("No transaction or payment ID provided")
        }
      } catch (error) {
        console.error("Payment verification error:", error)
        const errorMessage = axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to verify payment. Please contact support if the payment was successful."
        
        setStatus("error")
        setMessage(errorMessage)
        toast.error(errorMessage)
      }
    }

    verifyPayment()
  }, [searchParams, router])

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
          </div>
          <CardTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-500">
            {status === "loading" && "Processing..."}
            {status === "success" && "Payment Successful!"}
            {status === "error" && "Error"}
          </CardTitle>
          <CardDescription className="text-center">{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {status === "success" && (
            <>
              {searchParams.get("type") === "credit" ? (
                <Button asChild className="w-full">
                  <Link href="/job-poster/credits">Go to Credits</Link>
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link href="/freelancer/connects">Go to Connects</Link>
                </Button>
              )}
            </>
          )}
          {status === "error" && (
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Go Home</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

