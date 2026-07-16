<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '@/utils/format'
import type { PurchaseOrderItemInput } from '../../types/purchase-order'

const props = defineProps<{
  items: PurchaseOrderItemInput[]
}>()

const total = computed(() =>
  props.items.reduce((sum, row) => sum + (row.quantity || 0) * (row.unitPrice || 0), 0),
)
</script>

<template>
  <div class="po-totals">
    <span class="po-totals__label">Total</span>
    <span class="po-totals__value">{{ formatCurrency(total) }}</span>
  </div>
</template>

<style scoped>
.po-totals {
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-top: 1px solid var(--surface-border);
}

.po-totals__label {
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.po-totals__value {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}
</style>
