import { apiClient } from '@/api/client'
import type { ApiResponse, PaginationMeta } from '@/api/types'
import type { StockMovement, StockMovementQuery, StockMovementType } from '../types/stock-movement'

interface ApiPaginatedResponse<T> extends ApiResponse<T> {
  pagination: PaginationMeta
}

interface ApiItem {
  id: string
  itemCode: string
  itemName: string
}

interface ApiBatch {
  id: string
  batchNumber: string
}

interface ApiStockMovement {
  id: string
  itemId: string
  item?: ApiItem
  batchId: string | null
  batch?: ApiBatch | null
  type: StockMovementType
  quantity: number | string
  referenceType: string | null
  referenceId: string | null
  note: string | null
  createdAt: string
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  return Number(value)
}

function fromApi(raw: ApiStockMovement): StockMovement {
  return {
    id: raw.id,
    type: raw.type,
    quantity: toNumber(raw.quantity),
    referenceType: raw.referenceType,
    referenceId: raw.referenceId,
    note: raw.note,
    createdAt: raw.createdAt,
    itemId: raw.item?.id ?? raw.itemId,
    itemName: raw.item?.itemName ?? '',
    itemCode: raw.item?.itemCode ?? '',
    batchId: raw.batch?.id ?? raw.batchId,
    batchNumber: raw.batch?.batchNumber ?? null,
  }
}

function toQueryParams(query: StockMovementQuery) {
  return {
    page: query.page,
    limit: query.limit,
    search: query.search || undefined,
    item_id: query.itemId || undefined,
    batch_id: query.batchId || undefined,
    type: query.type || undefined,
    reference_type: query.referenceType || undefined,
    date_from: query.dateFrom || undefined,
    date_to: query.dateTo || undefined,
  }
}

export const stockMovementApi = {
  async getAll(
    query: StockMovementQuery = {},
  ): Promise<{ items: StockMovement[]; pagination: PaginationMeta }> {
    const res = await apiClient.get<ApiPaginatedResponse<ApiStockMovement[]>>(
      '/inventory/inventory/movements',
      { params: toQueryParams(query) },
    )
    return { items: res.data.data.map(fromApi), pagination: res.data.pagination }
  },
}
