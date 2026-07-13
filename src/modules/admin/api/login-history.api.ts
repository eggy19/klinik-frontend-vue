import { apiClient } from '@/api/client'
import type { ApiResponse, PaginatedData } from '@/api/types'
import type { LoginHistoryEntry, LoginResult } from '../types/login-history'

export interface LoginHistoryQuery {
  page?: number
  limit?: number
  userId?: string
  tenantId?: string
  branchId?: string
  loginResult?: LoginResult
  /** ISO date (YYYY-MM-DD); dateTo bersifat inklusif sampai akhir hari. */
  dateFrom?: string
  dateTo?: string
}

export const loginHistoryApi = {
  async getHistory(query: LoginHistoryQuery = {}): Promise<PaginatedData<LoginHistoryEntry>> {
    const res = await apiClient.get<ApiResponse<PaginatedData<LoginHistoryEntry>>>(
      '/admin/login-history',
      {
        params: {
          page: query.page,
          limit: query.limit,
          userId: query.userId || undefined,
          tenantId: query.tenantId || undefined,
          branchId: query.branchId || undefined,
          loginResult: query.loginResult || undefined,
          dateFrom: query.dateFrom || undefined,
          dateTo: query.dateTo || undefined,
        },
      },
    )
    return res.data.data
  },
}
