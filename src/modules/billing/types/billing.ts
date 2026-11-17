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

/** Status sale yang muncul di list/detail (§6.2); VOIDED dicadangkan. */
export type SaleStatus = 'PENDING' | 'PAID' | 'FAILED' | 'NEEDS_RECONCILIATION' | 'VOIDED'

export interface SalePayment {
  methodCode: string
  methodName: string
  amount: number
  tenderedAmount: number
  changeAmount: number
}

/** Header/footer struk per cabang (BR-RC-04). Kosong = null. */
export interface SaleReceiptText {
  header: string | null
  footer: string | null
}

/** Header sale tanpa baris/pembayaran/struk (`SaleSummary`, §7.5). */
export interface SaleSummary {
  id: string
  saleNumber: string | null
  status: SaleStatus
  sourceType: string
  shiftId: string | null
  shiftNumber: string | null
  cashierUserId: string | null
  cashierName: string | null
  customerName: string | null
  createdAt: string | null
  paidAt: string | null
  subtotal: number
  taxRate: number
  taxTotal: number
  grandTotal: number
  tenderedAmount: number
  changeAmount: number
  failureCode: string | null
  failureMessage: string | null
}

/** Detail sale = response checkout = data struk (§7.5). */
export interface Sale extends SaleSummary {
  items: SaleItem[]
  payments: SalePayment[]
  /** null bila response tidak memuat objek `receipt` (data struk belum lengkap). */
  receipt: SaleReceiptText | null
  replayed: boolean
}

export interface ListParams {
  page?: number
  limit?: number
  dateFrom?: string
  dateTo?: string
  cashierUserId?: string
  status?: string
}

export interface SaleListParams extends ListParams {
  /** Cari nomor penjualan. */
  q?: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PagedResult<T> {
  items: T[]
  pagination: Pagination
}

/** Item error per baris dari Inventory yang diteruskan Billing (`field: "items[i]"`). */
export interface ApiLineError {
  field: string
  message: string
}
