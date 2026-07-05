<script setup lang="ts">
import { computed } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseSwitch from '@/components/base/BaseSwitch.vue'
import type { ItemInput } from '../../types/item'
import type { ItemType } from '../../types/item-type'
import type { Category } from '../../types/category'
import type { Unit } from '../../types/unit'

const props = defineProps<{
  form: ItemInput
  errors: Record<string, string>
  isEditMode: boolean
  itemTypes: ItemType[]
  categories: Category[]
  units: Unit[]
  // Tambahkan prop ini jika Anda memiliki daftar bentuk sediaan
  forms: { id: string; name: string }[]
  isActive: boolean
}>()

const statusOptions = [
  { id: true, name: 'Aktif' },
  { id: false, name: 'Tidak Aktif' },
]

const emit = defineEmits(['update:form'])

const updateForm = (key: keyof ItemInput, value: any) => {
  emit('update:form', { ...props.form, [key]: value })
}

const filteredCategories = computed(() =>
  props.categories.filter((c) => c.itemTypeId === props.form.itemTypeId),
)

const dummyCategories = [
  { id: 1, name: 'Obat Bebas', itemTypeId: 'obat' },
  { id: 2, name: 'Obat Keras', itemTypeId: 'obat' },
  { id: 3, name: 'Suplemen', itemTypeId: 'vitamin' }
]

const dummyForms = [
  { id: 'tablet', name: 'Tablet' },
  { id: 'kapsul', name: 'Kapsul' },
  { id: 'sirup', name: 'Sirup' },
  { id: 'salep', name: 'Salep' }
]

// Jika props categories/forms kosong, gunakan dummy ini
const displayCategories = computed(() => props.categories.length > 0 ? props.categories : dummyCategories)
const displayForms = computed(() => props.forms && props.forms.length > 0 ? props.forms : dummyForms)

</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
    <div class="space-y-4">
      <BaseInput
        :model-value="form.barcode"
        label="SKU / Barcode *"
        placeholder="Contoh: OB-99201"
        :error="errors.barcode"
        @update:model-value="updateForm('barcode', $event)"
      />
      <BaseInput
        :model-value="form.itemName"
        label="Nama Obat / Merk *"
        placeholder="Contoh: Paracetamol 500mg"
        :error="errors.itemName"
        @update:model-value="updateForm('itemName', $event)"
      />
        <tr v-for="(row, i) in form.suppliers" :key="i">
          <td>
            <BaseSelect
              :model-value="row.categoryId"
              label="Kategori"
              :options="categories" 
              option-label="name"   
              option-value="id"     
              placeholder="Pilih Kategori"
              :error="errors?.suppliers?.[i]?.categoryId"
              @update:model-value="row.categoryId = $event as string"
            />
          </td>
        </tr>
      <BaseInput
        :model-value="form.manufacturer"
        label="Produsen (Pabrik)"
        placeholder="Contoh: Sanbe Farma"
        :error="errors.manufacturer"
        @update:model-value="updateForm('manufacturer', $event)"
      />
    </div>

    <div class="space-y-4">
      <div class="flex flex-col gap-2">
        <label class="text-sm font-semibold text-gray-700">Status Aktif</label>
        <div class="flex items-center gap-3">
          <!-- Menggunakan updateForm agar konsisten dengan field lain -->
          <BaseSwitch 
            :model-value="form.isActive" 
            @update:model-value="updateForm('isActive', $event)" 
          />
          <span class="text-sm text-gray-600 font-medium">
            {{ form.isActive ? 'Aktif' : 'Tidak Aktif' }}
          </span>
        </div>
      </div>
      
      <BaseInput
        :model-value="form.genericName"
        label="Nama Generik"
        placeholder="Contoh: Paracetamol"
        :error="errors.genericName"
        @update:model-value="updateForm('genericName', $event)"
      />
    </div>

    <!-- Kolom 3 (Upload) -->
    <div class="flex justify-center items-start">
      <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center w-full max-w-[200px]">
        <img
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='gray'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'%3E%3C/path%3E%3C/svg%3E"
          class="mx-auto w-12 h-12 text-gray-400 mb-2"
        />
        <p class="text-sm text-blue-600 font-medium cursor-pointer">Upload Foto Produk</p>
        <p class="text-xs text-gray-400 mt-1">Maks 2MB, format JPG/PNG</p>
        <p v-if="errors.image" class="text-xs text-red-500 mt-2">{{ errors.image }}</p>
      </div>
    </div>
  </div>
</template>


<style scoped>


.item-form-basic__toggle {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.item-form-basic__toggle-label {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.item-form-basic__toggle-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.item-form-basic__warning {
  font-size: var(--font-sm);
  color: var(--color-warning, #f59e0b);
}
</style>
