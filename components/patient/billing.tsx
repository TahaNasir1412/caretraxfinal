"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CreditCard, Download, LogOut } from "lucide-react"
import PatientNavigation from "@/components/patient/navigation"
import { useRouter } from "next/navigation"

export default function PatientBilling() {
  const router = useRouter()

  // Updated with Pakistani Rupees
  const bills = [
    {
      id: "INV-2025-001",
      date: "Mar 1, 2025",
      amount: "Rs 24,500",
      status: "paid",
      description: "Insulin Treatment - 3 doses",
    },
    {
      id: "INV-2025-002",
      date: "Mar 2, 2025",
      amount: "Rs 18,000",
      status: "pending",
      description: "Insulin Treatment - 2 doses",
    },
    {
      id: "INV-2025-003",
      date: "Mar 3, 2025",
      amount: "Rs 32,000",
      status: "pending",
      description: "Insulin Treatment - 4 doses",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-16 items-center px-4">
          <Link href="/patient/dashboard" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold">Billing</h1>
          <div className="ml-auto">
            <Button variant="primary" size="sm" onClick={() => router.push("/")}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Billed</span>
                <span className="font-medium">Rs 74,500</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Paid</span>
                <span className="font-medium">Rs 24,500</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Outstanding</span>
                <span className="font-medium">Rs 50,000</span>
              </div>

              <Button className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                Make Payment
              </Button>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-xl font-semibold mb-4">Recent Bills</h2>

        <div className="space-y-4">
          {bills.map((bill) => (
            <Card key={bill.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{bill.id}</h3>
                    <p className="text-sm text-muted-foreground">{bill.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{bill.amount}</div>
                    <div className={`text-xs ${bill.status === "paid" ? "text-green-600" : "text-amber-600"}`}>
                      {bill.status === "paid" ? "Paid" : "Pending"}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{bill.description}</p>

                <div className="flex justify-end">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <PatientNavigation />
    </div>
  )
}
