import { defineStore } from 'pinia'
import { ref } from 'vue'
import { unitApi } from '../api/unit.api'
import type { Unit, UnitInput } from '../types/unit'

/** Store master data satuan obat. */
export const useUnitStore = defineStore('unit', () => {
  const items = ref<Unit[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      items.value = await unitApi.getUnits()
    } finally {
      loading.value = false
    }
  }

  async function create(input: UnitInput) {
    const created = await unitApi.createUnit(input)
    items.value = [created, ...items.value]
    return created
  }

  async function update(id: string, input: UnitInput) {
    const updated = await unitApi.updateUnit(id, input)
    items.value = items.value.map((u) => (u.id === id ? updated : u))
    return updated
  }

  async function remove(id: string) {
    await unitApi.deleteUnit(id)
    items.value = items.value.filter((u) => u.id !== id)
  }

  return { items, loading, fetchAll, create, update, remove }
})
