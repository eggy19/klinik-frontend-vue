<script setup lang="ts">
import { computed, useId } from 'vue'
import InputText from 'primevue/inputtext'

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    label?: string
    placeholder?: string
    type?: string
    required?: boolean
    disabled?: boolean
    error?: string
  }>(),
  {
    type: 'text',
    required: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const fieldId = useId()
const hasError = computed(() => !!props.error)

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="base-field">
    <!-- Label selalu di atas field (docs/06-ui-ux-standard.md). -->
    <label v-if="label" :for="fieldId" class="base-field__label">
      {{ label }}
      <span v-if="required" class="base-field__required" aria-hidden="true">*</span>
    </label>

    <InputText
      :id="fieldId"
      :model-value="modelValue != null ? String(modelValue) : ''"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :invalid="hasError"
      :aria-invalid="hasError"
      class="base-field__control"
      @input="onInput"
    />

    <!-- Error message langsung di bawah field (docs/06). -->
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

.base-field__error {
  color: var(--color-danger);
  font-size: var(--font-xs);
}
</style>
