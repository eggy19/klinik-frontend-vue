<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import { formatDateTime } from '@/utils/format'
import { useGoodsReceiptStore } from '../stores/goods-receipt.store'
import type { GoodsReceipt } from '../types/goods-receipt'

const router = useRouter()
const store = useGoodsReceiptStore()

const columns: DataTableColumn[] = [
  { field: 'receiptNumber', header: 'No. Penerimaan' },
  { field: 'poNumber', header: 'No. PO' },
  { field: 'supplierName', header: 'Supplier' },
  { field: 'receivedAt', header: 'Tanggal Diterima' },
]

function fetch(page = 1, limit = 20, search = '') {
  store.fetchAll({ page, limit, search: search || undefined })
}

function onPage(e: { page: number; rows: number }) {
  fetch(e.page, e.rows)
}

function onSearch(term: string) {
  fetch(1, store.pagination.limit, term)
}

function goDetail(gr: GoodsReceipt) {
  router.push(`/inventory/goods-receipts/${gr.id}`)
}

onMounted(() => fetch())
</script>

<template>
  <div class="gr-list">
    <div class="gr-list__head">
      <h1 class="gr-list__title">Goods Receipt</h1>
    </div>

    <BaseCard>
      <BaseDataTable
        :value="store.items"
        :columns="columns"
        :loading="store.loading"
        lazy
        :total-records="store.pagination.total"
        search-placeholder="Cari No. Penerimaan..."
        empty-title="Belum ada penerimaan barang"
        empty-description="Penerimaan barang tercatat setelah PO yang disetujui diterima."
        @page="onPage"
        @search="onSearch"
      >
        <template #cell-receivedAt="{ data }">
          {{ formatDateTime(data.receivedAt) }}
        </template>

        <template #row-actions="{ data }">
          <BaseButton icon="pi pi-eye" variant="ghost" rounded aria-label="Detail" @click="goDetail(data)" />
        </template>
      </BaseDataTable>
    </BaseCard>
  </div>
</template>

<style scoped>
.gr-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.gr-list__title {
  font-size: var(--font-2xl);
  color: var(--text);
}
</style>
