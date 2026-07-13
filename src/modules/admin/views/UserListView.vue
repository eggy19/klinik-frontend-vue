<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import StatusTag from '../components/StatusTag.vue'
import UserForm from '../components/UserForm.vue'
import { useAdminUserStore } from '../stores/user.store'
import { useAdminTenantStore } from '../stores/tenant.store'
import type { AdminUser, CreateUserInput, UpdateUserInput } from '../types/user'
import { formatRelative } from '@/utils/format'
import { useToastFeedback } from '@/composables/useToastFeedback'

const store = useAdminUserStore()
const tenantStore = useAdminTenantStore()
const router = useRouter()
const confirm = useConfirm()
const toast = useToastFeedback()

const columns: DataTableColumn[] = [
  { field: 'name', header: 'Nama' },
  { field: 'email', header: 'Email' },
  { field: 'tenantName', header: 'Tenant' },
  { field: 'primaryBranchName', header: 'Cabang' },
  { field: 'status', header: 'Status' },
  { field: 'isLocked', header: 'Keamanan' },
  { field: 'lastLoginAt', header: 'Login Terakhir' },
]

const dialogVisible = ref(false)
const submitting = ref(false)
const editingUser = ref<AdminUser | null>(null)

const dialogHeader = computed(() => (editingUser.value ? 'Edit Pengguna' : 'Tambah Pengguna'))

function openCreate() {
  editingUser.value = null
  dialogVisible.value = true
}

function openEdit(user: AdminUser) {
  editingUser.value = user
  dialogVisible.value = true
}

function openDetail(user: AdminUser) {
  void router.push({ name: 'admin-user-detail', params: { id: user.id } })
}

async function onCreate(input: CreateUserInput) {
  submitting.value = true
  try {
    await store.create(input)
    dialogVisible.value = false
    toast.success('Pengguna berhasil dibuat.')
  } catch {
    toast.error('Gagal membuat pengguna. Periksa email belum terdaftar.')
  } finally {
    submitting.value = false
  }
}

async function onUpdate(input: UpdateUserInput) {
  if (!editingUser.value) return
  submitting.value = true
  try {
    await store.update(editingUser.value.id, input)
    dialogVisible.value = false
    toast.success()
  } catch {
    toast.error()
  } finally {
    submitting.value = false
  }
}

function confirmToggleStatus(user: AdminUser) {
  const deactivating = user.status === 'active'
  confirm.require({
    header: deactivating ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna',
    message: deactivating
      ? `Nonaktifkan "${user.name}"? Pengguna tidak akan bisa login dan permintaan berikutnya dari sesi aktifnya akan ditolak.`
      : `Aktifkan kembali "${user.name}"?`,
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Batal',
    acceptLabel: deactivating ? 'Nonaktifkan' : 'Aktifkan',
    acceptProps: { severity: deactivating ? 'danger' : 'primary' },
    accept: async () => {
      try {
        await store.updateStatus(user.id, deactivating ? 'inactive' : 'active')
        toast.success('Status pengguna diperbarui.')
      } catch {
        toast.error('Gagal memperbarui status pengguna.')
      }
    },
  })
}

function confirmUnlock(user: AdminUser) {
  confirm.require({
    header: 'Buka Kunci Akun',
    message: `Buka kunci akun "${user.name}"? Hitungan gagal login akan direset.`,
    icon: 'pi pi-unlock',
    rejectLabel: 'Batal',
    acceptLabel: 'Buka Kunci',
    accept: async () => {
      try {
        await store.unlock(user.id)
        toast.success('Akun berhasil dibuka kuncinya.')
      } catch {
        toast.error('Gagal membuka kunci akun.')
      }
    },
  })
}

onMounted(() => {
  void store.fetchAll()
  if (tenantStore.items.length === 0) void tenantStore.fetchAll()
})
</script>

<template>
  <div class="user">
    <div class="user__head">
      <h1 class="user__title">Pengguna</h1>
    </div>

    <BaseCard>
      <BaseDataTable
        :value="store.items"
        :columns="columns"
        :loading="store.loading"
        search-placeholder="Cari pengguna..."
        export-filename="pengguna"
        empty-title="Belum ada pengguna"
        empty-description="Tambahkan pengguna pertama untuk tenant Anda."
      >
        <template #actions>
          <BaseButton label="Tambah Pengguna" icon="pi pi-plus" @click="openCreate" />
        </template>

        <template #cell-tenantName="{ data }">
          {{ (data as AdminUser).tenantName ?? '-' }}
        </template>

        <template #cell-primaryBranchName="{ data }">
          {{ (data as AdminUser).primaryBranchName ?? '-' }}
        </template>

        <template #cell-status="{ data }">
          <StatusTag :status="(data as AdminUser).status" />
        </template>

        <template #cell-isLocked="{ data }">
          <BaseTag v-if="(data as AdminUser).isLocked" variant="warning">
            <i class="pi pi-lock" style="font-size: 0.75rem" />
            Terkunci
          </BaseTag>
          <span v-else>—</span>
        </template>

        <template #cell-lastLoginAt="{ data }">
          <span :title="(data as AdminUser).lastLoginAt ?? undefined">
            {{ formatRelative((data as AdminUser).lastLoginAt) }}
          </span>
        </template>

        <template #row-actions="{ data }">
          <BaseButton
            icon="pi pi-eye"
            variant="ghost"
            rounded
            aria-label="Detail"
            @click="openDetail(data as AdminUser)"
          />
          <BaseButton
            icon="pi pi-pencil"
            variant="ghost"
            rounded
            aria-label="Edit"
            @click="openEdit(data as AdminUser)"
          />
          <BaseButton
            v-if="(data as AdminUser).isLocked"
            icon="pi pi-unlock"
            variant="ghost"
            rounded
            aria-label="Buka Kunci"
            @click="confirmUnlock(data as AdminUser)"
          />
          <BaseButton
            :icon="(data as AdminUser).status === 'active' ? 'pi pi-ban' : 'pi pi-check-circle'"
            :variant="(data as AdminUser).status === 'active' ? 'danger' : 'ghost'"
            text
            rounded
            :aria-label="(data as AdminUser).status === 'active' ? 'Nonaktifkan' : 'Aktifkan'"
            @click="confirmToggleStatus(data as AdminUser)"
          />
        </template>

        <template #empty-action>
          <BaseButton label="Tambah Pengguna" icon="pi pi-plus" @click="openCreate" />
        </template>
      </BaseDataTable>
    </BaseCard>

    <BaseDialog v-model:visible="dialogVisible" :header="dialogHeader">
      <UserForm
        :key="editingUser?.id ?? 'new'"
        :tenants="tenantStore.items"
        :is-edit="!!editingUser"
        :initial-name="editingUser?.name ?? ''"
        :submitting="submitting"
        @create="onCreate"
        @update="onUpdate"
        @cancel="dialogVisible = false"
      />
    </BaseDialog>
  </div>
</template>

<style scoped>
.user {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.user__title {
  font-size: var(--font-2xl);
  color: var(--text);
}
</style>
