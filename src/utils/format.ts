/** Format angka ke Rupiah, mis. 15000 -> "Rp 15.000". */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/** Format tanggal ISO / Date ke "17 Jun 2026". */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/** Selisih hari dari hari ini ke `value` (negatif = sudah lewat). */
export function daysUntil(value: string | Date): number {
  const date = typeof value === 'string' ? new Date(value) : value
  const ms = date.getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}
