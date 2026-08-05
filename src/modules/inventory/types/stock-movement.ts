export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT'

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  IN: 'Masuk',
  OUT: 'Keluar',
  ADJUSTMENT: 'Penyesuaian',
}

export type TagVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'

export const STOCK_MOVEMENT_TYPE_VARIANT: Record<StockMovementType, TagVariant> = {
  IN: 'success',
  OUT: 'danger',
  ADJUSTMENT: 'warning',
}

/** reference_type values written by InventoryService.writeMovement() callers (goods receipt, dispensing, stock opname, manual adjustment). */
export const REFERENCE_TYPE_LABELS: Record<string, string> = {
  goods_receipt: 'Penerimaan Barang',
  dispensing: 'Dispensing',
  stock_opname: 'Stok Opname',
  manual_adjustment: 'Penyesuaian Manual',
}

export interface StockMovement {
  id: string
  type: StockMovementType
  quantity: number
  referenceType: string | null
  referenceId: string | null
  note: string | null
  createdAt: string
  itemId: string
  itemName: string
  itemCode: string
  batchId: string | null
  batchNumber: string | null
}

export interface StockMovementQuery {
  page?: number
  limit?: number
  search?: string
  itemId?: string
  batchId?: string
  type?: StockMovementType
  referenceType?: string
  dateFrom?: string
  dateTo?: string
}
