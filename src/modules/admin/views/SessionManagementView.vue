<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ToggleSwitch from 'primevue/toggleswitch'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import SessionTable from '../components/SessionTable.vue'
import { useAdminUserStore } from '../stores/user.store'

const userStore = useAdminUserStore()

const userFilter = ref<string | null>(null)
const activeOnly = ref(true)

onMounted(() => {
  if (userStore.items.length === 0) void userStore.fetchAll()
})
</script>

<template>
  <div class="session-view">
    <div class="session-view__head">
      <h1 class="session-view__title">Sesi Aktif</h1>
    </div>

    <BaseCard>
      <SessionTable :user-id="userFilter" :active-only="activeOnly">
        <template #filters>
          <BaseSelect
            v-model="userFilter"
            :options="userStore.items"
            option-label="name"
            option-value="id"
            placeholder="Semua pengguna"
            filter
            show-clear
          />
          <label class="session-view__toggle">
            <ToggleSwitch v-model="activeOnly" />
            <span>Hanya sesi aktif</span>
          </label>
        </template>
      </SessionTable>
    </BaseCard>
  </div>
</template>

<style scoped>
.session-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.session-view__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.session-view__toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-sm);
  color: var(--text);
  cursor: pointer;
}
</style>
