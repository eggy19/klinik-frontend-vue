<script setup lang="ts">
import { computed } from 'vue'
import BaseTag from '@/components/base/BaseTag.vue'
import {
  computeExpiryStatus,
  DEFAULT_EXPIRY_THRESHOLD_DAYS,
  EXPIRY_STATUS_LABELS,
  EXPIRY_STATUS_VARIANT,
} from '../types/batch'

const props = withDefaults(
  defineProps<{
    expiredDate: string | null
    thresholdDays?: number
  }>(),
  { thresholdDays: DEFAULT_EXPIRY_THRESHOLD_DAYS },
)

const status = computed(() => computeExpiryStatus(props.expiredDate, props.thresholdDays))
const label = computed(() => EXPIRY_STATUS_LABELS[status.value])
const variant = computed(() => EXPIRY_STATUS_VARIANT[status.value])
</script>

<template>
  <BaseTag :value="label" :variant="variant" />
</template>
