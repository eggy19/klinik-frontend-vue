import type { PurchaseOrderItem, TagVariant } from './purchase-order'

export type GoodsReceiptStatus = 'DRAFT' | 'VERIFIED'

export const GR_STATUS_LABELS: Record<GoodsReceiptStatus, string> = {
  DRAFT: 'Draft',
  VERIFIED: 'Terverifikasi',
}

export const GR_STATUS_VARIANT: Record<GoodsReceiptStatus, TagVariant> = {
  DRAFT: 'secondary',
  VERIFIED: 'success',
}

/** Global discount (goods_receipt) dan item discount (goods_receipt_item) bersifat
 *  saling eksklusif dalam satu goods receipt (lihat backend INV_047). */
export type DiscountType = 'PERCENTAGE' | 'FIXED'

export const DISCOUNT_TYPE_OPTIONS: { label: string; value: DiscountType }[] = [
  { label: 'Persentase (%)', value: 'PERCENTAGE' },
  { label: 'Nominal (Rp)', value: 'FIXED' },
]

/** Mode diskon di form — hanya konsep UI, tidak dikirim langsung ke API. */
export type ReceiptDiscountMode = 'NONE' | 'GLOBAL' | 'PER_ITEM'

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
  subtotal: number
  discountType: DiscountType | null
  discountValue: number | null
  discountAmount: number | null
  totalAmount: number
}

export interface GoodsReceipt {
  id: string
  purchaseOrderId: string
  poNumber: string
  supplierName: string
  receiptNumber: string
  status: GoodsReceiptStatus
  receivedAt: string
  verifiedAt: string | null
  note: string
  subtotal: number
  discountType: DiscountType | null
  discountValue: number | null
  discountAmount: number | null
  taxRate: number | null
  taxAmount: number | null
  grandTotal: number
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
  discountType: DiscountType | null
  discountValue: number | null
}

export interface ReceiveGoodsInput {
  note: string
  discountType: DiscountType | null
  discountValue: number | null
  taxRate: number | null
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
    discountType: null,
    discountValue: null,
  }
}

export interface QueryGoodsReceipt {
  page?: number
  limit?: number
  purchaseOrderId?: string
  supplierId?: string
  search?: string
}
