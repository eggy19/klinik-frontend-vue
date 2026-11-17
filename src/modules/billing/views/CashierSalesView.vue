<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { apiErrorMessage } from '@/utils/api-error'
import { formatCurrencyExact, formatDateTimeWib, todayWib } from '@/utils/format'
import { billingApi } from '../api/billing.api'
import type { SaleSummary } from '../types/billing'
import {
  SALE_FILTER_STATUSES,
  SALE_STATUS_LABEL,
  SALE_STATUS_VARIANT,
  showsFailure,
} from '../utils/status'

// Riwayat Penjualan (billing-mvp-spec §4.6, BR-MN-05, AC-RW-01..03): satu view, dua scope.
const auth = useAuthStore()
const router = useRouter()

// BR-MN-04: pakai permission, bukan roles.
const canReadAll = computed(() => auth.can('billing.sale.read_all'))
const canReadAllShifts = computed(() => auth.can('billing.shift.read_all'))
const title = computed(() => (canReadAll.value ? 'Riwayat Penjualan' : 'Penjualan Saya'))

const today = todayWib()
const dateFrom = ref(today)
const dateTo = ref(today)
const status = ref('')
const cashierId = ref('')
const search = ref('')

const items = ref<SaleSummary[]>([])
const total = ref(0)
const limit = ref(20)
// `loading` mengganti tabel dengan skeleton (membuat ulang paginator -> kembali ke halaman 1),
// jadi hanya dipakai untuk muat awal / ganti filter. Ganti halaman memuat tanpa skeleton.
const loading = ref(true)
const errorMessage = ref('')
let requestSeq = 0

const rangeInvalid = computed(() => !!dateFrom.value && !!dateTo.value && dateFrom.value > dateTo.value)
const rangeError = computed(() => (rangeInvalid.value ? 'Tanggal awal melewati tanggal akhir' : undefined))

const statusOptions = [
  { value: '', label: 'Semua status' },
  ...SALE_FILTER_STATUSES.map((value) => ({ value, label: SALE_STATUS_LABEL[value] })),
]

// Tidak ada endpoint daftar kasir di Billing: opsi dikumpulkan dari daftar shift (bila boleh)
// dan dari penjualan yang sudah dimuat.
const cashierNames = ref<Record<string, string>>({})
const cashierOptions = computed(() => [
  { value: '', label: 'Semua kasir' },
  ...Object.entries(cashierNames.value)
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'id')),
])

function rememberCashier(id: string | null, name: string | null) {
  if (id && !cashierNames.value[id]) cashierNames.value[id] = name ?? 'Tanpa nama'
}

async function loadCashierOptions() {
  if (!canReadAll.value || !canReadAllShifts.value || rangeInvalid.value) return
  try {
    const res = await billingApi.getShifts({ dateFrom: dateFrom.value, dateTo: dateTo.value, limit: 100 })
    res.items.forEach((shift) => rememberCashier(shift.cashierUserId, shift.cashierName))
  } catch {
    // opsi kasir hanya pelengkap; daftar penjualan tetap dimuat
  }
}

async function load(page = 1, showSkeleton = true) {
  if (rangeInvalid.value) return
  const seq = (requestSeq += 1)
  if (showSkeleton) loading.value = true
  errorMessage.value = ''
  try {
    const res = await billingApi.getSales({
      page,
      limit: limit.value,
      dateFrom: dateFrom.value || undefined,
      dateTo: dateTo.value || undefined,
      status: status.value || undefined,
      q: search.value || undefined,
      // BR-MN-05: tanpa read_all, cashier_user_id tidak pernah dikirim.
      cashierUserId: canReadAll.value ? cashierId.value || undefined : undefined,
    })
    if (seq !== requestSeq) return
    items.value = res.items
    total.value = res.pagination.total
    res.items.forEach((sale) => rememberCashier(sale.cashierUserId, sale.cashierName))
  } catch (error) {
    if (seq !== requestSeq) return
    items.value = []
    total.value = 0
    errorMessage.value = apiErrorMessage(error, 'Gagal memuat penjualan.')
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

function onSearch(term: string) {
  search.value = term
  load()
}

watch([dateFrom, dateTo], () => {
  loadCashierOptions()
})
watch([dateFrom, dateTo, status, cashierId], () => load())

onMounted(() => {
  loadCashierOptions()
  load()
})

const columns: DataTableColumn[] = [
  { field: 'saleNumber', header: 'Nomor' },
  { field: 'createdAt', header: 'Waktu' },
  { field: 'cashierName', header: 'Kasir' },
  { field: 'grandTotal', header: 'Total' },
  { field: 'status', header: 'Status' },
]

function openDetail(sale: SaleSummary) {
  router.push({ name: 'cashier-sale-detail', params: { id: sale.id } })
}
</script>

<template>
  <div class="sales">
    <h1 class="sales__title">{{ title }}</h1>

    <BaseCard>
      <div class="sales__filters">
        <BaseInput v-model="dateFrom" type="date" label="Dari tanggal" :error="rangeError" />
        <BaseInput v-model="dateTo" type="date" label="Sampai tanggal" />
        <BaseSelect
          v-model="status"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          label="Status"
        />
        <!-- BR-MN-05 / BR-MN-04: filter Kasir hanya untuk billing.sale.read_all. -->
        <BaseSelect
          v-if="canReadAll"
          v-model="cashierId"
          :options="cashierOptions"
          option-label="label"
          option-value="value"
          label="Kasir"
          filter
        />
      </div>
    </BaseCard>

    <p v-if="errorMessage" class="alert alert--danger" role="alert">
      {{ errorMessage }}
      <BaseButton label="Coba lagi" variant="secondary" size="small" @click="load()" />
    </p>

    <BaseCard>
      <BaseDataTable
        :value="items"
        :columns="columns"
        :loading="loading"
        lazy
        :rows="limit"
        :total-records="total"
        :show-column-toggle="false"
        :show-export="false"
        search-placeholder="Cari nomor penjualan..."
        empty-title="Belum ada penjualan"
        empty-description="Tidak ada penjualan pada filter yang dipilih."
        @page="onPage"
        @search="onSearch"
      >
        <template #cell-saleNumber="{ data }">
          <!-- Nomor baru dibuat saat PAID (BR-SL-*); sale FAILED/PENDING belum punya nomor. -->
          <span>{{ (data as SaleSummary).saleNumber ?? '-' }}</span>
        </template>
        <template #cell-createdAt="{ data }">
          {{ formatDateTimeWib((data as SaleSummary).createdAt) }}
        </template>
        <template #cell-cashierName="{ data }">
          {{ (data as SaleSummary).cashierName ?? '-' }}
        </template>
        <template #cell-grandTotal="{ data }">
          {{ formatCurrencyExact((data as SaleSummary).grandTotal) }}
        </template>
        <template #cell-status="{ data }">
          <div class="sales__status">
            <BaseTag
              :variant="SALE_STATUS_VARIANT[(data as SaleSummary).status]"
              :value="SALE_STATUS_LABEL[(data as SaleSummary).status]"
            />
            <small v-if="showsFailure((data as SaleSummary).status)" class="sales__failure">
              {{ (data as SaleSummary).failureMessage ?? 'Transaksi perlu diperiksa supervisor.' }}
            </small>
          </div>
        </template>
        <template #row-actions="{ data }">
          <BaseButton label="Detail" icon="pi pi-eye" variant="secondary" size="small" @click="openDetail(data as SaleSummary)" />
        </template>
      </BaseDataTable>
    </BaseCard>
  </div>
</template>

<style scoped>
.sales {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.sales__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.sales__filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--space-4);
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

.sales__status {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
}

.sales__failure {
  font-size: var(--font-xs);
  color: var(--color-danger);
}
</style>
