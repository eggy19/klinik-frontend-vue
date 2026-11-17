<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import BaseDataTable, { type DataTableColumn } from '@/components/base/BaseDataTable.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { apiErrorMessage, isNotFoundError } from '@/utils/api-error'
import { formatCurrencyExact, formatDateTimeWib } from '@/utils/format'
import { billingApi } from '../api/billing.api'
import ReceiptWidthPicker from '../components/ReceiptWidthPicker.vue'
import SaleReceipt from '../components/SaleReceipt.vue'
import { useReceiptWidth } from '../composables/useReceiptWidth'
import type { Sale } from '../types/billing'
import { SALE_STATUS_LABEL, SALE_STATUS_VARIANT, showsFailure } from '../utils/status'

// Detail Penjualan & Cetak Ulang (billing-mvp-spec §4.6, §4.8, BR-RC-01/02/08, AC-PS-10).
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { width: receiptWidth } = useReceiptWidth()

const sale = ref<Sale | null>(null)
const loading = ref(true)
const notFound = ref(false)
const errorMessage = ref('')
// Struk cetak ulang selalu bertanda SALINAN (BR-RC-08); waktu cetak diperbarui saat tombol ditekan.
const copyPrintedAt = ref<Date>(new Date())

const saleId = computed(() => String(route.params.id ?? ''))
// BR-RC-01: hanya PAID yang bisa dicetak. BR-RC-02: siapa pun yang boleh melihat detail boleh mencetak.
const canPrint = computed(() => sale.value?.status === 'PAID')

async function load() {
  loading.value = true
  notFound.value = false
  errorMessage.value = ''
  sale.value = null
  try {
    sale.value = await billingApi.getSale(saleId.value)
    copyPrintedAt.value = new Date()
  } catch (error) {
    // 404 BIL_005: tidak ada atau di luar scope user (AC-RW-01).
    if (isNotFoundError(error)) notFound.value = true
    else errorMessage.value = apiErrorMessage(error, 'Gagal memuat penjualan.')
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(saleId, load)

async function onPrint() {
  copyPrintedAt.value = new Date()
  await nextTick()
  window.print()
}

function back() {
  router.push({ name: 'cashier-sales' })
}

const itemColumns: DataTableColumn[] = [
  { field: 'itemName', header: 'Item' },
  { field: 'quantityText', header: 'Jumlah' },
  { field: 'unitPrice', header: 'Harga' },
  { field: 'lineTotal', header: 'Total' },
]

const itemRows = computed(() =>
  (sale.value?.items ?? []).map((item) => ({
    id: String(item.lineNo),
    itemName: item.itemName,
    quantityText: `${item.quantity.toLocaleString('id-ID', { maximumFractionDigits: 4 })} ${item.unitName}`,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  })),
)
</script>

<template>
  <div class="detail">
    <div class="detail__head">
      <BaseButton label="Kembali" icon="pi pi-arrow-left" variant="secondary" @click="back" />
      <h1 class="detail__title">Detail Penjualan</h1>
    </div>

    <p v-if="loading" class="detail__hint">Memuat penjualan...</p>

    <BaseCard v-else-if="notFound">
      <BaseEmptyState
        icon="pi pi-search"
        title="Penjualan tidak ditemukan"
        description="Penjualan tidak ditemukan."
      >
        <template #action>
          <BaseButton label="Ke Riwayat Penjualan" variant="secondary" @click="back" />
        </template>
      </BaseEmptyState>
    </BaseCard>

    <BaseCard v-else-if="errorMessage">
      <BaseEmptyState icon="pi pi-exclamation-circle" title="Penjualan tidak dapat dimuat" :description="errorMessage">
        <template #action>
          <BaseButton label="Coba lagi" variant="secondary" @click="load" />
        </template>
      </BaseEmptyState>
    </BaseCard>

    <template v-else-if="sale">
      <!-- AC-RW-03: FAILED / NEEDS_RECONCILIATION menampilkan status + failureMessage, tanpa tombol cetak. -->
      <p v-if="showsFailure(sale.status)" class="alert alert--danger" role="alert">
        {{ sale.failureMessage ?? 'Transaksi perlu diperiksa supervisor.' }}
      </p>
      <p v-else-if="sale.status === 'PENDING'" class="alert alert--warn" role="status">
        Status transaksi belum pasti. Struk hanya dapat dicetak untuk transaksi berhasil.
      </p>

      <BaseCard>
        <template #header>
          <div class="detail__card-head">
            <h3 class="detail__card-title">{{ sale.saleNumber ?? 'Penjualan tanpa nomor' }}</h3>
            <BaseTag :variant="SALE_STATUS_VARIANT[sale.status]" :value="SALE_STATUS_LABEL[sale.status]" />
          </div>
        </template>
        <dl class="detail__rows">
          <div><dt>Dibuat</dt><dd>{{ formatDateTimeWib(sale.createdAt) }}</dd></div>
          <div><dt>Dibayar</dt><dd>{{ formatDateTimeWib(sale.paidAt) }}</dd></div>
          <div><dt>Kasir</dt><dd>{{ sale.cashierName ?? '-' }}</dd></div>
          <div><dt>Pelanggan</dt><dd>{{ sale.customerName ?? '-' }}</dd></div>
          <div><dt>Shift</dt><dd>{{ sale.shiftNumber ?? '-' }}</dd></div>
          <div><dt>Cabang</dt><dd>{{ auth.context?.branchName ?? '-' }}</dd></div>
        </dl>
        <template v-if="canPrint" #footer>
          <div class="detail__print">
            <ReceiptWidthPicker />
            <BaseButton label="Cetak Ulang" icon="pi pi-print" @click="onPrint" />
          </div>
        </template>
      </BaseCard>

      <!-- AC-RW-03 (TM-H5-04): item hanya disimpan untuk PAID, jadi FAILED/NEEDS_RECONCILIATION tanpa tabel item. -->
      <BaseCard v-if="showsFailure(sale.status)" title="Item">
        <p class="detail__failure">
          {{
            sale.status === 'FAILED'
              ? 'Transaksi gagal, tidak ada barang yang keluar'
              : 'Barang mungkin sudah keluar, periksa dispensing Inventory dengan referensi sale ini'
          }}
        </p>
        <dl v-if="sale.status === 'NEEDS_RECONCILIATION'" class="detail__rows detail__ref">
          <div v-if="sale.saleNumber"><dt>Nomor sale</dt><dd>{{ sale.saleNumber }}</dd></div>
          <div><dt>ID sale</dt><dd class="detail__id">{{ sale.id }}</dd></div>
        </dl>
      </BaseCard>

      <BaseCard v-else title="Item">
        <BaseDataTable
          :value="itemRows"
          :columns="itemColumns"
          :paginator="false"
          :show-search="false"
          :show-column-toggle="false"
          :show-export="false"
          :rows="Math.max(itemRows.length, 1)"
          empty-title="Tidak ada item"
        >
          <template #cell-unitPrice="{ value }">{{ formatCurrencyExact(value as number) }}</template>
          <template #cell-lineTotal="{ value }">{{ formatCurrencyExact(value as number) }}</template>
        </BaseDataTable>
      </BaseCard>

      <BaseCard title="Pembayaran">
        <dl v-if="showsFailure(sale.status)" class="detail__rows">
          <div class="detail__row--big"><dt>Nilai yang dicoba</dt><dd>{{ formatCurrencyExact(sale.subtotal) }}</dd></div>
        </dl>
        <dl v-else class="detail__rows">
          <div v-if="sale.taxRate > 0 || sale.subtotal !== sale.grandTotal">
            <dt>Subtotal</dt><dd>{{ formatCurrencyExact(sale.subtotal) }}</dd>
          </div>
          <div v-if="sale.taxRate > 0">
            <dt>Termasuk PPN {{ sale.taxRate }}%</dt><dd>{{ formatCurrencyExact(sale.taxTotal) }}</dd>
          </div>
          <div class="detail__row--big"><dt>Total</dt><dd>{{ formatCurrencyExact(sale.grandTotal) }}</dd></div>
          <template v-for="(payment, i) in sale.payments" :key="i">
            <div><dt>{{ payment.methodName }}</dt><dd>{{ formatCurrencyExact(payment.tenderedAmount) }}</dd></div>
            <div><dt>Kembalian</dt><dd>{{ formatCurrencyExact(payment.changeAmount) }}</dd></div>
          </template>
          <div v-if="sale.payments.length === 0"><dt>Pembayaran</dt><dd>-</dd></div>
        </dl>
      </BaseCard>

      <SaleReceipt
        :sale="sale"
        :branch-name="auth.context?.branchName ?? ''"
        :width="receiptWidth"
        :copy-printed-at="copyPrintedAt"
      />
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
}

.detail__row--big dd {
  font-size: var(--font-xl);
}

.detail__failure {
  margin: 0;
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.detail__ref {
  margin-top: var(--space-4);
}

/* ID sale mudah diblok/disalin sebagai teks biasa. */
.detail__id {
  font-family: monospace;
  word-break: break-all;
  user-select: all;
}

.detail__print {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: flex-end;
  gap: var(--space-4);
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

.alert--danger {
  color: var(--color-danger);
  border-color: var(--color-danger);
}
</style>
