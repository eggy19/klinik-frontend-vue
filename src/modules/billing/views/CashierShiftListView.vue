<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import { apiErrorMessage } from '@/utils/api-error'
import { formatCurrencyExact, formatDateTimeWib, todayWib } from '@/utils/format'
import { billingApi } from '../api/billing.api'
import type { Shift } from '../types/billing'
import { formatCashDifference, SHIFT_STATUS_LABEL, SHIFT_STATUS_VARIANT } from '../utils/status'

// Daftar Shift (billing.shift.read_all, §5.12). Tanggal dicocokkan ke `opened_at` (§7.5).
const router = useRouter()

interface ShiftRow {
  id: string
  shiftNumber: string
  cashierName: string | null
  openedAt: string
  closedAt: string | null
  openingCash: number
  expectedCash: number
  closingCashCounted: number | null
  cashDifference: number | null
  status: Shift['status']
}

const today = todayWib()
const dateFrom = ref(today)
const dateTo = ref(today)
const status = ref('')
const cashierId = ref('')

const rows = ref<ShiftRow[]>([])
const total = ref(0)
const limit = ref(20)
// Lihat catatan di CashierSalesView: skeleton hanya untuk muat awal / ganti filter.
const loading = ref(true)
const errorMessage = ref('')
let requestSeq = 0

const rangeInvalid = computed(() => !!dateFrom.value && !!dateTo.value && dateFrom.value > dateTo.value)
const rangeError = computed(() => (rangeInvalid.value ? 'Tanggal awal melewati tanggal akhir' : undefined))

const statusOptions = [
  { value: '', label: 'Semua status' },
  { value: 'OPEN', label: SHIFT_STATUS_LABEL.OPEN },
  { value: 'CLOSED', label: SHIFT_STATUS_LABEL.CLOSED },
]

// Opsi kasir = kasir unik dari hasil list shift (tidak ada endpoint daftar kasir).
const cashierNames = ref<Record<string, string>>({})
const cashierOptions = computed(() => [
  { value: '', label: 'Semua kasir' },
  ...Object.entries(cashierNames.value)
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'id')),
])

function toRow(shift: Shift): ShiftRow {
  return {
    id: shift.id,
    shiftNumber: shift.shiftNumber,
    cashierName: shift.cashierName,
    openedAt: shift.openedAt,
    closedAt: shift.closedAt,
    openingCash: shift.openingCash,
    // Shift OPEN belum punya expectedCash final; tampilkan hitungan berjalan dari ringkasan.
    expectedCash: shift.expectedCash ?? shift.summary.expectedCash,
    closingCashCounted: shift.closingCashCounted,
    cashDifference: shift.cashDifference,
    status: shift.status,
  }
}

async function load(page = 1, showSkeleton = true) {
  if (rangeInvalid.value) return
  const seq = (requestSeq += 1)
  if (showSkeleton) loading.value = true
  errorMessage.value = ''
  try {
    const res = await billingApi.getShifts({
      page,
      limit: limit.value,
      dateFrom: dateFrom.value || undefined,
      dateTo: dateTo.value || undefined,
      status: status.value || undefined,
      cashierUserId: cashierId.value || undefined,
    })
    if (seq !== requestSeq) return
    rows.value = res.items.map(toRow)
    total.value = res.pagination.total
    res.items.forEach((shift) => {
      if (!cashierNames.value[shift.cashierUserId]) {
        cashierNames.value[shift.cashierUserId] = shift.cashierName ?? 'Tanpa nama'
      }
    })
  } catch (error) {
    if (seq !== requestSeq) return
    rows.value = []
    total.value = 0
    errorMessage.value = apiErrorMessage(error, 'Gagal memuat shift.')
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

function onPage(e: { page: number; rows: number }) {
  const rowsChanged = e.rows !== limit.value
  limit.value = e.rows
  // Ganti jumlah baris: skeleton agar paginator ikut kembali ke halaman 1.
  if (rowsChanged) load(1, true)
  else load(e.page, false)
}

watch([dateFrom, dateTo, status, cashierId], () => load())
onMounted(() => load())

const columns: DataTableColumn[] = [
  { field: 'shiftNumber', header: 'Nomor Shift' },
  { field: 'cashierName', header: 'Kasir' },
  { field: 'openedAt', header: 'Dibuka' },
  { field: 'closedAt', header: 'Ditutup' },
  { field: 'openingCash', header: 'Kas Awal' },
  { field: 'expectedCash', header: 'Kas Seharusnya' },
  { field: 'closingCashCounted', header: 'Kas Dihitung' },
  { field: 'cashDifference', header: 'Selisih' },
  { field: 'status', header: 'Status' },
]

function money(value: number | null): string {
  return value === null ? '-' : formatCurrencyExact(value)
}

function openDetail(row: ShiftRow) {
  router.push({ name: 'cashier-shift-detail', params: { id: row.id } })
}
</script>

<template>
  <div class="shifts">
    <h1 class="shifts__title">Daftar Shift</h1>

    <BaseCard>
      <div class="shifts__filters">
        <BaseInput v-model="dateFrom" type="date" label="Dibuka dari tanggal" :error="rangeError" />
        <BaseInput v-model="dateTo" type="date" label="Dibuka sampai tanggal" />
        <BaseSelect
          v-model="cashierId"
          :options="cashierOptions"
          option-label="label"
          option-value="value"
          label="Kasir"
          filter
        />
        <BaseSelect
          v-model="status"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          label="Status"
        />
      </div>
    </BaseCard>

    <p v-if="errorMessage" class="alert alert--danger" role="alert">
      {{ errorMessage }}
      <BaseButton label="Coba lagi" variant="secondary" size="small" @click="load()" />
    </p>

    <BaseCard>
      <BaseDataTable
        :value="rows"
        :columns="columns"
        :loading="loading"
        lazy
        :rows="limit"
        :total-records="total"
        :show-search="false"
        :show-column-toggle="false"
        :show-export="false"
        empty-title="Belum ada shift"
        empty-description="Tidak ada shift yang dibuka pada filter yang dipilih."
        @page="onPage"
      >
        <template #cell-cashierName="{ data }">{{ (data as ShiftRow).cashierName ?? '-' }}</template>
        <template #cell-openedAt="{ data }">{{ formatDateTimeWib((data as ShiftRow).openedAt) }}</template>
        <template #cell-closedAt="{ data }">{{ formatDateTimeWib((data as ShiftRow).closedAt) }}</template>
        <template #cell-openingCash="{ data }">{{ money((data as ShiftRow).openingCash) }}</template>
        <template #cell-expectedCash="{ data }">{{ money((data as ShiftRow).expectedCash) }}</template>
        <template #cell-closingCashCounted="{ data }">{{ money((data as ShiftRow).closingCashCounted) }}</template>
        <template #cell-cashDifference="{ data }">
          <span :class="{ 'shifts__diff': (data as ShiftRow).cashDifference }">
            {{ formatCashDifference((data as ShiftRow).cashDifference) }}
          </span>
        </template>
        <template #cell-status="{ data }">
          <BaseTag
            :variant="SHIFT_STATUS_VARIANT[(data as ShiftRow).status]"
            :value="SHIFT_STATUS_LABEL[(data as ShiftRow).status]"
          />
        </template>
        <template #row-actions="{ data }">
          <BaseButton label="Detail" icon="pi pi-eye" variant="secondary" size="small" @click="openDetail(data as ShiftRow)" />
        </template>
      </BaseDataTable>
    </BaseCard>
  </div>
</template>

<style scoped>
.shifts {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.shifts__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.shifts__filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--space-4);
}

/* Selisih kas ≠ 0 ditandai agar supervisor langsung melihatnya. */
.shifts__diff {
  color: var(--color-danger);
  font-weight: var(--font-weight-heading);
}

.alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background-color: var(--bg);
  font-weight: var(--font-weight-heading);
}

.alert--danger {
  color: var(--color-danger);
  border-color: var(--color-danger);
}
</style>
