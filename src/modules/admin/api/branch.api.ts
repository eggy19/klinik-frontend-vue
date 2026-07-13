import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type { Branch, BranchInput } from '../types/branch'

export const branchApi = {
  async getBranches(tenantId?: string): Promise<Branch[]> {
    const res = await apiClient.get<ApiResponse<Branch[]>>('/branches', {
      params: tenantId ? { tenantId } : undefined,
    })
    return res.data.data
  },

  async getBranch(id: string): Promise<Branch> {
    const res = await apiClient.get<ApiResponse<Branch>>(`/branches/${id}`)
    return res.data.data
  },

  async createBranch(input: BranchInput): Promise<Branch> {
    const res = await apiClient.post<ApiResponse<Branch>>('/branches', input)
    return res.data.data
  },

  // UpdateBranchDto backend hanya menerima name & status (tenant/kode immutable).
  async updateBranch(id: string, input: BranchInput): Promise<Branch> {
    const res = await apiClient.put<ApiResponse<Branch>>(`/branches/${id}`, {
      name: input.name,
      status: input.status,
    })
    return res.data.data
  },
}
