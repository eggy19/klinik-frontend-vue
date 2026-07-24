<script setup lang="ts">
import { computed } from 'vue'
import BaseTag from '@/components/base/BaseTag.vue'
import { GR_STATUS_LABELS, GR_STATUS_VARIANT, type GoodsReceiptStatus } from '../types/goods-receipt'

const props = defineProps<{
  status: GoodsReceiptStatus
}>()

const label = computed(() => GR_STATUS_LABELS[props.status] ?? props.status)
const variant = computed(() => GR_STATUS_VARIANT[props.status] ?? 'secondary')
</script>

<template>
  <BaseTag :value="label" :variant="variant" />
</template>
