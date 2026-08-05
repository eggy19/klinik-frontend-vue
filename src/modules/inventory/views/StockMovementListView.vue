<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import DatePicker from 'primevue/datepicker'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import { formatDateTime } from '@/utils/format'
import { useStockMovementStore } from '../stores/stock-movement.store'
import {
  REFERENCE_TYPE_LABELS,
  STOCK_MOVEMENT_TYPE_LABELS,
  STOCK_MOVEMENT_TYPE_VARIANT,
  type StockMovementType,
} from '../types/stock-movement'

const router = useRouter()
const store = useStockMovementStore()

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Default: 30 hari terakhir agar load pertama relevan dan tidak terlalu berat.
function last30Days(): [Date, Date] {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  return [from, to]
}

const dateRange = ref<Date[] | null>(last30Days())
const filterType = ref<StockMovementType | ''>('')
const filterReferenceType = ref('')

const typeOptions = (Object.keys(STOCK_MOVEMENT_TYPE_LABELS) as StockMovementType[]).map((value) => ({
  value,
  label: STOCK_MOVEMENT_TYPE_LABELS[value],
}))
const referenceTypeOptions = Object.entries(REFERENCE_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const columns: DataTableColumn[] = [
  { field: 'createdAt', header: 'Tanggal', sortable: true },
  { field: 'itemName', header: 'Item' },
  { field: 'batchNumber', header: 'No. Batch' },
  { field: 'type', header: 'Jenis' },
  { field: 'quantity', header: 'Qty' },
  { field: 'referenceType', header: 'Referensi' },
  { field: 'note', header: 'Catatan' },
]

function currentFilters() {
  const [from, to] = dateRange.value ?? []
  return {
    type: filterType.value || undefined,
    referenceType: filterReferenceType.value || undefined,
    dateFrom: from ? toIsoDate(from) : undefined,
    dateTo: to ? toIsoDate(to) : undefined,
  }
}

function fetch(page = 1, limit = 20, search = '') {
  store.fetchAll({
    page,
    limit,
    search: search || undefined,
    ...currentFilters(),
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

function formatSignedQuantity(value: number): string {
  const sign = value > 0 ? '+' : ''
  return sign + value.toLocaleString('id-ID', { maximumFractionDigits: 4 })
}

function referenceLabel(referenceType: string | null): string {
  if (!referenceType) return '-'
  return REFERENCE_TYPE_LABELS[referenceType] ?? referenceType
}

function typeLabel(type: string): string {
  return STOCK_MOVEMENT_TYPE_LABELS[type as StockMovementType] ?? type
}

function typeVariant(type: string) {
  return STOCK_MOVEMENT_TYPE_VARIANT[type as StockMovementType] ?? 'primary'
}

function goToGoodsReceipt(referenceId: string) {
  router.push(`/inventory/purchasing/goods-receipts/${referenceId}`)
}

onMounted(() => {
  fetch()
})
</script>

<template>
  <div class="movement-list">
    <div class="movement-list__head">
      <h1 class="movement-list__title">Stock Movement</h1>
    </div>

    <BaseCard>
      <BaseDataTable
        :value="store.items"
        :columns="columns"
        :loading="store.loading"
        lazy
        :total-records="store.pagination.total"
        search-placeholder="Cari item..."
        export-filename="stock-movement"
        empty-title="Belum ada pergerakan stok"
        empty-description="Riwayat penerimaan, dispensing, dan penyesuaian stok akan muncul di sini."
        @page="onPage"
        @search="onSearch"
      >
        <template #filters>
          <DatePicker
            v-model="dateRange"
            selection-mode="range"
            :manual-input="false"
            date-format="dd/mm/yy"
            placeholder="Rentang tanggal"
            show-icon
            @update:model-value="onFilterChange"
          />
          <BaseSelect
            :model-value="filterType"
            :options="typeOptions"
            option-label="label"
            option-value="value"
            placeholder="Semua Jenis"
            show-clear
            class="movement-list__filter"
            @update:model-value="
              (v) => {
                filterType = (v as StockMovementType) ?? ''
                onFilterChange()
              }
            "
          />
          <BaseSelect
            :model-value="filterReferenceType"
            :options="referenceTypeOptions"
            option-label="label"
            option-value="value"
            placeholder="Semua Referensi"
            show-clear
            class="movement-list__filter"
            @update:model-value="
              (v) => {
                filterReferenceType = (v as string) ?? ''
                onFilterChange()
              }
            "
          />
        </template>

        <template #cell-createdAt="{ data }">
          {{ formatDateTime(data.createdAt) }}
        </template>

        <template #cell-itemName="{ data }">
          <div class="movement-list__item">
            <span>{{ data.itemName }}</span>
            <span class="movement-list__item-code">{{ data.itemCode }}</span>
          </div>
        </template>

        <template #cell-batchNumber="{ data }">
          {{ data.batchNumber ?? '-' }}
        </template>

        <template #cell-type="{ data }">
          <BaseTag :value="typeLabel(data.type)" :variant="typeVariant(data.type)" />
        </template>

        <template #cell-quantity="{ data }">
          <span :class="data.quantity < 0 ? 'movement-list__qty--out' : 'movement-list__qty--in'">
            {{ formatSignedQuantity(data.quantity) }}
          </span>
        </template>

        <template #cell-referenceType="{ data }">
          <BaseButton
            v-if="data.referenceType === 'goods_receipt' && data.referenceId"
            variant="ghost"
            :label="referenceLabel(data.referenceType)"
            @click="goToGoodsReceipt(data.referenceId)"
          />
          <span v-else>{{ referenceLabel(data.referenceType) }}</span>
        </template>

        <template #cell-note="{ data }">
          {{ data.note ?? '-' }}
        </template>
      </BaseDataTable>
    </BaseCard>
  </div>
</template>

<style scoped>
.movement-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.movement-list__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.movement-list__filter {
  min-width: 200px;
}

.movement-list__item {
  display: flex;
  flex-direction: column;
}

.movement-list__item-code {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.movement-list__qty--in {
  color: var(--color-success);
  font-weight: 600;
}

.movement-list__qty--out {
  color: var(--color-danger);
  font-weight: 600;
}
</style>
