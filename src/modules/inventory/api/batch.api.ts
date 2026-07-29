import { apiClient } from '@/api/client'
import type { ApiResponse, PaginationMeta } from '@/api/types'
import type { BatchStats, InventoryBatch, QueryBatch } from '../types/batch'

interface ApiPaginatedResponse<T> extends ApiResponse<T> {
  pagination: PaginationMeta
}

interface ApiSupplier {
  id: string
  supplierName: string
}

interface ApiPurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplier?: ApiSupplier
}

interface ApiGoodsReceipt {
  id: string
  receiptNumber: string
  receivedAt: string
  purchaseOrderId: string
  purchaseOrder?: ApiPurchaseOrder
}

interface ApiGoodsReceiptItem {
  id: string
  goodsReceiptId: string
  goodsReceipt?: ApiGoodsReceipt
}

interface ApiUnit {
  id: string
  unitCode: string
  unitName: string
}

interface ApiItem {
  id: string
  itemCode: string
  itemName: string
  baseUnit?: ApiUnit
}

interface ApiInventoryBatch {
  id: string
  itemId: string
  item?: ApiItem
  batchNumber: string
  expiredDate: string | null
  quantity: number | string
  unitCost: number | string
  goodsReceiptItemId: string | null
  goodsReceiptItem?: ApiGoodsReceiptItem
  createdAt: string
}

interface ApiBatchStats {
  totalBatch: number
  activeBatch: number
  emptyBatch: number
  expiringSoon: number
  expiredBatch: number
  totalQuantity: number | string
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  return Number(value)
}

function fromApi(raw: ApiInventoryBatch): InventoryBatch {
  const goodsReceipt = raw.goodsReceiptItem?.goodsReceipt
  const purchaseOrder = goodsReceipt?.purchaseOrder

  return {
    id: raw.id,
    itemId: raw.item?.id ?? raw.itemId,
    itemCode: raw.item?.itemCode ?? '',
    itemName: raw.item?.itemName ?? '',
    unitCode: raw.item?.baseUnit?.unitCode ?? '',
    unitName: raw.item?.baseUnit?.unitName ?? '',
    batchNumber: raw.batchNumber,
    expiredDate: raw.expiredDate,
    quantity: toNumber(raw.quantity),
    unitCost: toNumber(raw.unitCost),
    supplierId: purchaseOrder?.supplier?.id ?? purchaseOrder?.supplierId ?? '',
    supplierName: purchaseOrder?.supplier?.supplierName ?? '',
    goodsReceiptId: goodsReceipt?.id ?? '',
    goodsReceiptNumber: goodsReceipt?.receiptNumber ?? '',
    receivedDate: goodsReceipt?.receivedAt ?? null,
    purchaseOrderId: purchaseOrder?.id ?? '',
    poNumber: purchaseOrder?.poNumber ?? '',
    createdAt: raw.createdAt,
  }
}

function toQueryParams(query: QueryBatch) {
  return {
    page: query.page,
    limit: query.limit,
    search: query.search || undefined,
    item_id: query.itemId || undefined,
    supplier_id: query.supplierId || undefined,
    expiry_status: query.expiryStatus || undefined,
    stock_status: query.stockStatus || undefined,
    expiry_threshold_days: query.expiryThresholdDays,
  }
}

export const batchApi = {
  async getAll(
    query: QueryBatch = {},
  ): Promise<{ items: InventoryBatch[]; pagination: PaginationMeta }> {
    const res = await apiClient.get<ApiPaginatedResponse<ApiInventoryBatch[]>>(
      '/inventory/inventory/batches',
      { params: toQueryParams(query) },
    )
    return { items: res.data.data.map(fromApi), pagination: res.data.pagination }
  },

  async getStats(expiryThresholdDays?: number): Promise<BatchStats> {
    const res = await apiClient.get<ApiResponse<ApiBatchStats>>(
      '/inventory/inventory/batches/stats',
      { params: { expiry_threshold_days: expiryThresholdDays } },
    )
    return {
      totalBatch: res.data.data.totalBatch,
      activeBatch: res.data.data.activeBatch,
      emptyBatch: res.data.data.emptyBatch,
      expiringSoon: res.data.data.expiringSoon,
      expiredBatch: res.data.data.expiredBatch,
      totalQuantity: toNumber(res.data.data.totalQuantity),
    }
  },

  async getById(id: string): Promise<InventoryBatch> {
    const res = await apiClient.get<ApiResponse<ApiInventoryBatch>>(
      `/inventory/inventory/batches/${id}`,
    )
    return fromApi(res.data.data)
  },
}
