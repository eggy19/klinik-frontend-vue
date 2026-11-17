import { ref } from 'vue'

// Pilihan lebar kertas struk disimpan per perangkat (billing-mvp-spec BR-RC-10): bukan data bisnis.
export type ReceiptWidth = 58 | 80

export const RECEIPT_WIDTH_STORAGE_KEY = 'billing.receiptWidth'

function readWidth(): ReceiptWidth {
  try {
    return localStorage.getItem(RECEIPT_WIDTH_STORAGE_KEY) === '80' ? 80 : 58
  } catch {
    return 58
  }
}

// Satu state bersama agar layar POS dan detail riwayat memakai pilihan yang sama.
const width = ref<ReceiptWidth>(readWidth())

export function useReceiptWidth() {
  function setWidth(value: ReceiptWidth) {
    width.value = value
    try {
      localStorage.setItem(RECEIPT_WIDTH_STORAGE_KEY, String(value))
    } catch {
      // diabaikan: pilihan hanya berlaku selama halaman terbuka
    }
  }

  return { width, setWidth }
}
