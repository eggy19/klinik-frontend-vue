<script setup lang="ts">
import { computed, onMounted } from 'vue'
import BaseSummaryCard from '@/components/base/BaseSummaryCard.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useMedicineStore } from '@/modules/inventory/stores/medicine.store'

const inventory = useMedicineStore()
const auth = useAuthStore()

// Modul Billing belum masuk MVP — transaksi hari ini masih mock.
const todayTransaction = 24

const canSeeItems = computed(() => auth.can('inventory.item.read'))

onMounted(() => {
  if (canSeeItems.value && inventory.items.length === 0) inventory.fetchAll()
})
</script>

<template>
  <div class="dashboard">
    <h1 class="dashboard__title">Dashboard</h1>

    <!-- BR-FE-06: user tanpa permission apa pun -->
    <BaseEmptyState
      v-if="auth.permissions.length === 0"
      icon="pi pi-user"
      title="Belum ada akses"
      description="Akun Anda belum memiliki role di cabang ini. Hubungi admin."
    />

    <!-- Grid responsive: 4/3/2/1 kolom (docs/07) -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <BaseSummaryCard
        v-if="canSeeItems"
        title="Total Item"
        :value="inventory.totalItems"
        icon="pi pi-box"
        variant="primary"
        :loading="inventory.loading"
      />
      <BaseSummaryCard
        v-if="canSeeItems"
        title="Stok Rendah"
        :value="inventory.lowStockCount"
        icon="pi pi-exclamation-triangle"
        variant="warning"
        :loading="inventory.loading"
      />
      <BaseSummaryCard
        v-if="canSeeItems"
        title="Mendekati Kedaluwarsa"
        :value="inventory.nearExpiredCount"
        icon="pi pi-clock"
        variant="danger"
        :loading="inventory.loading"
      />
      <BaseSummaryCard
        title="Transaksi Hari Ini"
        :value="todayTransaction"
        icon="pi pi-shopping-cart"
        variant="success"
      />
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.dashboard__title {
  font-size: var(--font-2xl);
  color: var(--text);
}
</style>
