<script setup lang="ts">
import Dialog from 'primevue/dialog'

withDefaults(
  defineProps<{
    visible: boolean
    header?: string
  }>(),
  {},
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()
</script>

<template>
  <!--
    Dialog standar Create/Edit/Confirm (docs/03 & 06).
    Lebar 600px desktop, 95vw mobile (docs/07-responsive-guideline.md).
  -->
  <Dialog
    :visible="visible"
    :header="header"
    modal
    :draggable="false"
    :dismissable-mask="true"
    :style="{ width: '600px' }"
    :breakpoints="{ '767px': '95vw' }"
    @update:visible="emit('update:visible', $event)"
  >
    <slot />

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </Dialog>
</template>
