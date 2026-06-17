<script setup lang="ts">
import { reactive, ref } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { MEDICINE_CATEGORIES, type MedicineInput } from '../types/medicine'

const props = withDefaults(
  defineProps<{
    initial: MedicineInput
    submitting?: boolean
  }>(),
  { submitting: false },
)

const emit = defineEmits<{
  submit: [value: MedicineInput]
  cancel: []
}>()

// Salinan lokal agar form tidak memutasi data parent.
const form = reactive<MedicineInput>({ ...props.initial })

type ErrorMap = Partial<Record<keyof MedicineInput, string>>
const errors = ref<ErrorMap>({})

function validate(): boolean {
  const e: ErrorMap = {}
  if (!form.code.trim()) e.code = 'Kode wajib diisi.'
  if (!form.name.trim()) e.name = 'Nama obat wajib diisi.'
  if (!form.unit.trim()) e.unit = 'Satuan wajib diisi.'
  if (!form.expiryDate) e.expiryDate = 'Tanggal kedaluwarsa wajib diisi.'
  if (form.stock < 0) e.stock = 'Stok tidak boleh negatif.'
  if (form.minStock < 0) e.minStock = 'Stok minimum tidak boleh negatif.'
  if (form.price < 0) e.price = 'Harga tidak boleh negatif.'
  errors.value = e
  return Object.keys(e).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('submit', {
    ...form,
    stock: Number(form.stock),
    minStock: Number(form.minStock),
    price: Number(form.price),
  })
}
</script>

<template>
  <form class="medicine-form" @submit.prevent="onSubmit">
    <!-- 2 kolom desktop, 1 kolom mobile (docs/07) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BaseInput v-model="form.code" label="Kode" required :error="errors.code" />
      <BaseInput v-model="form.name" label="Nama Obat" required :error="errors.name" />

      <BaseSelect
        v-model="form.category"
        label="Kategori"
        :options="MEDICINE_CATEGORIES"
        required
      />
      <BaseInput v-model="form.unit" label="Satuan" required :error="errors.unit" />

      <BaseInput v-model="form.stock" label="Stok" type="number" :error="errors.stock" />
      <BaseInput
        v-model="form.minStock"
        label="Stok Minimum"
        type="number"
        :error="errors.minStock"
      />

      <BaseInput v-model="form.price" label="Harga (Rp)" type="number" :error="errors.price" />
      <BaseInput
        v-model="form.expiryDate"
        label="Tanggal Kedaluwarsa"
        type="date"
        required
        :error="errors.expiryDate"
      />

      <div class="md:col-span-2">
        <BaseInput v-model="form.supplier" label="Supplier" />
      </div>
    </div>

    <div class="medicine-form__actions">
      <BaseButton label="Batal" variant="ghost" type="button" @click="emit('cancel')" />
      <BaseButton label="Simpan" type="submit" :loading="submitting" />
    </div>
  </form>
</template>

<style scoped>
.medicine-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-6);
}
</style>
