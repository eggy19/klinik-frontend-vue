<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import CategoryForm from '../components/CategoryForm.vue'
import { useCategoryStore } from '../stores/category.store'
import { emptyCategory, type Category, type CategoryInput } from '../types/category'
import { useToastFeedback } from '@/composables/useToastFeedback'

const store = useCategoryStore()
const confirm = useConfirm()
const toast = useToastFeedback()

const columns: DataTableColumn[] = [
  { field: 'code', header: 'Kode' },
  { field: 'name', header: 'Nama Kategori' },
  { field: 'description', header: 'Deskripsi' },
]

const dialogVisible = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)
const formInitial = ref<CategoryInput>(emptyCategory())

const dialogHeader = computed(() => (editingId.value ? 'Edit Kategori' : 'Tambah Kategori'))

function openCreate() {
  editingId.value = null
  formInitial.value = emptyCategory()
  dialogVisible.value = true
}

function openEdit(item: Category) {
  editingId.value = item.id
  const { id: _id, ...rest } = item
  formInitial.value = { ...rest }
  dialogVisible.value = true
}

async function onSubmit(input: CategoryInput) {
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

function confirmDelete(item: Category) {
  confirm.require({
    header: 'Hapus Kategori',
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
  <div class="category">
    <div class="category__head">
      <h1 class="category__title">Kategori</h1>
    </div>

    <BaseCard>
      <BaseDataTable
        :value="store.items"
        :columns="columns"
        :loading="store.loading"
        search-placeholder="Cari kategori..."
        export-filename="kategori"
        empty-title="Belum ada data kategori"
        empty-description="Tambahkan kategori pertama untuk mengelompokkan obat."
      >
        <template #actions>
          <BaseButton label="Tambah Kategori" icon="pi pi-plus" @click="openCreate" />
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
          <BaseButton label="Tambah Kategori" icon="pi pi-plus" @click="openCreate" />
        </template>
      </BaseDataTable>
    </BaseCard>

    <BaseDialog v-model:visible="dialogVisible" :header="dialogHeader">
      <CategoryForm
        :initial="formInitial"
        :submitting="submitting"
        @submit="onSubmit"
        @cancel="dialogVisible = false"
      />
    </BaseDialog>
  </div>
</template>

<style scoped>
.category {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.category__title {
  font-size: var(--font-2xl);
  color: var(--text);
}
</style>
