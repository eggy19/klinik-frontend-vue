<script setup lang="ts">
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import type { ItemInput } from '../../types/item'
import type { Unit } from '../../types/unit'

const props = defineProps<{
  form: ItemInput
  units: Unit[]
  errors: Record<string, string>
}>()

function addRow() {
  props.form.conversions.push({ fromUnitId: '', toUnitId: '', factor: 1 })
}

function removeRow(index: number) {
  props.form.conversions.splice(index, 1)
}
</script>

<template>
  <div class="item-form-conv">
    <p v-if="errors.conversions" class="item-form-conv__error">{{ errors.conversions }}</p>

    <table v-if="form.conversions.length > 0" class="item-form-conv__table">
      <thead>
        <tr>
          <th>Dari Satuan</th>
          <th></th>
          <th>Ke Satuan</th>
          <th>Faktor</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in form.conversions" :key="i">
          <td>
            <BaseSelect
              :model-value="row.fromUnitId"
              :options="units"
              option-label="name"
              option-value="id"
              placeholder="Dari..."
              @update:model-value="row.fromUnitId = $event as string"
            />
          </td>
          <td class="item-form-conv__arrow">→</td>
          <td>
            <BaseSelect
              :model-value="row.toUnitId"
              :options="units"
              option-label="name"
              option-value="id"
              placeholder="Ke..."
              @update:model-value="row.toUnitId = $event as string"
            />
          </td>
          <td>
            <input
              type="number"
              class="item-form-conv__input"
              :value="row.factor"
              min="1"
              @input="row.factor = Number(($event.target as HTMLInputElement).value)"
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

    <p v-else class="item-form-conv__empty">
      Belum ada konversi satuan. Contoh: BOX → STRIP dengan faktor 10.
    </p>

    <BaseButton label="Tambah Konversi" icon="pi pi-plus" variant="ghost" @click="addRow" />
  </div>
</template>

<style scoped>
.item-form-conv {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.item-form-conv__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-sm);
}

.item-form-conv__table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-weight: var(--font-weight-heading);
  color: var(--text-muted);
  border-bottom: 1px solid var(--surface-border);
}

.item-form-conv__table td {
  padding: var(--space-2) var(--space-3);
  vertical-align: middle;
}

.item-form-conv__arrow {
  text-align: center;
  color: var(--text-muted);
  width: 32px;
}

.item-form-conv__input {
  width: 80px;
  padding: var(--space-2);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: var(--font-sm);
  color: var(--text);
  background: var(--surface-0);
}

.item-form-conv__input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.item-form-conv__empty {
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.item-form-conv__error {
  font-size: var(--font-sm);
  color: var(--color-danger);
}
</style>
