import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type { NotSellableReason, PosItem, PosUnit } from '../types/billing'

// Kontrak: billing-mvp-spec §7.3 — GET /inventory/pos/items (permission inventory.pos_item.read).

interface ApiPosUnit {
  unitId: string
  unitCode: string
  unitName: string
  isDefaultSales: boolean
  unitPrice: number | string | null
  availableQuantity: number | string
  sellable: boolean
  notSellableReason: NotSellableReason | null
}

interface ApiPosItem {
  itemId: string
  itemCode: string
  itemName: string
  brandName?: string | null
  barcode?: string | null
  saleRestriction: PosItem['saleRestriction']
  units?: ApiPosUnit[] | null
}

function fromApiUnit(raw: ApiPosUnit): PosUnit {
  return {
    unitId: raw.unitId,
    unitCode: raw.unitCode,
    unitName: raw.unitName,
    isDefaultSales: raw.isDefaultSales,
    unitPrice: raw.unitPrice === null || raw.unitPrice === undefined ? null : Number(raw.unitPrice),
    availableQuantity: Number(raw.availableQuantity),
    sellable: raw.sellable,
    notSellableReason: raw.notSellableReason ?? null,
  }
}

export const posApi = {
  async searchItems(q: string, limit = 20, signal?: AbortSignal): Promise<PosItem[]> {
    const res = await apiClient.get<ApiResponse<ApiPosItem[]>>('/inventory/pos/items', {
      params: { q, limit },
      signal,
    })
    return res.data.data.map((raw) => ({
      itemId: raw.itemId,
      itemCode: raw.itemCode,
      itemName: raw.itemName,
      brandName: raw.brandName ?? null,
      barcode: raw.barcode ?? null,
      saleRestriction: raw.saleRestriction,
      units: (raw.units ?? []).map(fromApiUnit),
    }))
  },
}
