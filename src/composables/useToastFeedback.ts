import { useToast } from 'primevue/usetoast'

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
    toast.add({ severity: 'error', summary, detail, life: 4000 })
  }

  function warning(detail = 'Periksa kembali data Anda.', summary = 'Perhatian') {
    toast.add({ severity: 'warn', summary, detail, life: 3500 })
  }

  return { success, error, warning }
}
