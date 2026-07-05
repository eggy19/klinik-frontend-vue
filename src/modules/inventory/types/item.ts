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

export interface ItemCategory {
  categoryId: string
  isPrimary: boolean
  categoryName: string
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
  currentStock: number
  minimumStock: number
  maximumStock: number
  reorderPoint: number
  trackBatch: boolean
  trackExpiry: boolean
  prescriptionRequired: boolean
  isActive: boolean
  expiryDate?: string
  description?: string
  suppliers: ItemSupplier[]
  prices: ItemPrice[]
  conversions: ItemConversion[]
  categorys: ItemCategory[]

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
    currentStock: 0,
    minimumStock: 0,
    maximumStock: 0,
    reorderPoint: 0,
    trackBatch: false,
    trackExpiry: false,
    prescriptionRequired: false,
    suppliers: [],
    prices: [],
    conversions: [],
    categorys: [],  
    description: '',  
  }
}
