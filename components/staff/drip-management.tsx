"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Droplet, Save, RefreshCw } from "lucide-react"

interface DripManagementProps {
  patientId: string
  currentWeight: number
  onDripReplaced: (newVolume: number) => void
  onStatusOverride: (status: string) => void
}

export default function DripManagement({
  patientId,
  currentWeight,
  onDripReplaced,
  onStatusOverride,
}: DripManagementProps) {
  const [selectedVolume, setSelectedVolume] = useState<number>(1000) // Default 1 litre
  const [isReplacing, setIsReplacing] = useState(false)

  // Calculate remaining percentage based on current weight and selected volume
  const remainingPercentage = Math.max(0, Math.min(100, (currentWeight / (selectedVolume / 1000)) * 100))

  const handleDripReplacement = async () => {
    setIsReplacing(true)

    try {
      // Log the drip replacement
      await fetch("/api/drip-replacement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          newVolume: selectedVolume,
          timestamp: new Date().toISOString(),
          replacedBy: "Current Staff", // In real app, get from auth
        }),
      })

      onDripReplaced(selectedVolume)
      onStatusOverride("completed")

      alert("Drip replaced successfully!")
    } catch (error) {
      console.error("Error replacing drip:", error)
      alert("Error replacing drip. Please try again.")
    } finally {
      setIsReplacing(false)
    }
  }

  const handleStatusOverride = (newStatus: string) => {
    onStatusOverride(newStatus)
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplet className="h-5 w-5 text-blue-500" />
          Drip Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="drip-volume">Drip Volume (ml)</Label>
            <Select value={selectedVolume.toString()} onValueChange={(value) => setSelectedVolume(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select volume" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="500">500ml (0.5L)</SelectItem>
                <SelectItem value="1000">1000ml (1L)</SelectItem>
                <SelectItem value="1500">1500ml (1.5L)</SelectItem>
                <SelectItem value="2000">2000ml (2L)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Current Status</Label>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={
                  remainingPercentage <= 10 ? "destructive" : remainingPercentage <= 50 ? "outline" : "secondary"
                }
              >
                {remainingPercentage <= 10 ? "Critical" : remainingPercentage <= 50 ? "Warning" : "Normal"}
              </Badge>
              <span className="text-sm text-muted-foreground">{remainingPercentage.toFixed(1)}ml remaining</span>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 p-3 rounded-md">
          <p className="text-sm">
            <strong>Current Weight:</strong> {currentWeight.toFixed(3)} ml
          </p>
          <p className="text-sm">
            <strong>Selected Volume:</strong> {selectedVolume}ml ({(selectedVolume / 1000).toFixed(1)}L)
          </p>
          <p className="text-sm">
            <strong>Calculated Remaining:</strong> {remainingPercentage.toFixed(1)}%
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleDripReplacement} disabled={isReplacing} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            {isReplacing ? "Replacing..." : "Replace Drip"}
          </Button>

          {remainingPercentage <= 10 && (
            <Button variant="outline" onClick={() => handleStatusOverride("completed")} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Mark as Completed
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
