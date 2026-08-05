/** Snapshot satu baris alokasi FEFO (backend: InventoryService.deductStockFEFO). */
export interface BatchAllocationRow {
  batchId: string
  batchNumber: string
  quantity: number
  unitCost: number
}

export interface DispensingItem {
  id: string
  itemId: string
  itemName: string
  itemCode: string
  /** null = baris legacy/tanpa satuan eksplisit — quantity langsung dalam satuan dasar. */
  unitId: string | null
  unitName: string | null
  /** Qty mentah sebagaimana diinput dalam unitId, sebelum konversi. null bila unitId null. */
  inputQuantity: number | null
  /** Qty dalam satuan dasar — dipakai untuk deduksi stok FEFO. */
  quantity: number
  /** Snapshot harga jual per satuan input saat dispensing. null bila belum ada harga. */
  unitPrice: number | null
  subtotal: number | null
  batchAllocation: BatchAllocationRow[]
}

export interface Dispensing {
  id: string
  dispensingNumber: string
  prescriptionId: string | null
  patientId: string | null
  note: string | null
  createdAt: string
  items?: DispensingItem[]
}

export interface DispensingQuery {
  page?: number
  limit?: number
  search?: string
}

export interface CreateDispensingItemInput {
  itemId: string
  /** Kosong = satuan dasar (perilaku lama, backward compatible). */
  unitId?: string
  quantity: number
}

/** patientId/prescriptionId sengaja tidak ada di form manual — nanti datang dari clinical service. */
export interface CreateDispensingInput {
  dispensingNumber: string
  note?: string
  items: CreateDispensingItemInput[]
}
