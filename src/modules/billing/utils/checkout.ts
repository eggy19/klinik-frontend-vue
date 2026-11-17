import { isAxiosError } from 'axios'
import { apiErrorMessage } from '@/utils/api-error'
import type { ApiLineError, CreateSalePayload } from '../types/billing'

// Aturan: billing-mvp-spec §5.5 (BR-SL-02), §5.10 (BR-PS-06..10), §6.4.

export const PENDING_CHECKOUT_STORAGE_KEY = 'billing.pendingCheckout'

/** Satu slot per user + cabang agar pending milik orang lain tidak tertimpa. */
function pendingSlot(userId: string, branchId: string): string {
  return `${PENDING_CHECKOUT_STORAGE_KEY}:${userId}:${branchId}`
}

/** UUID v4 untuk header Idempotency-Key; `randomUUID` hanya ada di secure context. */
export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** Nominal dalam sen (integer) agar perhitungan uang tidak memakai floating point (BR-SL-15). */
export function toCents(value: number): number {
  return Math.round(value * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

/** Transaksi yang dikirim tetapi belum mendapat jawaban pasti (BR-PS-06, disimpan di localStorage). */
export interface PendingCheckout {
  key: string
  userId: string
  branchId: string
  payload: CreateSalePayload
  /** Ringkasan untuk ditampilkan saat dipulihkan setelah reload/login ulang. */
  snapshot: {
    lines: Array<{ itemName: string; unitName: string; quantity: number; unitPrice: number }>
    total: number
    tendered: number
  }
}

/**
 * Baca slot dari localStorage. Migrasi sekali jalan: slot lama di sessionStorage (versi sebelum
 * TM-H5-03) dipindah ke localStorage bila localStorage belum punya slot untuk user + cabang itu.
 */
function readPendingRaw(slot: string): string | null {
  const stored = localStorage.getItem(slot)
  if (stored) return stored
  const legacy = sessionStorage.getItem(slot)
  if (!legacy) return null
  try {
    localStorage.setItem(slot, legacy)
    sessionStorage.removeItem(slot)
  } catch {
    // migrasi gagal: slot lama tetap dipakai untuk sesi ini, jangan dibuang
  }
  return legacy
}

// localStorage bisa melempar (mode privat/diblokir); halaman tetap harus jalan tanpanya.
export function loadPendingCheckout(userId: string, branchId: string): PendingCheckout | null {
  let raw: string | null
  try {
    raw = readPendingRaw(pendingSlot(userId, branchId))
  } catch {
    // Error baca storage bukan bukti slot rusak: jangan menghapus apa pun.
    return null
  }
  if (!raw) return null
  let parsed: unknown = null
  try {
    parsed = JSON.parse(raw)
  } catch {
    // JSON rusak: ditangani sama dengan bentuk rusak di bawah.
  }
  if (!isPendingCheckout(parsed) || parsed.userId !== userId || parsed.branchId !== branchId) {
    // Bentuk rusak / bukan milik slot ini: buang agar tidak memblokir POS (BR-PS-10).
    clearPendingCheckout(userId, branchId)
    return null
  }
  return parsed
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Validasi bentuk data dari storage (bisa rusak / diubah manual). */
function isPendingCheckout(value: unknown): value is PendingCheckout {
  if (!isRecord(value)) return false
  if (typeof value.key !== 'string' || !UUID_PATTERN.test(value.key)) return false
  if (typeof value.userId !== 'string' || typeof value.branchId !== 'string') return false
  const { payload, snapshot } = value
  if (!isRecord(payload) || !Array.isArray(payload.items) || !Array.isArray(payload.payments)) return false
  if (!payload.items.every(isRecord) || !payload.payments.every(isRecord)) return false
  // Snapshot dipakai dialog untuk menampilkan ringkasan; rusak = tidak bisa ditampilkan.
  if (!isRecord(snapshot) || !Array.isArray(snapshot.lines) || !snapshot.lines.every(isRecord)) return false
  return typeof snapshot.total === 'number' && typeof snapshot.tendered === 'number'
}

export function savePendingCheckout(pending: PendingCheckout): void {
  try {
    localStorage.setItem(pendingSlot(pending.userId, pending.branchId), JSON.stringify(pending))
  } catch {
    // diabaikan: tanpa storage, pemulihan setelah reload tidak tersedia
  }
}

/** Hanya dipanggil setelah jawaban pasti atau "Tinggalkan" terkonfirmasi; logout/401 tidak (BR-PS-09/10). */
export function clearPendingCheckout(userId: string, branchId: string, onlyKey?: string): void {
  const slot = pendingSlot(userId, branchId)
  // Dengan `onlyKey`: jangan hapus slot yang kini berisi key lain (milik tab lain).
  if (onlyKey) {
    try {
      const raw = localStorage.getItem(slot)
      if (raw) {
        const stored: unknown = JSON.parse(raw)
        if (isRecord(stored) && typeof stored.key === 'string' && stored.key !== onlyKey) return
      }
    } catch {
      // tidak terbaca / rusak: lanjut menghapus
    }
  }
  // Dua storage dibersihkan terpisah agar kegagalan satu tidak melewatkan yang lain.
  try {
    localStorage.removeItem(slot)
  } catch {
    // diabaikan
  }
  try {
    sessionStorage.removeItem(slot)
  } catch {
    // diabaikan
  }
}

export type UncertainReason = 'timeout' | 'network' | 'unavailable' | 'unauthorized' | 'unknown'

/** `forbidden` = 403: pesan "Anda tidak memiliki akses" sudah ditampilkan interceptor global (BR-FE-07). */
export type RejectedAction = 'none' | 'open-shift' | 'reload-prices' | 'supervisor' | 'forbidden'

export type CheckoutFailure =
  /** Belum ada jawaban pasti: pakai ulang key yang sama (BR-PS-08/09). */
  | { kind: 'uncertain'; reason: UncertainReason }
  /** 409 BIL_010: request sebelumnya masih diproses. Key sama. */
  | { kind: 'processing' }
  /** Jawaban pasti dari Billing: key diganti. */
  | {
      kind: 'rejected'
      code: string | null
      message: string
      /** Pesan per indeks baris keranjang (dari `errors[].field = "items[i]"`). */
      lineErrors: Record<number, string>
      action: RejectedAction
    }

function lineErrorsOf(data: unknown): Record<number, string> {
  const result: Record<number, string> = {}
  const errors = (data as { errors?: ApiLineError[] } | undefined)?.errors
  if (!Array.isArray(errors)) return result
  for (const err of errors) {
    const match = /^items\[(\d+)\]/.exec(err?.field ?? '')
    if (match) result[Number(match[1])] = err.message || 'Item bermasalah.'
  }
  return result
}

/** Memetakan error checkout ke tindakan FE sesuai BR-PS-08. */
export function classifyCheckoutError(error: unknown): CheckoutFailure {
  if (!isAxiosError(error)) return { kind: 'uncertain', reason: 'unknown' }

  if (!error.response) {
    const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
    return { kind: 'uncertain', reason: timedOut ? 'timeout' : 'network' }
  }

  const status = error.response.status
  const data = error.response.data as { code?: string; message?: unknown } | undefined
  const code = typeof data?.code === 'string' ? data.code : null
  const rejected = (
    message: string,
    action: RejectedAction = 'none',
    lineErrors: Record<number, string> = {},
  ): CheckoutFailure => ({ kind: 'rejected', code, message, lineErrors, action })

  if (code === 'BIL_010') return { kind: 'processing' }
  // 503 BIL_015 maupun 503 Gateway (envelope tanpa code, F14).
  if (status === 503) return { kind: 'uncertain', reason: 'unavailable' }
  // Interceptor sudah mengarahkan ke login; pendingCheckout dipertahankan (BR-PS-10).
  if (status === 401) return { kind: 'uncertain', reason: 'unauthorized' }

  switch (code) {
    case 'BIL_012':
      return rejected('Harga berubah, periksa kembali keranjang.', 'reload-prices', lineErrorsOf(data))
    case 'BIL_013':
      return rejected('Stok tidak mencukupi.', 'none', lineErrorsOf(data))
    case 'BIL_014':
      return rejected('Ada item yang tidak dapat dijual.', 'none', lineErrorsOf(data))
    case 'BIL_003':
      return rejected('Buka shift terlebih dahulu.', 'open-shift')
    case 'BIL_009':
      return rejected('Transaksi tidak cocok, ulangi.')
    case 'BIL_016':
    case 'BIL_017': {
      // Nomor/ID sale bila ada di envelope (BR-PS-08); nama field tidak dikunci spec, dicoba beberapa.
      const d = data as Record<string, unknown> | undefined
      const nested = (d?.data ?? d?.details ?? d?.sale) as Record<string, unknown> | undefined
      const ref = [d?.saleNumber, d?.saleId, nested?.saleNumber, nested?.saleId, nested?.id].find(
        (v): v is string => typeof v === 'string' && v !== '',
      )
      return rejected(
        `Transaksi perlu diperiksa supervisor. Jangan ulangi pembayaran.${ref ? ` Nomor/ID transaksi: ${ref}` : ''}`,
        'supervisor',
      )
    }
    default:
      break
  }

  if (status === 403) return rejected('Anda tidak memiliki akses.', 'forbidden')
  // 5xx tanpa kode dikenal: jawaban tidak pasti, aman diulang karena idempotent di kedua lapis.
  if (status >= 500) return { kind: 'uncertain', reason: 'unknown' }
  return rejected(apiErrorMessage(error, 'Transaksi gagal diproses.'))
}
