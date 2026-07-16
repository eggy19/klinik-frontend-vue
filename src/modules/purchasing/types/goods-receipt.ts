import type { PurchaseOrderItem } from './purchase-order'

export interface GoodsReceiptItem {
  id: string
  purchaseOrderItemId: string
  itemId: string
  itemCode: string
  itemName: string
  unitId: string
  unitCode: string
  unitName: string
  batchNumber: string
  expiredDate: string | null
  quantity: number
  unitCost: number
}

export interface GoodsReceipt {
  id: string
  purchaseOrderId: string
  poNumber: string
  supplierName: string
  receiptNumber: string
  receivedAt: string
  note: string
  items: GoodsReceiptItem[]
}

export interface ReceiveGoodsItemInput {
  purchaseOrderItemId: string
  itemName: string
  /** Sisa qty yang masih bisa diterima, dalam satuan PO line — batas atas validasi form. */
  remainingQuantity: number
  unitId: string
  quantity: number
  unitCost: number
  batchNumber: string
  expiredDate: string
}

export interface ReceiveGoodsInput {
  note: string
  items: ReceiveGoodsItemInput[]
}

/** Baris default form penerimaan — satu per PO line yang masih punya sisa qty. */
export function receiveGoodsItemFromPoItem(poItem: PurchaseOrderItem): ReceiveGoodsItemInput {
  return {
    purchaseOrderItemId: poItem.id,
    itemName: poItem.itemName,
    remainingQuantity: poItem.quantity - poItem.receivedQuantity,
    unitId: poItem.unitId,
    quantity: poItem.quantity - poItem.receivedQuantity,
    unitCost: poItem.unitPrice,
    batchNumber: '',
    expiredDate: '',
  }
}

export interface QueryGoodsReceipt {
  page?: number
  limit?: number
  purchaseOrderId?: string
  supplierId?: string
  search?: string
}
