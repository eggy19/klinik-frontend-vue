<script setup lang="ts">
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import type { ItemInput } from '../../types/item'
import type { Unit } from '../../types/unit'

const props = defineProps<{
  form: ItemInput
  units: Unit[]
}>()

function addRow() {
  props.form.prices.push({ unitId: '', purchasePrice: 0, sellingPrice: 0 })
}

function removeRow(index: number) {
  props.form.prices.splice(index, 1)
}
</script>

<template>
  <div class="item-form-prices">
    <table v-if="form.prices.length > 0" class="item-form-prices__table">
      <thead>
        <tr>
          <th>Satuan</th>
          <th>Harga Beli (Rp)</th>
          <th>Harga Jual (Rp)</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in form.prices" :key="i">
          <td>
            <BaseSelect
              :model-value="row.unitId"
              :options="units"
              option-label="name"
              option-value="id"
              placeholder="Pilih satuan..."
              @update:model-value="row.unitId = $event as string"
            />
          </td>
          <td>
            <input
              type="number"
              class="item-form-prices__input"
              :value="row.purchasePrice"
              min="0"
              @input="row.purchasePrice = Number(($event.target as HTMLInputElement).value)"
            />
          </td>
          <td>
            <input
              type="number"
              class="item-form-prices__input"
              :value="row.sellingPrice"
              min="0"
              @input="row.sellingPrice = Number(($event.target as HTMLInputElement).value)"
            />
          </td>
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

    <p v-else class="item-form-prices__empty">Belum ada harga. Klik tombol di bawah untuk menambahkan.</p>

    <BaseButton label="Tambah Harga" icon="pi pi-plus" variant="ghost" @click="addRow" />
  </div>
</template>

<style scoped>
.item-form-prices {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.item-form-prices__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-sm);
}

.item-form-prices__table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-weight: var(--font-weight-heading);
  color: var(--text-muted);
  border-bottom: 1px solid var(--surface-border);
}

.item-form-prices__table td {
  padding: var(--space-2) var(--space-3);
  vertical-align: middle;
}

.item-form-prices__input {
  width: 100%;
  max-width: 160px;
  padding: var(--space-2);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: var(--font-sm);
  color: var(--text);
  background: var(--surface-0);
}

.item-form-prices__input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.item-form-prices__empty {
  font-size: var(--font-sm);
  color: var(--text-muted);
}
</style>
