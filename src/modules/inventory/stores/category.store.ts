import { defineStore } from 'pinia'
import { ref } from 'vue'
import { categoryApi } from '../api/category.api'
import type { Category, CategoryInput } from '../types/category'

/** Store master data kategori obat. */
export const useCategoryStore = defineStore('category', () => {
  const items = ref<Category[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      items.value = await categoryApi.getCategories()
    } finally {
      loading.value = false
    }
  }

  async function create(input: CategoryInput) {
    const created = await categoryApi.createCategory(input)
    items.value = [created, ...items.value]
    return created
  }

  async function update(id: string, input: CategoryInput) {
    const updated = await categoryApi.updateCategory(id, input)
    items.value = items.value.map((c) => (c.id === id ? updated : c))
    return updated
  }

  async function remove(id: string) {
    await categoryApi.deleteCategory(id)
    items.value = items.value.filter((c) => c.id !== id)
  }

  return { items, loading, fetchAll, create, update, remove }
})
