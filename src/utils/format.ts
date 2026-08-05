/** Format angka ke Rupiah, mis. 15000 -> "Rp 15.000". */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/** Format angka jadi string nominal id-ID (titik ribuan, koma desimal), mis. 10000 -> "10.000,00". */
export function formatNominalInput(value: number | null | undefined): string {
  if (value == null) return ''
  return value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Parse hasil ketikan mask nominal (semua digit dianggap sen bergeser dari kanan,
 *  mis. ketik "1","0","0","0","0" -> 100,00) jadi number, atau null kalau kosong. */
export function parseNominalInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  return parseInt(digits, 10) / 100
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

/** Format tanggal + jam ke "17 Jun 2026 14:30". */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '-'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** Waktu relatif berbahasa Indonesia, mis. "5 menit lalu" / "dalam 2 hari". */
export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return '-'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '-'

  const diffMs = date.getTime() - Date.now()
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['month', 1000 * 60 * 60 * 24 * 30],
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60],
  ]
  const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' })
  for (const [unit, ms] of units) {
    if (Math.abs(diffMs) >= ms) {
      return rtf.format(Math.trunc(diffMs / ms), unit)
    }
  }
  return 'baru saja'
}

/** Selisih hari dari hari ini ke `value` (negatif = sudah lewat). */
export function daysUntil(value: string | Date): number {
  const date = typeof value === 'string' ? new Date(value) : value
  const ms = date.getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}
