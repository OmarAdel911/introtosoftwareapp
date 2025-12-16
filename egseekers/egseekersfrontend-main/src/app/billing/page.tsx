import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CreditCard, Plus } from "lucide-react"

interface PaymentMethod {
  id: string
  type: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

interface BillingHistory {
  id: string
  date: string
  amount: number
  description: string
  status: "paid" | "pending" | "failed"
}

export default function BillingPage() {
  // This would be replaced with actual API calls
  const paymentMethods: PaymentMethod[] = [
    {
      id: "1",
      type: "visa",
      last4: "4242",
      expMonth: 12,
      expYear: 2024,
      isDefault: true
    },
    // Add more mock payment methods as needed
  ]

  const billingHistory: BillingHistory[] = [
    {
      id: "1",
      date: "2024-04-18T10:00:00Z",
      amount: 29.99,
      description: "Pro Plan Subscription",
      status: "paid"
    },
    // Add more mock billing history as needed
  ]

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Billing & Payments</h1>
      </div>

      <div className="grid gap-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Pro Plan</h3>
                <p className="text-sm text-muted-foreground">
                  $29.99/month
                </p>
              </div>
              <Button variant="outline">Change Plan</Button>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Next billing date: May 1, 2024
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Payment Methods</CardTitle>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {method.type.toUpperCase()} •••• {method.last4}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Expires {method.expMonth}/{method.expYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.isDefault && (
                      <span className="text-sm text-muted-foreground">
                        Default
                      </span>
                    )}
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm">
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {new Date(item.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>${item.amount}</TableCell>
                    <TableCell className="capitalize">{item.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 