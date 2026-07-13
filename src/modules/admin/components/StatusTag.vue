<script setup lang="ts">
import { computed } from 'vue'
import BaseTag from '@/components/base/BaseTag.vue'
import { STATUS_LABELS, type EntityStatus } from '../types/common'

const props = defineProps<{
  status: EntityStatus
}>()

const label = computed(() => STATUS_LABELS[props.status] ?? props.status)
const variant = computed(() => (props.status === 'active' ? 'success' : 'secondary'))
</script>

<template>
  <BaseTag :value="label" :variant="variant" />
</template>
