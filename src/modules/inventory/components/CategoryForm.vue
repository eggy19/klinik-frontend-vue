<script setup lang="ts">
import { reactive, ref } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import type { CategoryInput } from '../types/category'
import type { ItemType } from '../types/item-type'

const props = withDefaults(
  defineProps<{
    initial: CategoryInput
    submitting?: boolean
    itemTypes: ItemType[]
  }>(),
  { submitting: false },
)

const emit = defineEmits<{
  submit: [value: CategoryInput]
  cancel: []
}>()

const form = reactive<CategoryInput>({ ...props.initial })

type ErrorMap = Partial<Record<keyof CategoryInput, string>>
const errors = ref<ErrorMap>({})

function validate(): boolean {
  const e: ErrorMap = {}
  if (!form.itemTypeId) e.itemTypeId = 'Tipe item wajib dipilih.'
  if (!form.code.trim()) e.code = 'Kode wajib diisi.'
  if (!form.name.trim()) e.name = 'Nama kategori wajib diisi.'
  errors.value = e
  return Object.keys(e).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('submit', { ...form })
}
</script>

<template>
  <form class="category-form" @submit.prevent="onSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="md:col-span-2">
        <BaseSelect
          v-model="form.itemTypeId"
          label="Tipe Item"
          required
          :options="itemTypes"
          option-label="name"
          option-value="id"
          :error="errors.itemTypeId"
          filter
        />
      </div>
      <BaseInput v-model="form.code" label="Kode" required :error="errors.code" />
      <BaseInput v-model="form.name" label="Nama Kategori" required :error="errors.name" />
      <div class="md:col-span-2">
        <BaseInput v-model="form.description" label="Deskripsi" />
      </div>
    </div>

    <div class="category-form__actions">
      <BaseButton label="Batal" variant="ghost" type="button" @click="emit('cancel')" />
      <BaseButton label="Simpan" type="submit" :loading="submitting" />
    </div>
  </form>
</template>

<style scoped>
.category-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-6);
}
</style>
