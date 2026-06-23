<script setup lang="ts">
import { reactive, ref } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import type { ItemTypeInput } from '../types/item-type'

const props = withDefaults(
  defineProps<{
    initial: ItemTypeInput
    submitting?: boolean
  }>(),
  { submitting: false },
)

const emit = defineEmits<{
  submit: [value: ItemTypeInput]
  cancel: []
}>()

const form = reactive<ItemTypeInput>({ ...props.initial })

type ErrorMap = Partial<Record<keyof ItemTypeInput, string>>
const errors = ref<ErrorMap>({})

function validate(): boolean {
  const e: ErrorMap = {}
  if (!form.code.trim()) {
    e.code = 'Kode wajib diisi.'
  } else if (form.code.length > 10) {
    e.code = 'Kode maksimal 10 karakter.'
  } else if (!/^[a-zA-Z0-9]+$/.test(form.code)) {
    e.code = 'Kode hanya boleh huruf dan angka.'
  }
  if (!form.name.trim()) e.name = 'Nama tipe wajib diisi.'
  errors.value = e
  return Object.keys(e).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('submit', { ...form })
}
</script>

<template>
  <form class="item-type-form" @submit.prevent="onSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BaseInput v-model="form.code" label="Kode" required :error="errors.code" placeholder="mis. MED" />
      <BaseInput v-model="form.name" label="Nama Tipe" required :error="errors.name" />
      <div class="md:col-span-2">
        <BaseInput v-model="form.description" label="Deskripsi" />
      </div>
    </div>

    <div class="item-type-form__actions">
      <BaseButton label="Batal" variant="ghost" type="button" @click="emit('cancel')" />
      <BaseButton label="Simpan" type="submit" :loading="submitting" />
    </div>
  </form>
</template>

<style scoped>
.item-type-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-6);
}
</style>
