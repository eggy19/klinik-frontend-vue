<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DatePicker from 'primevue/datepicker'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import LoginHistoryTable from '../components/LoginHistoryTable.vue'
import { useAdminUserStore } from '../stores/user.store'
import { useAdminTenantStore } from '../stores/tenant.store'
import { useTenantBranchCascade } from '../composables/useTenantBranchCascade'
import { LOGIN_RESULT_LABELS, type LoginResult } from '../types/login-history'
import type { LoginHistoryQuery } from '../api/login-history.api'

const userStore = useAdminUserStore()
const tenantStore = useAdminTenantStore()

// Default: 7 hari terakhir agar load pertama cepat dan relevan.
function lastSevenDays(): [Date, Date] {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 6)
  return [from, to]
}

const dateRange = ref<Date[] | null>(lastSevenDays())
const resultFilter = ref<LoginResult | null>(null)
const userFilter = ref<string | null>(null)
const tenantFilter = ref<string | null>(null)
const { branchId: branchFilter, branchOptions } = useTenantBranchCascade(tenantFilter)

const resultOptions = (Object.keys(LOGIN_RESULT_LABELS) as LoginResult[]).map((value) => ({
  value,
  label: LOGIN_RESULT_LABELS[value],
}))

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const filters = computed<Omit<LoginHistoryQuery, 'page' | 'limit'>>(() => {
  const [from, to] = dateRange.value ?? []
  return {
    dateFrom: from ? toIsoDate(from) : undefined,
    dateTo: to ? toIsoDate(to) : undefined,
    loginResult: resultFilter.value ?? undefined,
    userId: userFilter.value ?? undefined,
    tenantId: tenantFilter.value ?? undefined,
    branchId: branchFilter.value ?? undefined,
  }
})

function resetFilters() {
  dateRange.value = lastSevenDays()
  resultFilter.value = null
  userFilter.value = null
  tenantFilter.value = null
}

onMounted(() => {
  if (userStore.items.length === 0) void userStore.fetchAll()
  if (tenantStore.items.length === 0) void tenantStore.fetchAll()
})
</script>

<template>
  <div class="history-view">
    <div class="history-view__head">
      <h1 class="history-view__title">Riwayat Login</h1>
    </div>

    <BaseCard>
      <LoginHistoryTable :filters="filters">
        <template #filters>
          <DatePicker
            v-model="dateRange"
            selection-mode="range"
            :manual-input="false"
            date-format="dd/mm/yy"
            placeholder="Rentang tanggal"
            show-icon
          />
          <BaseSelect
            v-model="resultFilter"
            :options="resultOptions"
            option-label="label"
            option-value="value"
            placeholder="Semua hasil"
            show-clear
          />
          <BaseSelect
            v-model="userFilter"
            :options="userStore.items"
            option-label="name"
            option-value="id"
            placeholder="Semua pengguna"
            filter
            show-clear
          />
          <BaseSelect
            v-model="tenantFilter"
            :options="tenantStore.items"
            option-label="name"
            option-value="id"
            placeholder="Semua tenant"
            filter
            show-clear
          />
          <BaseSelect
            v-model="branchFilter"
            :options="branchOptions"
            option-label="name"
            option-value="id"
            :placeholder="tenantFilter ? 'Semua cabang' : 'Pilih tenant dulu'"
            :disabled="!tenantFilter"
            show-clear
          />
          <BaseButton
            label="Reset Filter"
            icon="pi pi-filter-slash"
            variant="ghost"
            @click="resetFilters"
          />
        </template>
      </LoginHistoryTable>
    </BaseCard>
  </div>
</template>

<style scoped>
.history-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.history-view__title {
  font-size: var(--font-2xl);
  color: var(--text);
}
</style>
