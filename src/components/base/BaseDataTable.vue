<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed, ref, useSlots, watch } from 'vue'
import DataTable, { type DataTablePageEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import MultiSelect from 'primevue/multiselect'
import Skeleton from 'primevue/skeleton'
import Button from 'primevue/button'
import BaseEmptyState from './BaseEmptyState.vue'
import { useDebounce } from '@/composables/useDebounce'
import { toCsv, downloadCsv } from '@/utils/csv'

export interface DataTableColumn {
  field: string
  header: string
  sortable?: boolean
}

const props = withDefaults(
  defineProps<{
    value: T[]
    columns: DataTableColumn[]
    loading?: boolean
    rows?: number
    searchPlaceholder?: string
    exportFilename?: string
    emptyTitle?: string
    emptyDescription?: string
    /**
     * Mode server-side: data sudah dipaginasi backend. Search/sort/filter lokal
     * dimatikan; paginator memakai totalRecords dan emit event `page` (1-based).
     */
    lazy?: boolean
    totalRecords?: number
    /** Sembunyikan kotak pencarian (mis. lazy table tanpa dukungan search backend). */
    showSearch?: boolean
  }>(),
  {
    loading: false,
    rows: 10,
    searchPlaceholder: 'Cari...',
    exportFilename: 'data',
    emptyTitle: 'Belum ada data',
    lazy: false,
    totalRecords: 0,
    showSearch: true,
  },
)

const emit = defineEmits<{
  page: [value: { page: number; rows: number }]
  search: [value: string]
}>()

// --- Search (kiri atas) dengan debounce 300ms (docs/06) ---
const search = ref('')
const debouncedSearch = useDebounce(search, 300)

// Mode lazy meneruskan pencarian ke pemanggil, mode biasa memfilter lokal.
watch(debouncedSearch, (term) => {
  if (props.lazy) emit('search', term.trim())
})

const filteredRows = computed(() => {
  if (props.lazy) return props.value
  const term = debouncedSearch.value.trim().toLowerCase()
  if (!term) return props.value
  return props.value.filter((row) =>
    props.columns.some((col) => String(row[col.field] ?? '').toLowerCase().includes(term)),
  )
})

// --- Column visibility ---
const visibleColumns = ref<DataTableColumn[]>([...props.columns])
const isVisible = (field: string) => visibleColumns.value.some((c) => c.field === field)
const shownColumns = computed(() => props.columns.filter((c) => isVisible(c.field)))

// --- Export CSV (kolom yang sedang tampil; nonaktif di mode lazy — data tidak lengkap) ---
function exportCsv() {
  const cols = shownColumns.value.map((c) => ({ field: c.field, header: c.header }))
  downloadCsv(props.exportFilename, toCsv(filteredRows.value, cols))
}

function onPage(event: DataTablePageEvent) {
  emit('page', { page: event.page + 1, rows: event.rows })
}

// Placeholder baris untuk skeleton loading.
const skeletonRows = computed(() => Array.from({ length: props.rows }, (_, i) => ({ _k: i })))

const slots = useSlots()
const hasRowActions = computed(() => !!slots['row-actions'])
</script>

<template>
  <div class="base-table">
    <!-- Toolbar: search + filter kiri, aksi kanan (docs/06) -->
    <div class="base-table__toolbar">
      <div class="base-table__filters">
        <IconField v-if="showSearch" class="base-table__search">
          <InputIcon class="pi pi-search" />
          <InputText v-model="search" :placeholder="searchPlaceholder" />
        </IconField>
        <!-- Filter domain-specific (dropdown kategori, status, dsb.) diisi oleh view -->
        <slot name="filters" />
      </div>

      <div class="base-table__tools">
        <MultiSelect
          v-model="visibleColumns"
          :options="columns"
          option-label="header"
          display="chip"
          :max-selected-labels="0"
          selected-items-label="Kolom"
          placeholder="Kolom"
          class="base-table__columns"
          data-key="field"
        />
        <Button
          v-if="!lazy"
          icon="pi pi-download"
          label="Export CSV"
          severity="secondary"
          outlined
          :disabled="loading || filteredRows.length === 0"
          @click="exportCsv"
        />
        <slot name="actions" />
      </div>
    </div>

    <!-- Loading: skeleton (docs/06 — hindari teks "Loading...") -->
    <DataTable
      v-if="loading"
      :value="skeletonRows"
      :rows="rows"
      data-key="_k"
      class="base-table__grid"
    >
      <Column v-for="col in shownColumns" :key="col.field" :header="col.header">
        <template #body>
          <Skeleton height="1rem" />
        </template>
      </Column>
      <Column v-if="hasRowActions" header="" style="width: 8rem">
        <template #body><Skeleton height="1rem" /></template>
      </Column>
    </DataTable>

    <!-- Empty state -->
    <BaseEmptyState
      v-else-if="filteredRows.length === 0"
      :title="emptyTitle"
      :description="emptyDescription"
    >
      <template v-if="$slots['empty-action']" #action>
        <slot name="empty-action" />
      </template>
    </BaseEmptyState>

    <!-- Tabel data -->
    <DataTable
      v-else
      :value="filteredRows"
      :rows="rows"
      :rows-per-page-options="[10, 20, 30, 50]"
      paginator
      :lazy="lazy"
      :total-records="lazy ? totalRecords : undefined"
      removable-sort
      data-key="id"
      class="base-table__grid"
      paginator-template="RowsPerPageDropdown CurrentPageReport PrevPageLink NextPageLink"
      current-page-report-template="{first}–{last} dari {totalRecords}"
      @page="onPage"
    >
      <Column
        v-for="col in shownColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortable="lazy ? false : (col.sortable ?? true)"
      >
        <template #body="{ data }">
          <slot :name="`cell-${col.field}`" :data="data" :value="data[col.field]">
            {{ data[col.field] }}
          </slot>
        </template>
      </Column>

      <!-- Kolom aksi di kanan (docs/06) -->
      <Column v-if="hasRowActions" header="Aksi" class="base-table__actions-col">
        <template #body="{ data }">
          <slot name="row-actions" :data="data" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
.base-table {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.base-table__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
}

.base-table__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  flex: 1 1 auto;
}

.base-table__search {
  flex: 1 1 240px;
  max-width: 360px;
}

.base-table__search :deep(input) {
  width: 100%;
}

.base-table__tools {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

/* Tabel: header 48px, row 44px, hover subtle (docs/06) */
.base-table__grid :deep(.p-datatable-thead > tr > th) {
  height: 48px;
}

.base-table__grid :deep(.p-datatable-tbody > tr > td) {
  height: 44px;
}

.base-table__actions-col {
  text-align: right;
  width: 1%;
  white-space: nowrap;
}

/* Tablet: tabel horizontal scroll (docs/07) */
@media (max-width: 1023px) {
  .base-table__grid {
    display: block;
    overflow-x: auto;
  }
}
</style>
