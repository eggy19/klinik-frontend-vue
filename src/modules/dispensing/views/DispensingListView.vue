<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import { formatDateTime } from '@/utils/format'
import { useDispensingStore } from '../stores/dispensing.store'

const router = useRouter()
const store = useDispensingStore()

const columns: DataTableColumn[] = [
  { field: 'dispensingNumber', header: 'No. Dispensing' },
  { field: 'note', header: 'Catatan' },
  { field: 'createdAt', header: 'Tanggal', sortable: true },
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

function goCreate() {
  router.push('/inventory/dispensing/baru')
}

function goDetail(row: { id: string }) {
  router.push(`/inventory/dispensing/${row.id}`)
}

onMounted(() => {
  fetch()
})
</script>

<template>
  <div class="disp-list">
    <div class="disp-list__head">
      <h1 class="disp-list__title">Dispensing</h1>
      <BaseButton label="Buat Dispensing" icon="pi pi-plus" @click="goCreate" />
    </div>

    <BaseCard>
      <BaseDataTable
        :value="store.items"
        :columns="columns"
        :loading="store.loading"
        lazy
        :total-records="store.pagination.total"
        search-placeholder="Cari no. dispensing..."
        export-filename="dispensing"
        empty-title="Belum ada dispensing"
        empty-description="Transaksi dispensing yang dibuat akan muncul di sini."
        @page="onPage"
        @search="onSearch"
      >
        <template #cell-note="{ data }">
          {{ data.note ?? '-' }}
        </template>

        <template #cell-createdAt="{ data }">
          {{ formatDateTime(data.createdAt) }}
        </template>

        <template #row-actions="{ data }">
          <BaseButton
            icon="pi pi-eye"
            variant="ghost"
            rounded
            aria-label="Detail"
            @click="goDetail(data)"
          />
        </template>
      </BaseDataTable>
    </BaseCard>
  </div>
</template>

<style scoped>
.disp-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.disp-list__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.disp-list__title {
  font-size: var(--font-2xl);
  color: var(--text);
}
</style>
