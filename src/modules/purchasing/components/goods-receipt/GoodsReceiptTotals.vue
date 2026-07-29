<script setup lang="ts">
import { formatCurrency } from '@/utils/format'

/**
 * Pure/presentational — always receives already-computed numbers. The
 * create form computes a live preview client-side (same formulas as the
 * backend); the detail view passes the server-computed GoodsReceipt as-is.
 * Discount/tax rows render only when their amount is non-null, keeping the
 * NULL-vs-zero distinction from the spec visible in the UI (never show
 * "Rp 0" for a level that wasn't used).
 */
defineProps<{
  subtotal: number
  discountLabel?: string
  discountAmount: number | null
  taxRate: number | null
  taxAmount: number | null
  grandTotal: number
}>()
</script>

<template>
  <div class="gr-totals">
    <div class="gr-totals__row">
      <span class="gr-totals__label">Subtotal</span>
      <span class="gr-totals__value">{{ formatCurrency(subtotal) }}</span>
    </div>
    <div v-if="discountAmount != null" class="gr-totals__row">
      <span class="gr-totals__label">{{ discountLabel ?? 'Diskon' }}</span>
      <span class="gr-totals__value">− {{ formatCurrency(discountAmount) }}</span>
    </div>
    <div v-if="taxAmount != null" class="gr-totals__row">
      <span class="gr-totals__label">PPN{{ taxRate != null ? ` (${taxRate}%)` : '' }}</span>
      <span class="gr-totals__value">+ {{ formatCurrency(taxAmount) }}</span>
    </div>
    <div class="gr-totals__row gr-totals__row--grand">
      <span class="gr-totals__label">Grand Total</span>
      <span class="gr-totals__value">{{ formatCurrency(grandTotal) }}</span>
    </div>
  </div>
</template>

<style scoped>
.gr-totals {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-self: flex-end;
  min-width: 260px;
}

.gr-totals__row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-3);
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.gr-totals__row--grand {
  padding-top: var(--space-2);
  border-top: 1px solid var(--surface-border);
  font-size: var(--font-xl);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}
</style>
