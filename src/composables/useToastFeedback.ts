import { useToast } from 'primevue/usetoast'
import type { ToastServiceMethods } from 'primevue/toastservice'

// Waktu terakhir toast 403 ditampilkan. Dipakai agar toast error generik dari
// view ("Gagal ...") tidak muncul bersamaan dengan pesan 403 seragam.
let lastForbiddenAt = 0
const FORBIDDEN_DEDUP_MS = 1500

// Toast service milik host global (BaseToast) agar interceptor axios — yang
// berjalan di luar komponen — bisa menampilkan notifikasi.
let hostToast: ToastServiceMethods | null = null

export function registerToastHost(toast: ToastServiceMethods) {
  hostToast = toast
}

/** Pesan seragam untuk respons 403 API (BR-FE-07), dipanggil dari interceptor axios. */
export function notifyForbidden() {
  // 403 paralel dalam jendela dedup hanya menampilkan satu toast; jendela
  // digeser tiap 403 agar error() tetap tertahan selama rentetan 403.
  const now = Date.now()
  const duplicate = now - lastForbiddenAt < FORBIDDEN_DEDUP_MS
  lastForbiddenAt = now
  if (duplicate) return
  hostToast?.add({
    severity: 'error',
    summary: 'Akses Ditolak',
    detail: 'Anda tidak memiliki akses.',
    life: 4000,
  })
}

/**
 * Helper notifikasi standar (docs/06-ui-ux-standard.md).
 * Membungkus PrimeVue useToast dengan pesan default berbahasa Indonesia.
 */
export function useToastFeedback() {
  const toast = useToast()

  function success(detail = 'Data berhasil disimpan.', summary = 'Berhasil') {
    toast.add({ severity: 'success', summary, detail, life: 3000 })
  }

  function error(detail = 'Gagal menyimpan data.', summary = 'Gagal') {
    if (Date.now() - lastForbiddenAt < FORBIDDEN_DEDUP_MS) return
    toast.add({ severity: 'error', summary, detail, life: 4000 })
  }

  function warning(detail = 'Periksa kembali data Anda.', summary = 'Perhatian') {
    toast.add({ severity: 'warn', summary, detail, life: 3500 })
  }

  return { success, error, warning }
}
