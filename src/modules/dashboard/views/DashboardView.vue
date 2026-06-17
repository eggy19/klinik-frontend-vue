<script setup lang="ts">
import { onMounted } from 'vue'
import SummaryCard from '../components/SummaryCard.vue'
import { useInventoryStore } from '@/modules/inventory/stores/inventory.store'

const inventory = useInventoryStore()

// Modul Billing belum masuk MVP — transaksi hari ini masih mock.
const todayTransaction = 24

onMounted(() => {
  if (inventory.items.length === 0) inventory.fetchAll()
})
</script>

<template>
  <div class="dashboard">
    <h1 class="dashboard__title">Dashboard</h1>

    <!-- Grid responsive: 4/3/2/1 kolom (docs/07) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Item"
        :value="inventory.totalItems"
        icon="pi pi-box"
        variant="primary"
        :loading="inventory.loading"
      />
      <SummaryCard
        title="Stok Rendah"
        :value="inventory.lowStockCount"
        icon="pi pi-exclamation-triangle"
        variant="warning"
        :loading="inventory.loading"
      />
      <SummaryCard
        title="Mendekati Kedaluwarsa"
        :value="inventory.nearExpiredCount"
        icon="pi pi-clock"
        variant="danger"
        :loading="inventory.loading"
      />
      <SummaryCard
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
