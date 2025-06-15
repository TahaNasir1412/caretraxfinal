interface Patient {
  id: string
  name: string
  room: string
  remainingPercentage: number
  lastChecked: string
  status: string
  currentDripVolume: number
}

class PatientService {
  private baseUrl = "http://10.20.9.189:8000/api" // Update with your server URL

  async getPatients(): Promise<Patient[]> {
    try {
      const response = await fetch(`${this.baseUrl}/patients`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error("Error fetching patients:", error)
      return []
    }
  }

  async getPatient(patientId: string): Promise<Patient | null> {
    try {
      const response = await fetch(`${this.baseUrl}/patient/${patientId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error("Error fetching patient:", error)
      return null
    }
  }

  async replaceDrip(patientId: string, newVolume: number, replacedBy: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/drip-replacement`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          newVolume,
          replacedBy,
          timestamp: new Date().toISOString(),
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Error replacing drip:", error)
      return false
    }
  }

  async updatePatientStatus(patientId: string, status: string, updatedBy: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/patient-status-update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          status,
          updatedBy,
          timestamp: new Date().toISOString(),
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Error updating patient status:", error)
      return false
    }
  }
}

export const patientService = new PatientService()
