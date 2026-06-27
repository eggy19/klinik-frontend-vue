<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import MedicineForm from '../components/MedicineForm.vue'
import { useMedicineStore } from '../stores/medicine.store'
import { emptyMedicine, getStockStatus, type Medicine, type MedicineInput } from '../types/medicine'
import { useToastFeedback } from '@/composables/useToastFeedback'

const store = useMedicineStore()
const confirm = useConfirm()
const toast = useToastFeedback()

const columns: DataTableColumn[] = [
  { field: 'code', header: 'SKU' },
  { field: 'name', header: 'NAME' },
  { field: 'category', header: 'CATEGORY' },
  { field: 'stock', header: 'STOCK LEVEL' },
  { field: 'status', header: 'STATUS' },
  { field: 'expiryDate', header: 'EXPIRY' },
]

const dialogVisible = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)
const formInitial = ref<MedicineInput>(emptyMedicine())

function openCreate() {
  editingId.value = null
  formInitial.value = emptyMedicine()
  dialogVisible.value = true
}

function openEdit(item: Medicine) {
  editingId.value = item.id
  formInitial.value = { ...item }
  dialogVisible.value = true
}

async function onSubmit(input: MedicineInput) {
  submitting.value = true
  try {
    editingId.value ? await store.update(editingId.value, input) : await store.create(input)
    dialogVisible.value = false
    toast.success()
  } catch { toast.error() } finally { submitting.value = false }
}

function confirmDelete(item: Medicine) {
  confirm.require({
    header: 'Hapus Obat',
    message: `Hapus "${item.name}"?`,
    accept: async () => { await store.remove(item.id); toast.success() }
  })
}

function stockVariant(item: Medicine) {
  const s = getStockStatus(item)
  return s === 'normal' ? 'success' : s === 'low' ? 'warning' : 'danger'
}

onMounted(store.fetchAll)
</script>

<template>
  <div class="medicine">
    <div class="medicine__head mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Master Obat</h1>
    </div>

    <div class="grid grid-cols-4 gap-4 mb-6">
      <BaseCard class="p-4"><p class="text-[10px] font-bold text-gray-500 uppercase">Total Items</p><h2 class="text-2xl font-bold">1,248</h2></BaseCard>
      <BaseCard class="p-4"><p class="text-[10px] font-bold text-gray-500 uppercase">Low Stock</p><h2 class="text-2xl font-bold text-red-500">24</h2></BaseCard>
      <BaseCard class="p-4"><p class="text-[10px] font-bold text-gray-500 uppercase">Near Expiry</p><h2 class="text-2xl font-bold text-blue-500">8</h2></BaseCard>
      <BaseCard class="p-4"><p class="text-[10px] font-bold text-gray-500 uppercase">Total Spend (MTD)</p><h2 class="text-2xl font-bold">$14,280</h2></BaseCard>
    </div>

    <BaseCard>
      <BaseDataTable :value="store.items" :columns="columns" :loading="store.loading" search-placeholder="Cari obat...">
        <template #actions>
          <BaseButton label="Tambah Obat Baru" icon="pi pi-plus" @click="openCreate" />
        </template>

        <template #cell-stock="{ data }">
          <div class="flex items-center gap-2">
            <span>{{ data.stock }} Units</span>
            <div class="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-full bg-green-600" :style="{ width: '70%' }"></div>
            </div>
          </div>
        </template>

        <template #cell-status="{ data }">
          <BaseTag :value="getStockStatus(data).toUpperCase()" :variant="stockVariant(data)" />
        </template>

        <template #row-actions="{ data }">
          <BaseButton icon="pi pi-pencil" variant="ghost" rounded @click="openEdit(data)" />
          <BaseButton icon="pi pi-ellipsis-v" variant="ghost" rounded @click="confirmDelete(data)" />
        </template>
      </BaseDataTable>
    </BaseCard>

    <BaseDialog v-model:visible="dialogVisible" header="Kelola Obat">
      <MedicineForm :initial="formInitial" @submit="onSubmit" @cancel="dialogVisible = false" />
    </BaseDialog>
  </div>
</template>