export type StockOpnameStatus = 'DRAFT' | 'FINALIZED'

export const STOCK_OPNAME_STATUS_LABELS: Record<StockOpnameStatus, string> = {
  DRAFT: 'Draft',
  FINALIZED: 'Selesai',
}

export type TagVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'

export const STOCK_OPNAME_STATUS_VARIANT: Record<StockOpnameStatus, TagVariant> = {
  DRAFT: 'warning',
  FINALIZED: 'success',
}

export interface StockOpnameItem {
  id: string
  itemId: string
  itemName: string
  itemCode: string
  batchId: string
  batchNumber: string
  expiredDate: string | null
  systemQuantity: number
  physicalQuantity: number
  difference: number
}

export interface StockOpname {
  id: string
  opnameNumber: string
  status: StockOpnameStatus
  note: string | null
  createdAt: string
  finalizedAt: string | null
  items?: StockOpnameItem[]
}

export interface StockOpnameQuery {
  page?: number
  limit?: number
  search?: string
  status?: StockOpnameStatus
}

export interface CreateStockOpnameItemInput {
  itemId: string
  batchId: string
  physicalQuantity: number
}

export interface CreateStockOpnameInput {
  opnameNumber: string
  note?: string
  items: CreateStockOpnameItemInput[]
}
