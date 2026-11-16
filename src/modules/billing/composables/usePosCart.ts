import { computed, ref } from 'vue'
import type { PosItem, PosUnit } from '../types/billing'
import { fromCents, toCents } from '../utils/checkout'

export const MAX_CART_LINES = 100

export interface CartLine {
  /** `${itemId}:${unitId}` — baris unik per (item, satuan) (BR-PS-05). */
  key: string
  itemId: string
  unitId: string
  itemCode: string
  itemName: string
  brandName: string | null
  unitName: string
  /** Harga saat ditambahkan; dikirim sebagai expected_unit_price. */
  unitPrice: number
  available: number
  restriction: PosItem['saleRestriction']
  /** Draft ketikan qty; divalidasi di `lineProblem`. */
  qtyText: string
  /** Pesan dari Billing untuk baris ini (BIL_012/013/014). */
  serverError: string | null
  /** Harga lama bila harga berubah dan belum dikonfirmasi kasir. */
  priceChange: { oldPrice: number } | null
}

export type AddResult = 'added' | 'incremented' | 'at-max' | 'cart-full'

/** Qty valid = bilangan bulat 1..available; selain itu null. */
export function parseQty(line: Pick<CartLine, 'qtyText' | 'available'>): number | null {
  const text = line.qtyText.trim()
  if (!/^\d+$/.test(text)) return null
  const qty = Number(text)
  return qty >= 1 && qty <= line.available ? qty : null
}

/** Pesan validasi FE untuk satu baris, atau null bila valid (BR-PS-05). */
export function lineProblem(line: Pick<CartLine, 'qtyText' | 'available'>): string | null {
  if (parseQty(line) !== null) return null
  return `Jumlah harus bilangan bulat 1 sampai ${line.available}`
}

export function usePosCart() {
  const lines = ref<CartLine[]>([])

  function add(item: PosItem, unit: PosUnit): AddResult {
    const key = `${item.itemId}:${unit.unitId}`
    const existing = lines.value.find((l) => l.key === key)
    if (existing) {
      const current = parseQty(existing)
      if (current !== null && current >= existing.available) return 'at-max'
      existing.qtyText = String((current ?? 0) + 1)
      existing.serverError = null
      return 'incremented'
    }
    if (lines.value.length >= MAX_CART_LINES) return 'cart-full'
    lines.value.push({
      key,
      itemId: item.itemId,
      unitId: unit.unitId,
      itemCode: item.itemCode,
      itemName: item.itemName,
      brandName: item.brandName,
      unitName: unit.unitName,
      unitPrice: unit.unitPrice ?? 0,
      available: unit.availableQuantity,
      restriction: item.saleRestriction,
      qtyText: '1',
      serverError: null,
      priceChange: null,
    })
    return 'added'
  }

  function remove(key: string) {
    lines.value = lines.value.filter((l) => l.key !== key)
  }

  function clear() {
    lines.value = []
  }

  function setQtyText(line: CartLine, value: string) {
    line.qtyText = value
    line.serverError = null
  }

  function step(line: CartLine, delta: number) {
    const next = (parseQty(line) ?? 0) + delta
    if (next < 1 || next > line.available) return
    setQtyText(line, String(next))
  }

  const totalCents = computed(() =>
    lines.value.reduce((sum, l) => sum + Math.round((parseQty(l) ?? 0) * toCents(l.unitPrice)), 0),
  )
  const total = computed(() => fromCents(totalCents.value))
  const hasPriceChange = computed(() => lines.value.some((l) => l.priceChange))
  const hasInvalidLine = computed(() => lines.value.some((l) => lineProblem(l) !== null))
  const canPay = computed(
    () =>
      lines.value.length > 0 &&
      !hasInvalidLine.value &&
      !hasPriceChange.value &&
      // Baris yang ditolak Billing (BIL_013/014) harus diubah qty-nya atau dihapus dulu.
      !lines.value.some((l) => l.serverError),
  )

  return {
    lines,
    total,
    totalCents,
    canPay,
    hasPriceChange,
    add,
    remove,
    clear,
    setQtyText,
    step,
  }
}
