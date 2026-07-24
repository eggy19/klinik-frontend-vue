<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import type { Item } from '@/modules/inventory/types/item'
import type { Unit } from '@/modules/inventory/types/unit'
import { formatCurrency } from '@/utils/format'
import type { PurchaseOrderItemInput } from '../../types/purchase-order'

const props = defineProps<{
  rows: PurchaseOrderItemInput[]
  supplierItems: Item[]
  units: Unit[]
  supplierSelected: boolean
  error?: string
  fallbackNames?: Record<string, { itemCode: string; itemName: string }>
}>()

const emit = defineEmits<{
  add: []
  edit: [index: number]
  remove: [index: number]
}>()

// Row display terpisah dari PurchaseOrderItemInput (form.items) — tabel ini
// murni presentational, tidak memutasi form. Type alias (bukan interface):
// constraint generic `T extends Record<string, unknown>` BaseDataTable gagal
// dengan interface.
type PoItemRow = {
  id: string
  index: number
  itemCode: string
  itemName: string
  unitName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

const columns: DataTableColumn[] = [
  { field: 'itemCode', header: 'Kode', sortable: false },
  { field: 'itemName', header: 'Item', sortable: false },
  { field: 'unitName', header: 'Satuan', sortable: false },
  { field: 'quantity', header: 'Qty', sortable: false },
  { field: 'unitPrice', header: 'Harga Beli', sortable: false },
  { field: 'subtotal', header: 'Subtotal', sortable: false },
]

const displayRows = computed<PoItemRow[]>(() =>
  props.rows.map((row, index) => {
    const item = props.supplierItems.find((i) => i.id === row.itemId)
    const fallback = props.fallbackNames?.[row.itemId]
    const unit = props.units.find((u) => u.id === row.unitId)
    return {
      id: `${row.itemId}:${row.unitId}`,
      index,
      itemCode: item?.itemCode ?? fallback?.itemCode ?? '(item tidak ditemukan)',
      itemName: item?.itemName ?? fallback?.itemName ?? '(item tidak ditemukan)',
      unitName: unit?.name ?? '(satuan tidak ditemukan)',
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      subtotal: row.quantity * row.unitPrice,
    }
  }),
)
</script>

<template>
  <div class="po-items">
    <p v-if="error" class="po-items__error">{{ error }}</p>

    <p v-if="!supplierSelected" class="po-items__hint">Pilih supplier terlebih dahulu untuk menambahkan item.</p>

    <BaseDataTable
      v-else
      :value="displayRows"
      :columns="columns"
      :show-search="false"
      :show-column-toggle="false"
      :show-export="false"
      :paginator="false"
      empty-title="Belum ada item"
    >
      <template #actions>
        <BaseButton
          label="Tambah Item"
          icon="pi pi-plus"
          :disabled="!supplierSelected"
          @click="emit('add')"
        />
      </template>

      <template #cell-unitPrice="{ value }">{{ formatCurrency(value as number) }}</template>
      <template #cell-subtotal="{ value }">{{ formatCurrency(value as number) }}</template>

      <template #row-actions="{ data }">
        <BaseButton
          icon="pi pi-pencil"
          variant="ghost"
          rounded
          aria-label="Edit"
          @click="emit('edit', data.index)"
        />
        <BaseButton
          icon="pi pi-trash"
          variant="danger"
          text
          rounded
          aria-label="Hapus"
          @click="emit('remove', data.index)"
        />
      </template>

      <template #empty-action>
        <BaseButton
          label="Tambah Item"
          icon="pi pi-plus"
          :disabled="!supplierSelected"
          @click="emit('add')"
        />
      </template>
    </BaseDataTable>
  </div>
</template>

<style scoped>
.po-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.po-items__hint {
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.po-items__error {
  font-size: var(--font-sm);
  color: var(--color-danger);
}
</style>
