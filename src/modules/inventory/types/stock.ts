export interface StockSummaryRow {
  itemId: string
  itemCode: string
  itemName: string
  unitName: string | null
  totalQuantity: number
  batchCount: number
  nearestExpiry: string | null
  minimumStock: number
  belowMinimum: boolean
}

export interface StockSummaryQuery {
  page?: number
  limit?: number
  search?: string
  lowStock?: boolean
}
