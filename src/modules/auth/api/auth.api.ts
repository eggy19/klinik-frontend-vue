import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type { LoginPayload, SessionInfo, User } from '../types/auth'

// Backend lama belum mengirim field RBAC: anggap kosong (tanpa permission), bukan error.
function normalizeUser(raw: User): User {
  return {
    ...raw,
    context: raw.context ?? null,
    roles: raw.roles ?? [],
    permissions: raw.permissions ?? [],
    branches: raw.branches ?? [],
  }
}

export const authApi = {
  async login(payload: LoginPayload): Promise<User> {
    const res = await apiClient.post<ApiResponse<User>>('/auth/login', payload, {
      skipAuthRedirect: true,
    })
    return normalizeUser(res.data.data)
  },

  async me(): Promise<User> {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me', {
      skipAuthRedirect: true,
    })
    return normalizeUser(res.data.data)
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout', undefined, { skipAuthRedirect: true })
  },

  async getSession(): Promise<SessionInfo> {
    const res = await apiClient.get<ApiResponse<SessionInfo>>('/auth/session')
    return res.data.data
  },

  async listSessions(): Promise<SessionInfo[]> {
    const res = await apiClient.get<ApiResponse<SessionInfo[]>>('/sessions')
    return res.data.data
  },

  // Backend juga menyediakan DELETE /auth/session/:id (path alternatif, hasil sama).
  async revokeSession(id: string): Promise<void> {
    await apiClient.delete(`/sessions/${id}`)
  },
}
