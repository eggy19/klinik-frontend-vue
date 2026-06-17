<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import UnitForm from '../components/UnitForm.vue'
import { useUnitStore } from '../stores/unit.store'
import { emptyUnit, type Unit, type UnitInput } from '../types/unit'
import { useToastFeedback } from '@/composables/useToastFeedback'

const store = useUnitStore()
const confirm = useConfirm()
const toast = useToastFeedback()

const columns: DataTableColumn[] = [
  { field: 'code', header: 'Singkatan' },
  { field: 'name', header: 'Nama Satuan' },
  { field: 'description', header: 'Deskripsi' },
]

const dialogVisible = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)
const formInitial = ref<UnitInput>(emptyUnit())

const dialogHeader = computed(() => (editingId.value ? 'Edit Satuan' : 'Tambah Satuan'))

function openCreate() {
  editingId.value = null
  formInitial.value = emptyUnit()
  dialogVisible.value = true
}

function openEdit(item: Unit) {
  editingId.value = item.id
  const { id: _id, ...rest } = item
  formInitial.value = { ...rest }
  dialogVisible.value = true
}

async function onSubmit(input: UnitInput) {
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

function confirmDelete(item: Unit) {
  confirm.require({
    header: 'Hapus Satuan',
    message: `Hapus "${item.name}"? Tindakan ini tidak dapat dibatalkan.`,
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Batal',
    acceptLabel: 'Hapus',
    acceptProps: { severity: 'danger' },
    accept: async () => {
      try {
        await store.remove(item.id)
        toast.success('Data berhasil dihapus.')
      } catch {
        toast.error('Gagal menghapus data.')
      }
    },
  })
}

onMounted(store.fetchAll)
</script>

<template>
  <div class="unit">
    <div class="unit__head">
      <h1 class="unit__title">Satuan</h1>
    </div>

    <BaseCard>
      <BaseDataTable
        :value="store.items"
        :columns="columns"
        :loading="store.loading"
        search-placeholder="Cari satuan..."
        export-filename="satuan"
        empty-title="Belum ada data satuan"
        empty-description="Tambahkan satuan pertama, mis. Tablet atau Botol."
      >
        <template #actions>
          <BaseButton label="Tambah Satuan" icon="pi pi-plus" @click="openCreate" />
        </template>

        <template #row-actions="{ data }">
          <BaseButton
            icon="pi pi-pencil"
            variant="ghost"
            rounded
            aria-label="Edit"
            @click="openEdit(data)"
          />
          <BaseButton
            icon="pi pi-trash"
            variant="danger"
            text
            rounded
            aria-label="Hapus"
            @click="confirmDelete(data)"
          />
        </template>

        <template #empty-action>
          <BaseButton label="Tambah Satuan" icon="pi pi-plus" @click="openCreate" />
        </template>
      </BaseDataTable>
    </BaseCard>

    <BaseDialog v-model:visible="dialogVisible" :header="dialogHeader">
      <UnitForm
        :initial="formInitial"
        :submitting="submitting"
        @submit="onSubmit"
        @cancel="dialogVisible = false"
      />
    </BaseDialog>
  </div>
</template>

<style scoped>
.unit {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.unit__title {
  font-size: var(--font-2xl);
  color: var(--text);
}
</style>
