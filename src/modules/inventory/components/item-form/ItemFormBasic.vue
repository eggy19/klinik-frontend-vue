<script setup lang="ts">
import { computed } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import type { ItemInput } from '../../types/item'
import type { ItemType } from '../../types/item-type'
import type { Category } from '../../types/category'
import type { Unit } from '../../types/unit'

const props = defineProps<{
  form: ItemInput
  errors: Record<string, string>
  isEditMode: boolean
  itemTypes: ItemType[]
  categories: Category[]
  units: Unit[]
}>()

const filteredCategories = computed(() =>
  props.categories.filter((c) => c.itemTypeId === props.form.itemTypeId),
)
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <BaseInput
      :model-value="form.itemCode"
      label="Kode Item"
      required
      :error="errors.itemCode"
      placeholder="mis. MED000001"
      :disabled="isEditMode"
      @update:model-value="form.itemCode = $event as string"
    />
    <BaseInput
      :model-value="form.itemName"
      label="Nama Item"
      required
      :error="errors.itemName"
      @update:model-value="form.itemName = $event as string"
    />
    <BaseInput
      :model-value="form.barcode"
      label="Barcode"
      :error="errors.barcode"
      @update:model-value="form.barcode = $event as string"
    />
    <BaseInput
      :model-value="form.manufacturer"
      label="Manufacturer"
      :error="errors.manufacturer"
      @update:model-value="form.manufacturer = $event as string"
    />
    <BaseSelect
      :model-value="form.itemTypeId"
      label="Tipe Item"
      required
      :options="itemTypes"
      option-label="name"
      option-value="id"
      :error="errors.itemTypeId"
      filter
      @update:model-value="(v) => { form.itemTypeId = v as string; form.categoryId = '' }"
    />
    <BaseSelect
      :model-value="form.categoryId"
      label="Kategori"
      required
      :options="filteredCategories"
      option-label="name"
      option-value="id"
      :error="errors.categoryId"
      :disabled="!form.itemTypeId"
      filter
      @update:model-value="form.categoryId = $event as string"
    />
    <div class="md:col-span-2">
      <BaseSelect
        :model-value="form.defaultUnitId"
        label="Satuan Default"
        required
        :options="units"
        option-label="name"
        option-value="id"
        :error="errors.defaultUnitId"
        filter
        @update:model-value="form.defaultUnitId = $event as string"
      />
    </div>
    <div class="item-form-basic__toggle">
      <label class="item-form-basic__toggle-label">
        Perlu Resep Dokter
      </label>
      <div class="item-form-basic__toggle-row">
        <input
          type="checkbox"
          :checked="form.prescriptionRequired"
          @change="form.prescriptionRequired = ($event.target as HTMLInputElement).checked"
        />
        <span v-if="form.prescriptionRequired" class="item-form-basic__warning">
          Item ini tidak dapat dijual melalui OTC Sales
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.item-form-basic__toggle {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.item-form-basic__toggle-label {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.item-form-basic__toggle-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.item-form-basic__warning {
  font-size: var(--font-sm);
  color: var(--color-warning, #f59e0b);
}
</style>
