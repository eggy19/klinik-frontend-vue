import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PaginationMeta } from '@/api/types'
import { batchApi } from '../api/batch.api'
import type { BatchStats, InventoryBatch, QueryBatch } from '../types/batch'

export const useInventoryBatchStore = defineStore('inventoryBatch', () => {
  const items = ref<InventoryBatch[]>([])
  const loading = ref(false)
  const pagination = ref<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const lastQuery = ref<QueryBatch>({})
  const stats = ref<BatchStats>({
    totalBatch: 0,
    activeBatch: 0,
    emptyBatch: 0,
    expiringSoon: 0,
    expiredBatch: 0,
    totalQuantity: 0,
  })
  const statsLoading = ref(false)

  async function fetchAll(query: QueryBatch = {}) {
    loading.value = true
    lastQuery.value = query
    try {
      const res = await batchApi.getAll(query)
      items.value = res.items
      pagination.value = res.pagination
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string) {
    return batchApi.getById(id)
  }

  async function fetchStats(expiryThresholdDays?: number) {
    statsLoading.value = true
    try {
      stats.value = await batchApi.getStats(expiryThresholdDays)
    } finally {
      statsLoading.value = false
    }
  }

  return {
    items,
    loading,
    pagination,
    lastQuery,
    stats,
    statsLoading,
    fetchAll,
    fetchOne,
    fetchStats,
  }
})
