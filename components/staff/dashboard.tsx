"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, LogOut, RefreshCw } from "lucide-react"
import { useWeight } from "@/hooks/use-weight"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function StaffDashboard() {
  const router = useRouter()
  const { weight, timestamp, error, isLoading, refreshWeight } = useWeight()

  const [patients, setPatients] = useState([
    {
      id: "P-123456",
      name: "Taha Nasir",
      room: "101",
      remainingPercentage: 8,
      lastChecked: "2:30 PM",
      status: "critical" as const,
      dripVolume: 1000, // ml
    },
    {
      id: "P-234567",
      name: "Abdullah Farhat",
      room: "102",
      remainingPercentage: 100,
      lastChecked: "2:15 PM",
      status: "normal" as const,
      dripVolume: 1000, // ml
    },
    {
      id: "P-345678",
      name: "Abdullah Iqbal",
      room: "103",
      remainingPercentage: 100,
      lastChecked: "1:45 PM",
      status: "normal" as const,
      dripVolume: 1000, // ml
    },
  ])

  useEffect(() => {
    if (weight !== null && weight !== undefined) {
      setPatients((prevPatients) =>
        prevPatients.map((patient) => {
          if (patient.name === "Taha Nasir") {
            const newPercentage = Math.max(0, Math.min(500, (weight / 0.1) * 100))
            return {
              ...patient,
              remainingPercentage: newPercentage,
              lastChecked: timestamp ? new Date(timestamp).toLocaleTimeString() : patient.lastChecked,
            }
          }
          return patient
        }),
      )
    }
  }, [weight, timestamp])

  const handleDripVolumeChange = (patientId: string, volume: number) => {
    setPatients((prevPatients) =>
      prevPatients.map((patient) => (patient.id === patientId ? { ...patient, dripVolume: volume } : patient)),
    )
  }

  const handleReplaceDrip = (patientId: string) => {
    setPatients((prevPatients) =>
      prevPatients.map((patient) => (patient.id === patientId ? { ...patient, remainingPercentage: 100 } : patient)),
    )
    toast.success(`${patients.find((p) => p.id === patientId)?.name}'s drip has been replaced!`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">CareTrax Dashboard</h1>
            <div className="relative">
              <Bell className="h-5 w-5 text-yellow-400" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                2
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshWeight} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" style={{ animationDuration: isLoading ? "2s" : "0s" }} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/")}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="text-muted-foreground mb-4">
          Current Sensor Weight:{" "}
          <span className="font-medium">
            {isLoading ? "Loading..." : error ? "Error" : `${(weight * 1000)?.toFixed(0) || 0} ml`}
          </span>
          {timestamp && (
            <span className="text-xs ml-2">(Last updated: {new Date(timestamp).toLocaleTimeString()})</span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{patients.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Drip Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{patients.filter((p) => p.status === "critical").length}</div>
            </CardContent>
          </Card>

          <Card className="bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8</div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold mb-4">Active Patients</h2>

        <div className="space-y-4">
          {patients.map((patient) => (
            <Card key={patient.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{patient.name}</h3>
                  <p className="text-sm text-muted-foreground">Room {patient.room}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <Select
                      value={patient.dripVolume.toString()}
                      onValueChange={(value) => handleDripVolumeChange(patient.id, Number.parseInt(value))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select volume" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="500">500 ml</SelectItem>
                        <SelectItem value="1000">1000 ml</SelectItem>
                        <SelectItem value="1500">1500 ml</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-medium ${
                        patient.remainingPercentage <= 10
                          ? "text-red-500"
                          : patient.remainingPercentage <= 50
                            ? "text-amber-500"
                            : "text-green-500"
                      }`}
                    >
                      {patient.remainingPercentage}ml Remaining
                    </div>
                    <div className="text-xs text-muted-foreground">Last checked: {patient.lastChecked}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleReplaceDrip(patient.id)}>
                    Replace Drip
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="border-t bg-background">
        <div className="flex h-16 items-center justify-around">
          <Link href="/staff/dashboard" className="flex flex-col items-center text-primary">
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link href="/staff/patients" className="flex flex-col items-center text-muted-foreground">
            <span className="text-xs">Patients</span>
          </Link>
          <Link href="/staff/alerts" className="flex flex-col items-center text-muted-foreground">
            <span className="text-xs">Alerts</span>
          </Link>
          <Link href="/staff/settings" className="flex flex-col items-center text-muted-foreground">
            <span className="text-xs">Settings</span>
          </Link>
        </div>
      </footer>
    </div>
  )
}
