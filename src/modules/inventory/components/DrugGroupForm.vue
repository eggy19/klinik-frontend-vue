<script setup lang="ts">
import { reactive, ref } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import type { DrugGroupInput } from '../types/drug-group'

const props = withDefaults(
  defineProps<{
    initial: DrugGroupInput
    submitting?: boolean
  }>(),
  { submitting: false },
)

const emit = defineEmits<{
  submit: [value: DrugGroupInput]
  cancel: []
}>()

const form = reactive<DrugGroupInput>({ ...props.initial })

type ErrorMap = Partial<Record<keyof DrugGroupInput, string>>
const errors = ref<ErrorMap>({})

function validate(): boolean {
  const e: ErrorMap = {}
  if (!form.code.trim()) {
    e.code = 'Kode wajib diisi.'
  } else if (form.code.length > 50) {
    e.code = 'Kode maksimal 50 karakter.'
  }
  if (!form.name.trim()) e.name = 'Nama golongan wajib diisi.'
  errors.value = e
  return Object.keys(e).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('submit', { ...form })
}
</script>

<template>
  <form class="drug-group-form" @submit.prevent="onSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BaseInput v-model="form.code" label="Kode Golongan" required :error="errors.code" placeholder="mis. OBT_KERAS" />
      <BaseInput v-model="form.name" label="Nama Golongan" required :error="errors.name" placeholder="mis. Obat Keras (Daftar G)" />
      <div class="md:col-span-2">
        <BaseInput v-model="form.description" label="Deskripsi" />
      </div>
    </div>

    <div class="drug-group-form__toggles">
      <label class="drug-group-form__toggle">
        <input
          type="checkbox"
          :checked="form.requiresPrescription"
          @change="form.requiresPrescription = ($event.target as HTMLInputElement).checked"
        />
        <span>Wajib Resep Dokter</span>
      </label>
      <label class="drug-group-form__toggle">
        <input
          type="checkbox"
          :checked="form.isActive"
          @change="form.isActive = ($event.target as HTMLInputElement).checked"
        />
        <span>Aktif</span>
      </label>
    </div>

    <div class="drug-group-form__actions">
      <BaseButton label="Batal" variant="ghost" type="button" @click="emit('cancel')" />
      <BaseButton label="Simpan" type="submit" :loading="submitting" />
    </div>
  </form>
</template>

<style scoped>
.drug-group-form__toggles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-6);
  margin-top: var(--space-4);
}

.drug-group-form__toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-sm);
  color: var(--text);
}

.drug-group-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-6);
}
</style>
