<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import InputText from 'primevue/inputtext'
import { formatDecimal } from '@/utils/format'

/**
 * Input angka desimal format Indonesia: koma (,) sebagai pemisah desimal, mis. "12,5".
 * Titik yang diketik dianggap koma. Dipakai untuk nilai seperti margin persen.
 */
const props = withDefaults(
  defineProps<{
    modelValue?: number | null
    label?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    error?: string
    /** Jumlah digit maksimum di belakang koma. */
    maxFractionDigits?: number
  }>(),
  {
    required: false,
    disabled: false,
    maxFractionDigits: 2,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const fieldId = useId()
const hasError = computed(() => !!props.error)

function toDisplay(value: number | null | undefined): string {
  // Tanpa pemisah ribuan agar teks yang tampil sama dengan yang bisa diketik ulang.
  return formatDecimal(value, props.maxFractionDigits).replace(/\./g, '')
}

function parse(text: string): number | null {
  return text === '' ? null : Number(text.replace(',', '.'))
}

const display = ref(toDisplay(props.modelValue))

// Sinkron ulang hanya bila nilai berubah dari luar (reset/prefill), supaya
// ketikan setengah jadi seperti "12," tidak dihapus.
watch(
  () => props.modelValue,
  (value) => {
    if (value !== parse(display.value)) display.value = toDisplay(value)
  },
)

function sanitize(raw: string): string {
  const text = raw.replace(/\./g, ',').replace(/[^\d,]/g, '')
  const [whole, ...rest] = text.split(',')
  if (rest.length === 0 || props.maxFractionDigits === 0) return whole
  return `${whole},${rest.join('').slice(0, props.maxFractionDigits)}`
}

function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  display.value = sanitize(input.value)
  input.value = display.value
  emit('update:modelValue', parse(display.value))
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
