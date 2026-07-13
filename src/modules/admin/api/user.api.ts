import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type { EntityStatus } from '../types/common'
import type {
  AdminUser,
  AdminUserDetail,
  CreateUserInput,
  UpdateUserInput,
} from '../types/user'

export const userApi = {
  async getUsers(): Promise<AdminUser[]> {
    const res = await apiClient.get<ApiResponse<AdminUser[]>>('/users')
    return res.data.data
  },

  async getUser(id: string): Promise<AdminUserDetail> {
    const res = await apiClient.get<ApiResponse<AdminUserDetail>>(`/users/${id}`)
    return res.data.data
  },

  async createUser(input: CreateUserInput): Promise<void> {
    await apiClient.post('/users', input)
  },

  async updateUser(id: string, input: UpdateUserInput): Promise<void> {
    await apiClient.put(`/users/${id}`, input)
  },

  async updateStatus(id: string, status: EntityStatus): Promise<void> {
    await apiClient.patch(`/users/${id}/status`, { status })
  },

  async unlockUser(id: string): Promise<AdminUserDetail> {
    const res = await apiClient.post<ApiResponse<AdminUserDetail>>(`/users/${id}/unlock`)
    return res.data.data
  },
}
