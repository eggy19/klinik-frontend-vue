import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  CloseShiftInput,
  CreateSalePayload,
  OpenShiftInput,
  PaymentMethod,
  Sale,
  Shift,
} from '../types/billing'

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

function fromApiSale(raw: Record<string, unknown>): Sale {
  const items = (raw.items as Array<Record<string, unknown>> | undefined) ?? []
  return {
    id: raw.id as string,
    saleNumber: raw.saleNumber as string,
    status: raw.status as string,
    grandTotal: num(raw.grandTotal as number | string),
    tenderedAmount: num(raw.tenderedAmount as number | string),
    changeAmount: num(raw.changeAmount as number | string),
    paidAt: (raw.paidAt as string | null) ?? null,
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
  }
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
}
