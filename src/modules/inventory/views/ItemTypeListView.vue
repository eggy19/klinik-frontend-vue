<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import ItemTypeForm from '../components/ItemTypeForm.vue'
import { useItemTypeStore } from '../stores/item-type.store'
import { emptyItemType, type ItemType, type ItemTypeInput } from '../types/item-type'
import { useToastFeedback } from '@/composables/useToastFeedback'

const store = useItemTypeStore()
const confirm = useConfirm()
const toast = useToastFeedback()

const columns: DataTableColumn[] = [
  { field: 'code', header: 'Kode' },
  { field: 'name', header: 'Nama Tipe' },
  { field: 'description', header: 'Deskripsi' },
]

const dialogVisible = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)
const formInitial = ref<ItemTypeInput>(emptyItemType())

const dialogHeader = computed(() => (editingId.value ? 'Edit Tipe Item' : 'Tambah Tipe Item'))

function openCreate() {
  editingId.value = null
  formInitial.value = emptyItemType()
  dialogVisible.value = true
}

function openEdit(item: ItemType) {
  editingId.value = item.id
  const { id: _id, ...rest } = item
  formInitial.value = { ...rest }
  dialogVisible.value = true
}

async function onSubmit(input: ItemTypeInput) {
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

function confirmDelete(item: ItemType) {
  confirm.require({
    header: 'Hapus Tipe Item',
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
            ? `"${item.name}" tidak dapat dihapus karena sedang digunakan oleh kategori.`
            : 'Gagal menghapus data.',
        )
      }
    },
  })
}

onMounted(store.fetchAll)
</script>

<template>
  <div class="item-type">
    <div class="item-type__head">
      <h1 class="item-type__title">Tipe Item</h1>
    </div>

    <BaseCard>
      <BaseDataTable
        :value="store.items"
        :columns="columns"
        :loading="store.loading"
        search-placeholder="Cari tipe item..."
        export-filename="tipe-item"
        empty-title="Belum ada data tipe item"
        empty-description="Tambahkan tipe item pertama, mis. Medicine atau Alkes."
      >
        <template #actions>
          <BaseButton label="Tambah Tipe Item" icon="pi pi-plus" @click="openCreate" />
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
          <BaseButton label="Tambah Tipe Item" icon="pi pi-plus" @click="openCreate" />
        </template>
      </BaseDataTable>
    </BaseCard>

    <BaseDialog v-model:visible="dialogVisible" :header="dialogHeader">
      <ItemTypeForm
        :initial="formInitial"
        :submitting="submitting"
        @submit="onSubmit"
        @cancel="dialogVisible = false"
      />
    </BaseDialog>
  </div>
</template>

<style scoped>
.item-type {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.item-type__title {
  font-size: var(--font-2xl);
  color: var(--text);
}
</style>
