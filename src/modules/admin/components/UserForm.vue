<script setup lang="ts">
import { computed, reactive, ref, toRef } from 'vue'
import Password from 'primevue/password'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useTenantBranchCascade } from '../composables/useTenantBranchCascade'
import type { Tenant } from '../types/tenant'
import type { CreateUserInput, UpdateUserInput } from '../types/user'

/**
 * Mode create: semua field + cascade Tenant → Cabang.
 * Mode edit: hanya nama (batasan backend — PUT /users/:id menerima name saja).
 */
const props = withDefaults(
  defineProps<{
    tenants: Tenant[]
    submitting?: boolean
    isEdit?: boolean
    initialName?: string
  }>(),
  { submitting: false, isEdit: false, initialName: '' },
)

const emit = defineEmits<{
  create: [value: CreateUserInput]
  update: [value: UpdateUserInput]
  cancel: []
}>()

const form = reactive({
  name: props.initialName,
  email: '',
  password: '',
  tenantId: null as string | null,
})

const { branchId, branchOptions, loadingBranches } = useTenantBranchCascade(
  toRef(form, 'tenantId'),
)

interface ErrorMap {
  name?: string
  email?: string
  password?: string
  tenantId?: string
  branchId?: string
}
const errors = ref<ErrorMap>({})

const branchPlaceholder = computed(() => {
  if (!form.tenantId) return 'Pilih tenant dulu'
  if (loadingBranches.value) return 'Memuat cabang...'
  return 'Pilih...'
})

function validate(): boolean {
  const e: ErrorMap = {}
  if (form.name.trim().length < 2) e.name = 'Nama minimal 2 karakter.'
  if (!props.isEdit) {
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email tidak valid.'
    if (form.password.length < 8) e.password = 'Password minimal 8 karakter.'
    if (!form.tenantId) e.tenantId = 'Tenant wajib dipilih.'
    if (!branchId.value) e.branchId = 'Cabang wajib dipilih.'
  }
  errors.value = e
  return Object.keys(e).length === 0
}

function onSubmit() {
  if (!validate()) return
  if (props.isEdit) {
    emit('update', { name: form.name.trim() })
    return
  }
  emit('create', {
    name: form.name.trim(),
    email: form.email.trim(),
    password: form.password,
    tenantId: form.tenantId!,
    branchId: branchId.value!,
  })
}
</script>

<template>
  <form class="user-form" @submit.prevent="onSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="md:col-span-2">
        <BaseInput v-model="form.name" label="Nama" required :error="errors.name" />
      </div>

      <template v-if="!isEdit">
        <BaseInput
          v-model="form.email"
          label="Email"
          type="email"
          required
          :error="errors.email"
          placeholder="nama@klinik.id"
        />
        <div class="base-field">
          <label class="base-field__label">
            Password
            <span class="base-field__required" aria-hidden="true">*</span>
          </label>
          <Password
            v-model="form.password"
            toggle-mask
            :feedback="false"
            :invalid="!!errors.password"
            input-class="w-full"
            class="user-form__password"
          />
          <small v-if="errors.password" class="base-field__error">{{ errors.password }}</small>
        </div>
        <BaseSelect
          v-model="form.tenantId"
          label="Tenant"
          :options="tenants"
          option-label="name"
          option-value="id"
          required
          filter
          :error="errors.tenantId"
        />
        <BaseSelect
          v-model="branchId"
          label="Cabang"
          :options="branchOptions"
          option-label="name"
          option-value="id"
          required
          filter
          :disabled="!form.tenantId || loadingBranches"
          :placeholder="branchPlaceholder"
          :error="errors.branchId"
        />
      </template>
    </div>

    <div class="user-form__actions">
      <BaseButton label="Batal" variant="ghost" type="button" @click="emit('cancel')" />
      <BaseButton label="Simpan" type="submit" :loading="submitting" />
    </div>
  </form>
</template>

<style scoped>
.user-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-6);
}

.user-form__password :deep(input) {
  width: 100%;
}

.base-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.base-field__label {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.base-field__required {
  color: var(--color-danger);
}

.base-field__error {
  color: var(--color-danger);
  font-size: var(--font-xs);
}
</style>
