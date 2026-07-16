<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { formatCurrency, formatDate } from '@/utils/format'
import { usePurchaseOrderStore } from '../stores/purchase-order.store'
import PurchaseOrderStatusTag from '../components/PurchaseOrderStatusTag.vue'
import { PO_STATUS_LABELS, type PurchaseOrder, type PurchaseOrderStatus } from '../types/purchase-order'

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

const statusFilter = ref<PurchaseOrderStatus | null>(null)
const statusOptions = [
  { label: 'Semua Status', value: null },
  ...(Object.keys(PO_STATUS_LABELS) as PurchaseOrderStatus[]).map((s) => ({
    label: PO_STATUS_LABELS[s],
    value: s,
  })),
]

function fetch(page = 1, limit = 20, search = '') {
  store.fetchAll({ page, limit, search: search || undefined, status: statusFilter.value ?? undefined })
}

function onPage(e: { page: number; rows: number }) {
  fetch(e.page, e.rows)
}

function onSearch(term: string) {
  fetch(1, store.pagination.limit, term)
}

function onStatusFilterChange() {
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

onMounted(() => fetch())
</script>

<template>
  <div class="po-list">
    <div class="po-list__head">
      <h1 class="po-list__title">Purchase Order</h1>
    </div>

    <BaseCard>
      <BaseDataTable
        :value="store.items"
        :columns="columns"
        :loading="store.loading"
        lazy
        :total-records="store.pagination.total"
        search-placeholder="Cari No. PO..."
        empty-title="Belum ada purchase order"
        empty-description="Buat purchase order pertama untuk mulai memesan barang ke supplier."
        @page="onPage"
        @search="onSearch"
      >
        <template #filters>
          <BaseSelect
            v-model="statusFilter"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="Semua Status"
            show-clear
            @update:model-value="onStatusFilterChange"
          />
        </template>

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
</style>
