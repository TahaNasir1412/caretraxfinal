"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bell, CheckCircle, Clock, Droplet, LogOut } from "lucide-react"
import StaffNavigation from "@/components/staff/navigation"
// Import the useRouter hook at the top of the file
import { useRouter } from "next/navigation"

interface Alert {
  id: string
  patientId: string
  patientName: string
  room: string
  type: "critical" | "warning" | "info"
  message: string
  time: string
  read: boolean
}

export default function StaffAlerts() {
  // Add the router declaration near the top of the component function
  const router = useRouter()
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: "alert-001",
      patientId: "P-123456",
      patientName: "John Doe",
      room: "101",
      type: "critical",
      message: "Insulin drip level critically low (8%)",
      time: "10 min ago",
      read: false,
    },
    {
      id: "alert-002",
      patientId: "P-234567",
      patientName: "Jane Smith",
      room: "102",
      type: "warning",
      message: "Insulin drip level below 50% (45%)",
      time: "25 min ago",
      read: false,
    },
    {
      id: "alert-003",
      patientId: "P-456789",
      patientName: "Emily Davis",
      room: "104",
      type: "warning",
      message: "Insulin drip level below 50% (23%)",
      time: "45 min ago",
      read: true,
    },
    {
      id: "alert-004",
      patientId: "P-123456",
      patientName: "John Doe",
      room: "101",
      type: "info",
      message: "Scheduled check in 15 minutes",
      time: "1 hour ago",
      read: true,
    },
    {
      id: "alert-005",
      patientId: "P-345678",
      patientName: "Robert Johnson",
      room: "103",
      type: "info",
      message: "Drip replaced successfully",
      time: "2 hours ago",
      read: true,
    },
  ])

  const markAsRead = (alertId: string) => {
    setAlerts(alerts.map((alert) => (alert.id === alertId ? { ...alert, read: true } : alert)))
  }

  const markAllAsRead = () => {
    setAlerts(alerts.map((alert) => ({ ...alert, read: true })))
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-16 items-center px-4">
          <Link href="/staff/dashboard" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold">Alerts & Notifications</h1>
          <div className="ml-auto">
            <Button variant="primary" size="sm" onClick={() => router.push("/")}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>

          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onMarkAsRead={markAsRead} />
            ))}
          </TabsContent>

          <TabsContent value="unread" className="space-y-4">
            {alerts
              .filter((a) => !a.read)
              .map((alert) => (
                <AlertCard key={alert.id} alert={alert} onMarkAsRead={markAsRead} />
              ))}

            {alerts.filter((a) => !a.read).length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No unread notifications</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="critical" className="space-y-4">
            {alerts
              .filter((a) => a.type === "critical")
              .map((alert) => (
                <AlertCard key={alert.id} alert={alert} onMarkAsRead={markAsRead} />
              ))}

            {alerts.filter((a) => a.type === "critical").length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No critical notifications</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <StaffNavigation />
    </div>
  )
}

interface AlertCardProps {
  alert: Alert
  onMarkAsRead: (alertId: string) => void
}

function AlertCard({ alert, onMarkAsRead }: AlertCardProps) {
  return (
    <Card className={`${!alert.read ? "bg-blue-50 border-blue-200" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center ${
              alert.type === "critical" ? "bg-red-100" : alert.type === "warning" ? "bg-amber-100" : "bg-blue-100"
            }`}
          >
            <Droplet
              className={`h-5 w-5 ${
                alert.type === "critical"
                  ? "text-red-500"
                  : alert.type === "warning"
                    ? "text-amber-500"
                    : "text-blue-500"
              }`}
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{alert.patientName}</h3>
                <Badge
                  variant={
                    alert.type === "critical" ? "destructive" : alert.type === "warning" ? "outline" : "secondary"
                  }
                >
                  {alert.type === "critical" ? "Critical" : alert.type === "warning" ? "Warning" : "Info"}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{alert.time}</span>
              </div>
            </div>

            <p className="text-sm mb-2">{alert.message}</p>

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Room {alert.room} • Patient ID: {alert.patientId}
              </div>

              <div className="flex gap-2">
                {!alert.read && (
                  <Button variant="ghost" size="sm" onClick={() => onMarkAsRead(alert.id)}>
                    Mark as read
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/staff/patient/${alert.patientId}`}>View Patient</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
