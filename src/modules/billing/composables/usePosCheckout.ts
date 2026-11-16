import { ref } from 'vue'
import { billingApi } from '../api/billing.api'
import type { CreateSalePayload, Sale } from '../types/billing'
import {
  classifyCheckoutError,
  clearPendingCheckout,
  loadPendingCheckout,
  newIdempotencyKey,
  savePendingCheckout,
  type CheckoutFailure,
  type PendingCheckout,
  type UncertainReason,
} from '../utils/checkout'

// Status checkout FE (billing-mvp-spec §6.4): SIAP -> MENGIRIM -> SUKSES | DITOLAK | BELUM_PASTI.
export type CheckoutPhase = 'idle' | 'sending' | 'uncertain' | 'success'
export type UncertainDisplayReason = UncertainReason | 'processing'
export type RejectedCheckout = Extract<CheckoutFailure, { kind: 'rejected' }>

/** BR-PS-08: BIL_010 diulang otomatis tiap 3 dtk, maksimal 5 kali. */
const PROCESSING_RETRY_DELAY_MS = 3000
const PROCESSING_RETRY_MAX = 5

export function usePosCheckout() {
  const phase = ref<CheckoutPhase>('idle')
  const pending = ref<PendingCheckout | null>(null)
  const uncertainReason = ref<UncertainDisplayReason>('unknown')
  const sale = ref<Sale | null>(null)

  // Key hanya dipakai ulang untuk payload yang persis sama dan belum dijawab pasti (BR-SL-02).
  let attempt: { key: string; payloadJson: string } | null = null
  let disposed = false
  let wakeUp: (() => void) | null = null

  /** Pulihkan transaksi yang belum pasti setelah reload / login ulang (BR-PS-10). */
  function restore(userId: string, branchId: string) {
    const stored = loadPendingCheckout(userId, branchId)
    if (!stored) return
    pending.value = stored
    attempt = { key: stored.key, payloadJson: JSON.stringify(stored.payload) }
    uncertainReason.value = 'unknown'
    phase.value = 'uncertain'
  }

  function waitProcessingDelay(): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, PROCESSING_RETRY_DELAY_MS)
      wakeUp = () => {
        clearTimeout(timer)
        resolve()
      }
    })
  }

  /** Mengirim `pending` sampai ada jawaban; mengembalikan penolakan pasti, atau null. */
  async function send(): Promise<RejectedCheckout | null> {
    const current = pending.value
    if (!current) return null
    phase.value = 'sending'
    uncertainReason.value = 'unknown'
    let processingTries = 0

    while (!disposed) {
      try {
        sale.value = await billingApi.createSale(current.key, current.payload)
        clearPendingCheckout(current.userId, current.branchId)
        pending.value = null
        attempt = null
        phase.value = 'success'
        return null
      } catch (error) {
        const failure = classifyCheckoutError(error)
        if (failure.kind === 'processing') {
          if (processingTries < PROCESSING_RETRY_MAX) {
            processingTries += 1
            uncertainReason.value = 'processing'
            await waitProcessingDelay()
            continue
          }
          phase.value = 'uncertain'
          uncertainReason.value = 'processing'
          return null
        }
        if (failure.kind === 'uncertain') {
          phase.value = 'uncertain'
          uncertainReason.value = failure.reason
          return null
        }
        // Jawaban pasti: key dihapus, percobaan berikutnya memakai key baru.
        clearPendingCheckout(current.userId, current.branchId)
        pending.value = null
        attempt = null
        phase.value = 'idle'
        return failure
      }
    }
    return null
  }

  function submit(
    payload: CreateSalePayload,
    snapshot: PendingCheckout['snapshot'],
    userId: string,
    branchId: string,
  ): Promise<RejectedCheckout | null> {
    const payloadJson = JSON.stringify(payload)
    const key = attempt && attempt.payloadJson === payloadJson ? attempt.key : newIdempotencyKey()
    attempt = { key, payloadJson }
    const record: PendingCheckout = { key, userId, branchId, payload, snapshot }
    pending.value = record
    savePendingCheckout(record)
    return send()
  }

  /** "Coba lagi" / "Lanjutkan": kirim ulang payload yang sama dengan key yang sama. */
  function retry(): Promise<RejectedCheckout | null> {
    return send()
  }

  /** "Tinggalkan transaksi" (setelah konfirmasi): hapus pending, key berikutnya baru. */
  function abandon() {
    if (pending.value) clearPendingCheckout(pending.value.userId, pending.value.branchId)
    pending.value = null
    attempt = null
    phase.value = 'idle'
  }

  /** Setelah layar sukses ditutup. */
  function reset() {
    sale.value = null
    phase.value = 'idle'
  }

  function dispose() {
    disposed = true
    wakeUp?.()
  }

  return { phase, pending, uncertainReason, sale, restore, submit, retry, abandon, reset, dispose }
}
