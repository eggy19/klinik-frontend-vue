import { formatCurrencyExact } from '@/utils/format'
import type { SaleStatus, Shift } from '../types/billing'

/** Selisih kas: "Rp 0" bila pas, selain itu "Lebih/Kurang Rp N"; null = "-". Dipakai list & detail shift. */
export function formatCashDifference(value: number | null): string {
  if (value === null) return '-'
  if (value === 0) return formatCurrencyExact(0)
  return `${value > 0 ? 'Lebih' : 'Kurang'} ${formatCurrencyExact(Math.abs(value))}`
}

// Label & warna status Billing (billing-mvp-spec §6.1, §6.2). Warna lewat varian BaseTag.
export type TagVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'

export const SALE_STATUS_LABEL: Record<SaleStatus, string> = {
  PAID: 'Berhasil',
  PENDING: 'Belum pasti',
  FAILED: 'Gagal',
  NEEDS_RECONCILIATION: 'Perlu diperiksa',
  VOIDED: 'Dibatalkan',
}

export const SALE_STATUS_VARIANT: Record<SaleStatus, TagVariant> = {
  PAID: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
  NEEDS_RECONCILIATION: 'warning',
  VOIDED: 'secondary',
}

/** Status yang boleh difilter di `GET /billing/sales` (SALE_LIST_STATUSES backend). */
export const SALE_FILTER_STATUSES: SaleStatus[] = ['PAID', 'PENDING', 'FAILED', 'NEEDS_RECONCILIATION']

export const SHIFT_STATUS_LABEL: Record<Shift['status'], string> = {
  OPEN: 'Terbuka',
  CLOSED: 'Ditutup',
}

export const SHIFT_STATUS_VARIANT: Record<Shift['status'], TagVariant> = {
  OPEN: 'success',
  CLOSED: 'secondary',
}

/** Status FAILED / NEEDS_RECONCILIATION menampilkan `failureMessage` (AC-RW-03). */
export function showsFailure(status: SaleStatus): boolean {
  return status === 'FAILED' || status === 'NEEDS_RECONCILIATION'
}
