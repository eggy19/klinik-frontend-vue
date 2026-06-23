<script setup lang="ts">
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import type { ItemInput } from '../../types/item'
import type { Supplier } from '../../types/supplier'

const props = defineProps<{
  form: ItemInput
  suppliers: Supplier[]
}>()

function addRow() {
  props.form.suppliers.push({ supplierId: '', isPrimary: props.form.suppliers.length === 0 })
}

function removeRow(index: number) {
  props.form.suppliers.splice(index, 1)
  // Jika yang dihapus adalah primary, set yang pertama sebagai primary.
  if (props.form.suppliers.length > 0 && !props.form.suppliers.some((s) => s.isPrimary)) {
    props.form.suppliers[0].isPrimary = true
  }
}

function setPrimary(index: number) {
  props.form.suppliers.forEach((s, i) => {
    s.isPrimary = i === index
  })
}
</script>

<template>
  <div class="item-form-suppliers">
    <table v-if="form.suppliers.length > 0" class="item-form-suppliers__table">
      <thead>
        <tr>
          <th>Supplier</th>
          <th class="item-form-suppliers__col-center">Primary</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in form.suppliers" :key="i">
          <td>
            <BaseSelect
              :model-value="row.supplierId"
              :options="suppliers"
              option-label="name"
              option-value="id"
              placeholder="Pilih supplier..."
              @update:model-value="row.supplierId = $event as string"
            />
          </td>
          <td class="item-form-suppliers__col-center">
            <input
              type="radio"
              :checked="row.isPrimary"
              name="supplier-primary"
              @change="setPrimary(i)"
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

    <p v-else class="item-form-suppliers__empty">Belum ada supplier. Klik tombol di bawah untuk menambahkan.</p>

    <BaseButton label="Tambah Supplier" icon="pi pi-plus" variant="ghost" @click="addRow" />
  </div>
</template>

<style scoped>
.item-form-suppliers {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.item-form-suppliers__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-sm);
}

.item-form-suppliers__table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-weight: var(--font-weight-heading);
  color: var(--text-muted);
  border-bottom: 1px solid var(--surface-border);
}

.item-form-suppliers__table td {
  padding: var(--space-2) var(--space-3);
  vertical-align: middle;
}

.item-form-suppliers__col-center {
  text-align: center;
  width: 80px;
}

.item-form-suppliers__empty {
  font-size: var(--font-sm);
  color: var(--text-muted);
}
</style>
