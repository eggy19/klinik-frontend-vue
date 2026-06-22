export interface ItemSupplier {
  supplierId: string
  isPrimary: boolean
}

export interface ItemPrice {
  unitId: string
  purchasePrice: number
  sellingPrice: number
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
  barcode: string
  manufacturer: string
  minimumStock: number
  maximumStock: number
  reorderPoint: number
  trackBatch: boolean
  trackExpiry: boolean
  prescriptionRequired: boolean
  isActive: boolean
  suppliers: ItemSupplier[]
  prices: ItemPrice[]
  conversions: ItemConversion[]
}

export type ItemInput = Omit<Item, 'id' | 'isActive'>

export function emptyItem(): ItemInput {
  return {
    itemCode: '',
    itemName: '',
    itemTypeId: '',
    categoryId: '',
    defaultUnitId: '',
    barcode: '',
    manufacturer: '',
    minimumStock: 0,
    maximumStock: 0,
    reorderPoint: 0,
    trackBatch: false,
    trackExpiry: false,
    prescriptionRequired: false,
    suppliers: [],
    prices: [],
    conversions: [],
  }
}
