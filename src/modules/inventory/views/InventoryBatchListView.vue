<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseSummaryCard from '@/components/base/BaseSummaryCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import { formatDate } from '@/utils/format'
import { useInventoryBatchStore } from '../stores/batch.store'
import { useItemStore } from '../stores/item.store'
import { useSupplierStore } from '../stores/supplier.store'
import ExpiryStatusTag from '../components/ExpiryStatusTag.vue'
import {
  computeExpiryStatus,
  DEFAULT_EXPIRY_THRESHOLD_DAYS,
  EXPIRY_STATUS_LABELS,
  type ExpiryStatus,
  type StockStatus,
} from '../types/batch'

const router = useRouter()
const store = useInventoryBatchStore()
const itemStore = useItemStore()
const supplierStore = useSupplierStore()

const filterItemId = ref('')
const filterSupplierId = ref('')
const filterExpiryStatus = ref<ExpiryStatus | ''>('')
const filterStockStatus = ref<StockStatus | ''>('')

const expiryStatusOptions = (Object.keys(EXPIRY_STATUS_LABELS) as ExpiryStatus[]).map((value) => ({
  value,
  label: EXPIRY_STATUS_LABELS[value],
}))
const stockStatusOptions = [
  { value: 'AVAILABLE', label: 'Tersedia' },
  { value: 'EMPTY', label: 'Habis' },
]

const columns: DataTableColumn[] = [
  { field: 'itemName', header: 'Item' },
  { field: 'itemCode', header: 'Kode Item' },
  { field: 'batchNumber', header: 'No. Batch' },
  { field: 'supplierName', header: 'Supplier' },
  { field: 'goodsReceiptNumber', header: 'No. Penerimaan' },
  { field: 'receivedDate', header: 'Tgl. Diterima' },
  { field: 'expiredDate', header: 'Kadaluarsa' },
  { field: 'quantity', header: 'Qty', sortable: true },
  { field: 'unitName', header: 'Satuan' },
  { field: 'expiryStatus', header: 'Status' },
]

// Baris dilebur dengan status kadaluarsa terhitung supaya kolom Status ikut
// muncul di toggle kolom & export CSV milik BaseDataTable (bukan cuma di slot).
const tableRows = computed(() =>
  store.items.map((batch) => ({
    ...batch,
    expiryStatus: EXPIRY_STATUS_LABELS[
      computeExpiryStatus(batch.expiredDate, DEFAULT_EXPIRY_THRESHOLD_DAYS)
    ],
  })),
)

function fetch(page = 1, limit = 20, search = '') {
  store.fetchAll({
    page,
    limit,
    search: search || undefined,
    itemId: filterItemId.value || undefined,
    supplierId: filterSupplierId.value || undefined,
    expiryStatus: filterExpiryStatus.value || undefined,
    stockStatus: filterStockStatus.value || undefined,
  })
}

function onPage(e: { page: number; rows: number }) {
  fetch(e.page, e.rows)
}

function onSearch(term: string) {
  fetch(1, store.pagination.limit, term)
}

function onFilterChange() {
  fetch(1, store.pagination.limit)
}

function goDetail(batch: { id: string }) {
  router.push(`/inventory/management/batch/${batch.id}`)
}

onMounted(() => {
  fetch()
  store.fetchStats()
  if (itemStore.items.length === 0) itemStore.fetchAll().catch(() => {})
  if (supplierStore.items.length === 0) supplierStore.fetchAll().catch(() => {})
})
</script>

<template>
  <div class="batch-list">
    <div class="batch-list__head">
      <h1 class="batch-list__title">Inventory Batch</h1>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <BaseSummaryCard
        title="Total Batch"
        :value="store.stats.totalBatch"
        icon="pi pi-box"
        variant="info"
        :loading="store.statsLoading"
      />
      <BaseSummaryCard
        title="Batch Aktif"
        :value="store.stats.activeBatch"
        icon="pi pi-check-circle"
        variant="success"
        :loading="store.statsLoading"
      />
      <BaseSummaryCard
        title="Batch Habis"
        :value="store.stats.emptyBatch"
        icon="pi pi-inbox"
        variant="info"
        :loading="store.statsLoading"
      />
      <BaseSummaryCard
        title="Mendekati Kadaluarsa"
        :value="store.stats.expiringSoon"
        icon="pi pi-clock"
        variant="warning"
        :loading="store.statsLoading"
      />
      <BaseSummaryCard
        title="Kadaluarsa"
        :value="store.stats.expiredBatch"
        icon="pi pi-exclamation-triangle"
        variant="danger"
        :loading="store.statsLoading"
      />
      <BaseSummaryCard
        title="Total Quantity"
        :value="store.stats.totalQuantity"
        icon="pi pi-chart-bar"
        variant="primary"
        :loading="store.statsLoading"
      />
    </div>

    <BaseCard>
      <BaseDataTable
        :value="tableRows"
        :columns="columns"
        :loading="store.loading"
        lazy
        :total-records="store.pagination.total"
        search-placeholder="Cari item, batch, supplier, no. GR/PO..."
        export-filename="inventory-batch"
        empty-title="Belum ada batch"
        empty-description="Batch akan muncul di sini setelah Goods Receipt diverifikasi."
        @page="onPage"
        @search="onSearch"
      >
        <template #filters>
          <BaseSelect
            :model-value="filterItemId"
            :options="itemStore.items"
            option-label="itemName"
            option-value="id"
            placeholder="Semua Item"
            filter
            show-clear
            class="batch-list__filter"
            @update:model-value="
              (v) => {
                filterItemId = (v as string) ?? ''
                onFilterChange()
              }
            "
          />
          <BaseSelect
            :model-value="filterSupplierId"
            :options="supplierStore.items"
            option-label="name"
            option-value="id"
            placeholder="Semua Supplier"
            filter
            show-clear
            class="batch-list__filter"
            @update:model-value="
              (v) => {
                filterSupplierId = (v as string) ?? ''
                onFilterChange()
              }
            "
          />
          <BaseSelect
            :model-value="filterExpiryStatus"
            :options="expiryStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="Semua Status Kadaluarsa"
            show-clear
            class="batch-list__filter"
            @update:model-value="
              (v) => {
                filterExpiryStatus = (v as ExpiryStatus) ?? ''
                onFilterChange()
              }
            "
          />
          <BaseSelect
            :model-value="filterStockStatus"
            :options="stockStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="Semua Status Stok"
            show-clear
            class="batch-list__filter"
            @update:model-value="
              (v) => {
                filterStockStatus = (v as StockStatus) ?? ''
                onFilterChange()
              }
            "
          />
        </template>

        <template #cell-receivedDate="{ data }">
          {{ formatDate(data.receivedDate) }}
        </template>

        <template #cell-expiredDate="{ data }">
          {{ formatDate(data.expiredDate) }}
        </template>

        <template #cell-expiryStatus="{ data }">
          <ExpiryStatusTag :expired-date="data.expiredDate" />
        </template>

        <template #row-actions="{ data }">
          <BaseButton icon="pi pi-eye" variant="ghost" rounded aria-label="Detail" @click="goDetail(data)" />
        </template>
      </BaseDataTable>
    </BaseCard>
  </div>
</template>

<style scoped>
.batch-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.batch-list__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.batch-list__filter {
  min-width: 200px;
}
</style>
