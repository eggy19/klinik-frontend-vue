import { apiClient } from '@/api/client'
import type { ApiResponse, PaginationMeta } from '@/api/types'
import type { StockSummaryQuery, StockSummaryRow } from '../types/stock'

interface ApiPaginatedResponse<T> extends ApiResponse<T> {
  pagination: PaginationMeta
}

interface ApiStockSummaryRow {
  itemId: string
  itemCode: string
  itemName: string
  unitName: string | null
  totalQuantity: number | string
  batchCount: number | string
  nearestExpiry: string | null
  minimumStock: number | string
  belowMinimum: boolean
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  return Number(value)
}

function fromApi(raw: ApiStockSummaryRow): StockSummaryRow {
  return {
    itemId: raw.itemId,
    itemCode: raw.itemCode,
    itemName: raw.itemName,
    unitName: raw.unitName ?? null,
    totalQuantity: toNumber(raw.totalQuantity),
    batchCount: toNumber(raw.batchCount),
    nearestExpiry: raw.nearestExpiry,
    minimumStock: toNumber(raw.minimumStock),
    belowMinimum: raw.belowMinimum,
  }
}

function toQueryParams(query: StockSummaryQuery) {
  return {
    page: query.page,
    limit: query.limit,
    search: query.search || undefined,
    low_stock: query.lowStock || undefined,
  }
}

export const stockApi = {
  async getSummary(
    query: StockSummaryQuery = {},
  ): Promise<{ items: StockSummaryRow[]; pagination: PaginationMeta }> {
    const res = await apiClient.get<ApiPaginatedResponse<ApiStockSummaryRow[]>>(
      '/inventory/inventory/stock-summary',
      { params: toQueryParams(query) },
    )
    return { items: res.data.data.map(fromApi), pagination: res.data.pagination }
  },
}
