<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSummaryCard from '@/components/base/BaseSummaryCard.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { formatCurrency, formatDate } from '@/utils/format'
import { usePurchaseOrderStore } from '../stores/purchase-order.store'
import PurchaseOrderStatusTag from '../components/PurchaseOrderStatusTag.vue'
import type { PurchaseOrder, PurchaseOrderStatusGroup } from '../types/purchase-order'

const router = useRouter()
const store = usePurchaseOrderStore()
const confirm = useConfirm()
const toast = useToastFeedback()

const columns: DataTableColumn[] = [
  { field: 'poNumber', header: 'No. PO' },
  { field: 'supplierName', header: 'Supplier' },
  { field: 'status', header: 'Status' },
  { field: 'totalAmount', header: 'Total' },
  { field: 'createdAt', header: 'Tanggal' },
]

type TabValue = 'draft' | 'active' | 'archive'

const TAB_TO_GROUP: Record<TabValue, PurchaseOrderStatusGroup> = {
  draft: 'DRAFT',
  active: 'ACTIVE',
  archive: 'ARCHIVE',
}

const TAB_EMPTY_TEXT: Record<TabValue, { title: string; description: string }> = {
  draft: {
    title: 'Belum ada draft PO',
    description: 'Purchase order yang masih disimpan sebagai draft akan muncul di sini.',
  },
  active: {
    title: 'Tidak ada PO aktif',
    description: 'Purchase order yang sedang berjalan (diajukan, disetujui, atau sebagian diterima) akan muncul di sini.',
  },
  archive: {
    title: 'Belum ada PO diarsipkan',
    description: 'Purchase order yang sudah diterima penuh atau dibatalkan akan muncul di sini.',
  },
}

const activeTab = ref<TabValue>('active')
const emptyText = computed(() => TAB_EMPTY_TEXT[activeTab.value])

function fetch(page = 1, limit = 20, search = '') {
  store.fetchAll({
    page,
    limit,
    search: search || undefined,
    statusGroup: TAB_TO_GROUP[activeTab.value],
  })
}

function onPage(e: { page: number; rows: number }) {
  fetch(e.page, e.rows)
}

function onSearch(term: string) {
  fetch(1, store.pagination.limit, term)
}

function onTabChange(value: string | number) {
  activeTab.value = value as TabValue
  fetch(1, store.pagination.limit)
}

function goCreate() {
  router.push('/inventory/purchase-orders/baru')
}

function goDetail(po: PurchaseOrder) {
  router.push(`/inventory/purchase-orders/${po.id}`)
}

function goEdit(po: PurchaseOrder) {
  router.push(`/inventory/purchase-orders/${po.id}/edit`)
}

async function doSubmit(po: PurchaseOrder) {
  try {
    await store.submit(po.id)
    toast.success('Purchase order berhasil diajukan.')
  } catch {
    toast.error()
  }
}

function confirmCancel(po: PurchaseOrder) {
  confirm.require({
    header: 'Batalkan Purchase Order',
    message: `Batalkan PO "${po.poNumber}"? Tindakan ini tidak dapat dibatalkan.`,
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Tutup',
    acceptLabel: 'Batalkan PO',
    acceptProps: { severity: 'danger' },
    accept: async () => {
      try {
        await store.cancel(po.id)
        toast.success('Purchase order berhasil dibatalkan.')
      } catch {
        toast.error()
      }
    },
  })
}

async function doApprove(po: PurchaseOrder) {
  try {
    await store.approve(po.id)
    toast.success('Purchase order berhasil disetujui.')
  } catch {
    toast.error()
  }
}

onMounted(() => {
  fetch()
  store.fetchStats()
})
</script>

<template>
  <div class="po-list">
    <div class="po-list__head">
      <h1 class="po-list__title">Purchase Order</h1>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <BaseSummaryCard
        title="Total PO Aktif"
        :value="store.stats.totalActive"
        icon="pi pi-file"
        variant="info"
        :loading="store.statsLoading"
      />
      <BaseSummaryCard
        title="PO Menunggu Approval"
        :value="store.stats.pendingApproval"
        icon="pi pi-clock"
        variant="warning"
        :loading="store.statsLoading"
      />
      <BaseSummaryCard
        title="Belanja Bulan Ini"
        :value="formatCurrency(store.stats.monthlySpend)"
        icon="pi pi-wallet"
        variant="success"
        :loading="store.statsLoading"
      />
    </div>

    <BaseCard>
      <div class="po-list__tabs">
        <Tabs :value="activeTab" @update:value="onTabChange">
          <TabList>
            <Tab value="draft">Draft</Tab>
            <Tab value="active">Aktif</Tab>
            <Tab value="archive">Arsip</Tab>
          </TabList>
        </Tabs>
      </div>

      <BaseDataTable
        :value="store.items"
        :columns="columns"
        :loading="store.loading"
        lazy
        :total-records="store.pagination.total"
        search-placeholder="Cari No. PO..."
        :empty-title="emptyText.title"
        :empty-description="emptyText.description"
        @page="onPage"
        @search="onSearch"
      >
        <template #actions>
          <BaseButton label="Buat Purchase Order" icon="pi pi-plus" @click="goCreate" />
        </template>

        <template #cell-status="{ data }">
          <PurchaseOrderStatusTag :status="data.status" />
        </template>

        <template #cell-totalAmount="{ data }">
          {{ formatCurrency(data.totalAmount) }}
        </template>

        <template #cell-createdAt="{ data }">
          {{ formatDate(data.createdAt) }}
        </template>

        <template #row-actions="{ data }">
          <BaseButton icon="pi pi-eye" variant="ghost" rounded aria-label="Detail" @click="goDetail(data)" />
          <template v-if="data.status === 'DRAFT'">
            <BaseButton icon="pi pi-pencil" variant="ghost" rounded aria-label="Edit" @click="goEdit(data)" />
            <BaseButton icon="pi pi-send" variant="ghost" rounded aria-label="Submit" @click="doSubmit(data)" />
            <BaseButton icon="pi pi-times" variant="danger" text rounded aria-label="Batalkan" @click="confirmCancel(data)" />
          </template>
          <template v-else-if="data.status === 'SUBMITTED'">
            <BaseButton icon="pi pi-check" variant="ghost" rounded aria-label="Setujui" @click="doApprove(data)" />
          </template>
        </template>

        <template #empty-action>
          <BaseButton label="Buat Purchase Order" icon="pi pi-plus" @click="goCreate" />
        </template>
      </BaseDataTable>
    </BaseCard>
  </div>
</template>

<style scoped>
.po-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.po-list__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.po-list__tabs {
  padding-bottom: var(--space-4);
  margin-bottom: var(--space-4);
  border-bottom: 1px solid var(--border);
}
</style>
