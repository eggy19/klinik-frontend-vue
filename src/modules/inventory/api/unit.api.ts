import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type { Unit, UnitInput } from '../types/unit'

interface ApiUnit {
  id: string
  unitCode: string
  unitName: string
  description: string
}

function fromApi(raw: ApiUnit): Unit {
  return {
    id: raw.id,
    code: raw.unitCode,
    name: raw.unitName,
    description: raw.description,
  }
}

function toApi(input: UnitInput): Omit<ApiUnit, 'id'> {
  return {
    unitCode: input.code,
    unitName: input.name,
    description: input.description,
  }
}

export const unitApi = {
  async getUnits(): Promise<Unit[]> {
    const res = await apiClient.get<ApiResponse<ApiUnit[]>>('/inventory/master/units')
    return res.data.data.map(fromApi)
  },

  async createUnit(input: UnitInput): Promise<Unit> {
    const res = await apiClient.post<ApiResponse<ApiUnit>>('/inventory/master/units', toApi(input))
    return fromApi(res.data.data)
  },

  async updateUnit(id: string, input: UnitInput): Promise<Unit> {
    const res = await apiClient.put<ApiResponse<ApiUnit>>(`/inventory/master/units/${id}`, toApi(input))
    return fromApi(res.data.data)
  },

  async deleteUnit(id: string): Promise<void> {
    await apiClient.delete(`/inventory/master/units/${id}`)
  },
}
