<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import { formatDateTime } from '@/utils/format'
import { useStockOpnameStore } from '../stores/stock-opname.store'
import {
  STOCK_OPNAME_STATUS_LABELS,
  STOCK_OPNAME_STATUS_VARIANT,
  type StockOpnameStatus,
} from '../types/stock-opname'

const router = useRouter()
const store = useStockOpnameStore()

const filterStatus = ref<StockOpnameStatus | ''>('')

const statusOptions = (Object.keys(STOCK_OPNAME_STATUS_LABELS) as StockOpnameStatus[]).map((value) => ({
  value,
  label: STOCK_OPNAME_STATUS_LABELS[value],
}))

const columns: DataTableColumn[] = [
  { field: 'opnameNumber', header: 'No. Opname' },
  { field: 'status', header: 'Status' },
  { field: 'note', header: 'Catatan' },
  { field: 'createdAt', header: 'Tanggal Dibuat', sortable: true },
]

function fetch(page = 1, limit = 20, search = '') {
  store.fetchAll({
    page,
    limit,
    search: search || undefined,
    status: filterStatus.value || undefined,
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

function statusLabel(status: string) {
  return STOCK_OPNAME_STATUS_LABELS[status as StockOpnameStatus] ?? status
}

function statusVariant(status: string) {
  return STOCK_OPNAME_STATUS_VARIANT[status as StockOpnameStatus] ?? 'primary'
}

function goCreate() {
  router.push('/inventory/management/stock-opname/baru')
}

function goDetail(row: { id: string }) {
  router.push(`/inventory/management/stock-opname/${row.id}`)
}

onMounted(() => {
  fetch()
})
</script>

<template>
  <div class="opname-list">
    <div class="opname-list__head">
      <h1 class="opname-list__title">Stock Opname</h1>
      <BaseButton label="Buat Opname" icon="pi pi-plus" @click="goCreate" />
    </div>

    <BaseCard>
      <BaseDataTable
        :value="store.items"
        :columns="columns"
        :loading="store.loading"
        lazy
        :total-records="store.pagination.total"
        search-placeholder="Cari no. opname..."
        export-filename="stock-opname"
        empty-title="Belum ada stock opname"
        empty-description="Sesi stock opname yang dibuat akan muncul di sini."
        @page="onPage"
        @search="onSearch"
      >
        <template #filters>
          <BaseSelect
            :model-value="filterStatus"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="Semua Status"
            show-clear
            class="opname-list__filter"
            @update:model-value="
              (v) => {
                filterStatus = (v as StockOpnameStatus) ?? ''
                onFilterChange()
              }
            "
          />
        </template>

        <template #cell-status="{ data }">
          <BaseTag :value="statusLabel(data.status)" :variant="statusVariant(data.status)" />
        </template>

        <template #cell-note="{ data }">
          {{ data.note ?? '-' }}
        </template>

        <template #cell-createdAt="{ data }">
          {{ formatDateTime(data.createdAt) }}
        </template>

        <template #row-actions="{ data }">
          <BaseButton icon="pi pi-eye" variant="ghost" rounded aria-label="Detail" @click="goDetail(data)" />
        </template>
      </BaseDataTable>
    </BaseCard>
  </div>
</template>

<style scoped>
.opname-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.opname-list__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.opname-list__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.opname-list__filter {
  min-width: 200px;
}
</style>
