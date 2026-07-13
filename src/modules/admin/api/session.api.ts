import { apiClient } from '@/api/client'
import type { ApiResponse, PaginatedData } from '@/api/types'
import type { AdminSession } from '../types/session'

export interface SessionQuery {
  page?: number
  limit?: number
  userId?: string
  activeOnly?: boolean
}

export const sessionApi = {
  async getSessions(query: SessionQuery = {}): Promise<PaginatedData<AdminSession>> {
    const res = await apiClient.get<ApiResponse<PaginatedData<AdminSession>>>('/admin/sessions', {
      params: {
        page: query.page,
        limit: query.limit,
        userId: query.userId || undefined,
        activeOnly: query.activeOnly === undefined ? undefined : String(query.activeOnly),
      },
    })
    return res.data.data
  },

  async revokeSession(id: string): Promise<void> {
    await apiClient.delete(`/admin/sessions/${id}`)
  },
}
