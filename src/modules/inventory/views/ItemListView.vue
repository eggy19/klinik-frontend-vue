<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import { useItemStore } from '../stores/item.store'
import { useCategoryStore } from '../stores/category.store'
import { useToastFeedback } from '@/composables/useToastFeedback'
import type { Item } from '../types/item'

const store = useItemStore()
const categoryStore = useCategoryStore()
const router = useRouter()
const confirm = useConfirm()
const toast = useToastFeedback()

const columns: DataTableColumn[] = [
  { field: 'itemCode', header: 'SKU' },
  { field: 'itemName', header: 'NAME' },
  { field: 'categoryId', header: 'CATEGORY' },
  { field: 'currentStock', header: 'STOCK LEVEL' },
  { field: 'status', header: 'STATUS' },
  { field: 'expiryDate', header: 'EXPIRY' },
]

// Summary stats
const lowStockCount = computed(() => store.items.filter((i) => i.currentStock <= i.minimumStock).length)
const totalItems = computed(() => store.items.length)

function getStockStatus(item: Item): 'healthy' | 'moderate' | 'critical' {
  if (item.currentStock <= 0 || item.currentStock <= item.minimumStock * 0.5) return 'critical'
  if (item.currentStock <= item.minimumStock) return 'moderate'
  return 'healthy'
}

function getStatusVariant(status: string) {
  switch (status.toLowerCase()) {
    case 'healthy':
      return 'success'
    case 'moderate':
      return 'warning'
    case 'critical':
      return 'danger'
    default:
      return 'info'
  }
}

function getStockPercentage(item: Item): number {
  const max = item.maximumStock || item.minimumStock * 2
  return Math.min((item.currentStock / max) * 100, 100)
}

function categoryName(id: string) {
  return categoryStore.items.find((c) => c.id === id)?.name ?? id
}

function confirmDelete(item: Item) {
  confirm.require({
    header: 'Hapus Item',
    message: `Hapus "${item.itemName}"?`,
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Batal',
    acceptLabel: 'Hapus',
    acceptProps: { severity: 'danger' },
    accept: async () => {
      try {
        await store.remove(item.id)
        toast.success('Item berhasil dihapus.')
      } catch (err: unknown) {
        const isInUse =
          err instanceof Error &&
          (err.message.includes('409') || err.message.toLowerCase().includes('digunakan'))
        toast.error(isInUse ? `Tidak dapat dihapus karena sudah digunakan.` : 'Gagal menghapus item.')
      }
    },
  })
}

onMounted(() => {
  store.fetchAll().catch(() => {})
  // if (itemTypeStore.items.length === 0) itemTypeStore.fetchAll().catch(() => {})
  if (categoryStore.items.length === 0) categoryStore.fetchAll().catch(() => {})
  // if (unitStore.items.length === 0) unitStore.fetchAll().catch(() => {})
})
</script>

<template>
  <div class="item-list">
    <!-- Header -->
    <div class="item-list__header mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Master Obat</h1>
      <p class="text-sm text-gray-500 mt-1">Manage your clinical stock levels, expiry dates, and supplier orders.</p>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <BaseCard class="p-4">
        <p class="text-[10px] font-bold text-gray-500 uppercase">Total Items</p>
        <h2 class="text-2xl font-bold mt-2">{{ totalItems }}</h2>
      </BaseCard>
      <BaseCard class="p-4">
        <p class="text-[10px] font-bold text-red-500 uppercase">Low Stock</p>
        <h2 class="text-2xl font-bold mt-2 text-red-500">{{ lowStockCount }}</h2>
        <p class="text-xs text-red-500 mt-1">! Requires reorder</p>
      </BaseCard>
      <BaseCard class="p-4">
        <p class="text-[10px] font-bold text-blue-500 uppercase">Near Expiry</p>
        <h2 class="text-2xl font-bold mt-2 text-blue-500">8</h2>
        <p class="text-xs text-gray-500 mt-1">Expiring within 30 days</p>
      </BaseCard>
      <BaseCard class="p-4">
        <p class="text-[10px] font-bold text-gray-500 uppercase">Total Spend (MTD)</p>
        <h2 class="text-2xl font-bold mt-2">$14,280</h2>
      </BaseCard>
    </div>

    <!-- Data Table -->
    <BaseCard>
      <BaseDataTable
        :value="store.items"
        :columns="columns"
        :loading="store.loading"
        search-placeholder="Search by SKU, Name or Category..."
      >
        <template #actions>
          <BaseButton label="Tambah Obat Baru" icon="pi pi-plus" @click="router.push('/inventory/obat/baru')" />
        </template>

        <template #cell-itemCode="{ data }">
          <span class="font-medium">{{ data.itemCode }}</span>
        </template>

        <template #cell-itemName="{ data }">
          <div>
            <p class="font-medium">{{ data.itemName }}</p>
            <p class="text-xs text-gray-500">{{ data.description || '—' }}</p>
          </div>
        </template>

        <template #cell-categoryId="{ data }">
          {{ categoryName(data.categoryId) }}
        </template>

        <template #cell-currentStock="{ data }">
          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap">{{ data.currentStock }} Units</span>
            <div class="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="getStockStatus(data) === 'healthy' ? 'bg-green-600' : getStockStatus(data) === 'moderate' ? 'bg-yellow-500' : 'bg-red-600'"
                :style="{ width: getStockPercentage(data) + '%' }"
              ></div>
            </div>
          </div>
        </template>

        <template #cell-status="{ data }">
          <BaseTag
            :value="getStockStatus(data).toUpperCase()"
            :variant="getStatusVariant(getStockStatus(data))"
          />
        </template>

        <template #cell-expiryDate="{ data }">
          {{ data.expiryDate || '—' }}
        </template>

        <template #row-actions="{ data }">
          <BaseButton icon="pi pi-pencil" variant="ghost" rounded @click="router.push(`/inventory/obat/${data.id}/edit`)" />
          <BaseButton icon="pi pi-ellipsis-v" variant="ghost" rounded @click="confirmDelete(data)" />
        </template>
      </BaseDataTable>
    </BaseCard>
  </div>
</template>

<style scoped>
.item-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.item-list__header {
  margin-bottom: 1.5rem;
}
</style>