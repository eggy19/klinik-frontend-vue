import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type { Item, ItemInput } from '../types/item'

// Shape dari backend — GET detail memakai nested objects, POST/PUT memakai IDs.
interface ApiItemNested {
  id?: string
  itemTypeId?: string
  categoryId?: string
  defaultUnitId?: string
  itemType?: { id: string }
  category?: { id: string }
  defaultUnit?: { id: string }
}

type ApiItem = Omit<Item, 'itemTypeId' | 'categoryId' | 'defaultUnitId' | 'id'> & ApiItemNested

function fromApi(raw: ApiItem): Item {
  return {
    id: raw.id ?? '',
    itemCode: raw.itemCode,
    itemName: raw.itemName,
    itemTypeId: raw.itemType?.id ?? raw.itemTypeId ?? '',
    categoryId: raw.category?.id ?? raw.categoryId ?? '',
    defaultUnitId: raw.defaultUnit?.id ?? raw.defaultUnitId ?? '',
    barcode: raw.barcode ?? '',
    manufacturer: raw.manufacturer ?? '',
    minimumStock: raw.minimumStock ?? 0,
    maximumStock: raw.maximumStock ?? 0,
    reorderPoint: raw.reorderPoint ?? 0,
    trackBatch: raw.trackBatch ?? false,
    trackExpiry: raw.trackExpiry ?? false,
    prescriptionRequired: raw.prescriptionRequired ?? false,
    isActive: raw.isActive ?? true,
    suppliers: raw.suppliers ?? [],
    prices: raw.prices ?? [],
    conversions: raw.conversions ?? [],
  }
}

export const itemApi = {
  async getAll(): Promise<Item[]> {
    const res = await apiClient.get<ApiResponse<ApiItem[]>>('/inventory/master/items')
    return res.data.data.map(fromApi)
  },

  async getById(id: string): Promise<Item> {
    const res = await apiClient.get<ApiResponse<ApiItem>>(`/inventory/master/items/${id}`)
    return fromApi(res.data.data)
  },

  async create(input: ItemInput): Promise<Item> {
    const res = await apiClient.post<ApiResponse<ApiItem>>('/inventory/master/items', input)
    return fromApi(res.data.data)
  },

  async update(id: string, input: ItemInput): Promise<Item> {
    const res = await apiClient.put<ApiResponse<ApiItem>>(`/inventory/master/items/${id}`, input)
    return fromApi(res.data.data)
  },

  async activate(id: string): Promise<void> {
    await apiClient.patch(`/inventory/master/items/${id}/activate`)
  },

  async deactivate(id: string): Promise<void> {
    await apiClient.patch(`/inventory/master/items/${id}/deactivate`)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/inventory/master/items/${id}`)
  },
}
