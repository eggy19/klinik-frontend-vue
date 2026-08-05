import { apiClient } from '@/api/client'
import type { ApiResponse, PaginationMeta } from '@/api/types'
import type {
  CreateStockOpnameInput,
  StockOpname,
  StockOpnameItem,
  StockOpnameQuery,
  StockOpnameStatus,
} from '../types/stock-opname'

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
  expiredDate: string | null
}

interface ApiStockOpnameItem {
  id: string
  itemId: string
  item?: ApiItem
  batchId: string
  batch?: ApiBatch
  systemQuantity: number | string
  physicalQuantity: number | string
  difference: number | string
}

interface ApiStockOpname {
  id: string
  opnameNumber: string
  status: StockOpnameStatus
  note: string | null
  createdAt: string
  finalizedAt: string | null
  items?: ApiStockOpnameItem[]
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  return Number(value)
}

function fromApiItem(raw: ApiStockOpnameItem): StockOpnameItem {
  return {
    id: raw.id,
    itemId: raw.item?.id ?? raw.itemId,
    itemName: raw.item?.itemName ?? '',
    itemCode: raw.item?.itemCode ?? '',
    batchId: raw.batch?.id ?? raw.batchId,
    batchNumber: raw.batch?.batchNumber ?? '',
    expiredDate: raw.batch?.expiredDate ?? null,
    systemQuantity: toNumber(raw.systemQuantity),
    physicalQuantity: toNumber(raw.physicalQuantity),
    difference: toNumber(raw.difference),
  }
}

function fromApi(raw: ApiStockOpname): StockOpname {
  return {
    id: raw.id,
    opnameNumber: raw.opnameNumber,
    status: raw.status,
    note: raw.note,
    createdAt: raw.createdAt,
    finalizedAt: raw.finalizedAt,
    items: raw.items?.map(fromApiItem),
  }
}

function toQueryParams(query: StockOpnameQuery) {
  return {
    page: query.page,
    limit: query.limit,
    search: query.search || undefined,
    status: query.status || undefined,
  }
}

function toCreatePayload(input: CreateStockOpnameInput) {
  return {
    opname_number: input.opnameNumber,
    note: input.note || undefined,
    items: input.items.map((i) => ({
      item_id: i.itemId,
      batch_id: i.batchId,
      physical_quantity: i.physicalQuantity,
    })),
  }
}

export const stockOpnameApi = {
  async getAll(
    query: StockOpnameQuery = {},
  ): Promise<{ items: StockOpname[]; pagination: PaginationMeta }> {
    const res = await apiClient.get<ApiPaginatedResponse<ApiStockOpname[]>>(
      '/inventory/stock-opname',
      { params: toQueryParams(query) },
    )
    return { items: res.data.data.map(fromApi), pagination: res.data.pagination }
  },

  async getById(id: string): Promise<StockOpname> {
    const res = await apiClient.get<ApiResponse<ApiStockOpname>>(`/inventory/stock-opname/${id}`)
    return fromApi(res.data.data)
  },

  async create(input: CreateStockOpnameInput): Promise<StockOpname> {
    const res = await apiClient.post<ApiResponse<ApiStockOpname>>(
      '/inventory/stock-opname',
      toCreatePayload(input),
    )
    return fromApi(res.data.data)
  },

  async finalize(id: string): Promise<StockOpname> {
    const res = await apiClient.post<ApiResponse<ApiStockOpname>>(
      `/inventory/stock-opname/${id}/finalize`,
    )
    return fromApi(res.data.data)
  },
}
