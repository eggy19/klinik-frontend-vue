<script setup lang="ts">
import { computed, useId } from 'vue'
import ToggleSwitch from 'primevue/toggleswitch'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    label?: string
    required?: boolean
    disabled?: boolean
    error?: string
  }>(),
  {
    modelValue: false,
    required: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
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

    <ToggleSwitch
      :input-id="fieldId"
      :model-value="modelValue"
      :disabled="disabled"
      :invalid="hasError"
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

.base-field__error {
  color: var(--color-danger);
  font-size: var(--font-xs);
}
</style>