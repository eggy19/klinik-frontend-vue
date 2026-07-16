import { apiClient } from '@/api/client'
import type { ApiResponse, PaginationMeta } from '@/api/types'
import type {
  PurchaseOrder,
  PurchaseOrderInput,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  QueryPurchaseOrder,
} from '../types/purchase-order'

interface ApiPaginatedResponse<T> extends ApiResponse<T> {
  pagination: PaginationMeta
}

interface ApiPurchaseOrderItem {
  id: string
  itemId: string
  item?: { id: string; itemCode: string; itemName: string }
  unitId: string
  unit?: { id: string; unitCode: string; unitName: string }
  quantity: number | string
  unitPrice: number | string
  receivedQuantity: number | string
}

interface ApiPurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplier?: { id: string; supplierCode: string; supplierName: string }
  status: PurchaseOrderStatus
  totalAmount: number | string
  note: string | null
  submittedAt: string | null
  approvedAt: string | null
  cancelledAt: string | null
  createdAt: string
  items?: ApiPurchaseOrderItem[]
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  return Number(value)
}

function fromApiItem(raw: ApiPurchaseOrderItem): PurchaseOrderItem {
  return {
    id: raw.id,
    itemId: raw.item?.id ?? raw.itemId,
    itemCode: raw.item?.itemCode ?? '',
    itemName: raw.item?.itemName ?? '',
    unitId: raw.unit?.id ?? raw.unitId,
    unitCode: raw.unit?.unitCode ?? '',
    unitName: raw.unit?.unitName ?? '',
    quantity: toNumber(raw.quantity),
    unitPrice: toNumber(raw.unitPrice),
    receivedQuantity: toNumber(raw.receivedQuantity),
  }
}

function fromApi(raw: ApiPurchaseOrder): PurchaseOrder {
  return {
    id: raw.id,
    poNumber: raw.poNumber,
    supplierId: raw.supplier?.id ?? raw.supplierId,
    supplierName: raw.supplier?.supplierName ?? '',
    status: raw.status,
    totalAmount: toNumber(raw.totalAmount),
    note: raw.note ?? '',
    submittedAt: raw.submittedAt,
    approvedAt: raw.approvedAt,
    cancelledAt: raw.cancelledAt,
    createdAt: raw.createdAt,
    items: (raw.items ?? []).map(fromApiItem),
  }
}

function toCreatePayload(input: PurchaseOrderInput) {
  return {
    supplierId: input.supplierId,
    note: input.note || undefined,
    items: input.items.map((i) => ({
      itemId: i.itemId,
      unitId: i.unitId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
  }
}

export const purchaseOrderApi = {
  async getAll(
    query: QueryPurchaseOrder = {},
  ): Promise<{ items: PurchaseOrder[]; pagination: PaginationMeta }> {
    const res = await apiClient.get<ApiPaginatedResponse<ApiPurchaseOrder[]>>(
      '/inventory/purchase-orders',
      { params: query },
    )
    return { items: res.data.data.map(fromApi), pagination: res.data.pagination }
  },

  async getById(id: string): Promise<PurchaseOrder> {
    const res = await apiClient.get<ApiResponse<ApiPurchaseOrder>>(
      `/inventory/purchase-orders/${id}`,
    )
    return fromApi(res.data.data)
  },

  async create(input: PurchaseOrderInput): Promise<PurchaseOrder> {
    const res = await apiClient.post<ApiResponse<ApiPurchaseOrder>>(
      '/inventory/purchase-orders',
      toCreatePayload(input),
    )
    return fromApi(res.data.data)
  },

  async update(id: string, input: PurchaseOrderInput): Promise<PurchaseOrder> {
    const res = await apiClient.put<ApiResponse<ApiPurchaseOrder>>(
      `/inventory/purchase-orders/${id}`,
      toCreatePayload(input),
    )
    return fromApi(res.data.data)
  },

  async submit(id: string): Promise<PurchaseOrder> {
    const res = await apiClient.post<ApiResponse<ApiPurchaseOrder>>(
      `/inventory/purchase-orders/${id}/submit`,
    )
    return fromApi(res.data.data)
  },

  async approve(id: string): Promise<PurchaseOrder> {
    const res = await apiClient.post<ApiResponse<ApiPurchaseOrder>>(
      `/inventory/purchase-orders/${id}/approve`,
    )
    return fromApi(res.data.data)
  },

  async cancel(id: string): Promise<PurchaseOrder> {
    const res = await apiClient.post<ApiResponse<ApiPurchaseOrder>>(
      `/inventory/purchase-orders/${id}/cancel`,
    )
    return fromApi(res.data.data)
  },
}
