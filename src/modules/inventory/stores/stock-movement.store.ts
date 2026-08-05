import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PaginationMeta } from '@/api/types'
import { stockMovementApi } from '../api/stock-movement.api'
import type { StockMovement, StockMovementQuery } from '../types/stock-movement'

export const useStockMovementStore = defineStore('stockMovement', () => {
  const items = ref<StockMovement[]>([])
  const loading = ref(false)
  const pagination = ref<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const lastQuery = ref<StockMovementQuery>({})

  async function fetchAll(query: StockMovementQuery = {}) {
    loading.value = true
    lastQuery.value = query
    try {
      const res = await stockMovementApi.getAll(query)
      items.value = res.items
      pagination.value = res.pagination
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    loading,
    pagination,
    lastQuery,
    fetchAll,
  }
})
