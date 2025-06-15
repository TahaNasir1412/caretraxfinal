interface LoginData {
  email: string
  password: string
  userType: string
}

interface RegisterData {
  name: string
  email: string
  password: string
  phone: string
  address: string
  userType: string
  department?: string
  role?: string
  patientId?: string
  emergencyContact?: string
}

interface AuthResponse {
  success: boolean
  error?: string
  user?: any
  token?: string
}

interface User {
  id: string
  name: string
  email: string
  password: string
  userType: string
  phone: string
  address: string
  department?: string
  role?: string
  patientId?: string
  emergencyContact?: string
  createdAt: string
}

class AuthService {
  private users: User[] = []
  private isInitialized = false

  // Check if we're running in the browser
  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined"
  }

  private initializeDummyData() {
    if (!this.isBrowser() || this.isInitialized) return

    try {
      // Load existing users from localStorage
      const savedUsers = localStorage.getItem("caretrax_users")
      if (savedUsers) {
        this.users = JSON.parse(savedUsers)
      } else {
        // Create dummy accounts
        this.users = [
          {
            id: "staff_001",
            name: "Dr. Sarah Johnson",
            email: "sarah.johnson@caretrax.com",
            password: "staff123",
            userType: "staff",
            phone: "+92 300 1234567",
            address: "123 Medical Center, Lahore, Pakistan",
            department: "Endocrinology",
            role: "Head Nurse",
            createdAt: new Date().toISOString(),
          },
          {
            id: "patient_001",
            name: "Taha Nasir",
            email: "taha.nasir@patient.com",
            password: "patient123",
            userType: "patient",
            phone: "+92 301 9876543",
            address: "456 Patient Street, Karachi, Pakistan",
            patientId: "P-251758",
            emergencyContact: "+92 302 5555555",
            createdAt: new Date().toISOString(),
          },
        ]
        this.saveUsers()
      }
      this.isInitialized = true
    } catch (error) {
      console.error("Error initializing auth data:", error)
      this.users = []
    }
  }

  private saveUsers() {
    if (!this.isBrowser()) return

    try {
      localStorage.setItem("caretrax_users", JSON.stringify(this.users))
    } catch (error) {
      console.error("Error saving users:", error)
    }
  }

  private generatePatientId(): string {
    const timestamp = Date.now().toString().slice(-6)
    return `P-${timestamp}`
  }

  private generateUserId(userType: string): string {
    const timestamp = Date.now().toString().slice(-6)
    return `${userType}_${timestamp}`
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      // Initialize data if not already done
      this.initializeDummyData()

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      const user = this.users.find(
        (u) => u.email.toLowerCase() === data.email.toLowerCase() && u.userType === data.userType,
      )

      if (!user) {
        return { success: false, error: "User not found" }
      }

      if (user.password !== data.password) {
        return { success: false, error: "Invalid password" }
      }

      // Generate a simple token (in production, use proper JWT)
      const token = btoa(JSON.stringify({ userId: user.id, userType: user.userType, timestamp: Date.now() }))

      // Store authentication info (only in browser)
      if (this.isBrowser()) {
        localStorage.setItem("caretrax_token", token)
        localStorage.setItem("caretrax_user", JSON.stringify(user))
      }

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType,
        },
        token,
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Login failed" }
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Initialize data if not already done
      this.initializeDummyData()

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Check if user already exists
      const existingUser = this.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())
      if (existingUser) {
        return { success: false, error: "Email already registered" }
      }

      // Create new user
      const newUser: User = {
        id: this.generateUserId(data.userType),
        name: data.name,
        email: data.email.toLowerCase(),
        password: data.password,
        userType: data.userType,
        phone: data.phone,
        address: data.address,
        department: data.department,
        role: data.role,
        patientId: data.userType === "patient" ? data.patientId || this.generatePatientId() : undefined,
        emergencyContact: data.emergencyContact,
        createdAt: new Date().toISOString(),
      }

      this.users.push(newUser)
      this.saveUsers()

      return {
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          userType: newUser.userType,
        },
      }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, error: "Registration failed" }
    }
  }

  logout() {
    if (!this.isBrowser()) return

    try {
      localStorage.removeItem("caretrax_token")
      localStorage.removeItem("caretrax_user")
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null

    try {
      return localStorage.getItem("caretrax_token")
    } catch (error) {
      console.error("Error getting token:", error)
      return null
    }
  }

  getCurrentUser(): User | null {
    if (!this.isBrowser()) return null

    try {
      const userStr = localStorage.getItem("caretrax_user")
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error("Error getting current user:", error)
      return null
    }
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser()) return false

    const token = this.getToken()
    if (!token) return false

    try {
      const decoded = JSON.parse(atob(token))
      // Check if token is less than 24 hours old
      const tokenAge = Date.now() - decoded.timestamp
      return tokenAge < 24 * 60 * 60 * 1000 // 24 hours
    } catch {
      return false
    }
  }

  // Get all users (for admin purposes)
  getAllUsers(): User[] {
    this.initializeDummyData()
    return this.users.map((user) => ({
      ...user,
      password: "***", // Hide password
    }))
  }

  // Update user profile
  async updateProfile(userId: string, updates: Partial<User>): Promise<AuthResponse> {
    try {
      this.initializeDummyData()

      const userIndex = this.users.findIndex((u) => u.id === userId)
      if (userIndex === -1) {
        return { success: false, error: "User not found" }
      }

      this.users[userIndex] = { ...this.users[userIndex], ...updates }
      this.saveUsers()

      // Update stored user data
      const currentUser = this.getCurrentUser()
      if (currentUser && currentUser.id === userId && this.isBrowser()) {
        localStorage.setItem("caretrax_user", JSON.stringify(this.users[userIndex]))
      }

      return { success: true, user: this.users[userIndex] }
    } catch (error) {
      return { success: false, error: "Update failed" }
    }
  }
}

export const authService = new AuthService()
