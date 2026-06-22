import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type { Category, CategoryInput } from '../types/category'

interface ApiCategory {
  id: string
  itemTypeId: string
  categoryCode: string
  categoryName: string
  description: string
}

function fromApi(raw: ApiCategory): Category {
  return {
    id: raw.id,
    itemTypeId: raw.itemTypeId,
    code: raw.categoryCode,
    name: raw.categoryName,
    description: raw.description,
  }
}

function toApi(input: CategoryInput): Omit<ApiCategory, 'id'> {
  return {
    itemTypeId: input.itemTypeId,
    categoryCode: input.code,
    categoryName: input.name,
    description: input.description,
  }
}

export const categoryApi = {
  async getCategories(): Promise<Category[]> {
    const res = await apiClient.get<ApiResponse<ApiCategory[]>>('/master/categories')
    return res.data.data.map(fromApi)
  },

  async createCategory(input: CategoryInput): Promise<Category> {
    const res = await apiClient.post<ApiResponse<ApiCategory>>('/master/categories', toApi(input))
    return fromApi(res.data.data)
  },

  async updateCategory(id: string, input: CategoryInput): Promise<Category> {
    const res = await apiClient.put<ApiResponse<ApiCategory>>(`/master/categories/${id}`, toApi(input))
    return fromApi(res.data.data)
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/master/categories/${id}`)
  },
}
