export interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  status: string
  createdAt: string
  updatedAt: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface SessionInfo {
  id: string
  userId: string
  expiresAt: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  current: boolean
}
