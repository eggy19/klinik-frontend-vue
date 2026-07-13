<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import BaseTag from '@/components/base/BaseTag.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import type { PaginationMeta } from '@/api/types'
import { loginHistoryApi, type LoginHistoryQuery } from '../api/login-history.api'
import {
  LOGIN_RESULT_LABELS,
  LOGIN_RESULT_VARIANTS,
  type LoginHistoryEntry,
} from '../types/login-history'
import { formatDateTime, formatRelative } from '@/utils/format'
import { formatUserAgent } from '@/utils/user-agent'

/**
 * Tabel riwayat login (server-side pagination), reusable: halaman Riwayat Login
 * (filter lengkap) dan tab Riwayat di Detail Pengguna (userId preset).
 */
const props = withDefaults(
  defineProps<{
    /** Filter dari pemanggil; perubahan memicu fetch ulang ke halaman 1. */
    filters?: Omit<LoginHistoryQuery, 'page' | 'limit'>
    showUserColumn?: boolean
    showTenantColumns?: boolean
  }>(),
  { filters: () => ({}), showUserColumn: true, showTenantColumns: true },
)

const items = ref<LoginHistoryEntry[]>([])
const meta = ref<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 })
const loading = ref(false)

const columns: DataTableColumn[] = [
  { field: 'createdAt', header: 'Waktu' },
  ...(props.showUserColumn ? [{ field: 'userName', header: 'Pengguna' }] : []),
  ...(props.showTenantColumns
    ? [
        { field: 'tenantName', header: 'Tenant' },
        { field: 'branchName', header: 'Cabang' },
      ]
    : []),
  { field: 'loginResult', header: 'Hasil' },
  { field: 'ipAddress', header: 'Alamat IP' },
  { field: 'userAgent', header: 'Perangkat' },
  { field: 'failureReason', header: 'Alasan Gagal' },
]

async function fetch(page = meta.value.page, limit = meta.value.limit) {
  loading.value = true
  try {
    const data = await loginHistoryApi.getHistory({ ...props.filters, page, limit })
    items.value = data.items
    meta.value = data.meta
  } finally {
    loading.value = false
  }
}

function onPage(event: { page: number; rows: number }) {
  void fetch(event.page, event.rows)
}

watch(
  () => props.filters,
  () => void fetch(1),
  { deep: true },
)

onMounted(() => void fetch(1))
</script>

<template>
  <BaseDataTable
    :value="items"
    :columns="columns"
    :loading="loading"
    lazy
    :total-records="meta.total"
    :rows="meta.limit"
    :show-search="false"
    empty-title="Tidak ada riwayat login"
    empty-description="Tidak ada catatan yang cocok dengan filter saat ini."
    @page="onPage"
  >
    <template #filters>
      <slot name="filters" />
    </template>

    <template #cell-createdAt="{ data }">
      <span :title="formatRelative((data as LoginHistoryEntry).createdAt)">
        {{ formatDateTime((data as LoginHistoryEntry).createdAt) }}
      </span>
    </template>

    <template v-if="showUserColumn" #cell-userName="{ data }">
      <div class="history-user">
        <span>{{ (data as LoginHistoryEntry).userName ?? '—' }}</span>
        <span class="history-user__email">{{ (data as LoginHistoryEntry).userEmail ?? '' }}</span>
      </div>
    </template>

    <template v-if="showTenantColumns" #cell-tenantName="{ data }">
      {{ (data as LoginHistoryEntry).tenantName ?? '-' }}
    </template>

    <template v-if="showTenantColumns" #cell-branchName="{ data }">
      {{ (data as LoginHistoryEntry).branchName ?? '-' }}
    </template>

    <template #cell-loginResult="{ data }">
      <BaseTag
        :value="LOGIN_RESULT_LABELS[(data as LoginHistoryEntry).loginResult]"
        :variant="LOGIN_RESULT_VARIANTS[(data as LoginHistoryEntry).loginResult]"
      />
    </template>

    <template #cell-ipAddress="{ data }">
      {{ (data as LoginHistoryEntry).ipAddress ?? '-' }}
    </template>

    <template #cell-userAgent="{ data }">
      <span :title="(data as LoginHistoryEntry).userAgent ?? undefined">
        {{ formatUserAgent((data as LoginHistoryEntry).userAgent) }}
      </span>
    </template>

    <template #cell-failureReason="{ data }">
      {{ (data as LoginHistoryEntry).failureReason ?? '-' }}
    </template>
  </BaseDataTable>
</template>

<style scoped>
.history-user {
  display: flex;
  flex-direction: column;
}

.history-user__email {
  font-size: var(--font-xs);
  color: var(--text-muted, #6b7280);
}
</style>
