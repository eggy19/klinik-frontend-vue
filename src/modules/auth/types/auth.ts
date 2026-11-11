/** Konteks tenant/cabang aktif (spec prasyarat-kasir §8.6). */
export interface AuthContext {
  tenantId: string
  tenantName: string
  tenantCode: string
  branchId: string
  branchName: string
  branchCode: string
  status: 'active' | 'tenant_inactive' | 'branch_inactive'
}

export interface AuthBranch {
  branchId: string
  branchName: string
  isPrimary: boolean
}

/** Response `/auth/me` dan `/auth/login` (spec prasyarat-kasir §8.6). */
export interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  status: string
  branchIds?: string[]
  createdAt: string
  updatedAt: string
  /** null bila user belum punya assignment cabang. */
  context: AuthContext | null
  roles: string[]
  /** Semua permission efektif (semua service, termasuk identity.*). */
  permissions: string[]
  branches: AuthBranch[]
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
