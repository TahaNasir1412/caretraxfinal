"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, CalendarIcon, ChevronLeft, ChevronRight, Clock, Droplet, FileText, LogOut } from "lucide-react"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import PatientNavigation from "@/components/patient/navigation"
// Import the useRouter hook at the top of the file
import { useRouter } from "next/navigation"

interface Treatment {
  id: string
  type: string
  date: string
  time: string
  status: "completed" | "active" | "scheduled"
  details: string
  administeredBy?: string
}

export default function PatientHistory() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  const [treatments, setTreatments] = useState<Treatment[]>([
    {
      id: "t-001",
      type: "Insulin Drip",
      date: "Mar 4, 2025",
      time: "2:30 PM",
      status: "active",
      details: "Regular insulin drip administration",
      administeredBy: "Dr. Sarah Johnson",
    },
    {
      id: "t-002",
      type: "Insulin Drip",
      date: "Mar 4, 2025",
      time: "10:15 AM",
      status: "completed",
      details: "Regular insulin drip administration",
      administeredBy: "Dr. Sarah Johnson",
    },
    {
      id: "t-003",
      type: "Insulin Drip",
      date: "Mar 4, 2025",
      time: "6:45 AM",
      status: "completed",
      details: "Regular insulin drip administration",
      administeredBy: "Dr. Michael Chen",
    },
    {
      id: "t-004",
      type: "Insulin Drip",
      date: "Mar 3, 2025",
      time: "8:30 PM",
      status: "completed",
      details: "Regular insulin drip administration",
      administeredBy: "Dr. Sarah Johnson",
    },
    {
      id: "t-005",
      type: "Insulin Drip",
      date: "Mar 3, 2025",
      time: "2:15 PM",
      status: "completed",
      details: "Regular insulin drip administration",
      administeredBy: "Dr. Michael Chen",
    },
    {
      id: "t-006",
      type: "Blood Test",
      date: "Mar 3, 2025",
      time: "9:00 AM",
      status: "completed",
      details: "Routine blood glucose level test",
      administeredBy: "Dr. Lisa Wong",
    },
    {
      id: "t-007",
      type: "Insulin Drip",
      date: "Mar 5, 2025",
      time: "8:00 AM",
      status: "scheduled",
      details: "Regular insulin drip administration",
    },
  ])

  // Add the router declaration near the top of the component function
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-16 items-center px-4">
          <Link href="/patient/dashboard" className="mr-4">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold">Treatment History</h1>
          <div className="ml-auto">
            {/* Find the logout button in the header and update it */}
            <Button variant="primary" size="sm" onClick={() => router.push("/")}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Medical History</h2>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {date ? format(date, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Today - Mar 4, 2025</h3>
              <Button variant="ghost" size="sm" className="text-primary">
                Export <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {treatments
              .filter((t) => t.date === "Mar 4, 2025")
              .map((treatment) => (
                <TreatmentCard key={treatment.id} treatment={treatment} />
              ))}

            <div className="flex items-center justify-between mb-2 mt-6">
              <h3 className="font-medium">Yesterday - Mar 3, 2025</h3>
              <Button variant="ghost" size="sm" className="text-primary">
                Export <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {treatments
              .filter((t) => t.date === "Mar 3, 2025")
              .map((treatment) => (
                <TreatmentCard key={treatment.id} treatment={treatment} />
              ))}

            <div className="flex items-center justify-between mb-2 mt-6">
              <h3 className="font-medium">Tomorrow - Mar 5, 2025</h3>
              <Button variant="ghost" size="sm" className="text-primary">
                Export <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {treatments
              .filter((t) => t.date === "Mar 5, 2025")
              .map((treatment) => (
                <TreatmentCard key={treatment.id} treatment={treatment} />
              ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {treatments
              .filter((t) => t.status === "completed")
              .map((treatment) => (
                <TreatmentCard key={treatment.id} treatment={treatment} />
              ))}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            {treatments
              .filter((t) => t.status === "scheduled")
              .map((treatment) => (
                <TreatmentCard key={treatment.id} treatment={treatment} />
              ))}

            {treatments.filter((t) => t.status === "scheduled").length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No scheduled treatments</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <PatientNavigation />
    </div>
  )
}

interface TreatmentCardProps {
  treatment: Treatment
}

function TreatmentCard({ treatment }: TreatmentCardProps) {
  return (
    <Card
      className={`${
        treatment.status === "active"
          ? "bg-blue-50 border-blue-200"
          : treatment.status === "scheduled"
            ? "bg-purple-50 border-purple-200"
            : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center ${
              treatment.type.includes("Insulin") ? "bg-blue-100" : "bg-green-100"
            }`}
          >
            {treatment.type.includes("Insulin") ? (
              <Droplet className="h-5 w-5 text-blue-500" />
            ) : (
              <FileText className="h-5 w-5 text-green-500" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium">{treatment.type}</h3>
              <Badge
                variant={
                  treatment.status === "active" ? "outline" : treatment.status === "scheduled" ? "secondary" : "default"
                }
              >
                {treatment.status === "active"
                  ? "Active"
                  : treatment.status === "scheduled"
                    ? "Scheduled"
                    : "Completed"}
              </Badge>
            </div>

            <p className="text-sm mb-2">{treatment.details}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {treatment.time} • {treatment.date}
                </span>
              </div>

              {treatment.administeredBy && (
                <div className="text-xs text-muted-foreground">Administered by: {treatment.administeredBy}</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
