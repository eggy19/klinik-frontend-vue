import axios from 'axios'
import { apiClient } from '@/api/client'
import type { ApiResponse, PaginationMeta } from '@/api/types'
import type {
  CurrentItemPrice,
  CurrentUnitPrice,
  Item,
  ItemInput,
  ItemSupplier,
  ItemUnitRow,
  MarginType,
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
    marginType: raw.marginType ?? null,
    marginValue: toNullableNumber(raw.marginValue),
    isActive: raw.isActive ?? true,
    suppliers: raw.suppliers ?? [],
    currentPrice: null,
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
  marginType?: MarginType | null
  marginValue?: number | string | null
  effectiveDate?: string | null
}

// Baris master_item_unit_price bersarang di dalam ApiItemUnit.currentPrice
// (lihat ItemUnitService.list — join current_price per baris satuan).
interface ApiItemUnitPrice {
  purchasePrice?: number | string | null
  marginType?: MarginType | null
  marginValue?: number | string | null
  sellingPrice?: number | string | null
  effectiveDate?: string | null
}

interface ApiItemUnit {
  id: string
  unitId: string
  isBaseUnit?: boolean
  conversionFactor?: number | string | null
  purchaseEnabled?: boolean
  salesEnabled?: boolean
  defaultPurchase?: boolean
  defaultSales?: boolean
  currentPrice?: ApiItemUnitPrice | null
}

function fromApiPrice(raw: ApiItemPrice): CurrentItemPrice {
  return {
    purchasePrice: toNumber(raw.purchasePrice),
    sellingPrice: toNumber(raw.sellingPrice),
    marginType: raw.marginType ?? 'PERCENTAGE',
    marginValue: toNumber(raw.marginValue),
    effectiveDate: raw.effectiveDate ?? '',
  }
}

function fromApiUnitPrice(raw: ApiItemUnitPrice): CurrentUnitPrice {
  return {
    purchasePrice: toNumber(raw.purchasePrice),
    marginType: raw.marginType ?? null,
    marginValue: toNullableNumber(raw.marginValue),
    sellingPrice: toNumber(raw.sellingPrice),
    effectiveDate: raw.effectiveDate ?? '',
  }
}

function fromApiUnit(raw: ApiItemUnit): ItemUnitRow {
  const currentPrice = raw.currentPrice ? fromApiUnitPrice(raw.currentPrice) : null
  return {
    unitLinkId: raw.id,
    unitId: raw.unitId,
    conversionFactor: raw.conversionFactor != null ? toNumber(raw.conversionFactor) : 1,
    purchaseEnabled: raw.purchaseEnabled ?? true,
    salesEnabled: raw.salesEnabled ?? true,
    defaultPurchase: raw.defaultPurchase ?? false,
    defaultSales: raw.defaultSales ?? false,
    isBaseUnit: raw.isBaseUnit ?? false,
    purchasePrice: currentPrice?.purchasePrice ?? null,
    marginType: currentPrice?.marginType ?? null,
    marginValue: currentPrice?.marginValue ?? null,
    currentPrice,
  }
}

// purchasePrice/margin per satuan dikirim lewat endpoint /units/:id/prices
// terpisah (lihat addUnitPrice), bukan bagian payload item — drugGroupId FK
// opsional juga dikirim undefined saat kosong karena backend menolak string
// kosong untuk @IsUUID().
function toCreatePayload(input: ItemInput) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { units: _units, ...rest } = input
  return { ...rest, drugGroupId: input.drugGroupId || undefined }
}

export interface ItemUnitWritePayload {
  unitId: string
  isBaseUnit?: boolean
  conversionFactor: number
  purchaseEnabled: boolean
  salesEnabled: boolean
  defaultPurchase: boolean
  defaultSales: boolean
}

export interface ItemUnitPriceWritePayload {
  purchasePrice: number
  marginType?: MarginType | null
  marginValue?: number | null
  effectiveDate?: string
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

  /** Satuan yang terdaftar untuk item ini (master_item_unit), masing-masing membawa harga aktifnya — dipakai dropdown satuan Purchase Order & tab "Satuan & Harga". */
  async getUnits(id: string): Promise<ItemUnitRow[]> {
    const res = await apiClient.get<ApiResponse<ApiItemUnit[]>>(
      `/inventory/master/items/${id}/units`,
    )
    return res.data.data.map(fromApiUnit)
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

  /** Harga aktif terkini item (endpoint legacy — sudah di-rewire backend ke baris satuan dasar), atau null kalau belum pernah diisi. Dipakai prefill harga di form Purchase Order/Goods Receipt. */
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

  /** Daftarkan satuan baru untuk item (master_item_unit). */
  async addUnit(itemId: string, input: ItemUnitWritePayload): Promise<ItemUnitRow> {
    const res = await apiClient.post<ApiResponse<ApiItemUnit>>(
      `/inventory/master/items/${itemId}/units`,
      {
        unit_id: input.unitId,
        is_base_unit: input.isBaseUnit,
        conversion_factor: input.conversionFactor,
        purchase_enabled: input.purchaseEnabled,
        sales_enabled: input.salesEnabled,
        default_purchase: input.defaultPurchase,
        default_sales: input.defaultSales,
      },
    )
    return fromApiUnit(res.data.data)
  },

  /** Ubah faktor konversi / flag beli-jual-default satuan. Perubahan faktor ditolak backend (INV_025) kalau item sudah dipakai di transaksi. */
  async updateUnit(
    itemId: string,
    unitLinkId: string,
    input: Partial<Omit<ItemUnitWritePayload, 'unitId' | 'isBaseUnit'>>,
  ): Promise<ItemUnitRow> {
    const res = await apiClient.patch<ApiResponse<ApiItemUnit>>(
      `/inventory/master/items/${itemId}/units/${unitLinkId}`,
      {
        conversion_factor: input.conversionFactor,
        purchase_enabled: input.purchaseEnabled,
        sales_enabled: input.salesEnabled,
        default_purchase: input.defaultPurchase,
        default_sales: input.defaultSales,
      },
    )
    return fromApiUnit(res.data.data)
  },

  /** Hapus satuan non-dasar dari item. */
  async removeUnit(itemId: string, unitLinkId: string): Promise<void> {
    await apiClient.delete(`/inventory/master/items/${itemId}/units/${unitLinkId}`)
  },

  /** Tambah entri harga baru untuk satuan tertentu — harga jual dihitung otomatis oleh backend dari margin (baris ini, override item, atau default OTC/Resep). */
  async addUnitPrice(
    itemId: string,
    unitLinkId: string,
    input: ItemUnitPriceWritePayload,
  ): Promise<CurrentUnitPrice> {
    const res = await apiClient.post<ApiResponse<ApiItemUnitPrice>>(
      `/inventory/master/items/${itemId}/units/${unitLinkId}/prices`,
      {
        purchase_price: input.purchasePrice,
        margin_type: input.marginType ?? undefined,
        margin_value: input.marginValue ?? undefined,
        effective_date: input.effectiveDate ?? new Date().toISOString().slice(0, 10),
        is_active: true,
      },
    )
    return fromApiUnitPrice(res.data.data)
  },

  /** Harga aktif satuan tertentu, atau null kalau belum pernah diisi. */
  async getUnitPriceCurrent(itemId: string, unitLinkId: string): Promise<CurrentUnitPrice | null> {
    try {
      const res = await apiClient.get<ApiResponse<ApiItemUnitPrice>>(
        `/inventory/master/items/${itemId}/units/${unitLinkId}/prices/current`,
      )
      return fromApiUnitPrice(res.data.data)
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) return null
      throw err
    }
  },
}
