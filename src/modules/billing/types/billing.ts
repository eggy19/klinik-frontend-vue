// Tipe domain Billing kasir (billing-mvp-spec §7.3, §7.5). Semua nominal sudah number.

export interface ShiftSummary {
  cashSalesTotal: number
  expectedCash: number
  saleCount: number
  pendingCount: number
  failedCount: number
  reconciliationCount: number
}

export interface Shift {
  id: string
  shiftNumber: string
  status: 'OPEN' | 'CLOSED'
  cashierUserId: string
  cashierName: string | null
  openedAt: string
  /** Dihitung Billing (BR-SH-11), FE tidak menghitung sendiri. */
  openedBeforeToday: boolean
  openingCash: number
  openNote: string | null
  closedAt: string | null
  expectedCash: number | null
  closingCashCounted: number | null
  cashDifference: number | null
  closeNote: string | null
  summary: ShiftSummary
  /** Hanya ada pada response tutup shift (BR-SH-06). */
  pendingConvertedCount?: number
}

export interface OpenShiftInput {
  openingCash: number
  openNote?: string
}

export interface CloseShiftInput {
  closingCashCounted: number
  closeNote?: string
}

export interface PaymentMethod {
  code: string
  name: string
  isCash: boolean
}

/** Satuan jual pada hasil POS lookup (§7.3). */
export type NotSellableReason = 'OUT_OF_STOCK' | 'NO_PRICE' | 'BLOCKED_DRUG_GROUP'

export interface PosUnit {
  unitId: string
  unitCode: string
  unitName: string
  isDefaultSales: boolean
  unitPrice: number | null
  availableQuantity: number
  sellable: boolean
  notSellableReason: NotSellableReason | null
}

export interface PosItem {
  itemId: string
  itemCode: string
  itemName: string
  brandName: string | null
  barcode: string | null
  /** WARNING = obat keras (KP-26), BLOCKED = narkotika/psikotropika. */
  saleRestriction: 'NONE' | 'WARNING' | 'BLOCKED'
  units: PosUnit[]
}

/** Body `POST /billing/sales` (snake_case, §7.5). */
export interface CreateSalePayload {
  customer_name: string | null
  items: Array<{
    item_id: string
    unit_id: string
    quantity: number
    expected_unit_price: number
  }>
  payments: Array<{ method_code: string; tendered_amount: number }>
}

export interface SaleItem {
  lineNo: number
  itemCode: string
  itemName: string
  unitCode: string
  unitName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

/** Response checkout (data struk). Rincian lengkap dipakai BL-20; di sini yang dibutuhkan layar sukses. */
export interface Sale {
  id: string
  saleNumber: string
  status: string
  grandTotal: number
  tenderedAmount: number
  changeAmount: number
  paidAt: string | null
  items: SaleItem[]
  replayed: boolean
}

/** Item error per baris dari Inventory yang diteruskan Billing (`field: "items[i]"`). */
export interface ApiLineError {
  field: string
  message: string
}
