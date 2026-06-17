<script setup lang="ts">
import { computed } from 'vue'
import BaseCard from '@/components/base/BaseCard.vue'

type Variant = 'primary' | 'success' | 'warning' | 'danger' | 'info'

const props = withDefaults(
  defineProps<{
    title: string
    value: string | number
    icon: string
    variant?: Variant
    loading?: boolean
  }>(),
  { variant: 'primary', loading: false },
)

// Warna ikon mengikuti token status (lewat CSS variable, bukan hardcode).
const accent = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'var(--color-success)'
    case 'warning':
      return 'var(--color-warning)'
    case 'danger':
      return 'var(--color-danger)'
    case 'info':
      return 'var(--color-info)'
    default:
      return 'var(--color-primary)'
  }
})
</script>

<template>
  <BaseCard>
    <div class="summary">
      <div class="summary__icon" :style="{ color: accent, backgroundColor: `${accent}1a` }">
        <i :class="icon" aria-hidden="true" />
      </div>
      <div class="summary__body">
        <p class="summary__title">{{ title }}</p>
        <p class="summary__value">{{ loading ? '—' : value }}</p>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped>
.summary {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.summary__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  font-size: 1.4rem;
  flex-shrink: 0;
}

.summary__title {
  margin: 0;
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.summary__value {
  margin: 0;
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}
</style>
