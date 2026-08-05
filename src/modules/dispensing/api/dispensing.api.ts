import { apiClient } from '@/api/client'
import type { ApiResponse, PaginationMeta } from '@/api/types'
import type {
  BatchAllocationRow,
  CreateDispensingInput,
  Dispensing,
  DispensingItem,
  DispensingQuery,
} from '../types/dispensing'

interface ApiPaginatedResponse<T> extends ApiResponse<T> {
  pagination: PaginationMeta
}

interface ApiItem {
  id: string
  itemCode: string
  itemName: string
}

interface ApiUnit {
  id: string
  name: string
}

interface ApiBatchAllocation {
  batchId: string
  batchNumber: string
  quantity: number | string
  unitCost: number | string
}

interface ApiDispensingItem {
  id: string
  itemId: string
  item?: ApiItem
  unitId: string | null
  unit?: ApiUnit | null
  inputQuantity: number | string | null
  quantity: number | string
  unitPrice: number | string | null
  subtotal: number | string | null
  batchAllocation: ApiBatchAllocation[] | null
}

interface ApiDispensing {
  id: string
  dispensingNumber: string
  prescriptionId: string | null
  patientId: string | null
  note: string | null
  createdAt: string
  items?: ApiDispensingItem[]
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  return Number(value)
}

// null di sini punya arti bisnis (belum ada harga/satuan diinput) — beda dengan toNumber().
function toNullableNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  return Number(value)
}

function fromApiAllocation(raw: ApiBatchAllocation): BatchAllocationRow {
  return {
    batchId: raw.batchId,
    batchNumber: raw.batchNumber,
    quantity: toNumber(raw.quantity),
    unitCost: toNumber(raw.unitCost),
  }
}

function fromApiItem(raw: ApiDispensingItem): DispensingItem {
  return {
    id: raw.id,
    itemId: raw.item?.id ?? raw.itemId,
    itemName: raw.item?.itemName ?? '',
    itemCode: raw.item?.itemCode ?? '',
    unitId: raw.unit?.id ?? raw.unitId ?? null,
    unitName: raw.unit?.name ?? null,
    inputQuantity: toNullableNumber(raw.inputQuantity),
    quantity: toNumber(raw.quantity),
    unitPrice: toNullableNumber(raw.unitPrice),
    subtotal: toNullableNumber(raw.subtotal),
    batchAllocation: (raw.batchAllocation ?? []).map(fromApiAllocation),
  }
}

function fromApi(raw: ApiDispensing): Dispensing {
  return {
    id: raw.id,
    dispensingNumber: raw.dispensingNumber,
    prescriptionId: raw.prescriptionId,
    patientId: raw.patientId,
    note: raw.note,
    createdAt: raw.createdAt,
    items: raw.items?.map(fromApiItem),
  }
}

function toQueryParams(query: DispensingQuery) {
  return {
    page: query.page,
    limit: query.limit,
    search: query.search || undefined,
  }
}

function toCreatePayload(input: CreateDispensingInput) {
  return {
    dispensing_number: input.dispensingNumber,
    note: input.note || undefined,
    items: input.items.map((i) => ({
      item_id: i.itemId,
      unit_id: i.unitId || undefined,
      quantity: i.quantity,
    })),
  }
}

export const dispensingApi = {
  async getAll(
    query: DispensingQuery = {},
  ): Promise<{ items: Dispensing[]; pagination: PaginationMeta }> {
    const res = await apiClient.get<ApiPaginatedResponse<ApiDispensing[]>>(
      '/inventory/dispensing',
      {
        params: toQueryParams(query),
      },
    )
    return { items: res.data.data.map(fromApi), pagination: res.data.pagination }
  },

  async getById(id: string): Promise<Dispensing> {
    const res = await apiClient.get<ApiResponse<ApiDispensing>>(`/inventory/dispensing/${id}`)
    return fromApi(res.data.data)
  },

  async create(input: CreateDispensingInput): Promise<Dispensing> {
    const res = await apiClient.post<ApiResponse<ApiDispensing>>(
      '/inventory/dispensing',
      toCreatePayload(input),
    )
    return fromApi(res.data.data)
  },
}
