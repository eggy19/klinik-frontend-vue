import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { itemApi } from '../api/item.api'
import type { Item, ItemInput } from '../types/item'

export const useItemStore = defineStore('item', () => {
  const items = ref<Item[]>([])
  const loading = ref(false)

  const totalItems = computed(() => items.value.length)
  const activeCount = computed(() => items.value.filter((i) => i.isActive).length)

  async function fetchAll() {
    loading.value = true
    try {
      items.value = await itemApi.getAll()
    } finally {
      loading.value = false
    }
  }

  async function create(input: ItemInput) {
    const created = await itemApi.create(input)
    items.value = [created, ...items.value]
    return created
  }

  async function update(id: string, input: ItemInput) {
    const updated = await itemApi.update(id, input)
    items.value = items.value.map((i) => (i.id === id ? updated : i))
    return updated
  }

  async function activate(id: string) {
    await itemApi.activate(id)
    items.value = items.value.map((i) => (i.id === id ? { ...i, isActive: true } : i))
  }

  async function deactivate(id: string) {
    await itemApi.deactivate(id)
    items.value = items.value.map((i) => (i.id === id ? { ...i, isActive: false } : i))
  }

  async function remove(id: string) {
    await itemApi.remove(id)
    items.value = items.value.filter((i) => i.id !== id)
  }

  return { items, loading, totalItems, activeCount, fetchAll, create, update, activate, deactivate, remove }
})
