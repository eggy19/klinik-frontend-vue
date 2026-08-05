import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PaginationMeta } from '@/api/types'
import { stockApi } from '../api/stock.api'
import type { StockSummaryQuery, StockSummaryRow } from '../types/stock'

export const useStockSummaryStore = defineStore('stockSummary', () => {
  const items = ref<StockSummaryRow[]>([])
  const loading = ref(false)
  const pagination = ref<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const lastQuery = ref<StockSummaryQuery>({})
  const lowStockCount = ref(0)
  const lowStockLoading = ref(false)

  async function fetchAll(query: StockSummaryQuery = {}) {
    loading.value = true
    lastQuery.value = query
    try {
      const res = await stockApi.getSummary(query)
      items.value = res.items
      pagination.value = res.pagination
    } finally {
      loading.value = false
    }
  }

  /** Reads only the total count of a low_stock=true query, without touching the table's items/pagination. */
  async function fetchLowStockCount() {
    lowStockLoading.value = true
    try {
      const res = await stockApi.getSummary({ lowStock: true, limit: 1 })
      lowStockCount.value = res.pagination.total
    } finally {
      lowStockLoading.value = false
    }
  }

  return {
    items,
    loading,
    pagination,
    lastQuery,
    lowStockCount,
    lowStockLoading,
    fetchAll,
    fetchLowStockCount,
  }
})
