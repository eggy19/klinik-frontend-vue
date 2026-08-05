<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseSummaryCard from '@/components/base/BaseSummaryCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import { formatDate, daysUntil } from '@/utils/format'
import { useStockSummaryStore } from '../stores/stock.store'
import { useInventoryBatchStore } from '../stores/batch.store'

const router = useRouter()
const store = useStockSummaryStore()
const batchStore = useInventoryBatchStore()

const columns: DataTableColumn[] = [
  { field: 'itemName', header: 'Item' },
  { field: 'itemCode', header: 'Kode Item' },
  { field: 'totalQuantity', header: 'Total Qty', sortable: true },
  { field: 'unitName', header: 'Satuan' },
  { field: 'batchCount', header: 'Jumlah Batch', sortable: true },
  { field: 'nearestExpiry', header: 'Kadaluarsa Terdekat' },
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

function goToBatches(itemId: string) {
  router.push({ path: '/inventory/management/batch', query: { item_id: itemId } })
}

function expiryHint(nearestExpiry: string | null): string {
  if (!nearestExpiry) return ''
  const days = daysUntil(nearestExpiry)
  if (days < 0) return 'kadaluarsa'
  return `${days} hari lagi`
}

onMounted(() => {
  fetch()
  batchStore.fetchStats()
  store.fetchLowStockCount()
})
</script>

<template>
  <div class="stock-list">
    <div class="stock-list__head">
      <h1 class="stock-list__title">Stock</h1>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <BaseSummaryCard
        title="Total Item"
        :value="store.pagination.total"
        icon="pi pi-box"
        variant="info"
        :loading="store.loading"
      />
      <BaseSummaryCard
        title="Total Qty (Semua Batch)"
        :value="batchStore.stats.totalQuantity"
        icon="pi pi-chart-bar"
        variant="primary"
        :loading="batchStore.statsLoading"
      />
      <BaseSummaryCard
        title="Stok Rendah"
        :value="store.lowStockCount"
        icon="pi pi-exclamation-triangle"
        variant="warning"
        :loading="store.lowStockLoading"
      />
    </div>

    <BaseCard>
      <BaseDataTable
        :value="store.items"
        :columns="columns"
        :loading="store.loading"
        lazy
        :total-records="store.pagination.total"
        search-placeholder="Cari item..."
        export-filename="stock-summary"
        empty-title="Belum ada stok"
        empty-description="Stok akan muncul di sini setelah ada batch yang diterima."
        @page="onPage"
        @search="onSearch"
      >
        <template #cell-itemName="{ data }">
          <div class="stock-list__item">
            <span>{{ data.itemName }}</span>
            <BaseTag v-if="data.belowMinimum" value="Stok Rendah" variant="warning" />
          </div>
        </template>

        <template #cell-totalQuantity="{ data }">
          {{ data.totalQuantity.toLocaleString('id-ID', { maximumFractionDigits: 4 }) }}
        </template>

        <template #cell-nearestExpiry="{ data }">
          <div v-if="data.nearestExpiry" class="stock-list__expiry">
            <span>{{ formatDate(data.nearestExpiry) }}</span>
            <span class="stock-list__expiry-hint">{{ expiryHint(data.nearestExpiry) }}</span>
          </div>
          <span v-else>-</span>
        </template>

        <template #row-actions="{ data }">
          <BaseButton icon="pi pi-list" variant="ghost" rounded aria-label="Lihat Batch" @click="goToBatches(data.itemId)" />
        </template>
      </BaseDataTable>
    </BaseCard>
  </div>
</template>

<style scoped>
.stock-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.stock-list__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.stock-list__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.stock-list__expiry {
  display: flex;
  flex-direction: column;
}

.stock-list__expiry-hint {
  font-size: var(--font-xs);
  color: var(--text-muted);
}
</style>
