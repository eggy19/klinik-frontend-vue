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
export function formatNominalInput(value: number | null | undefined, fractionDigits = 2): string {
  if (value == null) return ''
  return value.toLocaleString('id-ID', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })
}

/** Parse hasil ketikan mask nominal (default: semua digit dianggap sen bergeser dari kanan,
 *  mis. ketik "1","0","0","0","0" -> 100,00; fractionDigits 0 = rupiah bulat, "20000" -> 20000)
 *  jadi number, atau null kalau kosong. */
export function parseNominalInput(raw: string, fractionDigits = 2): number | null {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  return parseInt(digits, 10) / 10 ** fractionDigits
}

/** Format angka desimal id-ID (koma desimal, tanpa nol berlebih), mis. 12.5 -> "12,5", 1000 -> "1.000". */
export function formatDecimal(value: number | null | undefined, maxFractionDigits = 2): string {
  if (value == null) return ''
  return value.toLocaleString('id-ID', { maximumFractionDigits: maxFractionDigits })
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

/** Zona waktu bisnis (billing-mvp-spec BR-RC-03, KB-15). */
const WIB = 'Asia/Jakarta'

/** Komponen tanggal-jam dalam WIB (dua digit), terlepas dari zona waktu browser. */
function wibParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: WIB,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') }
}

function toValidDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const date = typeof value === 'string' ? new Date(value) : value
  return Number.isNaN(date.getTime()) ? null : date
}

/** Tanggal WIB hari ini dalam bentuk `YYYY-MM-DD` (untuk filter `date_from`/`date_to`). */
export function todayWib(): string {
  const p = wibParts(new Date())
  return `${p.year}-${p.month}-${p.day}`
}

/** Tanggal-jam WIB "DD/MM/YYYY HH:mm" (struk & riwayat kasir, BR-RC-03). */
export function formatDateTimeWib(value: string | Date | null | undefined): string {
  const date = toValidDate(value)
  if (!date) return '-'
  const p = wibParts(date)
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`
}

/** Penanda cetak ulang WIB "DD/MM HH:mm" (BR-RC-08). */
export function formatShortDateTimeWib(value: string | Date | null | undefined): string {
  const date = toValidDate(value)
  if (!date) return '-'
  const p = wibParts(date)
  return `${p.day}/${p.month} ${p.hour}:${p.minute}`
}

/**
 * Nominal Rupiah tanpa simbol untuk struk: titik ribuan, desimal hanya bila bukan ,00
 * (BR-RC-07), tanpa pembulatan. 11000 -> "11.000", 4261.26 -> "4.261,26", 5500.5 -> "5.500,50".
 */
export function formatReceiptAmount(value: number): string {
  const cents = Math.round(value * 100)
  const hasFraction = cents % 100 !== 0
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(cents / 100)
}

/** Rupiah ("Rp 11.000") dengan desimal hanya bila bukan ,00 (BR-RC-07). */
export function formatCurrencyExact(value: number): string {
  return `Rp ${formatReceiptAmount(value)}`
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
