<script setup lang="ts">
import { computed } from 'vue'
import BaseTag from '@/components/base/BaseTag.vue'
import { PO_STATUS_LABELS, PO_STATUS_VARIANT, type PurchaseOrderStatus } from '../types/purchase-order'

const props = defineProps<{
  status: PurchaseOrderStatus
}>()

const label = computed(() => PO_STATUS_LABELS[props.status] ?? props.status)
const variant = computed(() => PO_STATUS_VARIANT[props.status] ?? 'secondary')
</script>

<template>
  <BaseTag :value="label" :variant="variant" />
</template>
