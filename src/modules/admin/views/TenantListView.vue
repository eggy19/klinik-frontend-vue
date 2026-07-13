<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import StatusTag from '../components/StatusTag.vue'
import TenantForm from '../components/TenantForm.vue'
import { useAdminTenantStore } from '../stores/tenant.store'
import { emptyTenant, type Tenant, type TenantInput } from '../types/tenant'
import { formatDate } from '@/utils/format'
import { useToastFeedback } from '@/composables/useToastFeedback'

const store = useAdminTenantStore()
const toast = useToastFeedback()

const columns: DataTableColumn[] = [
  { field: 'code', header: 'Kode' },
  { field: 'name', header: 'Nama Tenant' },
  { field: 'status', header: 'Status' },
  { field: 'createdAt', header: 'Dibuat' },
]

const dialogVisible = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)
const formInitial = ref<TenantInput>(emptyTenant())

const dialogHeader = computed(() => (editingId.value ? 'Edit Tenant' : 'Tambah Tenant'))

function openCreate() {
  editingId.value = null
  formInitial.value = emptyTenant()
  dialogVisible.value = true
}

function openEdit(item: Tenant) {
  editingId.value = item.id
  formInitial.value = { name: item.name, code: item.code, status: item.status }
  dialogVisible.value = true
}

async function onSubmit(input: TenantInput) {
  submitting.value = true
  try {
    if (editingId.value) {
      await store.update(editingId.value, input)
      toast.success()
    } else {
      await store.create(input)
      toast.success('Tenant dibuat beserta cabang default (MAIN).')
    }
    dialogVisible.value = false
  } catch {
    toast.error()
  } finally {
    submitting.value = false
  }
}

onMounted(store.fetchAll)
</script>

<template>
  <div class="tenant">
    <div class="tenant__head">
      <h1 class="tenant__title">Tenant</h1>
    </div>

    <BaseCard>
      <BaseDataTable
        :value="store.items"
        :columns="columns"
        :loading="store.loading"
        search-placeholder="Cari tenant..."
        export-filename="tenant"
        empty-title="Belum ada tenant"
        empty-description="Tambahkan tenant pertama untuk memulai."
      >
        <template #actions>
          <BaseButton label="Tambah Tenant" icon="pi pi-plus" @click="openCreate" />
        </template>

        <template #cell-status="{ data }">
          <StatusTag :status="(data as Tenant).status" />
        </template>

        <template #cell-createdAt="{ data }">
          {{ formatDate((data as Tenant).createdAt) }}
        </template>

        <template #row-actions="{ data }">
          <BaseButton
            icon="pi pi-pencil"
            variant="ghost"
            rounded
            aria-label="Edit"
            @click="openEdit(data as Tenant)"
          />
        </template>

        <template #empty-action>
          <BaseButton label="Tambah Tenant" icon="pi pi-plus" @click="openCreate" />
        </template>
      </BaseDataTable>
    </BaseCard>

    <BaseDialog v-model:visible="dialogVisible" :header="dialogHeader">
      <TenantForm
        :key="editingId ?? 'new'"
        :initial="formInitial"
        :is-edit="!!editingId"
        :submitting="submitting"
        @submit="onSubmit"
        @cancel="dialogVisible = false"
      />
    </BaseDialog>
  </div>
</template>

<style scoped>
.tenant {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.tenant__title {
  font-size: var(--font-2xl);
  color: var(--text);
}
</style>
