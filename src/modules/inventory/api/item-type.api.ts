import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type { ItemType, ItemTypeInput } from '../types/item-type'

export const itemTypeApi = {
  async getAll(): Promise<ItemType[]> {
    const res = await apiClient.get<ApiResponse<ItemType[]>>('/inventory/master/item-types')
    return res.data.data
  },

  async create(input: ItemTypeInput): Promise<ItemType> {
    const res = await apiClient.post<ApiResponse<ItemType>>('/inventory/master/item-types', input)
    return res.data.data
  },

  async update(id: string, input: ItemTypeInput): Promise<ItemType> {
    const res = await apiClient.put<ApiResponse<ItemType>>(`/inventory/master/item-types/${id}`, input)
    return res.data.data
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/inventory/master/item-types/${id}`)
  },
}
