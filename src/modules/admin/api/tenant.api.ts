import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type { Tenant, TenantInput } from '../types/tenant'

export const tenantApi = {
  async getTenants(): Promise<Tenant[]> {
    const res = await apiClient.get<ApiResponse<Tenant[]>>('/tenants')
    return res.data.data
  },

  async getTenant(id: string): Promise<Tenant> {
    const res = await apiClient.get<ApiResponse<Tenant>>(`/tenants/${id}`)
    return res.data.data
  },

  async createTenant(input: TenantInput): Promise<Tenant> {
    const res = await apiClient.post<ApiResponse<Tenant>>('/tenants', input)
    return res.data.data
  },

  // UpdateTenantDto backend hanya menerima name & status (kode tenant immutable).
  async updateTenant(id: string, input: TenantInput): Promise<Tenant> {
    const res = await apiClient.put<ApiResponse<Tenant>>(`/tenants/${id}`, {
      name: input.name,
      status: input.status,
    })
    return res.data.data
  },
}
