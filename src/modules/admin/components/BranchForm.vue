<script setup lang="ts">
import { reactive, ref } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { STATUS_LABELS, type EntityStatus } from '../types/common'
import type { Tenant } from '../types/tenant'
import type { BranchInput } from '../types/branch'

const props = withDefaults(
  defineProps<{
    initial: BranchInput
    tenants: Tenant[]
    submitting?: boolean
    /** true saat edit — tenant & kode cabang tidak bisa diubah (batasan backend). */
    isEdit?: boolean
  }>(),
  { submitting: false, isEdit: false },
)

const emit = defineEmits<{
  submit: [value: BranchInput]
  cancel: []
}>()

const form = reactive<BranchInput>({ ...props.initial })

const statusOptions = (Object.keys(STATUS_LABELS) as EntityStatus[]).map((value) => ({
  value,
  label: STATUS_LABELS[value],
}))

type ErrorMap = Partial<Record<keyof BranchInput, string>>
const errors = ref<ErrorMap>({})

function validate(): boolean {
  const e: ErrorMap = {}
  if (!props.isEdit) {
    if (!form.tenantId) e.tenantId = 'Tenant wajib dipilih.'
    if (form.code.trim().length < 2) {
      e.code = 'Kode minimal 2 karakter.'
    } else if (!/^[A-Z0-9-]+$/.test(form.code)) {
      e.code = 'Kode hanya boleh huruf kapital, angka, dan tanda hubung.'
    }
  }
  if (form.name.trim().length < 2) e.name = 'Nama minimal 2 karakter.'
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
  <form class="branch-form" @submit.prevent="onSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="md:col-span-2">
        <BaseSelect
          v-model="form.tenantId"
          label="Tenant"
          :options="tenants"
          option-label="name"
          option-value="id"
          required
          filter
          :disabled="isEdit"
          :error="errors.tenantId"
        />
      </div>
      <BaseInput
        :model-value="form.code"
        label="Kode"
        required
        :disabled="isEdit"
        :error="errors.code"
        placeholder="mis. CAB-01"
        @update:model-value="onCodeInput"
      />
      <BaseInput v-model="form.name" label="Nama Cabang" required :error="errors.name" />
      <BaseSelect
        v-model="form.status"
        label="Status"
        :options="statusOptions"
        option-label="label"
        option-value="value"
      />
    </div>

    <div class="branch-form__actions">
      <BaseButton label="Batal" variant="ghost" type="button" @click="emit('cancel')" />
      <BaseButton label="Simpan" type="submit" :loading="submitting" />
    </div>
  </form>
</template>

<style scoped>
.branch-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-6);
}
</style>
