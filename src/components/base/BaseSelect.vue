<script setup lang="ts" generic="T">
import { computed, useId } from 'vue'
import Select from 'primevue/select'

const props = withDefaults(
  defineProps<{
    modelValue?: T | null
    options: T[]
    optionLabel?: string
    optionValue?: string
    label?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    error?: string
    filter?: boolean
  }>(),
  {
    placeholder: 'Pilih...',
    required: false,
    disabled: false,
    filter: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: T | null]
}>()

const fieldId = useId()
const hasError = computed(() => !!props.error)
</script>

<template>
  <div class="base-field">
    <label v-if="label" :for="fieldId" class="base-field__label">
      {{ label }}
      <span v-if="required" class="base-field__required" aria-hidden="true">*</span>
    </label>

    <Select
      :input-id="fieldId"
      :model-value="modelValue"
      :options="options"
      :option-label="optionLabel"
      :option-value="optionValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :invalid="hasError"
      :filter="filter"
      class="base-field__control"
      @update:model-value="emit('update:modelValue', $event)"
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

.base-field__error {
  color: var(--color-danger);
  font-size: var(--font-xs);
}
</style>
