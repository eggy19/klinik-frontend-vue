<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import StatusTag from '../components/StatusTag.vue'
import BranchForm from '../components/BranchForm.vue'
import { useAdminBranchStore } from '../stores/branch.store'
import { useAdminTenantStore } from '../stores/tenant.store'
import { emptyBranch, type Branch, type BranchInput } from '../types/branch'
import { formatDate } from '@/utils/format'
import { useToastFeedback } from '@/composables/useToastFeedback'

const store = useAdminBranchStore()
const tenantStore = useAdminTenantStore()
const toast = useToastFeedback()

const columns: DataTableColumn[] = [
  { field: 'tenantName', header: 'Tenant' },
  { field: 'code', header: 'Kode' },
  { field: 'name', header: 'Nama Cabang' },
  { field: 'status', header: 'Status' },
  { field: 'createdAt', header: 'Dibuat' },
]

// Nama tenant di-resolve dari store tenant (respons /branches hanya berisi tenantId).
const tenantNames = computed(() => {
  const map = new Map<string, string>()
  for (const tenant of tenantStore.items) map.set(tenant.id, tenant.name)
  return map
})

const rows = computed(() =>
  store.items.map((branch) => ({
    ...branch,
    tenantName: tenantNames.value.get(branch.tenantId) ?? '-',
  })),
)

const dialogVisible = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)
const formInitial = ref<BranchInput>(emptyBranch())

const dialogHeader = computed(() => (editingId.value ? 'Edit Cabang' : 'Tambah Cabang'))

function openCreate() {
  editingId.value = null
  formInitial.value = { ...emptyBranch(), tenantId: store.tenantFilter ?? '' }
  dialogVisible.value = true
}

function openEdit(item: Branch) {
  editingId.value = item.id
  formInitial.value = {
    tenantId: item.tenantId,
    name: item.name,
    code: item.code,
    status: item.status,
  }
  dialogVisible.value = true
}

async function onSubmit(input: BranchInput) {
  submitting.value = true
  try {
    if (editingId.value) {
      await store.update(editingId.value, input)
    } else {
      await store.create(input)
    }
    dialogVisible.value = false
    toast.success()
  } catch {
    toast.error()
  } finally {
    submitting.value = false
  }
}

function onTenantFilterChange(tenantId: string | null) {
  void store.setTenantFilter(tenantId)
}

onMounted(() => {
  void store.fetchAll()
  if (tenantStore.items.length === 0) void tenantStore.fetchAll()
})
</script>

<template>
  <div class="branch">
    <div class="branch__head">
      <h1 class="branch__title">Cabang</h1>
    </div>

    <BaseCard>
      <BaseDataTable
        :value="rows"
        :columns="columns"
        :loading="store.loading"
        search-placeholder="Cari cabang..."
        export-filename="cabang"
        empty-title="Belum ada cabang"
        empty-description="Tambahkan cabang untuk tenant yang tersedia."
      >
        <template #filters>
          <BaseSelect
            :model-value="store.tenantFilter"
            :options="tenantStore.items"
            option-label="name"
            option-value="id"
            placeholder="Semua tenant"
            filter
            show-clear
            @update:model-value="onTenantFilterChange"
          />
        </template>

        <template #actions>
          <BaseButton label="Tambah Cabang" icon="pi pi-plus" @click="openCreate" />
        </template>

        <template #cell-status="{ data }">
          <StatusTag :status="(data as Branch).status" />
        </template>

        <template #cell-createdAt="{ data }">
          {{ formatDate((data as Branch).createdAt) }}
        </template>

        <template #row-actions="{ data }">
          <BaseButton
            icon="pi pi-pencil"
            variant="ghost"
            rounded
            aria-label="Edit"
            @click="openEdit(data as Branch)"
          />
        </template>

        <template #empty-action>
          <BaseButton label="Tambah Cabang" icon="pi pi-plus" @click="openCreate" />
        </template>
      </BaseDataTable>
    </BaseCard>

    <BaseDialog v-model:visible="dialogVisible" :header="dialogHeader">
      <BranchForm
        :key="editingId ?? 'new'"
        :initial="formInitial"
        :tenants="tenantStore.items"
        :is-edit="!!editingId"
        :submitting="submitting"
        @submit="onSubmit"
        @cancel="dialogVisible = false"
      />
    </BaseDialog>
  </div>
</template>

<style scoped>
.branch {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.branch__title {
  font-size: var(--font-2xl);
  color: var(--text);
}
</style>
