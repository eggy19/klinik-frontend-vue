import type { EntityStatus } from './common'

/** Item list pengguna (GET /users) — sudah diperkaya nama tenant/cabang + status kunci. */
export interface AdminUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  status: EntityStatus
  tenantId: string | null
  tenantName: string | null
  primaryBranchId: string | null
  primaryBranchName: string | null
  isLocked: boolean
  blockUntil: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UserSecurityInfo {
  failedLoginCount: number
  blockUntil: string | null
  lockReason: string | null
  isLocked: boolean
  lastLoginAt: string | null
  lastLoginIp: string | null
  lastLoginDevice: string | null
  forceChangePassword: boolean
}

export interface UserBranchInfo {
  branchId: string
  branchName: string
  branchCode: string
  tenantId: string | null
  tenantName: string | null
  isPrimary: boolean
}

/** Detail pengguna (GET /users/:id). */
export interface AdminUserDetail {
  id: string
  name: string
  email: string
  emailVerified: boolean
  status: EntityStatus
  security: UserSecurityInfo | null
  branches: UserBranchInfo[]
  createdAt: string
  updatedAt: string
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  tenantId: string
  branchId: string
}

/** Backend hanya mengizinkan update nama (PUT /users/:id). */
export interface UpdateUserInput {
  name: string
}

export function emptyCreateUser(): CreateUserInput {
  return {
    name: '',
    email: '',
    password: '',
    tenantId: '',
    branchId: '',
  }
}
