import { getWeightUrl, SERVER_CONFIG } from "../config/server-config"

interface WeightData {
  weight: number
  timestamp: string
  error?: string
}

class WeightService {
  private listeners: ((data: WeightData) => void)[] = []
  private isPolling = false
  private pollInterval: NodeJS.Timeout | null = null
  private lastWeight: number | null = null

  addListener(callback: (data: WeightData) => void) {
    this.listeners.push(callback)

    if (this.listeners.length === 1 && !this.isPolling) {
      this.startPolling()
    }

    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback)
      if (this.listeners.length === 0) {
        this.stopPolling()
      }
    }
  }

  private startPolling() {
    if (this.isPolling) return

    this.isPolling = true
    this.fetchWeight()

    this.pollInterval = setInterval(() => {
      this.fetchWeight()
    }, SERVER_CONFIG.POLL_INTERVAL)
  }

  private stopPolling() {
    this.isPolling = false
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }

  // Make this method public so it can be called directly
  public async fetchWeight() {
    try {
      console.log("Fetching weight from:", getWeightUrl())
      const response = await fetch(getWeightUrl(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Weight data received:", data)
      const weight = Number.parseFloat(data.weight)

      // Always notify listeners to ensure updates
      this.lastWeight = weight
      this.notifyListeners({
        weight: weight,
        timestamp: data.timestamp,
      })
    } catch (error) {
      console.error("Error fetching weight:", error)
      this.notifyListeners({
        weight: 0,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  private notifyListeners(data: WeightData) {
    this.listeners.forEach((callback) => {
      try {
        callback(data)
      } catch (error) {
        console.error("Error in weight listener:", error)
      }
    })
  }

  async getCurrentWeight(): Promise<WeightData> {
    try {
      const response = await fetch(getWeightUrl())
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return {
        weight: Number.parseFloat(data.weight),
        timestamp: data.timestamp,
      }
    } catch (error) {
      console.error("Error getting current weight:", error)
      throw error
    }
  }
}

export default new WeightService()
