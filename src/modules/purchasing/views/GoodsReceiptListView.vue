<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import { formatDateTime } from '@/utils/format'
import { usePurchaseOrderStore } from '../stores/purchase-order.store'
import { useGoodsReceiptStore } from '../stores/goods-receipt.store'
import PurchaseOrderStatusTag from '../components/PurchaseOrderStatusTag.vue'
import GoodsReceiptStatusTag from '../components/GoodsReceiptStatusTag.vue'
import type { PurchaseOrder } from '../types/purchase-order'
import type { GoodsReceipt } from '../types/goods-receipt'

const router = useRouter()
const poStore = usePurchaseOrderStore()
const grStore = useGoodsReceiptStore()

type TabValue = 'receivable' | 'history'
const activeTab = ref<TabValue>('receivable')

const receivableColumns: DataTableColumn[] = [
  { field: 'poNumber', header: 'No. PO' },
  { field: 'supplierName', header: 'Supplier' },
  { field: 'status', header: 'Status' },
]

const historyColumns: DataTableColumn[] = [
  { field: 'receiptNumber', header: 'No. Penerimaan' },
  { field: 'poNumber', header: 'No. PO' },
  { field: 'supplierName', header: 'Supplier' },
  { field: 'status', header: 'Status' },
  { field: 'receivedAt', header: 'Tanggal Diterima' },
]

const pagination = computed(() =>
  activeTab.value === 'receivable' ? poStore.pagination : grStore.pagination,
)
const loading = computed(() => (activeTab.value === 'receivable' ? poStore.loading : grStore.loading))

function fetchReceivable(page = 1, limit = 20, search = '') {
  poStore.fetchAll({ page, limit, search: search || undefined, statusGroup: 'RECEIVABLE' })
}

function fetchHistory(page = 1, limit = 20, search = '') {
  grStore.fetchAll({ page, limit, search: search || undefined })
}

function fetchActive(page = 1, limit = 20, search = '') {
  if (activeTab.value === 'receivable') fetchReceivable(page, limit, search)
  else fetchHistory(page, limit, search)
}

function onPage(e: { page: number; rows: number }) {
  fetchActive(e.page, e.rows)
}

function onSearch(term: string) {
  fetchActive(1, pagination.value.limit, term)
}

function onTabChange(value: string | number) {
  activeTab.value = value as TabValue
  fetchActive(1, pagination.value.limit)
}

function goReceive(po: PurchaseOrder) {
  router.push(`/inventory/purchasing/goods-receipts/baru/${po.id}`)
}

function goDetail(gr: GoodsReceipt) {
  router.push(`/inventory/purchasing/goods-receipts/${gr.id}`)
}

onMounted(() => fetchReceivable())
</script>

<template>
  <div class="gr-list">
    <div class="gr-list__head">
      <h1 class="gr-list__title">Goods Receipt</h1>
    </div>

    <BaseCard>
      <div class="gr-list__tabs">
        <Tabs :value="activeTab" @update:value="onTabChange">
          <TabList>
            <Tab value="receivable">Siap Diterima</Tab>
            <Tab value="history">Riwayat Penerimaan</Tab>
          </TabList>
        </Tabs>
      </div>

      <BaseDataTable
        v-if="activeTab === 'receivable'"
        :value="poStore.items"
        :columns="receivableColumns"
        :loading="loading"
        lazy
        :total-records="pagination.total"
        search-placeholder="Cari No. PO..."
        empty-title="Tidak ada PO siap diterima"
        empty-description="Purchase order berstatus APPROVED atau PARTIALLY_RECEIVED akan muncul di sini."
        @page="onPage"
        @search="onSearch"
      >
        <template #cell-status="{ data }">
          <PurchaseOrderStatusTag :status="data.status" />
        </template>

        <template #row-actions="{ data }">
          <BaseButton label="Terima Barang" icon="pi pi-inbox" size="small" @click="goReceive(data)" />
        </template>
      </BaseDataTable>

      <BaseDataTable
        v-else
        :value="grStore.items"
        :columns="historyColumns"
        :loading="loading"
        lazy
        :total-records="pagination.total"
        search-placeholder="Cari No. Penerimaan..."
        empty-title="Belum ada penerimaan barang"
        empty-description="Penerimaan barang tercatat setelah PO yang disetujui diterima."
        @page="onPage"
        @search="onSearch"
      >
        <template #cell-status="{ data }">
          <GoodsReceiptStatusTag :status="data.status" />
        </template>

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

.gr-list__tabs {
  padding-bottom: var(--space-4);
  margin-bottom: var(--space-4);
  border-bottom: 1px solid var(--border);
}
</style>
