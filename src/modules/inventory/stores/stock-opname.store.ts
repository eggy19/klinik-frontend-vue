import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PaginationMeta } from '@/api/types'
import { stockOpnameApi } from '../api/stock-opname.api'
import type { CreateStockOpnameInput, StockOpname, StockOpnameQuery } from '../types/stock-opname'

export const useStockOpnameStore = defineStore('stockOpname', () => {
  const items = ref<StockOpname[]>([])
  const loading = ref(false)
  const pagination = ref<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const lastQuery = ref<StockOpnameQuery>({})

  const current = ref<StockOpname | null>(null)
  const currentLoading = ref(false)

  async function fetchAll(query: StockOpnameQuery = {}) {
    loading.value = true
    lastQuery.value = query
    try {
      const res = await stockOpnameApi.getAll(query)
      items.value = res.items
      pagination.value = res.pagination
    } finally {
      loading.value = false
    }
  }

  async function load(id: string) {
    currentLoading.value = true
    try {
      current.value = await stockOpnameApi.getById(id)
      return current.value
    } finally {
      currentLoading.value = false
    }
  }

  async function create(input: CreateStockOpnameInput) {
    const created = await stockOpnameApi.create(input)
    current.value = created
    return created
  }

  async function finalize(id: string) {
    const finalized = await stockOpnameApi.finalize(id)
    current.value = finalized
    return finalized
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
    finalize,
  }
})
