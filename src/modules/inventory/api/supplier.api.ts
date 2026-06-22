import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type { Supplier, SupplierInput } from '../types/supplier'

interface ApiSupplier {
  id: string
  supplierCode: string
  supplierName: string
  phone: string
  email: string
  address: string
}

function fromApi(raw: ApiSupplier): Supplier {
  return {
    id: raw.id,
    code: raw.supplierCode,
    name: raw.supplierName,
    phone: raw.phone,
    email: raw.email,
    address: raw.address,
  }
}

function toApi(input: SupplierInput): Omit<ApiSupplier, 'id'> {
  return {
    supplierCode: input.code,
    supplierName: input.name,
    phone: input.phone,
    email: input.email,
    address: input.address,
  }
}

export const supplierApi = {
  async getAll(): Promise<Supplier[]> {
    const res = await apiClient.get<ApiResponse<ApiSupplier[]>>('/master/suppliers')
    return res.data.data.map(fromApi)
  },

  async create(input: SupplierInput): Promise<Supplier> {
    const res = await apiClient.post<ApiResponse<ApiSupplier>>('/master/suppliers', toApi(input))
    return fromApi(res.data.data)
  },

  async update(id: string, input: SupplierInput): Promise<Supplier> {
    const res = await apiClient.put<ApiResponse<ApiSupplier>>(`/master/suppliers/${id}`, toApi(input))
    return fromApi(res.data.data)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/master/suppliers/${id}`)
  },
}
