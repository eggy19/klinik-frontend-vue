<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import SupplierForm from '../components/SupplierForm.vue'
import { useSupplierStore } from '../stores/supplier.store'
import { emptySupplier, type Supplier, type SupplierInput } from '../types/supplier'
import { useToastFeedback } from '@/composables/useToastFeedback'

const store = useSupplierStore()
const confirm = useConfirm()
const toast = useToastFeedback()

const columns: DataTableColumn[] = [
  { field: 'code', header: 'Kode' },
  { field: 'name', header: 'Nama Supplier' },
  { field: 'phone', header: 'Telepon' },
  { field: 'email', header: 'Email' },
  { field: 'address', header: 'Alamat' },
]

const dialogVisible = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)
const formInitial = ref<SupplierInput>(emptySupplier())

const dialogHeader = computed(() => (editingId.value ? 'Edit Supplier' : 'Tambah Supplier'))

function openCreate() {
  editingId.value = null
  formInitial.value = emptySupplier()
  dialogVisible.value = true
}

function openEdit(item: Supplier) {
  editingId.value = item.id
  const { id: _id, ...rest } = item
  formInitial.value = { ...rest }
  dialogVisible.value = true
}

async function onSubmit(input: SupplierInput) {
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

function confirmDelete(item: Supplier) {
  confirm.require({
    header: 'Hapus Supplier',
    message: `Hapus "${item.name}"? Tindakan ini tidak dapat dibatalkan.`,
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Batal',
    acceptLabel: 'Hapus',
    acceptProps: { severity: 'danger' },
    accept: async () => {
      try {
        await store.remove(item.id)
        toast.success('Data berhasil dihapus.')
      } catch (err: unknown) {
        const isInUse =
          err instanceof Error &&
          (err.message.includes('409') || err.message.toLowerCase().includes('digunakan'))
        toast.error(
          isInUse
            ? `"${item.name}" tidak dapat dihapus karena sedang digunakan oleh transaksi purchasing.`
            : 'Gagal menghapus data.',
        )
      }
    },
  })
}

onMounted(store.fetchAll)
</script>

<template>
  <div class="supplier">
    <div class="supplier__head">
      <h1 class="supplier__title">Supplier</h1>
    </div>

    <BaseCard>
      <BaseDataTable
        :value="store.items"
        :columns="columns"
        :loading="store.loading"
        search-placeholder="Cari supplier..."
        export-filename="supplier"
        empty-title="Belum ada data supplier"
        empty-description="Tambahkan supplier pertama, mis. Kimia Farma."
      >
        <template #actions>
          <BaseButton label="Tambah Supplier" icon="pi pi-plus" @click="openCreate" />
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
          <BaseButton label="Tambah Supplier" icon="pi pi-plus" @click="openCreate" />
        </template>
      </BaseDataTable>
    </BaseCard>

    <BaseDialog v-model:visible="dialogVisible" :header="dialogHeader">
      <SupplierForm
        :initial="formInitial"
        :submitting="submitting"
        @submit="onSubmit"
        @cancel="dialogVisible = false"
      />
    </BaseDialog>
  </div>
</template>

<style scoped>
.supplier {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.supplier__title {
  font-size: var(--font-2xl);
  color: var(--text);
}
</style>
