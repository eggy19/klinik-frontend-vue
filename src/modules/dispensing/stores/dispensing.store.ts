import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PaginationMeta } from '@/api/types'
import { dispensingApi } from '../api/dispensing.api'
import type { CreateDispensingInput, Dispensing, DispensingQuery } from '../types/dispensing'

export const useDispensingStore = defineStore('dispensing', () => {
  const items = ref<Dispensing[]>([])
  const loading = ref(false)
  const pagination = ref<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const lastQuery = ref<DispensingQuery>({})

  const current = ref<Dispensing | null>(null)
  const currentLoading = ref(false)

  async function fetchAll(query: DispensingQuery = {}) {
    loading.value = true
    lastQuery.value = query
    try {
      const res = await dispensingApi.getAll(query)
      items.value = res.items
      pagination.value = res.pagination
    } finally {
      loading.value = false
    }
  }

  async function load(id: string) {
    currentLoading.value = true
    try {
      current.value = await dispensingApi.getById(id)
      return current.value
    } finally {
      currentLoading.value = false
    }
  }

  async function create(input: CreateDispensingInput) {
    const created = await dispensingApi.create(input)
    current.value = created
    return created
  }

  return {
    items,
    loading,
    pagination,
    lastQuery,
    current,
    currentLoading,
    fetchAll,
    load,
    create,
  }
})
