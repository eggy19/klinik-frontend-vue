import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type { DrugGroup, DrugGroupInput } from '../types/drug-group'

interface ApiDrugGroup {
  id: string
  groupCode: string
  groupName: string
  description: string | null
  requiresPrescription: boolean
  isActive: boolean
}

function fromApi(raw: ApiDrugGroup): DrugGroup {
  return {
    id: raw.id,
    code: raw.groupCode,
    name: raw.groupName,
    description: raw.description ?? '',
    requiresPrescription: raw.requiresPrescription ?? false,
    isActive: raw.isActive ?? true,
  }
}

function toApi(input: DrugGroupInput): Omit<ApiDrugGroup, 'id'> {
  return {
    groupCode: input.code,
    groupName: input.name,
    description: input.description,
    requiresPrescription: input.requiresPrescription,
    isActive: input.isActive,
  }
}

export const drugGroupApi = {
  async getDrugGroups(): Promise<DrugGroup[]> {
    const res = await apiClient.get<ApiResponse<ApiDrugGroup[]>>('/inventory/master/drug-groups')
    return res.data.data.map(fromApi)
  },

  async createDrugGroup(input: DrugGroupInput): Promise<DrugGroup> {
    const res = await apiClient.post<ApiResponse<ApiDrugGroup>>(
      '/inventory/master/drug-groups',
      toApi(input),
    )
    return fromApi(res.data.data)
  },

  async updateDrugGroup(id: string, input: DrugGroupInput): Promise<DrugGroup> {
    const res = await apiClient.put<ApiResponse<ApiDrugGroup>>(
      `/inventory/master/drug-groups/${id}`,
      toApi(input),
    )
    return fromApi(res.data.data)
  },

  async deleteDrugGroup(id: string): Promise<void> {
    await apiClient.delete(`/inventory/master/drug-groups/${id}`)
  },
}
