/** Sesi aktif dari GET /admin/sessions — diperkaya nama/email pemilik sesi. */
export interface AdminSession {
  id: string
  userId: string
  userName: string | null
  userEmail: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  expiresAt: string
  current: boolean
}

export interface SessionFilters {
  userId: string | null
  activeOnly: boolean
}
