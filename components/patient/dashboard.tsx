"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, LogOut, AlertTriangle } from "lucide-react"
import { useWeight } from "@/hooks/use-weight"

export default function PatientDashboard() {
  const router = useRouter()
  const { weight, timestamp, error, isLoading } = useWeight()
  const [patient, setPatient] = useState({
    id: "P-251758",
    name: "Taha Nasir",
    room: "203",
    admissionDate: "Feb 15, 2025",
    remainingPercentage: weight ? Math.max(0, Math.min(100, (weight / 5) * 100)) : 49,
    todayDrips: 3,
    nextCheck: "30min",
    drips: [
      {
        id: 1,
        type: "Insulin Drip",
        time: timestamp ? new Date(timestamp).toLocaleTimeString() : "2:30 PM",
        status: "active",
      },
      { id: 2, type: "Insulin Drip", time: "10:15 AM", status: "completed" },
      { id: 3, type: "Insulin Drip", time: "6:45 AM", status: "completed" },
    ],
  })

  // Emergency Override Feature
  const [showEmergencyOverride, setShowEmergencyOverride] = useState(false)

  useEffect(() => {
    console.log("Weight changed:", weight, "Timestamp:", timestamp)
    if (weight !== null) {
      //const newPercentage = Math.max(0, Math.min(500, (weight / 0.5) * 100))
      const newPercentage = Math.max(0, Math.min(500, weight * 1000))
      console.log("New percentage:", newPercentage)
      setPatient((prev) => ({
        ...prev,
        remainingPercentage: newPercentage,
        drips: prev.drips.map((drip, index) =>
          index === 0 ? { ...drip, time: timestamp ? new Date(timestamp).toLocaleTimeString() : drip.time } : drip,
        ),
      }))

      // Show emergency override if critical level
      if (newPercentage <= 200) {
        setShowEmergencyOverride(true)
      }
    }
  }, [weight, timestamp])

  const handleEmergencyOverride = () => {
    // Log emergency override action
    console.log("Emergency override activated by patient")
    setShowEmergencyOverride(false)
    // In real implementation, this would send to database
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-16 items-center px-4">
          <Link href="/" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold">Patient Dashboard</h1>
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={() => router.push("/")}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        {/* Emergency Override Alert */}
        {showEmergencyOverride && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-800">Critical Insulin Level</h3>
                  <p className="text-sm text-red-600">Your insulin drip is critically low. Staff has been notified.</p>
                </div>
                <Button size="sm" variant="outline" onClick={handleEmergencyOverride}>
                  Acknowledge
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{patient.name}</h2>
                <p className="text-sm text-muted-foreground">Patient ID: {patient.id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Room {patient.room}</p>
                <p className="text-sm text-muted-foreground">Admitted: {patient.admissionDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-lg text-blue-600">Current Drip Status</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-5xl font-bold text-blue-600 mb-2">{patient.remainingPercentage}ml</div>
            <div className="text-sm text-blue-600 mb-4">Remaining</div>

            <Progress value={patient.remainingPercentage} className="h-2 mb-8 bg-blue-200" />

            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-green-50">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{patient.todayDrips}</div>
                  <div className="text-sm text-green-600">Today's Drips</div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">{patient.nextCheck}</div>
                  <div className="text-sm text-purple-600">Next Check</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-xl font-semibold mb-4">Treatment History</h2>

        <div className="space-y-4 mb-6">
          {patient.drips.map((drip) => (
            <Card key={drip.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{drip.type}</h3>
                  <p className="text-sm text-muted-foreground">{drip.time}</p>
                </div>
                <div className={`text-sm font-medium ${drip.status === "active" ? "text-green-600" : "text-gray-500"}`}>
                  {drip.status === "active" ? "Active" : "Completed"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="border-t bg-background">
        <div className="flex h-16 items-center justify-around">
          <Link href="/patient/dashboard" className="flex flex-col items-center text-primary">
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/patient/history" className="flex flex-col items-center text-muted-foreground">
            <span className="text-xs">History</span>
          </Link>
          <Link href="/patient/billing" className="flex flex-col items-center text-muted-foreground">
            <span className="text-xs">Billing</span>
          </Link>
          <Link href="/patient/support" className="flex flex-col items-center text-muted-foreground">
            <span className="text-xs">Support</span>
          </Link>
        </div>
      </footer>
    </div>
  )
}
