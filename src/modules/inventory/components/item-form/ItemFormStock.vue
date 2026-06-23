<script setup lang="ts">
import { watch } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import type { ItemInput } from '../../types/item'

const props = defineProps<{
  form: ItemInput
  errors: Record<string, string>
}>()

// Jika trackExpiry aktif, trackBatch wajib aktif juga (business rule).
watch(
  () => props.form.trackExpiry,
  (val) => {
    if (val) props.form.trackBatch = true
  },
)
</script>

<template>
  <div class="item-form-stock">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <BaseInput
        :model-value="String(form.minimumStock)"
        label="Min Stok"
        required
        type="number"
        :error="errors.minimumStock"
        @update:model-value="form.minimumStock = Number($event)"
      />
      <BaseInput
        :model-value="String(form.maximumStock)"
        label="Max Stok"
        type="number"
        :error="errors.maximumStock"
        @update:model-value="form.maximumStock = Number($event)"
      />
      <BaseInput
        :model-value="String(form.reorderPoint)"
        label="Reorder Point"
        type="number"
        :error="errors.reorderPoint"
        @update:model-value="form.reorderPoint = Number($event)"
      />
    </div>

    <div class="item-form-stock__toggles">
      <label class="item-form-stock__toggle">
        <input
          type="checkbox"
          :checked="form.trackBatch"
          :disabled="form.trackExpiry"
          @change="form.trackBatch = ($event.target as HTMLInputElement).checked"
        />
        <span>Track Batch</span>
        <span v-if="form.trackExpiry" class="item-form-stock__note">
          (otomatis aktif karena Track Expiry)
        </span>
      </label>

      <label class="item-form-stock__toggle">
        <input
          type="checkbox"
          :checked="form.trackExpiry"
          @change="form.trackExpiry = ($event.target as HTMLInputElement).checked"
        />
        <span>Track Expiry</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.item-form-stock {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.item-form-stock__toggles {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.item-form-stock__toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--font-sm);
  color: var(--text);
}

.item-form-stock__note {
  color: var(--text-muted);
  font-size: var(--font-xs);
}
</style>
