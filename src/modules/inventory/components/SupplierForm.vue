<script setup lang="ts">
import { reactive, ref } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import type { SupplierInput } from '../types/supplier'

const props = withDefaults(
  defineProps<{
    initial: SupplierInput
    submitting?: boolean
  }>(),
  { submitting: false },
)

const emit = defineEmits<{
  submit: [value: SupplierInput]
  cancel: []
}>()

const form = reactive<SupplierInput>({ ...props.initial })

type ErrorMap = Partial<Record<keyof SupplierInput, string>>
const errors = ref<ErrorMap>({})

function validate(): boolean {
  const e: ErrorMap = {}
  if (!form.code.trim()) {
    e.code = 'Kode supplier wajib diisi.'
  } else if (form.code.length > 20) {
    e.code = 'Kode maksimal 20 karakter.'
  }
  if (!form.name.trim()) e.name = 'Nama supplier wajib diisi.'
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    e.email = 'Format email tidak valid.'
  }
  errors.value = e
  return Object.keys(e).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('submit', { ...form })
}
</script>

<template>
  <form class="supplier-form" @submit.prevent="onSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BaseInput v-model="form.code" label="Kode Supplier" required :error="errors.code" placeholder="mis. SUP001" />
      <BaseInput v-model="form.name" label="Nama Supplier" required :error="errors.name" />
      <BaseInput v-model="form.phone" label="No. Telepon" :error="errors.phone" placeholder="mis. 08123456789" />
      <BaseInput v-model="form.email" label="Email" :error="errors.email" placeholder="mis. sales@supplier.com" />
      <div class="md:col-span-2">
        <BaseInput v-model="form.address" label="Alamat" :error="errors.address" />
      </div>
    </div>

    <div class="supplier-form__actions">
      <BaseButton label="Batal" variant="ghost" type="button" @click="emit('cancel')" />
      <BaseButton label="Simpan" type="submit" :loading="submitting" />
    </div>
  </form>
</template>

<style scoped>
.supplier-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-6);
}
</style>
