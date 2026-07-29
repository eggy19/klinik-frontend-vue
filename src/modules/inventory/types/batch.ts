import { daysUntil } from '@/utils/format'

export type ExpiryStatus = 'SAFE' | 'EXPIRING_SOON' | 'EXPIRED'

export const EXPIRY_STATUS_LABELS: Record<ExpiryStatus, string> = {
  SAFE: 'Aman',
  EXPIRING_SOON: 'Mendekati Kadaluarsa',
  EXPIRED: 'Kadaluarsa',
}

export type TagVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'

export const EXPIRY_STATUS_VARIANT: Record<ExpiryStatus, TagVariant> = {
  SAFE: 'success',
  EXPIRING_SOON: 'warning',
  EXPIRED: 'danger',
}

export type StockStatus = 'AVAILABLE' | 'EMPTY'

/** Default expiring-soon window in days — mirrors the backend's QueryBatchDto default. */
export const DEFAULT_EXPIRY_THRESHOLD_DAYS = 90

/** Batch expiry status is computed client-side from expiredDate, not persisted (business-flow doc section 12). */
export function computeExpiryStatus(
  expiredDate: string | null,
  thresholdDays = DEFAULT_EXPIRY_THRESHOLD_DAYS,
): ExpiryStatus {
  if (!expiredDate) return 'SAFE'
  const days = daysUntil(expiredDate)
  if (days < 0) return 'EXPIRED'
  if (days <= thresholdDays) return 'EXPIRING_SOON'
  return 'SAFE'
}

export interface InventoryBatch {
  id: string
  itemId: string
  itemCode: string
  itemName: string
  unitCode: string
  unitName: string
  batchNumber: string
  expiredDate: string | null
  quantity: number
  unitCost: number
  supplierId: string
  supplierName: string
  goodsReceiptId: string
  goodsReceiptNumber: string
  receivedDate: string | null
  purchaseOrderId: string
  poNumber: string
  createdAt: string
}

export interface BatchStats {
  totalBatch: number
  activeBatch: number
  emptyBatch: number
  expiringSoon: number
  expiredBatch: number
  totalQuantity: number
}

export interface QueryBatch {
  page?: number
  limit?: number
  search?: string
  itemId?: string
  supplierId?: string
  expiryStatus?: ExpiryStatus
  stockStatus?: StockStatus
  expiryThresholdDays?: number
}
