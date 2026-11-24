<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCurrencyInput from '@/components/base/BaseCurrencyInput.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { formatCurrency } from '@/utils/format'
import { fromCents, toCents } from '../utils/checkout'
import type { Shift } from '../types/billing'

// Tutup Shift (BR-SH-04/05, P1 di BL-19). Backend tetap penentu validasi.
const props = defineProps<{ visible: boolean; shift: Shift; submitting: boolean; errorMessage: string }>()
const emit = defineEmits<{
  close: []
  submit: [input: { closingCashCounted: number; closeNote: string }]
}>()

const counted = ref<number | null>(null)
const note = ref('')

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      counted.value = null
      note.value = ''
    }
  },
)

const differenceCents = computed(() =>
  counted.value === null ? null : toCents(counted.value) - toCents(props.shift.summary.expectedCash),
)
const noteRequired = computed(() => differenceCents.value !== null && differenceCents.value !== 0)
const noteMissing = computed(() => noteRequired.value && note.value.trim() === '')
const noteTooLong = computed(() => note.value.length > 500)
const canSubmit = computed(
  () => counted.value !== null && !noteMissing.value && !noteTooLong.value && !props.submitting,
)

function onVisible(value: boolean) {
  if (!value && !props.submitting) emit('close')
}

function onSubmit() {
  if (counted.value === null || !canSubmit.value) return
  emit('submit', { closingCashCounted: counted.value, closeNote: note.value })
}
</script>

<template>
  <BaseDialog :visible="visible" header="Tutup Shift" @update:visible="onVisible">
    <div class="close-shift">
      <dl class="close-shift__rows">
        <div><dt>Kas seharusnya</dt><dd>{{ formatCurrency(shift.summary.expectedCash) }}</dd></div>
        <div v-if="shift.summary.pendingCount > 0">
          <dt>Transaksi belum pasti</dt>
          <dd>{{ shift.summary.pendingCount }} (diperiksa supervisor)</dd>
        </div>
      </dl>

      <BaseCurrencyInput v-model="counted" whole-rupiah select-on-focus label="Kas fisik dihitung" required />

      <p v-if="differenceCents !== null" class="close-shift__diff" :class="{ 'close-shift__diff--bad': noteRequired }">
        Selisih: {{ formatCurrency(fromCents(differenceCents)) }}
      </p>

      <BaseInput
        v-model="note"
        label="Catatan"
        :required="noteRequired"
        :error="noteMissing ? 'Catatan wajib diisi bila ada selisih' : noteTooLong ? 'Maksimal 500 karakter' : undefined"
      />

      <p v-if="errorMessage" class="close-shift__error">{{ errorMessage }}</p>
    </div>

    <template #footer>
      <BaseButton label="Batal" variant="secondary" :disabled="submitting" @click="emit('close')" />
      <BaseButton
        label="Tutup Shift"
        icon="pi pi-lock"
        variant="danger"
        :loading="submitting"
        :disabled="!canSubmit"
        @click="onSubmit"
      />
    </template>
  </BaseDialog>
</template>

<style scoped>
.close-shift {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  color: var(--text);
}

.close-shift__rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
}

.close-shift__rows > div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

.close-shift__rows dt {
  color: var(--text-muted);
}

.close-shift__rows dd {
  margin: 0;
  font-weight: var(--font-weight-heading);
}

.close-shift__diff {
  font-weight: var(--font-weight-heading);
}

.close-shift__diff--bad {
  color: var(--color-warning-text);
}

.close-shift__error {
  font-size: var(--font-sm);
  color: var(--color-danger);
}
</style>
