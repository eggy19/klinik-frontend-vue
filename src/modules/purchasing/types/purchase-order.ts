export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED'

export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Diajukan',
  APPROVED: 'Disetujui',
  PARTIALLY_RECEIVED: 'Diterima Sebagian',
  RECEIVED: 'Diterima Lengkap',
  CANCELLED: 'Dibatalkan',
}

export type TagVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'

export const PO_STATUS_VARIANT: Record<PurchaseOrderStatus, TagVariant> = {
  DRAFT: 'secondary',
  SUBMITTED: 'info',
  APPROVED: 'primary',
  PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'success',
  CANCELLED: 'danger',
}

export interface PurchaseOrderItem {
  id: string
  itemId: string
  itemCode: string
  itemName: string
  unitId: string
  unitCode: string
  unitName: string
  quantity: number
  unitPrice: number
  receivedQuantity: number
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplierName: string
  status: PurchaseOrderStatus
  totalAmount: number
  note: string
  submittedAt: string | null
  approvedAt: string | null
  cancelledAt: string | null
  createdAt: string
  items: PurchaseOrderItem[]
}

export interface PurchaseOrderItemInput {
  itemId: string
  unitId: string
  quantity: number
  unitPrice: number
}

export interface PurchaseOrderInput {
  supplierId: string
  note: string
  items: PurchaseOrderItemInput[]
}

export function emptyPurchaseOrderItem(): PurchaseOrderItemInput {
  return { itemId: '', unitId: '', quantity: 1, unitPrice: 0 }
}

export function emptyPurchaseOrder(): PurchaseOrderInput {
  return { supplierId: '', note: '', items: [] }
}

export type PurchaseOrderStatusGroup = 'DRAFT' | 'ACTIVE' | 'ARCHIVE'

export interface PurchaseOrderStats {
  totalActive: number
  pendingApproval: number
  monthlySpend: number
}

export interface QueryPurchaseOrder {
  page?: number
  limit?: number
  status?: PurchaseOrderStatus
  statusGroup?: PurchaseOrderStatusGroup
  supplierId?: string
  search?: string
}
