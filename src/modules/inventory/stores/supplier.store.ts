import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supplierApi } from '../api/supplier.api'
import type { Supplier, SupplierInput } from '../types/supplier'

export const useSupplierStore = defineStore('supplier', () => {
  const items = ref<Supplier[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      items.value = await supplierApi.getAll()
    } finally {
      loading.value = false
    }
  }

  async function create(input: SupplierInput) {
    const created = await supplierApi.create(input)
    items.value = [created, ...items.value]
    return created
  }

  async function update(id: string, input: SupplierInput) {
    const updated = await supplierApi.update(id, input)
    items.value = items.value.map((s) => (s.id === id ? updated : s))
    return updated
  }

  async function remove(id: string) {
    await supplierApi.remove(id)
    items.value = items.value.filter((s) => s.id !== id)
  }

  return { items, loading, fetchAll, create, update, remove }
})
