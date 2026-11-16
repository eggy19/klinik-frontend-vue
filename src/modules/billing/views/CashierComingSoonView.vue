<script setup lang="ts">
import { useRoute } from 'vue-router'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'

// Penampung route Riwayat Penjualan / Daftar Shift sampai halamannya dibuat (BL-20).
const route = useRoute()
</script>

<template>
  <BaseEmptyState
    icon="pi pi-clock"
    :title="`${route.meta.title ?? 'Halaman'} belum tersedia`"
    description="Halaman ini sedang disiapkan."
  />
</template>
