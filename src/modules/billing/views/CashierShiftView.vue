<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseCurrencyInput from '@/components/base/BaseCurrencyInput.vue'
import BaseSummaryCard from '@/components/base/BaseSummaryCard.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { apiErrorMessage, apiErrorStatus } from '@/utils/api-error'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import { billingApi } from '../api/billing.api'
import CloseShiftDialog from '../components/CloseShiftDialog.vue'
import type { Shift } from '../types/billing'

// Shift Saya: shift aktif milik user + Buka Shift (BR-SH-*, §4.1, §5.12).
const auth = useAuthStore()
const router = useRouter()
const toast = useToastFeedback()

const shift = ref<Shift | null>(null)
const loading = ref(true)
const loadError = ref('')

const canOpen = computed(() => auth.can('billing.shift.open'))
const canClose = computed(() => auth.can('billing.shift.close'))
const canSell = computed(() => auth.can('billing.sale.create'))

async function loadShift() {
  loading.value = true
  loadError.value = ''
  try {
    shift.value = await billingApi.getCurrentShift()
  } catch (error) {
    shift.value = null
    loadError.value = apiErrorMessage(error, 'Gagal memuat shift.')
  } finally {
    loading.value = false
  }
}

onMounted(loadShift)

// --- Buka shift ---
const openingCash = ref<number | null>(0)
const openNote = ref('')
const opening = ref(false)
const openError = ref('')

const cashError = computed(() => (openingCash.value === null ? 'Modal awal wajib diisi (boleh 0)' : undefined))
const noteError = computed(() => (openNote.value.length > 500 ? 'Maksimal 500 karakter' : undefined))

async function onOpen() {
  if (openingCash.value === null || noteError.value || opening.value) return
  opening.value = true
  openError.value = ''
  try {
    shift.value = await billingApi.openShift({ openingCash: openingCash.value, openNote: openNote.value })
    toast.success(`Shift ${shift.value.shiftNumber} dibuka.`)
  } catch (error) {
    openError.value = apiErrorMessage(error, 'Gagal membuka shift.')
    // BIL_002: sudah ada shift OPEN (mis. dibuka di tab lain) — tampilkan shift itu.
    if (apiErrorStatus(error) === 409) await loadShift()
  } finally {
    opening.value = false
  }
}

// --- Tutup shift (P1) ---
const closeVisible = ref(false)
const closing = ref(false)
const closeError = ref('')

async function onClose(input: { closingCashCounted: number; closeNote: string }) {
  if (!shift.value) return
  closing.value = true
  closeError.value = ''
  try {
    const closed = await billingApi.closeShift(shift.value.id, input)
    closeVisible.value = false
    shift.value = null
    const converted = closed.pendingConvertedCount ?? 0
    toast.success(
      converted > 0
        ? `Shift ${closed.shiftNumber} ditutup. ${converted} transaksi belum pasti akan diperiksa supervisor.`
        : `Shift ${closed.shiftNumber} ditutup.`,
    )
  } catch (error) {
    closeError.value = apiErrorMessage(error, 'Gagal menutup shift.')
    // BIL_004: shift sudah ditutup / bukan milik user — sinkronkan tampilan.
    if (apiErrorStatus(error) === 409 || apiErrorStatus(error) === 404) {
      closeVisible.value = false
      await loadShift()
    }
  } finally {
    closing.value = false
  }
}
</script>

<template>
  <div class="shift">
    <h1 class="shift__title">Shift Saya</h1>

    <p v-if="loading" class="shift__hint">Memuat shift...</p>

    <BaseCard v-else-if="loadError">
      <BaseEmptyState icon="pi pi-exclamation-circle" title="Shift tidak dapat dimuat" :description="loadError">
        <template #action>
          <BaseButton label="Coba lagi" variant="secondary" @click="loadShift" />
        </template>
      </BaseEmptyState>
    </BaseCard>

    <!-- Shift OPEN -->
    <template v-else-if="shift">
      <p v-if="shift.openedBeforeToday" class="alert alert--warn">
        Shift dibuka {{ formatDate(shift.openedAt) }}, segera tutup.
      </p>

      <BaseCard :title="shift.shiftNumber">
        <template #header>
          <div class="shift__card-head">
            <h3 class="shift__card-title">{{ shift.shiftNumber }}</h3>
            <BaseTag variant="success" value="Terbuka" />
            <BaseTag v-if="shift.openedBeforeToday" variant="warning" value="Lintas hari" />
          </div>
        </template>
        <dl class="shift__rows">
          <div><dt>Kasir</dt><dd>{{ shift.cashierName ?? auth.user?.name ?? '-' }}</dd></div>
          <div><dt>Cabang</dt><dd>{{ auth.context?.branchName ?? '-' }}</dd></div>
          <div><dt>Dibuka</dt><dd>{{ formatDateTime(shift.openedAt) }}</dd></div>
          <div><dt>Modal awal</dt><dd>{{ formatCurrency(shift.openingCash) }}</dd></div>
          <div v-if="shift.openNote"><dt>Catatan</dt><dd>{{ shift.openNote }}</dd></div>
        </dl>
        <template #footer>
          <div class="shift__actions">
            <BaseButton
              v-if="canSell"
              label="Ke Layar POS"
              icon="pi pi-shopping-cart"
              @click="router.push('/cashier/pos')"
            />
            <BaseButton
              v-if="canClose"
              label="Tutup Shift"
              icon="pi pi-lock"
              variant="secondary"
              @click="(closeError = ''), (closeVisible = true)"
            />
          </div>
        </template>
      </BaseCard>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <BaseSummaryCard
          title="Penjualan Tunai"
          :value="formatCurrency(shift.summary.cashSalesTotal)"
          icon="pi pi-wallet"
          variant="success"
        />
        <BaseSummaryCard
          title="Kas Seharusnya"
          :value="formatCurrency(shift.summary.expectedCash)"
          icon="pi pi-calculator"
        />
        <BaseSummaryCard title="Transaksi Berhasil" :value="shift.summary.saleCount" icon="pi pi-check-circle" variant="info" />
        <BaseSummaryCard
          v-if="shift.summary.pendingCount > 0"
          title="Belum Pasti"
          :value="shift.summary.pendingCount"
          icon="pi pi-hourglass"
          variant="warning"
        />
        <BaseSummaryCard
          v-if="shift.summary.failedCount > 0"
          title="Gagal"
          :value="shift.summary.failedCount"
          icon="pi pi-times-circle"
          variant="danger"
        />
        <BaseSummaryCard
          v-if="shift.summary.reconciliationCount > 0"
          title="Perlu Diperiksa"
          :value="shift.summary.reconciliationCount"
          icon="pi pi-exclamation-triangle"
          variant="warning"
        />
      </div>

      <CloseShiftDialog
        v-if="canClose"
        :visible="closeVisible"
        :shift="shift"
        :submitting="closing"
        :error-message="closeError"
        @close="closeVisible = false"
        @submit="onClose"
      />
    </template>

    <!-- Belum ada shift: form Buka Shift -->
    <BaseCard v-else-if="canOpen" title="Buka Shift">
      <form class="shift__form" @submit.prevent="onOpen">
        <BaseCurrencyInput v-model="openingCash" whole-rupiah select-on-focus label="Modal awal (uang kembalian di laci)" required :error="cashError" />
        <BaseInput v-model="openNote" label="Catatan (opsional)" :error="noteError" />
        <p v-if="openError" class="shift__error">{{ openError }}</p>
        <div>
          <BaseButton
            type="submit"
            label="Buka Shift"
            icon="pi pi-play"
            :loading="opening"
            :disabled="openingCash === null || !!noteError"
          />
        </div>
      </form>
    </BaseCard>

    <BaseCard v-else>
      <BaseEmptyState
        icon="pi pi-clock"
        title="Belum ada shift terbuka"
        description="Anda tidak memiliki izin membuka shift."
      />
    </BaseCard>
  </div>
</template>

<style scoped>
.shift {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.shift__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.shift__hint {
  color: var(--text-muted);
}

.shift__card-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.shift__card-title {
  font-size: var(--font-lg);
  color: var(--text);
}

.shift__rows {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--space-4);
  margin: 0;
}

.shift__rows dt {
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.shift__rows dd {
  margin: 0;
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.shift__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.shift__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 28rem;
}

.shift__error {
  font-size: var(--font-sm);
  color: var(--color-danger);
}

.alert {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background-color: var(--bg);
  font-weight: var(--font-weight-heading);
}

.alert--warn {
  color: var(--color-warning);
  border-color: var(--color-warning);
}
</style>
