import axios from 'axios'
import { apiClient } from '@/api/client'
import type { ApiResponse, PaginationMeta } from '@/api/types'
import type {
  CurrentItemPrice,
  Item,
  ItemConversion,
  ItemInput,
  ItemSupplier,
  ItemUnitLink,
} from '../types/item'

// Shape dari backend — GET detail memakai nested objects, POST/PUT memakai IDs.
// Field numerik (kolom `numeric` di Postgres) dikirim sebagai string, mis. "10.00".
interface ApiItemNested {
  id?: string
  itemTypeId?: string
  categoryId?: string
  defaultUnitId?: string
  baseUnitId?: string
  drugGroupId?: string | null
  itemType?: { id: string }
  category?: { id: string; itemTypeId?: string }
  defaultUnit?: { id: string }
  drugGroup?: { id: string } | null
}

type ApiItem = Omit<
  Item,
  | 'itemTypeId'
  | 'categoryId'
  | 'defaultUnitId'
  | 'drugGroupId'
  | 'id'
  | 'minimumStock'
  | 'maximumStock'
  | 'reorderPoint'
  | 'currentPrice'
> &
  ApiItemNested & {
    minimumStock?: number | string | null
    maximumStock?: number | string | null
    reorderPoint?: number | string | null
  }

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  return Number(value)
}

// Beda dengan toNumber(): null di sini punya arti bisnis ("pakai default OTC/Resep"),
// jadi tidak boleh dipaksa jadi 0 — cuma string angka yang dikonversi.
function toNullableNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  return Number(value)
}

function fromApi(raw: ApiItem): Item {
  return {
    id: raw.id ?? '',
    itemCode: raw.itemCode,
    itemName: raw.itemName,
    itemTypeId: raw.itemType?.id ?? raw.itemTypeId ?? raw.category?.itemTypeId ?? '',
    categoryId: raw.category?.id ?? raw.categoryId ?? '',
    defaultUnitId: raw.defaultUnit?.id ?? raw.defaultUnitId ?? raw.baseUnitId ?? '',
    drugGroupId: raw.drugGroup?.id ?? raw.drugGroupId ?? '',
    barcode: raw.barcode ?? '',
    skuCode: raw.skuCode ?? '',
    minimumStock: toNumber(raw.minimumStock),
    maximumStock: toNumber(raw.maximumStock),
    reorderPoint: toNumber(raw.reorderPoint),
    trackBatch: raw.trackBatch ?? false,
    trackExpiry: raw.trackExpiry ?? false,
    prescriptionRequired: raw.prescriptionRequired ?? false,
    marginPercentage: toNullableNumber(raw.marginPercentage),
    isActive: raw.isActive ?? true,
    suppliers: raw.suppliers ?? [],
    currentPrice: null,
    conversions: raw.conversions ?? [],
  }
}

// Sub-resource: dikelola backend lewat endpoint terpisah, bukan bagian payload item.
interface ApiItemSupplier {
  supplierId: string
  isPrimary?: boolean
}

interface ApiItemPrice {
  purchasePrice?: number | string | null
  sellingPrice?: number | string | null
  marginPercentage?: number | string | null
  effectiveDate?: string | null
}

interface ApiItemConversion {
  fromUnitId: string
  toUnitId: string
  conversionFactor?: number | string | null
}

interface ApiItemUnit {
  id: string
  unitId: string
  isBaseUnit?: boolean
}

function fromApiPrice(raw: ApiItemPrice): CurrentItemPrice {
  return {
    purchasePrice: toNumber(raw.purchasePrice),
    sellingPrice: toNumber(raw.sellingPrice),
    marginPercentage: toNumber(raw.marginPercentage),
    effectiveDate: raw.effectiveDate ?? '',
  }
}

// purchasePrice dikirim lewat endpoint /prices terpisah (lihat addPrice), bukan
// bagian payload item — drugGroupId FK opsional juga dikirim undefined saat kosong
// karena backend menolak string kosong untuk @IsUUID().
function toCreatePayload(input: ItemInput) {
  const { purchasePrice: _purchasePrice, ...rest } = input
  return { ...rest, drugGroupId: input.drugGroupId || undefined }
}

export const itemApi = {
  /** `supplierId` memfilter ke item yang terdaftar pada supplier itu (item_supplier) — dipakai form Purchase Order. */
  async getAll(query?: { supplierId?: string; limit?: number }): Promise<Item[]> {
    const res = await apiClient.get<ApiResponse<ApiItem[]>>('/inventory/master/items', {
      params: {
        supplierId: query?.supplierId,
        limit: query?.limit ?? 100,
      },
    })
    return res.data.data.map(fromApi)
  },

  /**
   * Seluruh item milik satu supplier, tanpa batas — backend mem-paginasi
   * (maks. `limit=100` per halaman, lihat PaginationQueryDto), jadi di sini
   * di-loop per halaman sampai habis alih-alih memaksa limit besar yang akan
   * ditolak validasi.
   */
  async getAllForSupplier(supplierId: string): Promise<Item[]> {
    const limit = 100
    let page = 1
    const all: Item[] = []
    for (;;) {
      const res = await apiClient.get<ApiResponse<ApiItem[]> & { pagination: PaginationMeta }>(
        '/inventory/master/items',
        { params: { supplierId, page, limit } },
      )
      all.push(...res.data.data.map(fromApi))
      if (page >= res.data.pagination.totalPages) break
      page++
    }
    return all
  },

  /** Satuan yang terdaftar untuk item ini (master_item_unit) — dipakai dropdown satuan di baris Purchase Order. */
  async getUnits(id: string): Promise<ItemUnitLink[]> {
    const res = await apiClient.get<ApiResponse<ApiItemUnit[]>>(
      `/inventory/master/items/${id}/units`,
    )
    return res.data.data.map((r) => ({
      id: r.id,
      unitId: r.unitId,
      isBaseUnit: r.isBaseUnit ?? false,
    }))
  },

  async getById(id: string): Promise<Item> {
    const res = await apiClient.get<ApiResponse<ApiItem>>(`/inventory/master/items/${id}`)
    return fromApi(res.data.data)
  },

  async getSuppliers(id: string): Promise<ItemSupplier[]> {
    const res = await apiClient.get<ApiResponse<ApiItemSupplier[]>>(
      `/inventory/master/items/${id}/suppliers`,
    )
    return res.data.data.map((r) => ({
      supplierId: r.supplierId,
      isPrimary: r.isPrimary ?? false,
    }))
  },

  /** Harga aktif terkini item (1 harga per item, tanpa dimensi satuan), atau null kalau belum pernah diisi. */
  async getCurrentPrice(id: string): Promise<CurrentItemPrice | null> {
    try {
      const res = await apiClient.get<ApiResponse<ApiItemPrice>>(
        `/inventory/master/items/${id}/prices/current`,
      )
      return fromApiPrice(res.data.data)
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) return null
      throw err
    }
  },

  /** Tambah entri harga baru — harga jual & margin dihitung otomatis oleh backend. */
  async addPrice(id: string, input: { purchasePrice: number; effectiveDate: string }): Promise<CurrentItemPrice> {
    const res = await apiClient.post<ApiResponse<ApiItemPrice>>(
      `/inventory/master/items/${id}/prices`,
      { purchase_price: input.purchasePrice, effective_date: input.effectiveDate },
    )
    return fromApiPrice(res.data.data)
  },

  async getConversions(id: string): Promise<ItemConversion[]> {
    const res = await apiClient.get<ApiResponse<ApiItemConversion[]>>(
      `/inventory/master/items/${id}/conversions`,
    )
    return res.data.data.map((r) => ({
      fromUnitId: r.fromUnitId,
      toUnitId: r.toUnitId,
      factor: toNumber(r.conversionFactor),
    }))
  },

  async create(input: ItemInput): Promise<Item> {
    const res = await apiClient.post<ApiResponse<ApiItem>>(
      '/inventory/master/items',
      toCreatePayload(input),
    )
    return fromApi(res.data.data)
  },

  async update(id: string, input: ItemInput): Promise<Item> {
    const res = await apiClient.put<ApiResponse<ApiItem>>(
      `/inventory/master/items/${id}`,
      toCreatePayload(input),
    )
    return fromApi(res.data.data)
  },

  async activate(id: string): Promise<void> {
    await apiClient.patch(`/inventory/master/items/${id}/activate`)
  },

  async deactivate(id: string): Promise<void> {
    await apiClient.patch(`/inventory/master/items/${id}/deactivate`)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/inventory/master/items/${id}`)
  },
}
