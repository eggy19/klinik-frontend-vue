<script setup lang="ts">
import BaseSelect from '@/components/base/BaseSelect.vue'
import { useReceiptWidth } from '../composables/useReceiptWidth'

// Pilihan lebar kertas struk, tersimpan per perangkat (BR-RC-10).
const { width, setWidth } = useReceiptWidth()

const options = [
  { value: 58, label: '58 mm' },
  { value: 80, label: '80 mm' },
]
</script>

<template>
  <BaseSelect
    :model-value="width"
    :options="options"
    option-label="label"
    option-value="value"
    label="Lebar kertas struk"
    @update:model-value="setWidth($event === 80 ? 80 : 58)"
  />
</template>
