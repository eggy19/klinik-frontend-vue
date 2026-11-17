<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import InputText from 'primevue/inputtext'
import { formatNominalInput, parseNominalInput } from '@/utils/format'

const props = withDefaults(
  defineProps<{
    modelValue?: number | null
    label?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    error?: string
    /** Rupiah bulat tanpa sen: ketik "20000" = 20000 (default: mask sen, "20000" = 200,00). */
    wholeRupiah?: boolean
    /** Pilih seluruh teks saat fokus agar ketikan mengganti nilai awal (mis. "0"), bukan menyisip. */
    selectOnFocus?: boolean
  }>(),
  {
    required: false,
    disabled: false,
    wholeRupiah: false,
    selectOnFocus: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const fieldId = useId()
const hasError = computed(() => !!props.error)

const fractionDigits = computed(() => (props.wholeRupiah ? 0 : 2))
const display = ref(formatNominalInput(props.modelValue, fractionDigits.value))

// Sinkron ulang display kalau modelValue berubah dari luar (mis. reset form,
// prefill harga dari API) — bukan dari ketikan user sendiri.
watch(
  () => props.modelValue,
  (value) => {
    const formatted = formatNominalInput(value, fractionDigits.value)
    if (formatted !== display.value) display.value = formatted
  },
)

function onInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  const parsed = parseNominalInput(raw, fractionDigits.value)
  display.value = formatNominalInput(parsed, fractionDigits.value)
  emit('update:modelValue', parsed)
}

function onFocus(event: FocusEvent) {
  if (!props.selectOnFocus) return
  const input = event.target as HTMLInputElement
  // Ditunda: pada klik mouse, mouseup setelah focus akan membatalkan seleksi yang dibuat sinkron.
  setTimeout(() => input.select(), 0)
}
</script>

<template>
  <div class="base-field">
    <label v-if="label" :for="fieldId" class="base-field__label">
      {{ label }}
      <span v-if="required" class="base-field__required" aria-hidden="true">*</span>
    </label>

    <InputText
      :id="fieldId"
      :model-value="display"
      inputmode="decimal"
      :placeholder="placeholder"
      :disabled="disabled"
      :invalid="hasError"
      :aria-invalid="hasError"
      class="base-field__control base-field__control--num"
      @input="onInput"
      @focus="onFocus"
    />

    <small v-if="hasError" class="base-field__error">{{ error }}</small>
  </div>
</template>

<style scoped>
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

.base-field__control {
  width: 100%;
}

.base-field__control--num {
  text-align: right;
}

.base-field__error {
  color: var(--color-danger);
  font-size: var(--font-xs);
}
</style>
