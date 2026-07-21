import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PaginationMeta } from '@/api/types'
import { purchaseOrderApi } from '../api/purchase-order.api'
import type {
  PurchaseOrder,
  PurchaseOrderInput,
  PurchaseOrderStats,
  QueryPurchaseOrder,
} from '../types/purchase-order'

export const usePurchaseOrderStore = defineStore('purchaseOrder', () => {
  const items = ref<PurchaseOrder[]>([])
  const loading = ref(false)
  const pagination = ref<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const lastQuery = ref<QueryPurchaseOrder>({})
  const stats = ref<PurchaseOrderStats>({ totalActive: 0, pendingApproval: 0, monthlySpend: 0 })
  const statsLoading = ref(false)

  async function fetchAll(query: QueryPurchaseOrder = {}) {
    loading.value = true
    lastQuery.value = query
    try {
      const res = await purchaseOrderApi.getAll(query)
      items.value = res.items
      pagination.value = res.pagination
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string) {
    return purchaseOrderApi.getById(id)
  }

  async function fetchStats() {
    statsLoading.value = true
    try {
      stats.value = await purchaseOrderApi.getStats()
    } finally {
      statsLoading.value = false
    }
  }

  async function create(input: PurchaseOrderInput) {
    const created = await purchaseOrderApi.create(input)
    items.value = [created, ...items.value]
    return created
  }

  async function update(id: string, input: PurchaseOrderInput) {
    const updated = await purchaseOrderApi.update(id, input)
    items.value = items.value.map((po) => (po.id === id ? updated : po))
    return updated
  }

  async function submit(id: string) {
    const updated = await purchaseOrderApi.submit(id)
    items.value = items.value.map((po) => (po.id === id ? updated : po))
    return updated
  }

  async function approve(id: string) {
    const updated = await purchaseOrderApi.approve(id)
    items.value = items.value.map((po) => (po.id === id ? updated : po))
    return updated
  }

  async function cancel(id: string) {
    const updated = await purchaseOrderApi.cancel(id)
    items.value = items.value.map((po) => (po.id === id ? updated : po))
    return updated
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
    create,
    update,
    submit,
    approve,
    cancel,
  }
})
