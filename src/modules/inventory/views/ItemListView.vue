<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import { useItemStore } from '../stores/item.store'
import { useItemTypeStore } from '../stores/item-type.store'
import { useCategoryStore } from '../stores/category.store'
import { useUnitStore } from '../stores/unit.store'
import { useToastFeedback } from '@/composables/useToastFeedback'
import type { Item } from '../types/item'

const store = useItemStore()
const itemTypeStore = useItemTypeStore()
const categoryStore = useCategoryStore()
const unitStore = useUnitStore()
const router = useRouter()
const confirm = useConfirm()
const toast = useToastFeedback()

const columns: DataTableColumn[] = [
  { field: 'itemCode', header: 'Kode' },
  { field: 'itemName', header: 'Nama Item' },
  { field: 'itemTypeId', header: 'Tipe' },
  { field: 'categoryId', header: 'Kategori' },
  { field: 'defaultUnitId', header: 'Satuan' },
  { field: 'minimumStock', header: 'Min Stok', sortable: true },
  { field: 'isActive', header: 'Status' },
]

function itemTypeName(id: string) {
  return itemTypeStore.items.find((t) => t.id === id)?.name ?? id
}
function categoryName(id: string) {
  return categoryStore.items.find((c) => c.id === id)?.name ?? id
}
function unitName(id: string) {
  return unitStore.items.find((u) => u.id === id)?.name ?? id
}

function confirmDelete(item: Item) {
  confirm.require({
    header: 'Hapus Item',
    message: `Hapus "${item.itemName}"? Gunakan Nonaktifkan jika item sudah pernah digunakan transaksi.`,
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
        toast.error(
          isInUse
            ? `"${item.itemName}" tidak dapat dihapus karena sudah digunakan transaksi. Gunakan Nonaktifkan.`
            : 'Gagal menghapus item.',
        )
      }
    },
  })
}

async function toggleActive(item: Item) {
  try {
    if (item.isActive) {
      await store.deactivate(item.id)
      toast.success(`"${item.itemName}" berhasil dinonaktifkan.`)
    } else {
      await store.activate(item.id)
      toast.success(`"${item.itemName}" berhasil diaktifkan.`)
    }
  } catch {
    toast.error('Gagal mengubah status item.')
  }
}

onMounted(() => {
  store.fetchAll().catch(() => {})
  if (itemTypeStore.items.length === 0) itemTypeStore.fetchAll().catch(() => {})
  if (categoryStore.items.length === 0) categoryStore.fetchAll().catch(() => {})
  if (unitStore.items.length === 0) unitStore.fetchAll().catch(() => {})
})
</script>

<template>
  <div class="item-list">
    <div class="item-list__head">
      <h1 class="item-list__title">Item</h1>
    </div>

    <BaseCard>
      <BaseDataTable
        :value="store.items"
        :columns="columns"
        :loading="store.loading"
        search-placeholder="Cari item..."
        export-filename="item"
        empty-title="Belum ada data item"
        empty-description="Tambahkan item pertama untuk mulai mengelola stok."
      >
        <template #actions>
          <BaseButton
            label="Tambah Item"
            icon="pi pi-plus"
            @click="router.push('/inventory/obat/baru')"
          />
        </template>

        <template #cell-itemTypeId="{ value }">
          {{ itemTypeName(value) }}
        </template>

        <template #cell-categoryId="{ value }">
          {{ categoryName(value) }}
        </template>

        <template #cell-defaultUnitId="{ value }">
          {{ unitName(value) }}
        </template>

        <template #cell-isActive="{ value }">
          <BaseTag
            :value="value ? 'Aktif' : 'Nonaktif'"
            :variant="value ? 'success' : 'secondary'"
          />
        </template>

        <template #row-actions="{ data }">
          <BaseButton
            icon="pi pi-pencil"
            variant="ghost"
            rounded
            aria-label="Edit"
            @click="router.push(`/inventory/obat/${data.id}/edit`)"
          />
          <BaseButton
            :icon="data.isActive ? 'pi pi-ban' : 'pi pi-check-circle'"
            :variant="data.isActive ? 'warning' : 'success'"
            text
            rounded
            :aria-label="data.isActive ? 'Nonaktifkan' : 'Aktifkan'"
            @click="toggleActive(data)"
          />
          <BaseButton
            icon="pi pi-trash"
            variant="danger"
            text
            rounded
            aria-label="Hapus"
            @click="confirmDelete(data)"
          />
        </template>

        <template #empty-action>
          <BaseButton
            label="Tambah Item"
            icon="pi pi-plus"
            @click="router.push('/inventory/obat/baru')"
          />
        </template>
      </BaseDataTable>
    </BaseCard>
  </div>
</template>

<style scoped>
.item-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.item-list__title {
  font-size: var(--font-2xl);
  color: var(--text);
}
</style>
