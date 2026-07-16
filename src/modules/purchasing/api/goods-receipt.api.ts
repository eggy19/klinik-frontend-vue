import { apiClient } from '@/api/client'
import type { ApiResponse, PaginationMeta } from '@/api/types'
import type { GoodsReceipt, GoodsReceiptItem, QueryGoodsReceipt, ReceiveGoodsInput } from '../types/goods-receipt'

interface ApiPaginatedResponse<T> extends ApiResponse<T> {
  pagination: PaginationMeta
}

interface ApiGoodsReceiptItem {
  id: string
  purchaseOrderItemId: string
  itemId: string
  item?: { id: string; itemCode: string; itemName: string }
  unitId: string
  unit?: { id: string; unitCode: string; unitName: string }
  batchNumber: string
  expiredDate: string | null
  quantity: number | string
  unitCost: number | string
}

interface ApiGoodsReceipt {
  id: string
  purchaseOrderId: string
  purchaseOrder?: {
    id: string
    poNumber: string
    supplier?: { id: string; supplierName: string }
  }
  receiptNumber: string
  receivedAt: string
  note: string | null
  items?: ApiGoodsReceiptItem[]
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  return Number(value)
}

function fromApiItem(raw: ApiGoodsReceiptItem): GoodsReceiptItem {
  return {
    id: raw.id,
    purchaseOrderItemId: raw.purchaseOrderItemId,
    itemId: raw.item?.id ?? raw.itemId,
    itemCode: raw.item?.itemCode ?? '',
    itemName: raw.item?.itemName ?? '',
    unitId: raw.unit?.id ?? raw.unitId,
    unitCode: raw.unit?.unitCode ?? '',
    unitName: raw.unit?.unitName ?? '',
    batchNumber: raw.batchNumber,
    expiredDate: raw.expiredDate,
    quantity: toNumber(raw.quantity),
    unitCost: toNumber(raw.unitCost),
  }
}

function fromApi(raw: ApiGoodsReceipt): GoodsReceipt {
  return {
    id: raw.id,
    purchaseOrderId: raw.purchaseOrder?.id ?? raw.purchaseOrderId,
    poNumber: raw.purchaseOrder?.poNumber ?? '',
    supplierName: raw.purchaseOrder?.supplier?.supplierName ?? '',
    receiptNumber: raw.receiptNumber,
    receivedAt: raw.receivedAt,
    note: raw.note ?? '',
    items: (raw.items ?? []).map(fromApiItem),
  }
}

function toReceivePayload(input: ReceiveGoodsInput) {
  return {
    note: input.note || undefined,
    items: input.items.map((i) => ({
      purchaseOrderItemId: i.purchaseOrderItemId,
      unitId: i.unitId,
      quantity: i.quantity,
      unitCost: i.unitCost,
      batchNumber: i.batchNumber,
      expiredDate: i.expiredDate || undefined,
    })),
  }
}

export const goodsReceiptApi = {
  async getAll(
    query: QueryGoodsReceipt = {},
  ): Promise<{ items: GoodsReceipt[]; pagination: PaginationMeta }> {
    const res = await apiClient.get<ApiPaginatedResponse<ApiGoodsReceipt[]>>(
      '/inventory/goods-receipts',
      { params: query },
    )
    return { items: res.data.data.map(fromApi), pagination: res.data.pagination }
  },

  async getById(id: string): Promise<GoodsReceipt> {
    const res = await apiClient.get<ApiResponse<ApiGoodsReceipt>>(
      `/inventory/goods-receipts/${id}`,
    )
    return fromApi(res.data.data)
  },

  async listForPurchaseOrder(poId: string): Promise<GoodsReceipt[]> {
    const res = await apiClient.get<ApiResponse<ApiGoodsReceipt[]>>(
      `/inventory/purchase-orders/${poId}/goods-receipts`,
    )
    return res.data.data.map(fromApi)
  },

  async receive(poId: string, input: ReceiveGoodsInput): Promise<GoodsReceipt> {
    const res = await apiClient.post<ApiResponse<ApiGoodsReceipt>>(
      `/inventory/purchase-orders/${poId}/goods-receipt`,
      toReceivePayload(input),
    )
    return fromApi(res.data.data)
  },
}
