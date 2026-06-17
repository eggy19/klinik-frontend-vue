import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { inventoryApi } from '../api/inventory.api'
import { daysUntil } from '@/utils/format'
import type { Medicine, MedicineInput } from '../types/medicine'

const NEAR_EXPIRY_DAYS = 90

/**
 * Store ringan untuk caching daftar obat. CRUD halaman boleh tidak masuk
 * store (docs/05), tapi list disimpan agar bisa dipakai bersama Dashboard.
 */
export const useInventoryStore = defineStore('inventory', () => {
  const items = ref<Medicine[]>([])
  const loading = ref(false)

  // Ringkasan untuk Dashboard.
  const totalItems = computed(() => items.value.length)
  const lowStockCount = computed(
    () => items.value.filter((m) => m.stock <= m.minStock).length,
  )
  const nearExpiredCount = computed(
    () =>
      items.value.filter((m) => {
        const d = daysUntil(m.expiryDate)
        return d >= 0 && d <= NEAR_EXPIRY_DAYS
      }).length,
  )

  async function fetchAll() {
    loading.value = true
    try {
      items.value = await inventoryApi.getMedicines()
    } finally {
      loading.value = false
    }
  }

  async function create(input: MedicineInput) {
    const created = await inventoryApi.createMedicine(input)
    items.value = [created, ...items.value]
    return created
  }

  async function update(id: string, input: MedicineInput) {
    const updated = await inventoryApi.updateMedicine(id, input)
    items.value = items.value.map((m) => (m.id === id ? updated : m))
    return updated
  }

  async function remove(id: string) {
    await inventoryApi.deleteMedicine(id)
    items.value = items.value.filter((m) => m.id !== id)
  }

  return {
    items,
    loading,
    totalItems,
    lowStockCount,
    nearExpiredCount,
    fetchAll,
    create,
    update,
    remove,
  }
})
