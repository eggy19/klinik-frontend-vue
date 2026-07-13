import { defineStore } from 'pinia'
import { ref } from 'vue'
import { drugGroupApi } from '../api/drug-group.api'
import type { DrugGroup, DrugGroupInput } from '../types/drug-group'

/** Store master data golongan obat. */
export const useDrugGroupStore = defineStore('drugGroup', () => {
  const items = ref<DrugGroup[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      items.value = await drugGroupApi.getDrugGroups()
    } finally {
      loading.value = false
    }
  }

  async function create(input: DrugGroupInput) {
    const created = await drugGroupApi.createDrugGroup(input)
    items.value = [created, ...items.value]
    return created
  }

  async function update(id: string, input: DrugGroupInput) {
    const updated = await drugGroupApi.updateDrugGroup(id, input)
    items.value = items.value.map((g) => (g.id === id ? updated : g))
    return updated
  }

  async function remove(id: string) {
    await drugGroupApi.deleteDrugGroup(id)
    items.value = items.value.filter((g) => g.id !== id)
  }

  return { items, loading, fetchAll, create, update, remove }
})
