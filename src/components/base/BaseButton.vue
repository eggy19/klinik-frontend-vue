<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'

type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost'
type Size = 'small' | 'normal' | 'large'

const props = withDefaults(
  defineProps<{
    label?: string
    icon?: string
    variant?: Variant
    size?: Size
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    // Tampilan ikon-saja membulat (mis. aksi baris tabel).
    rounded?: boolean
    // Paksa gaya text/transparan dengan tetap mempertahankan warna variant.
    text?: boolean
    ariaLabel?: string
  }>(),
  {
    variant: 'primary',
    size: 'normal',
    loading: false,
    disabled: false,
    type: 'button',
    rounded: false,
    text: false,
  },
)

// Pemetaan variant bisnis -> properti PrimeVue Button.
const severity = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'secondary'
    case 'success':
      return 'success'
    case 'warning':
      return 'warn'
    case 'danger':
      return 'danger'
    default:
      return undefined // primary & ghost
  }
})

const isText = computed(() => props.text || props.variant === 'ghost')
const primeSize = computed(() => (props.size === 'normal' ? undefined : props.size))
</script>

<template>
  <Button
    :label="label"
    :icon="icon"
    :severity="severity"
    :text="isText"
    :rounded="rounded"
    :size="primeSize"
    :loading="loading"
    :disabled="disabled"
    :type="type"
    :aria-label="ariaLabel"
    class="base-button"
  >
    <slot />
  </Button>
</template>

<style scoped>
/* Touch target minimal 40px (docs/07-responsive-guideline.md). */
.base-button {
  min-height: 40px;
}
</style>
