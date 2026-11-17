import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  CloseShiftInput,
  CreateSalePayload,
  ListParams,
  OpenShiftInput,
  PagedResult,
  Pagination,
  PaymentMethod,
  Sale,
  SaleListParams,
  SaleStatus,
  SaleSummary,
  Shift,
} from '../types/billing'

/** Response list Billing: `data` array + `pagination` di level atas (BR-BL-03). */
interface ApiListResponse {
  success: boolean
  message: string
  data: Array<Record<string, unknown>>
  pagination?: Record<string, unknown>
}

// Kontrak: dokumentasi/billing/billing-mvp-spec.md §7.5 (via Gateway /billing/*).
// Response dibaca camelCase, body request snake_case.

/** Timeout checkout 45 dtk (BR-PS-07, §4.10); default apiClient 15 dtk tidak cukup. */
export const CHECKOUT_TIMEOUT_MS = 45_000

function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  return Number(value)
}

function numOrNull(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  return Number(value)
}

function fromApiShift(raw: Record<string, unknown>): Shift {
  const summary = (raw.summary ?? {}) as Record<string, number | string | null>
  return {
    id: raw.id as string,
    shiftNumber: raw.shiftNumber as string,
    status: raw.status as Shift['status'],
    cashierUserId: raw.cashierUserId as string,
    cashierName: (raw.cashierName as string | null) ?? null,
    openedAt: raw.openedAt as string,
    openedBeforeToday: raw.openedBeforeToday === true,
    openingCash: num(raw.openingCash as number | string),
    openNote: (raw.openNote as string | null) ?? null,
    closedAt: (raw.closedAt as string | null) ?? null,
    expectedCash: numOrNull(raw.expectedCash as number | string | null),
    closingCashCounted: numOrNull(raw.closingCashCounted as number | string | null),
    cashDifference: numOrNull(raw.cashDifference as number | string | null),
    closeNote: (raw.closeNote as string | null) ?? null,
    summary: {
      cashSalesTotal: num(summary.cashSalesTotal),
      expectedCash: num(summary.expectedCash),
      saleCount: num(summary.saleCount),
      pendingCount: num(summary.pendingCount),
      failedCount: num(summary.failedCount),
      reconciliationCount: num(summary.reconciliationCount),
    },
    pendingConvertedCount:
      raw.pendingConvertedCount === undefined ? undefined : num(raw.pendingConvertedCount as number),
  }
}

function strOrNull(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null
}

/** Header sale (tanpa baris/pembayaran/struk), bentuk `SaleSummary` §7.5. Dipakai list & detail. */
function fromApiSaleSummary(raw: Record<string, unknown>): SaleSummary {
  return {
    id: raw.id as string,
    saleNumber: strOrNull(raw.saleNumber),
    status: raw.status as SaleStatus,
    sourceType: (raw.sourceType as string | undefined) ?? 'OTC',
    shiftId: strOrNull(raw.shiftId),
    shiftNumber: strOrNull(raw.shiftNumber),
    cashierUserId: strOrNull(raw.cashierUserId),
    cashierName: strOrNull(raw.cashierName),
    customerName: strOrNull(raw.customerName),
    createdAt: strOrNull(raw.createdAt),
    paidAt: strOrNull(raw.paidAt),
    subtotal: num(raw.subtotal as number | string),
    taxRate: num(raw.taxRate as number | string),
    taxTotal: num(raw.taxTotal as number | string),
    grandTotal: num(raw.grandTotal as number | string),
    tenderedAmount: num(raw.tenderedAmount as number | string),
    changeAmount: num(raw.changeAmount as number | string),
    failureCode: strOrNull(raw.failureCode),
    failureMessage: strOrNull(raw.failureMessage),
  }
}

function fromApiSale(raw: Record<string, unknown>): Sale {
  const items = (raw.items as Array<Record<string, unknown>> | undefined) ?? []
  const payments = (raw.payments as Array<Record<string, unknown>> | undefined) ?? []
  const receipt = raw.receipt as Record<string, unknown> | null | undefined
  return {
    ...fromApiSaleSummary(raw),
    replayed: raw.replayed === true,
    items: items.map((item) => ({
      lineNo: num(item.lineNo as number),
      itemCode: item.itemCode as string,
      itemName: item.itemName as string,
      unitCode: item.unitCode as string,
      unitName: item.unitName as string,
      quantity: num(item.quantity as number | string),
      unitPrice: num(item.unitPrice as number | string),
      lineTotal: num(item.lineTotal as number | string),
    })),
    payments: payments.map((p) => ({
      methodCode: p.methodCode as string,
      methodName: p.methodName as string,
      amount: num(p.amount as number | string),
      tenderedAmount: num(p.tenderedAmount as number | string),
      changeAmount: num(p.changeAmount as number | string),
    })),
    receipt:
      receipt && typeof receipt === 'object'
        ? { header: strOrNull(receipt.header), footer: strOrNull(receipt.footer) }
        : null,
  }
}

function fromApiPagination(raw: Record<string, unknown> | undefined, fallbackLimit: number): Pagination {
  return {
    page: num(raw?.page as number | undefined) || 1,
    limit: num(raw?.limit as number | undefined) || fallbackLimit,
    total: num(raw?.total as number | undefined),
    totalPages: num(raw?.totalPages as number | undefined),
  }
}

/** Query list snake_case (§7.5); nilai kosong tidak dikirim. */
function listQuery(params: SaleListParams): Record<string, string | number> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  }
  if (params.dateFrom) query.date_from = params.dateFrom
  if (params.dateTo) query.date_to = params.dateTo
  if (params.cashierUserId) query.cashier_user_id = params.cashierUserId
  if (params.status) query.status = params.status
  if (params.q?.trim()) query.q = params.q.trim()
  return query
}

export const billingApi = {
  /** Shift OPEN milik user di cabang aktif, atau null (BR-SH-13). */
  async getCurrentShift(): Promise<Shift | null> {
    const res = await apiClient.get<ApiResponse<Record<string, unknown> | null>>('/billing/shifts/current')
    return res.data.data ? fromApiShift(res.data.data) : null
  },

  async openShift(input: OpenShiftInput): Promise<Shift> {
    const res = await apiClient.post<ApiResponse<Record<string, unknown>>>('/billing/shifts/open', {
      opening_cash: input.openingCash,
      open_note: input.openNote?.trim() ? input.openNote.trim() : null,
    })
    return fromApiShift(res.data.data)
  },

  async closeShift(id: string, input: CloseShiftInput): Promise<Shift> {
    const res = await apiClient.post<ApiResponse<Record<string, unknown>>>(`/billing/shifts/${id}/close`, {
      closing_cash_counted: input.closingCashCounted,
      close_note: input.closeNote?.trim() ? input.closeNote.trim() : null,
    })
    return fromApiShift(res.data.data)
  },

  /**
   * Metode bayar aktif. MVP: hanya Tunai (CASH) — endpoint `GET /billing/payment-methods`
   * dikerjakan di BL-16. Ganti isi fungsi ini dengan pemanggilan API tanpa mengubah pemanggil.
   */
  async listPaymentMethods(): Promise<PaymentMethod[]> {
    return [{ code: 'CASH', name: 'Tunai', isCash: true }]
  },

  /**
   * Checkout. `idempotencyKey` dibuat/dipakai ulang oleh pemanggil (BR-SL-02, BR-PS-06).
   * Error tidak ditangani di sini; klasifikasinya ada di utils/checkout-error.ts.
   */
  async createSale(idempotencyKey: string, payload: CreateSalePayload): Promise<Sale> {
    const res = await apiClient.post<ApiResponse<Record<string, unknown>>>('/billing/sales', payload, {
      headers: { 'Idempotency-Key': idempotencyKey },
      timeout: CHECKOUT_TIMEOUT_MS,
    })
    return fromApiSale(res.data.data)
  },

  /** Daftar penjualan (scope read / read_all ditentukan Billing, BR-SL-12). */
  async getSales(params: SaleListParams = {}): Promise<PagedResult<SaleSummary>> {
    const query = listQuery(params)
    const res = await apiClient.get<ApiListResponse>('/billing/sales', { params: query })
    return {
      items: res.data.data.map(fromApiSaleSummary),
      pagination: fromApiPagination(res.data.pagination, Number(query.limit)),
    }
  },

  /** Detail sale = data struk (§7.5). 404 `BIL_005` bila di luar scope. */
  async getSale(id: string): Promise<Sale> {
    const res = await apiClient.get<ApiResponse<Record<string, unknown>>>(`/billing/sales/${id}`)
    return fromApiSale(res.data.data)
  },

  /** Daftar shift; tanggal dicocokkan ke `opened_at` (§7.5 pengecualian). */
  async getShifts(params: ListParams = {}): Promise<PagedResult<Shift>> {
    const query = listQuery(params)
    const res = await apiClient.get<ApiListResponse>('/billing/shifts', { params: query })
    return {
      items: res.data.data.map(fromApiShift),
      pagination: fromApiPagination(res.data.pagination, Number(query.limit)),
    }
  },

  /** Detail shift. 404 `BIL_001` bila di luar scope (BR-SH-13). */
  async getShift(id: string): Promise<Shift> {
    const res = await apiClient.get<ApiResponse<Record<string, unknown>>>(`/billing/shifts/${id}`)
    return fromApiShift(res.data.data)
  },
}
