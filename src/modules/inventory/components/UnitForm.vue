<script setup lang="ts">
import { reactive, ref } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import type { UnitInput } from '../types/unit'

const props = withDefaults(
  defineProps<{
    initial: UnitInput
    submitting?: boolean
  }>(),
  { submitting: false },
)

const emit = defineEmits<{
  submit: [value: UnitInput]
  cancel: []
}>()

const form = reactive<UnitInput>({ ...props.initial })

type ErrorMap = Partial<Record<keyof UnitInput, string>>
const errors = ref<ErrorMap>({})

function validate(): boolean {
  const e: ErrorMap = {}
  if (!form.code.trim()) e.code = 'Singkatan wajib diisi.'
  if (!form.name.trim()) e.name = 'Nama satuan wajib diisi.'
  errors.value = e
  return Object.keys(e).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('submit', { ...form })
}
</script>

<template>
  <form class="unit-form" @submit.prevent="onSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BaseInput v-model="form.code" label="Singkatan" required :error="errors.code" />
      <BaseInput v-model="form.name" label="Nama Satuan" required :error="errors.name" />
      <div class="md:col-span-2">
        <BaseInput v-model="form.description" label="Deskripsi" />
      </div>
    </div>

    <div class="unit-form__actions">
      <BaseButton label="Batal" variant="ghost" type="button" @click="emit('cancel')" />
      <BaseButton label="Simpan" type="submit" :loading="submitting" />
    </div>
  </form>
</template>

<style scoped>
.unit-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-6);
}
</style>
