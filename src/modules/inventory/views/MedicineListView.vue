<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import MedicineForm from '../components/MedicineForm.vue'
import { useMedicineStore } from '../stores/medicine.store'
import {
  emptyMedicine,
  getStockStatus,
  type Medicine,
  type MedicineInput,
} from '../types/medicine'
import { formatCurrency, formatDate } from '@/utils/format'
import { useToastFeedback } from '@/composables/useToastFeedback'

const store = useMedicineStore()
const confirm = useConfirm()
const toast = useToastFeedback()

const columns: DataTableColumn[] = [
  { field: 'code', header: 'Kode' },
  { field: 'name', header: 'Nama Obat' },
  { field: 'category', header: 'Kategori' },
  { field: 'stock', header: 'Stok' },
  { field: 'price', header: 'Harga' },
  { field: 'expiryDate', header: 'Kedaluwarsa' },
  { field: 'supplier', header: 'Supplier' },
]

// --- Dialog create/edit ---
const dialogVisible = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)
const formInitial = ref<MedicineInput>(emptyMedicine())

const dialogHeader = computed(() => (editingId.value ? 'Edit Obat' : 'Tambah Obat'))

function openCreate() {
  editingId.value = null
  formInitial.value = emptyMedicine()
  dialogVisible.value = true
}

function openEdit(item: Medicine) {
  editingId.value = item.id
  const { id: _id, ...rest } = item
  formInitial.value = { ...rest }
  dialogVisible.value = true
}

async function onSubmit(input: MedicineInput) {
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

// --- Delete dengan konfirmasi (docs/06: delete wajib confirmation) ---
function confirmDelete(item: Medicine) {
  confirm.require({
    header: 'Hapus Obat',
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

// Tampilan status stok (warna value + tag) — normal default, rendah kuning, kritis merah.
function stockColor(item: Medicine): string | undefined {
  switch (getStockStatus(item)) {
    case 'critical':
      return 'var(--color-danger)'
    case 'low':
      return 'var(--color-warning)'
    default:
      return undefined
  }
}

function stockTag(item: Medicine): { label: string; variant: 'danger' | 'warning' } | null {
  switch (getStockStatus(item)) {
    case 'critical':
      return { label: 'Kritis', variant: 'danger' }
    case 'low':
      return { label: 'Stok rendah', variant: 'warning' }
    default:
      return null
  }
}

onMounted(store.fetchAll)
</script>

<template>
  <div class="medicine">
    <div class="medicine__head">
      <h1 class="medicine__title">Obat</h1>
    </div>

    <BaseCard>
      <BaseDataTable
        :value="store.items"
        :columns="columns"
        :loading="store.loading"
        search-placeholder="Cari obat..."
        export-filename="obat"
        empty-title="Belum ada data obat"
        empty-description="Tambahkan obat pertama untuk mulai mengelola stok."
      >
        <template #actions>
          <BaseButton label="Tambah Obat" icon="pi pi-plus" @click="openCreate" />
        </template>

        <!-- Sel kustom -->
        <template #cell-stock="{ data }">
          <span class="medicine__stock">
            <span
              class="medicine__stock-value"
              :class="{ 'medicine__stock-value--alert': !!stockTag(data) }"
              :style="{ color: stockColor(data) }"
            >
              {{ data.stock }}
            </span>
            <BaseTag
              v-if="stockTag(data)"
              :value="stockTag(data)!.label"
              :variant="stockTag(data)!.variant"
            />
          </span>
        </template>
        <template #cell-price="{ value }">{{ formatCurrency(Number(value)) }}</template>
        <template #cell-expiryDate="{ value }">{{ formatDate(String(value)) }}</template>

        <!-- Aksi baris -->
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
          <BaseButton label="Tambah Obat" icon="pi pi-plus" @click="openCreate" />
        </template>
      </BaseDataTable>
    </BaseCard>

    <BaseDialog v-model:visible="dialogVisible" :header="dialogHeader">
      <MedicineForm
        :initial="formInitial"
        :submitting="submitting"
        @submit="onSubmit"
        @cancel="dialogVisible = false"
      />
    </BaseDialog>
  </div>
</template>

<style scoped>
.medicine {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.medicine__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.medicine__stock {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.medicine__stock-value--alert {
  font-weight: var(--font-weight-heading);
}
</style>
