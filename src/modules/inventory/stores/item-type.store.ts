import { defineStore } from 'pinia'
import { ref } from 'vue'
import { itemTypeApi } from '../api/item-type.api'
import type { ItemType, ItemTypeInput } from '../types/item-type'

export const useItemTypeStore = defineStore('item-type', () => {
  const items = ref<ItemType[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      items.value = await itemTypeApi.getAll()
    } finally {
      loading.value = false
    }
  }

  async function create(input: ItemTypeInput) {
    const created = await itemTypeApi.create(input)
    items.value = [created, ...items.value]
    return created
  }

  async function update(id: string, input: ItemTypeInput) {
    const updated = await itemTypeApi.update(id, input)
    items.value = items.value.map((t) => (t.id === id ? updated : t))
    return updated
  }

  async function remove(id: string) {
    await itemTypeApi.remove(id)
    items.value = items.value.filter((t) => t.id !== id)
  }

  return { items, loading, fetchAll, create, update, remove }
})
