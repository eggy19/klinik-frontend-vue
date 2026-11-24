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
  <div class="po-totals kp-total">
    <span class="kp-total__label">Total PO</span>
    <span class="kp-total__value po-totals__value">{{ formatCurrency(total) }}</span>
  </div>
</template>

<style scoped>
.po-totals__value {
  font-size: var(--font-xl);
}
</style>
