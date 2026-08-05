export interface ItemSupplier {
  supplierId: string
  isPrimary: boolean
}

/** Sama dengan backend DiscountType — dipakai ulang untuk margin (PERCENTAGE/FIXED). */
export type MarginType = 'PERCENTAGE' | 'FIXED'

export const MARGIN_TYPE_OPTIONS: { label: string; value: MarginType }[] = [
  { label: 'Persentase (%)', value: 'PERCENTAGE' },
  { label: 'Nominal (Rp)', value: 'FIXED' },
]

// Fase 2: harga & margin pindah dari level item ke level item+satuan
// (master_item_unit_price) — 1 item bisa punya harga beda per satuan
// (BOX vs STRIP). currentPrice di sini dipertahankan hanya untuk kompatibilitas
// endpoint /prices legacy (dikelola backend lewat baris satuan dasar); form
// item yang baru pakai ItemUnitRow.currentPrice per baris, lihat di bawah.
export interface CurrentItemPrice {
  purchasePrice: number
  sellingPrice: number
  marginType: MarginType
  marginValue: number
  effectiveDate: string
}

/** Harga aktif (baris terbaru & aktif) milik satu baris satuan item. */
export interface CurrentUnitPrice {
  purchasePrice: number
  marginType: MarginType | null
  marginValue: number | null
  sellingPrice: number
  effectiveDate: string
}

/** Satuan yang terdaftar untuk sebuah item (master_item_unit), dipakai untuk dropdown satuan di form Purchase Order & sebagai baris tab "Satuan & Harga". */
export interface ItemUnitRow {
  /** null = baris baru, belum tersimpan (belum ada master_item_unit.id). */
  unitLinkId: string | null
  unitId: string
  /** Berapa satuan dasar setara 1 satuan ini (satuan dasar selalu 1). */
  conversionFactor: number
  purchaseEnabled: boolean
  salesEnabled: boolean
  defaultPurchase: boolean
  defaultSales: boolean
  isBaseUnit: boolean
  /** Input harga beli baru untuk baris ini (dikirim lewat POST .../units/:id/prices saat disimpan). */
  purchasePrice: number | null
  /** Override margin khusus satuan ini; null = pakai fallback (margin item lalu default OTC/Resep). */
  marginType: MarginType | null
  marginValue: number | null
  /** Harga aktif tersimpan di server saat form dimuat (null kalau belum pernah diisi). */
  currentPrice: CurrentUnitPrice | null
}

export interface Item {
  id: string
  itemCode: string
  itemName: string
  itemTypeId: string
  categoryId: string
  defaultUnitId: string
  drugGroupId: string
  barcode: string
  skuCode: string
  minimumStock: number
  maximumStock: number
  reorderPoint: number
  trackBatch: boolean
  trackExpiry: boolean
  prescriptionRequired: boolean
  /** Override margin khusus item ini; null (keduanya) = pakai default OTC/Resep dari Pengaturan Margin. */
  marginType: MarginType | null
  marginValue: number | null
  isActive: boolean
  suppliers: ItemSupplier[]
  currentPrice: CurrentItemPrice | null
}

export type ItemInput = Omit<Item, 'id' | 'isActive' | 'currentPrice'> & {
  units: ItemUnitRow[]
}

export function emptyItem(): ItemInput {
  return {
    itemCode: '',
    itemName: '',
    itemTypeId: '',
    categoryId: '',
    defaultUnitId: '',
    drugGroupId: '',
    barcode: '',
    skuCode: '',
    minimumStock: 0,
    maximumStock: 0,
    reorderPoint: 0,
    trackBatch: false,
    trackExpiry: false,
    prescriptionRequired: false,
    marginType: null,
    marginValue: null,
    suppliers: [],
    units: [
      {
        unitLinkId: null,
        unitId: '',
        conversionFactor: 1,
        purchaseEnabled: true,
        salesEnabled: true,
        defaultPurchase: true,
        defaultSales: true,
        isBaseUnit: true,
        purchasePrice: null,
        marginType: null,
        marginValue: null,
        currentPrice: null,
      },
    ],
  }
}
