<script setup lang="ts">
import { computed } from 'vue'
import Tag from 'primevue/tag'

type Variant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'

const props = withDefaults(
  defineProps<{
    value?: string
    variant?: Variant
  }>(),
  { variant: 'primary' },
)

const severity = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'success'
    case 'warning':
      return 'warn'
    case 'danger':
      return 'danger'
    case 'info':
      return 'info'
    case 'secondary':
      return 'secondary'
    default:
      return undefined // primary
  }
})
</script>

<template>
  <Tag :value="value" :severity="severity">
    <slot />
  </Tag>
</template>
