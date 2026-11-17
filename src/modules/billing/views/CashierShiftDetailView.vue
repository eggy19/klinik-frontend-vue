<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSummaryCard from '@/components/base/BaseSummaryCard.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { apiErrorMessage, isNotFoundError } from '@/utils/api-error'
import { formatCurrencyExact, formatDateTimeWib } from '@/utils/format'
import { billingApi } from '../api/billing.api'
import type { Shift } from '../types/billing'
import { formatCashDifference, SHIFT_STATUS_LABEL, SHIFT_STATUS_VARIANT } from '../utils/status'

// Detail Shift (billing.shift.read_all, §5.12): ringkasan BR-SH-14, selisih kas, catatan.
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const shift = ref<Shift | null>(null)
const loading = ref(true)
const notFound = ref(false)
const errorMessage = ref('')

const shiftId = computed(() => String(route.params.id ?? ''))

async function load() {
  loading.value = true
  notFound.value = false
  errorMessage.value = ''
  shift.value = null
  try {
    shift.value = await billingApi.getShift(shiftId.value)
  } catch (error) {
    // 404 BIL_001: tidak ada atau di luar scope (BR-SH-13).
    if (isNotFoundError(error)) notFound.value = true
    else errorMessage.value = apiErrorMessage(error, 'Gagal memuat shift.')
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(shiftId, load)

function back() {
  router.push({ name: 'cashier-shifts' })
}

const difference = computed(() => shift.value?.cashDifference ?? null)
const differenceText = computed(() => formatCashDifference(difference.value))
</script>

<template>
  <div class="detail">
    <div class="detail__head">
      <BaseButton label="Kembali" icon="pi pi-arrow-left" variant="secondary" @click="back" />
      <h1 class="detail__title">Detail Shift</h1>
    </div>

    <p v-if="loading" class="detail__hint">Memuat shift...</p>

    <BaseCard v-else-if="notFound">
      <BaseEmptyState icon="pi pi-search" title="Shift tidak ditemukan" description="Shift tidak ada atau di luar cabang Anda.">
        <template #action>
          <BaseButton label="Ke Daftar Shift" variant="secondary" @click="back" />
        </template>
      </BaseEmptyState>
    </BaseCard>

    <BaseCard v-else-if="errorMessage">
      <BaseEmptyState icon="pi pi-exclamation-circle" title="Shift tidak dapat dimuat" :description="errorMessage">
        <template #action>
          <BaseButton label="Coba lagi" variant="secondary" @click="load" />
        </template>
      </BaseEmptyState>
    </BaseCard>

    <template v-else-if="shift">
      <BaseCard>
        <template #header>
          <div class="detail__card-head">
            <h3 class="detail__card-title">{{ shift.shiftNumber }}</h3>
            <BaseTag :variant="SHIFT_STATUS_VARIANT[shift.status]" :value="SHIFT_STATUS_LABEL[shift.status]" />
            <BaseTag v-if="shift.openedBeforeToday" variant="warning" value="Lintas hari" />
          </div>
        </template>
        <dl class="detail__rows">
          <div><dt>Kasir</dt><dd>{{ shift.cashierName ?? '-' }}</dd></div>
          <div><dt>Cabang</dt><dd>{{ auth.context?.branchName ?? '-' }}</dd></div>
          <div><dt>Dibuka</dt><dd>{{ formatDateTimeWib(shift.openedAt) }}</dd></div>
          <div><dt>Ditutup</dt><dd>{{ formatDateTimeWib(shift.closedAt) }}</dd></div>
          <div><dt>Kas awal</dt><dd>{{ formatCurrencyExact(shift.openingCash) }}</dd></div>
        </dl>
      </BaseCard>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <BaseSummaryCard
          title="Penjualan Tunai"
          :value="formatCurrencyExact(shift.summary.cashSalesTotal)"
          icon="pi pi-wallet"
          variant="success"
        />
        <BaseSummaryCard
          title="Kas Seharusnya"
          :value="formatCurrencyExact(shift.summary.expectedCash)"
          icon="pi pi-calculator"
        />
        <BaseSummaryCard title="Transaksi Berhasil" :value="shift.summary.saleCount" icon="pi pi-check-circle" variant="info" />
        <BaseSummaryCard title="Belum Pasti" :value="shift.summary.pendingCount" icon="pi pi-hourglass" variant="warning" />
        <BaseSummaryCard title="Gagal" :value="shift.summary.failedCount" icon="pi pi-times-circle" variant="danger" />
        <BaseSummaryCard
          title="Perlu Diperiksa"
          :value="shift.summary.reconciliationCount"
          icon="pi pi-exclamation-triangle"
          variant="warning"
        />
      </div>

      <BaseCard title="Selisih Kas">
        <p v-if="shift.status === 'OPEN'" class="detail__hint">
          Shift masih terbuka. Selisih dihitung saat shift ditutup.
        </p>
        <dl v-else class="detail__rows">
          <div><dt>Kas seharusnya</dt><dd>{{ formatCurrencyExact(shift.expectedCash ?? shift.summary.expectedCash) }}</dd></div>
          <div>
            <dt>Kas dihitung</dt>
            <dd>{{ shift.closingCashCounted === null ? '-' : formatCurrencyExact(shift.closingCashCounted) }}</dd>
          </div>
          <div>
            <dt>Selisih</dt>
            <dd :class="{ 'detail__diff': difference !== null && difference !== 0 }">{{ differenceText }}</dd>
          </div>
        </dl>
      </BaseCard>

      <BaseCard title="Catatan">
        <dl class="detail__rows">
          <div><dt>Catatan buka shift</dt><dd>{{ shift.openNote ?? '-' }}</dd></div>
          <div><dt>Catatan tutup shift</dt><dd>{{ shift.closeNote ?? '-' }}</dd></div>
        </dl>
      </BaseCard>
    </template>
  </div>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.detail__head {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.detail__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.detail__hint {
  color: var(--text-muted);
}

.detail__card-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.detail__card-title {
  font-size: var(--font-lg);
  color: var(--text);
}

.detail__rows {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--space-4);
  margin: 0;
}

.detail__rows dt {
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.detail__rows dd {
  margin: 0;
  font-weight: var(--font-weight-heading);
  color: var(--text);
  overflow-wrap: anywhere;
}

.detail__rows dd.detail__diff {
  color: var(--color-danger);
}
</style>
