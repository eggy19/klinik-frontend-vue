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
  }>(),
  {
    required: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const fieldId = useId()
const hasError = computed(() => !!props.error)

const display = ref(formatNominalInput(props.modelValue))

// Sinkron ulang display kalau modelValue berubah dari luar (mis. reset form,
// prefill harga dari API) — bukan dari ketikan user sendiri.
watch(
  () => props.modelValue,
  (value) => {
    const formatted = formatNominalInput(value)
    if (formatted !== display.value) display.value = formatted
  },
)

function onInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  const parsed = parseNominalInput(raw)
  display.value = formatNominalInput(parsed)
  emit('update:modelValue', parsed)
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
