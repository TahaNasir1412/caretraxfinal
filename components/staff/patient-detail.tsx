"use client"

import { useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Bell, Calendar, Clock, Droplet, FileText, User } from "lucide-react"
import StaffNavigation from "@/components/staff/navigation"
import { useRouter } from "next/navigation"

interface PatientDetailProps {
  patientId: string
}

export default function PatientDetail({ patientId }: PatientDetailProps) {
  const [patient, setPatient] = useState({
    id: patientId,
    name: "John Doe",
    room: "101",
    admissionDate: "Feb 15, 2025",
    age: 45,
    gender: "Male",
    bloodType: "O+",
    remainingPercentage: 8,
    lastChecked: "2:30 PM",
    nextCheck: "3:00 PM",
    status: "critical" as "critical" | "warning" | "normal",
    drips: [
      { id: 1, type: "Insulin Drip", time: "2:30 PM", status: "active" },
      { id: 2, type: "Insulin Drip", time: "10:15 AM", status: "completed" },
      { id: 3, type: "Insulin Drip", time: "6:45 AM", status: "completed" },
    ],
    vitals: {
      heartRate: 72,
      bloodPressure: "120/80",
      temperature: 98.6,
      oxygenSaturation: 98,
    },
  })

  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-16 items-center px-4">
          <Link href="/staff/dashboard" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold">Patient Details</h1>
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={() => router.push("/")}>
              <Bell className="h-4 w-4 mr-2" />
              Alert
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/placeholder.svg?height=64&width=64" alt={patient.name} />
                <AvatarFallback>
                  {patient.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h2 className="text-xl font-semibold">{patient.name}</h2>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>ID: {patient.id}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Admitted: {patient.admissionDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>Room: {patient.room}</span>
                  </div>
                </div>
              </div>

              <Badge
                variant={
                  patient.status === "critical" ? "destructive" : patient.status === "warning" ? "warning" : "success"
                }
              >
                {patient.status === "critical" ? "Critical" : patient.status === "warning" ? "Warning" : "Normal"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Drip Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Remaining</div>
                <div
                  className={`text-sm font-medium ${
                    patient.remainingPercentage <= 10
                      ? "text-red-500"
                      : patient.remainingPercentage <= 50
                        ? "text-amber-500"
                        : "text-green-500"
                  }`}
                >
                  {patient.remainingPercentage}%
                </div>
              </div>

              <Progress
                value={patient.remainingPercentage}
                className={`h-2 ${
                  patient.remainingPercentage <= 10
                    ? "bg-red-100"
                    : patient.remainingPercentage <= 50
                      ? "bg-amber-100"
                      : "bg-green-100"
                }`}
                indicatorClassName={
                  patient.remainingPercentage <= 10
                    ? "bg-red-500"
                    : patient.remainingPercentage <= 50
                      ? "bg-amber-500"
                      : "bg-green-500"
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Last Checked</div>
                      <div className="font-medium">{patient.lastChecked}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Next Check</div>
                      <div className="font-medium">{patient.nextCheck}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" size="sm">
                  <Droplet className="h-4 w-4 mr-2" />
                  Adjust Drip
                </Button>
                <Button size="sm">Replace Drip</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="history">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="vitals">Vitals</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-4 space-y-4">
            {patient.drips.map((drip) => (
              <Card key={drip.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{drip.type}</h3>
                    <p className="text-sm text-muted-foreground">{drip.time}</p>
                  </div>
                  <Badge variant={drip.status === "active" ? "outline" : "secondary"}>
                    {drip.status === "active" ? "Active" : "Completed"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="vitals" className="mt-4">
            <Card>
              <CardContent className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Heart Rate</div>
                  <div className="font-medium">{patient.vitals.heartRate} bpm</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Blood Pressure</div>
                  <div className="font-medium">{patient.vitals.bloodPressure} mmHg</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Temperature</div>
                  <div className="font-medium">{patient.vitals.temperature}°F</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Oxygen Saturation</div>
                  <div className="font-medium">{patient.vitals.oxygenSaturation}%</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">No notes available.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <StaffNavigation />
    </div>
  )
}
