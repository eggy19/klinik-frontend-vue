<script setup lang="ts">
import { computed, watch } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import type { ItemInput } from '../../types/item'
import type { ItemType } from '../../types/item-type'
import type { Category } from '../../types/category'
import type { Unit } from '../../types/unit'
import type { DrugGroup } from '../../types/drug-group'

const props = defineProps<{
  form: ItemInput
  errors: Record<string, string>
  isEditMode: boolean
  itemTypes: ItemType[]
  categories: Category[]
  units: Unit[]
  drugGroups: DrugGroup[]
}>()

const filteredCategories = computed(() =>
  props.categories.filter((c) => c.itemTypeId === props.form.itemTypeId),
)

// Status "perlu resep" murni turunan dari Golongan Obat yang dipilih —
// tidak lagi diinput manual di form Item.
const selectedDrugGroup = computed(
  () => props.drugGroups.find((g) => g.id === props.form.drugGroupId) ?? null,
)

watch(
  selectedDrugGroup,
  (dg) => {
    props.form.prescriptionRequired = dg?.requiresPrescription ?? false
  },
  { immediate: true },
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
      :model-value="form.skuCode"
      label="Kode SKU"
      :error="errors.skuCode"
      @update:model-value="form.skuCode = $event as string"
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
    <div class="item-form-basic__drug-group">
      <BaseSelect
        :model-value="form.drugGroupId"
        label="Golongan Obat"
        :options="drugGroups"
        option-label="name"
        option-value="id"
        :error="errors.drugGroupId"
        filter
        show-clear
        @update:model-value="form.drugGroupId = ($event as string) ?? ''"
      />
      <BaseTag
        v-if="selectedDrugGroup"
        :value="selectedDrugGroup.requiresPrescription ? 'Wajib Resep Dokter' : 'Bebas (Tanpa Resep)'"
        :variant="selectedDrugGroup.requiresPrescription ? 'warning' : 'secondary'"
      />
    </div>
  </div>
</template>

<style scoped>
.item-form-basic__drug-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
