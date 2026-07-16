<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { itemApi } from '@/modules/inventory/api/item.api'
import type { Item } from '@/modules/inventory/types/item'
import type { Unit } from '@/modules/inventory/types/unit'
import { formatCurrency } from '@/utils/format'
import { emptyPurchaseOrderItem, type PurchaseOrderInput } from '../../types/purchase-order'

const props = defineProps<{
  form: PurchaseOrderInput
  items: Item[]
  units: Unit[]
  errors: Record<string, string>
}>()

// Cache satuan terdaftar per item (master_item_unit), diisi on-demand saat
// item pada baris dipilih — dipakai untuk opsi dropdown Satuan baris itu.
const unitOptionsByItem = reactive<Record<string, Unit[]>>({})

async function loadUnitOptions(itemId: string) {
  if (!itemId || unitOptionsByItem[itemId]) return
  try {
    const links = await itemApi.getUnits(itemId)
    unitOptionsByItem[itemId] = links
      .map((l) => props.units.find((u) => u.id === l.unitId))
      .filter((u): u is Unit => !!u)
  } catch {
    unitOptionsByItem[itemId] = []
  }
}

function unitOptionsFor(itemId: string): Unit[] {
  return unitOptionsByItem[itemId] ?? []
}

async function onItemChange(row: PurchaseOrderInput['items'][number], itemId: string) {
  row.itemId = itemId
  row.unitId = ''
  await loadUnitOptions(itemId)
  const first = unitOptionsFor(itemId)[0]
  if (first) row.unitId = first.id
}

function addRow() {
  props.form.items.push(emptyPurchaseOrderItem())
}

function removeRow(index: number) {
  props.form.items.splice(index, 1)
}

function subtotal(row: { quantity: number; unitPrice: number }): number {
  return (row.quantity || 0) * (row.unitPrice || 0)
}

onMounted(() => {
  // Mode edit: pre-load opsi satuan untuk baris yang sudah ada.
  for (const row of props.form.items) {
    if (row.itemId) loadUnitOptions(row.itemId)
  }
})
</script>

<template>
  <div class="po-items">
    <p v-if="errors.items" class="po-items__error">{{ errors.items }}</p>

    <p v-if="!form.supplierId" class="po-items__hint">Pilih supplier terlebih dahulu untuk menambahkan item.</p>

    <table v-else-if="form.items.length > 0" class="po-items__table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Satuan</th>
          <th class="po-items__col-num">Qty</th>
          <th class="po-items__col-num">Harga Beli</th>
          <th class="po-items__col-num">Subtotal</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in form.items" :key="i">
          <td>
            <BaseSelect
              :model-value="row.itemId"
              :options="items"
              option-label="itemName"
              option-value="id"
              filter
              placeholder="Pilih item..."
              :error="errors[`items.${i}.itemId`]"
              @update:model-value="onItemChange(row, $event as string)"
            />
          </td>
          <td>
            <BaseSelect
              :model-value="row.unitId"
              :options="unitOptionsFor(row.itemId)"
              option-label="name"
              option-value="id"
              placeholder="Satuan..."
              :disabled="!row.itemId"
              :error="errors[`items.${i}.unitId`]"
              @update:model-value="row.unitId = $event as string"
            />
          </td>
          <td class="po-items__col-num">
            <input
              type="number"
              class="po-items__input"
              :value="row.quantity"
              min="0.0001"
              step="any"
              @input="row.quantity = Number(($event.target as HTMLInputElement).value)"
            />
          </td>
          <td class="po-items__col-num">
            <input
              type="number"
              class="po-items__input"
              :value="row.unitPrice"
              min="0"
              step="any"
              @input="row.unitPrice = Number(($event.target as HTMLInputElement).value)"
            />
          </td>
          <td class="po-items__col-num po-items__subtotal">{{ formatCurrency(subtotal(row)) }}</td>
          <td>
            <BaseButton
              icon="pi pi-trash"
              variant="danger"
              text
              rounded
              aria-label="Hapus"
              @click="removeRow(i)"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else class="po-items__empty">Belum ada item. Klik tombol di bawah untuk menambahkan.</p>

    <BaseButton
      label="Tambah Item"
      icon="pi pi-plus"
      variant="ghost"
      :disabled="!form.supplierId"
      @click="addRow"
    />
  </div>
</template>

<style scoped>
.po-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.po-items__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-sm);
}

.po-items__table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-weight: var(--font-weight-heading);
  color: var(--text-muted);
  border-bottom: 1px solid var(--surface-border);
}

.po-items__table td {
  padding: var(--space-2) var(--space-3);
  vertical-align: middle;
}

.po-items__col-num {
  text-align: right;
}

.po-items__input {
  width: 100px;
  padding: var(--space-2);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: var(--font-sm);
  color: var(--text);
  background: var(--surface-0);
  text-align: right;
}

.po-items__input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.po-items__subtotal {
  white-space: nowrap;
  color: var(--text);
}

.po-items__empty,
.po-items__hint {
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.po-items__error {
  font-size: var(--font-sm);
  color: var(--color-danger);
}
</style>
