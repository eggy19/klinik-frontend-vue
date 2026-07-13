<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import type { PaginationMeta } from '@/api/types'
import { sessionApi } from '../api/session.api'
import type { AdminSession } from '../types/session'
import { formatDateTime, formatRelative } from '@/utils/format'
import { formatUserAgent } from '@/utils/user-agent'
import { useToastFeedback } from '@/composables/useToastFeedback'

/**
 * Tabel sesi (server-side pagination), reusable: dipakai halaman Sesi Aktif
 * (semua pengguna) dan tab Sesi di Detail Pengguna (userId preset).
 */
const props = withDefaults(
  defineProps<{
    userId?: string | null
    activeOnly?: boolean
    showUserColumn?: boolean
  }>(),
  { userId: null, activeOnly: true, showUserColumn: true },
)

const emit = defineEmits<{
  revoked: [session: AdminSession]
}>()

const confirm = useConfirm()
const toast = useToastFeedback()

const items = ref<AdminSession[]>([])
const meta = ref<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 })
const loading = ref(false)

const columns: DataTableColumn[] = [
  ...(props.showUserColumn ? [{ field: 'userName', header: 'Pengguna' }] : []),
  { field: 'userAgent', header: 'Perangkat' },
  { field: 'ipAddress', header: 'Alamat IP' },
  { field: 'createdAt', header: 'Dibuat' },
  { field: 'expiresAt', header: 'Kedaluwarsa' },
]

async function fetch(page = meta.value.page, limit = meta.value.limit) {
  loading.value = true
  try {
    const data = await sessionApi.getSessions({
      page,
      limit,
      userId: props.userId ?? undefined,
      activeOnly: props.activeOnly,
    })
    items.value = data.items
    meta.value = data.meta
  } finally {
    loading.value = false
  }
}

function onPage(event: { page: number; rows: number }) {
  void fetch(event.page, event.rows)
}

function confirmRevoke(session: AdminSession) {
  confirm.require({
    header: 'Cabut Sesi',
    message: session.current
      ? 'Ini adalah sesi Anda saat ini. Anda akan langsung keluar dari aplikasi. Lanjutkan?'
      : 'Cabut sesi ini? Pengguna akan keluar dari perangkat tersebut.',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Batal',
    acceptLabel: 'Cabut',
    acceptProps: { severity: 'danger' },
    accept: async () => {
      try {
        await sessionApi.revokeSession(session.id)
        toast.success('Sesi berhasil dicabut.')
        emit('revoked', session)
        await fetch()
      } catch {
        toast.error('Gagal mencabut sesi.')
      }
    },
  })
}

watch(
  () => [props.userId, props.activeOnly],
  () => void fetch(1),
)

onMounted(() => void fetch(1))

defineExpose({ refresh: () => fetch() })
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
    empty-title="Tidak ada sesi"
    empty-description="Tidak ada sesi yang cocok dengan filter saat ini."
    @page="onPage"
  >
    <template #filters>
      <slot name="filters" />
    </template>

    <template v-if="showUserColumn" #cell-userName="{ data }">
      <div class="session-user">
        <span class="session-user__name">
          {{ (data as AdminSession).userName ?? '-' }}
          <BaseTag v-if="(data as AdminSession).current" variant="info" value="Sesi Anda" />
        </span>
        <span class="session-user__email">{{ (data as AdminSession).userEmail ?? '' }}</span>
      </div>
    </template>

    <template #cell-userAgent="{ data }">
      <span :title="(data as AdminSession).userAgent ?? undefined">
        {{ formatUserAgent((data as AdminSession).userAgent) }}
        <BaseTag
          v-if="!showUserColumn && (data as AdminSession).current"
          variant="info"
          value="Sesi Anda"
        />
      </span>
    </template>

    <template #cell-ipAddress="{ data }">
      {{ (data as AdminSession).ipAddress ?? '-' }}
    </template>

    <template #cell-createdAt="{ data }">
      <span :title="formatDateTime((data as AdminSession).createdAt)">
        {{ formatRelative((data as AdminSession).createdAt) }}
      </span>
    </template>

    <template #cell-expiresAt="{ data }">
      {{ formatDateTime((data as AdminSession).expiresAt) }}
    </template>

    <template #row-actions="{ data }">
      <BaseButton
        icon="pi pi-sign-out"
        variant="danger"
        text
        rounded
        aria-label="Cabut Sesi"
        @click="confirmRevoke(data as AdminSession)"
      />
    </template>
  </BaseDataTable>
</template>

<style scoped>
.session-user {
  display: flex;
  flex-direction: column;
}

.session-user__name {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text);
}

.session-user__email {
  font-size: var(--font-xs);
  color: var(--text-muted, #6b7280);
}
</style>
