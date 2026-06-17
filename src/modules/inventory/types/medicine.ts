export type MedicineCategory = 'Obat Bebas' | 'Obat Keras' | 'Obat Bebas Terbatas' | 'Alkes'

export interface Medicine {
  id: string
  code: string
  name: string
  category: MedicineCategory
  unit: string
  stock: number
  minStock: number
  price: number
  expiryDate: string // ISO date
  supplier: string
}

/** Payload form (tanpa id, dipakai create/edit). */
export type MedicineInput = Omit<Medicine, 'id'>

export const MEDICINE_CATEGORIES: MedicineCategory[] = [
  'Obat Bebas',
  'Obat Bebas Terbatas',
  'Obat Keras',
  'Alkes',
]

export type StockStatus = 'normal' | 'low' | 'critical'

/**
 * Status stok berdasarkan stok minimum:
 * - critical: stok <= setengah stok minimum (atau habis) → merah
 * - low: stok <= stok minimum → kuning
 * - normal: di atas stok minimum → default
 */
export function getStockStatus(item: Pick<Medicine, 'stock' | 'minStock'>): StockStatus {
  if (item.stock <= 0 || item.stock <= item.minStock * 0.5) return 'critical'
  if (item.stock <= item.minStock) return 'low'
  return 'normal'
}

export function emptyMedicine(): MedicineInput {
  return {
    code: '',
    name: '',
    category: 'Obat Bebas',
    unit: 'Tablet',
    stock: 0,
    minStock: 0,
    price: 0,
    expiryDate: '',
    supplier: '',
  }
}
