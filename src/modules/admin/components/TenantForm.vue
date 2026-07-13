<script setup lang="ts">
import { reactive, ref } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { STATUS_LABELS, type EntityStatus } from '../types/common'
import type { TenantInput } from '../types/tenant'

const props = withDefaults(
  defineProps<{
    initial: TenantInput
    submitting?: boolean
    /** true saat edit — kode tenant tidak bisa diubah (batasan backend). */
    isEdit?: boolean
  }>(),
  { submitting: false, isEdit: false },
)

const emit = defineEmits<{
  submit: [value: TenantInput]
  cancel: []
}>()

const form = reactive<TenantInput>({ ...props.initial })

const statusOptions = (Object.keys(STATUS_LABELS) as EntityStatus[]).map((value) => ({
  value,
  label: STATUS_LABELS[value],
}))

type ErrorMap = Partial<Record<keyof TenantInput, string>>
const errors = ref<ErrorMap>({})

function validate(): boolean {
  const e: ErrorMap = {}
  if (form.name.trim().length < 2) e.name = 'Nama minimal 2 karakter.'
  if (!props.isEdit) {
    if (form.code.trim().length < 2) {
      e.code = 'Kode minimal 2 karakter.'
    } else if (!/^[A-Z0-9-]+$/.test(form.code)) {
      e.code = 'Kode hanya boleh huruf kapital, angka, dan tanda hubung.'
    }
  }
  errors.value = e
  return Object.keys(e).length === 0
}

function onCodeInput(value: string) {
  form.code = value.toUpperCase()
}

function onSubmit() {
  if (!validate()) return
  emit('submit', { ...form })
}
</script>

<template>
  <form class="tenant-form" @submit.prevent="onSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BaseInput
        :model-value="form.code"
        label="Kode"
        required
        :disabled="isEdit"
        :error="errors.code"
        placeholder="mis. KLINIK-A"
        @update:model-value="onCodeInput"
      />
      <BaseInput v-model="form.name" label="Nama Tenant" required :error="errors.name" />
      <BaseSelect
        v-model="form.status"
        label="Status"
        :options="statusOptions"
        option-label="label"
        option-value="value"
      />
    </div>

    <div class="tenant-form__actions">
      <BaseButton label="Batal" variant="ghost" type="button" @click="emit('cancel')" />
      <BaseButton label="Simpan" type="submit" :loading="submitting" />
    </div>
  </form>
</template>

<style scoped>
.tenant-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-6);
}
</style>
