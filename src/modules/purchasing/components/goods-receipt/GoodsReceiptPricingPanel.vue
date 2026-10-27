<script setup lang="ts">
import BaseSelect from '@/components/base/BaseSelect.vue'
import { formatCurrency, formatNominalInput, parseNominalInput } from '@/utils/format'
import {
  MARGIN_SOURCE_OPTIONS,
  MARGIN_TYPE_OPTIONS,
  type MarginSource,
  type MarginType,
} from '../../types/goods-receipt'

defineProps<{
  colspan: number
  expanded: boolean
  marginSource: MarginSource
  marginType: MarginType | null
  marginValue: number | null
  defaultMarginType: MarginType
  defaultMarginValue: number
  sellingPricePerUnit: number
  estimatedSellingValue: number
  marginError?: string
}>()

defineEmits<{
  'update:expanded': [value: boolean]
  'update:marginSource': [value: MarginSource]
  'update:marginType': [value: MarginType]
  'update:marginValue': [value: number | null]
}>()
</script>

<template>
  <tr class="gr-pricing-panel__row">
    <td :colspan="colspan" class="gr-pricing-panel__cell">
      <button
        type="button"
        class="gr-pricing-panel__toggle"
        :aria-expanded="expanded"
        @click="$emit('update:expanded', !expanded)"
      >
        <i class="pi" :class="expanded ? 'pi-chevron-down' : 'pi-chevron-right'" aria-hidden="true" />
        Pricing Information
      </button>

      <div v-if="expanded" class="gr-pricing-panel__content">
        <div class="gr-pricing-panel__field">
          <span class="gr-pricing-panel__label">Margin</span>
          <div class="gr-pricing-panel__margin-control">
            <BaseSelect
              :model-value="marginSource"
              :options="MARGIN_SOURCE_OPTIONS"
              option-label="label"
              option-value="value"
              @update:model-value="$emit('update:marginSource', $event as MarginSource)"
            />
            <template v-if="marginSource === 'MANUAL'">
              <BaseSelect
                :model-value="marginType"
                :options="MARGIN_TYPE_OPTIONS"
                option-label="label"
                option-value="value"
                @update:model-value="$emit('update:marginType', $event as MarginType)"
              />
              <input
                v-if="marginType === 'FIXED'"
                type="text"
                inputmode="decimal"
                class="gr-pricing-panel__input"
                :value="formatNominalInput(marginValue)"
                @input="$emit('update:marginValue', parseNominalInput(($event.target as HTMLInputElement).value))"
              />
              <input
                v-else
                type="number"
                class="gr-pricing-panel__input"
                min="0"
                step="any"
                :value="marginValue ?? ''"
                @input="
                  $emit(
                    'update:marginValue',
                    ($event.target as HTMLInputElement).value === ''
                      ? null
                      : Number(($event.target as HTMLInputElement).value),
                  )
                "
              />
              <p v-if="marginError" class="gr-pricing-panel__error">{{ marginError }}</p>
            </template>
            <span v-else class="gr-pricing-panel__hint">
              {{ defaultMarginValue }}{{ defaultMarginType === 'PERCENTAGE' ? '%' : ' Rp' }} (Default)
            </span>
          </div>
        </div>

        <div class="gr-pricing-panel__field">
          <span class="gr-pricing-panel__label">Harga Jual / Item</span>
          <span class="gr-pricing-panel__value">{{ formatCurrency(sellingPricePerUnit) }}</span>
        </div>

        <div class="gr-pricing-panel__field">
          <span class="gr-pricing-panel__label">Estimasi Nilai Penjualan</span>
          <span class="gr-pricing-panel__value">{{ formatCurrency(estimatedSellingValue) }}</span>
        </div>
      </div>
    </td>
  </tr>
</template>

<style scoped>
.gr-pricing-panel__row {
  background: var(--surface-50, var(--surface-0));
}

.gr-pricing-panel__cell {
  padding: var(--space-1) var(--space-3) var(--space-3);
}

.gr-pricing-panel__toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) 0;
  border: none;
  background: none;
  font: inherit;
  font-size: var(--font-sm);
  font-weight: var(--font-weight-heading);
  color: var(--text-muted);
  cursor: pointer;
}

.gr-pricing-panel__toggle:hover {
  color: var(--text);
}

.gr-pricing-panel__content {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-6);
  margin-top: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
}

.gr-pricing-panel__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 160px;
}

.gr-pricing-panel__label {
  font-size: var(--font-xs);
  font-weight: var(--font-weight-heading);
  color: var(--text-muted);
}

.gr-pricing-panel__value {
  font-size: var(--font-sm);
  color: var(--text);
}

.gr-pricing-panel__margin-control {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.gr-pricing-panel__input {
  width: 140px;
  padding: var(--space-2);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: var(--font-sm);
  color: var(--text);
  background: var(--surface-0);
}

.gr-pricing-panel__input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.gr-pricing-panel__hint {
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.gr-pricing-panel__error {
  margin: 0;
  font-size: var(--font-sm);
  color: var(--color-danger);
}
</style>
