export interface ItemSupplier {
  supplierId: string
  isPrimary: boolean
}

// Backend hanya simpan 1 harga aktif per item (tanpa dimensi satuan) —
// selling/margin selalu turunan server-side, tidak diinput manual.
export interface CurrentItemPrice {
  purchasePrice: number
  sellingPrice: number
  marginPercentage: number
  effectiveDate: string
}

export interface ItemConversion {
  fromUnitId: string
  toUnitId: string
  factor: number
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
  manufacturer: string
  minimumStock: number
  maximumStock: number
  reorderPoint: number
  trackBatch: boolean
  trackExpiry: boolean
  prescriptionRequired: boolean
  /** Override margin % khusus item ini; null = pakai default OTC/Resep dari Pengaturan Margin. */
  marginPercentage: number | null
  isActive: boolean
  suppliers: ItemSupplier[]
  currentPrice: CurrentItemPrice | null
  conversions: ItemConversion[]
}

export type ItemInput = Omit<Item, 'id' | 'isActive' | 'currentPrice'> & {
  purchasePrice: number
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
    manufacturer: '',
    minimumStock: 0,
    maximumStock: 0,
    reorderPoint: 0,
    trackBatch: false,
    trackExpiry: false,
    prescriptionRequired: false,
    marginPercentage: null,
    suppliers: [],
    purchasePrice: 0,
    conversions: [],
  }
}
