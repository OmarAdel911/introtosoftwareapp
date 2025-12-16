"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import axios from "axios"
import { config } from "@/config/env"

// Create axios instance
const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

interface BillingInfo {
  plan: string;
  status: string;
  nextBillingDate: string;
  paymentMethod?: {
    type: string;
    last4: string;
    expiryDate: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface BillingSettingsProps {
  billing: BillingInfo | null;
  onBillingChange: (billing: BillingInfo) => void;
}

export default function BillingSettings({ billing, onBillingChange }: BillingSettingsProps) {

  const handleBillingUpdate = async (data: Partial<BillingInfo>) => {
    if (!billing) return

    try {
      await api.put('/users/billing', data)
      onBillingChange({ ...billing, ...data })
      toast.success("Billing information updated successfully")
    } catch (error) {
      console.error("Error updating billing:", error)
      toast.error("Failed to update billing information. Please try again.")
    }
  }

  const handleBillingAddressUpdate = async (field: keyof NonNullable<BillingInfo['billingAddress']>, value: string) => {
    if (!billing?.billingAddress) return;

    try {
      const updatedAddress = {
        ...billing.billingAddress,
        [field]: value
      }
      await api.put('/users/billing/address', updatedAddress)
      onBillingChange({
        ...billing,
        billingAddress: updatedAddress
      })
      toast.success("Billing address updated successfully")
    } catch (error) {
      console.error("Error updating billing address:", error)
      toast.error("Failed to update billing address. Please try again.")
    }
  }

  if (!billing) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Billing Information</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Current Plan</h3>
          <p className="text-gray-600">{billing.plan || 'No active plan'}</p>
          <p className="text-sm text-gray-500">Next billing date: {billing.nextBillingDate || 'N/A'}</p>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Payment Method</h3>
          {billing.paymentMethod ? (
            <div className="space-y-2">
              <p className="text-gray-600">
                {billing.paymentMethod.type.toUpperCase()} ending in {billing.paymentMethod.last4}
              </p>
              <p className="text-sm text-gray-500">
                Expires: {billing.paymentMethod.expiryDate}
              </p>
            </div>
          ) : (
            <p className="text-gray-600">No payment method on file</p>
          )}
          <Button variant="outline" className="mt-2">
            Update Payment Method
          </Button>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Billing Address</h3>
          {billing.billingAddress ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={billing.billingAddress.street}
                  onChange={(e) => handleBillingAddressUpdate('street', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={billing.billingAddress.city}
                  onChange={(e) => handleBillingAddressUpdate('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={billing.billingAddress.state}
                  onChange={(e) => handleBillingAddressUpdate('state', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={billing.billingAddress.zipCode}
                  onChange={(e) => handleBillingAddressUpdate('zipCode', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={billing.billingAddress.country}
                  onChange={(e) => handleBillingAddressUpdate('country', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No billing address on file</p>
          )}
        </div>
      </div>
    </Card>
  )
} 