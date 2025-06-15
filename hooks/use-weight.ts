"use client"

import { useState, useEffect } from "react"
import weightService from "../services/weight-service"

interface WeightData {
  weight: number | null
  timestamp: string | null
  error: string | null
  isLoading: boolean
}

export const useWeight = (): WeightData => {
  const [weight, setWeight] = useState<number | null>(null)
  const [timestamp, setTimestamp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("Setting up weight service listener")

    const unsubscribe = weightService.addListener((data) => {
      console.log("Weight data received:", data)
      setIsLoading(false)

      if (data.error) {
        console.error("Weight error:", data.error)
        setError(data.error)
        setWeight(null)
      } else {
        setWeight(data.weight)
        setTimestamp(data.timestamp)
        setError(null)
      }
    })

    // Initial fetch
    weightService.fetchWeight()

    return unsubscribe
  }, [])

  return {
    weight,
    timestamp,
    error,
    isLoading,
  }
}
