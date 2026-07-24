import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PaginationMeta } from '@/api/types'
import { goodsReceiptApi } from '../api/goods-receipt.api'
import type { GoodsReceipt, QueryGoodsReceipt, ReceiveGoodsInput } from '../types/goods-receipt'

export const useGoodsReceiptStore = defineStore('goodsReceipt', () => {
  const items = ref<GoodsReceipt[]>([])
  const loading = ref(false)
  const pagination = ref<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 })

  async function fetchAll(query: QueryGoodsReceipt = {}) {
    loading.value = true
    try {
      const res = await goodsReceiptApi.getAll(query)
      items.value = res.items
      pagination.value = res.pagination
    } finally {
      loading.value = false
    }
  }

  async function fetchForPo(poId: string) {
    return goodsReceiptApi.listForPurchaseOrder(poId)
  }

  async function createDraft(poId: string, input: ReceiveGoodsInput) {
    return goodsReceiptApi.createDraft(poId, input)
  }

  async function verify(id: string) {
    return goodsReceiptApi.verify(id)
  }

  async function deleteDraft(id: string) {
    return goodsReceiptApi.deleteDraft(id)
  }

  return { items, loading, pagination, fetchAll, fetchForPo, createDraft, verify, deleteDraft }
})
