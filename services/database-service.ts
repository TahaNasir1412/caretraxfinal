interface PatientData {
  id: string
  name: string
  room: string
  admissionDate: string
  remainingPercentage: number
  lastChecked: string
  status: string
}

interface TreatmentRecord {
  id: string
  patientId: string
  type: string
  timestamp: string
  weight: number
  status: string
  administeredBy?: string
}

interface BillingRecord {
  id: string
  patientId: string
  date: string
  amount: string
  description: string
  status: string
}

interface DripRecord {
  id: string
  patientId: string
  itemId: string
  startTime: string
  endTime: string
  flowRate: number
  totalVolume: number
  status: string
}

class DatabaseService {
  private baseUrl = "http://localhost:8000/api" // Update with your server URL

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem("authToken")

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Patient Data Management
  async savePatientData(data: PatientData): Promise<void> {
    await this.makeRequest("/patients", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getPatientData(patientId: string): Promise<PatientData> {
    return this.makeRequest(`/patients/${patientId}`)
  }

  async updatePatientData(patientId: string, data: Partial<PatientData>): Promise<void> {
    await this.makeRequest(`/patients/${patientId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // Treatment Records
  async saveTreatmentRecord(data: TreatmentRecord): Promise<void> {
    await this.makeRequest("/treatments", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getTreatmentHistory(patientId: string): Promise<TreatmentRecord[]> {
    return this.makeRequest(`/treatments/patient/${patientId}`)
  }

  // Weight Data
  async saveWeightData(data: { weight: number; timestamp: string; patientId?: string }): Promise<void> {
    await this.makeRequest("/weight-data", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getLatestWeightData(): Promise<{ weight: number; timestamp: string }> {
    return this.makeRequest("/weight-data/latest")
  }

  // Billing Records
  async saveBillingRecord(data: BillingRecord): Promise<void> {
    await this.makeRequest("/billing", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getBillingHistory(patientId: string): Promise<BillingRecord[]> {
    return this.makeRequest(`/billing/patient/${patientId}`)
  }

  // Emergency Override Logging
  async logEmergencyOverride(data: {
    patientId: string
    staffId?: string
    timestamp: string
    reason: string
  }): Promise<void> {
    await this.makeRequest("/emergency-overrides", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Alert Management
  async saveAlert(data: {
    patientId: string
    type: string
    message: string
    timestamp: string
    read: boolean
  }): Promise<void> {
    await this.makeRequest("/alerts", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getAlerts(staffId?: string): Promise<any[]> {
    const endpoint = staffId ? `/alerts/staff/${staffId}` : "/alerts"
    return this.makeRequest(endpoint)
  }

  async markAlertAsRead(alertId: string): Promise<void> {
    await this.makeRequest(`/alerts/${alertId}/read`, {
      method: "PUT",
    })
  }

  // Drip Records
  async saveDripRecord(data: DripRecord): Promise<void> {
    await this.makeRequest("/drip-records", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getDripRecords(patientId: string): Promise<DripRecord[]> {
    return this.makeRequest(`/drip-records/patient/${patientId}`)
  }

  // Patient Status Updates
  async updatePatientStatus(patientId: string, status: string): Promise<void> {
    await this.makeRequest(`/patients/${patientId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    })
  }

  // Drip Replacement Logging
  async logDripReplacement(data: {
    patientId: string
    itemId: string
    timestamp: string
    reason: string
    staffId?: string
  }): Promise<void> {
    await this.makeRequest("/drip-replacements", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Real-time Data Synchronization (Example using WebSocket - adapt as needed)
  // Note: This is a simplified example and would require a WebSocket server setup.
  private ws: WebSocket | null = null

  connectWebSocket() {
    this.ws = new WebSocket("ws://localhost:8000/ws") // Replace with your WebSocket server URL

    this.ws.onopen = () => {
      console.log("WebSocket connected")
    }

    this.ws.onmessage = (event) => {
      // Handle incoming messages (e.g., update UI based on data)
      console.log("WebSocket message received:", event.data)
    }

    this.ws.onclose = () => {
      console.log("WebSocket disconnected")
      // Attempt to reconnect after a delay
      setTimeout(() => this.connectWebSocket(), 3000)
    }

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }
  }

  sendMessage(message: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message)
    } else {
      console.log("WebSocket not connected")
    }
  }
}

export const databaseService = new DatabaseService()
