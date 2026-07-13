<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import StatusTag from '../components/StatusTag.vue'
import UserForm from '../components/UserForm.vue'
import UserSecurityCard from '../components/UserSecurityCard.vue'
import SessionTable from '../components/SessionTable.vue'
import LoginHistoryTable from '../components/LoginHistoryTable.vue'
import { userApi } from '../api/user.api'
import { useAdminTenantStore } from '../stores/tenant.store'
import type { AdminUserDetail, UpdateUserInput } from '../types/user'
import { useToastFeedback } from '@/composables/useToastFeedback'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const toast = useToastFeedback()
const tenantStore = useAdminTenantStore()

const userId = computed(() => String(route.params.id))
const detail = ref<AdminUserDetail | null>(null)
const loading = ref(false)

const editVisible = ref(false)
const submitting = ref(false)

async function fetchDetail() {
  loading.value = true
  try {
    detail.value = await userApi.getUser(userId.value)
  } catch {
    toast.error('Gagal memuat detail pengguna.')
  } finally {
    loading.value = false
  }
}

async function onUpdate(input: UpdateUserInput) {
  submitting.value = true
  try {
    await userApi.updateUser(userId.value, input)
    editVisible.value = false
    toast.success()
    await fetchDetail()
  } catch {
    toast.error()
  } finally {
    submitting.value = false
  }
}

function confirmToggleStatus() {
  if (!detail.value) return
  const deactivating = detail.value.status === 'active'
  confirm.require({
    header: deactivating ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna',
    message: deactivating
      ? `Nonaktifkan "${detail.value.name}"? Pengguna tidak akan bisa login dan permintaan berikutnya dari sesi aktifnya akan ditolak.`
      : `Aktifkan kembali "${detail.value.name}"?`,
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Batal',
    acceptLabel: deactivating ? 'Nonaktifkan' : 'Aktifkan',
    acceptProps: { severity: deactivating ? 'danger' : 'primary' },
    accept: async () => {
      try {
        await userApi.updateStatus(userId.value, deactivating ? 'inactive' : 'active')
        toast.success('Status pengguna diperbarui.')
        await fetchDetail()
      } catch {
        toast.error('Gagal memperbarui status pengguna.')
      }
    },
  })
}

function confirmUnlock() {
  if (!detail.value) return
  confirm.require({
    header: 'Buka Kunci Akun',
    message: `Buka kunci akun "${detail.value.name}"? Hitungan gagal login akan direset.`,
    icon: 'pi pi-unlock',
    rejectLabel: 'Batal',
    acceptLabel: 'Buka Kunci',
    accept: async () => {
      try {
        detail.value = await userApi.unlockUser(userId.value)
        toast.success('Akun berhasil dibuka kuncinya.')
      } catch {
        toast.error('Gagal membuka kunci akun.')
      }
    },
  })
}

onMounted(() => {
  void fetchDetail()
  if (tenantStore.items.length === 0) void tenantStore.fetchAll()
})
</script>

<template>
  <div class="user-detail">
    <div class="user-detail__head">
      <BaseButton
        icon="pi pi-arrow-left"
        variant="ghost"
        rounded
        aria-label="Kembali"
        @click="router.push({ name: 'admin-user' })"
      />
      <h1 class="user-detail__title">Detail Pengguna</h1>
    </div>

    <BaseCard v-if="detail">
      <div class="user-detail__header">
        <div class="user-detail__identity">
          <h2 class="user-detail__name">{{ detail.name }}</h2>
          <span class="user-detail__email">{{ detail.email }}</span>
          <div class="user-detail__tags">
            <StatusTag :status="detail.status" />
            <BaseTag v-if="detail.emailVerified" variant="info" value="Terverifikasi" />
            <BaseTag v-if="detail.security?.isLocked" variant="danger">
              <i class="pi pi-lock" style="font-size: 0.75rem" />
              Terkunci
            </BaseTag>
          </div>
        </div>
        <div class="user-detail__actions">
          <BaseButton label="Edit" icon="pi pi-pencil" variant="secondary" @click="editVisible = true" />
          <BaseButton
            v-if="detail.security?.isLocked"
            label="Buka Kunci"
            icon="pi pi-unlock"
            variant="warning"
            @click="confirmUnlock"
          />
          <BaseButton
            :label="detail.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'"
            :icon="detail.status === 'active' ? 'pi pi-ban' : 'pi pi-check-circle'"
            :variant="detail.status === 'active' ? 'danger' : 'success'"
            @click="confirmToggleStatus"
          />
        </div>
      </div>

      <Tabs value="security" class="user-detail__tabs">
        <TabList>
          <Tab value="security">Keamanan</Tab>
          <Tab value="branches">Cabang</Tab>
          <Tab value="sessions">Sesi Aktif</Tab>
          <Tab value="history">Riwayat Login</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="security">
            <UserSecurityCard :security="detail.security" />
          </TabPanel>

          <TabPanel value="branches">
            <table class="user-detail__branches">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Kode</th>
                  <th>Nama Cabang</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="branch in detail.branches" :key="branch.branchId">
                  <td>{{ branch.tenantName ?? '-' }}</td>
                  <td>{{ branch.branchCode }}</td>
                  <td>{{ branch.branchName }}</td>
                  <td>
                    <BaseTag v-if="branch.isPrimary" variant="primary" value="Utama" />
                  </td>
                </tr>
                <tr v-if="detail.branches.length === 0">
                  <td colspan="4" class="user-detail__branches-empty">
                    Pengguna belum ditugaskan ke cabang manapun.
                  </td>
                </tr>
              </tbody>
            </table>
          </TabPanel>

          <TabPanel value="sessions">
            <SessionTable
              :user-id="detail.id"
              :show-user-column="false"
              @revoked="fetchDetail"
            />
          </TabPanel>

          <TabPanel value="history">
            <LoginHistoryTable
              :filters="{ userId: detail.id }"
              :show-user-column="false"
              :show-tenant-columns="false"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </BaseCard>

    <BaseCard v-else-if="loading">
      <p class="user-detail__loading">Memuat detail pengguna…</p>
    </BaseCard>

    <BaseDialog v-model:visible="editVisible" header="Edit Pengguna">
      <UserForm
        v-if="detail"
        :key="detail.id"
        :tenants="tenantStore.items"
        is-edit
        :initial-name="detail.name"
        :submitting="submitting"
        @update="onUpdate"
        @cancel="editVisible = false"
      />
    </BaseDialog>
  </div>
</template>

<style scoped>
.user-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.user-detail__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.user-detail__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.user-detail__header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.user-detail__name {
  font-size: var(--font-xl);
  color: var(--text);
}

.user-detail__email {
  display: block;
  color: var(--text-muted, #6b7280);
  margin-bottom: var(--space-2);
}

.user-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.user-detail__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--space-2);
}

.user-detail__branches {
  width: 100%;
  border-collapse: collapse;
}

.user-detail__branches th,
.user-detail__branches td {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
  font-size: var(--font-sm);
  color: var(--text);
}

.user-detail__branches th {
  font-size: var(--font-xs);
  color: var(--text-muted, #6b7280);
}

.user-detail__branches-empty {
  text-align: center;
  color: var(--text-muted, #6b7280);
}

.user-detail__loading {
  color: var(--text-muted, #6b7280);
}
</style>
