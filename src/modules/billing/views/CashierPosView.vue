<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { apiErrorMessage } from '@/utils/api-error'
import { formatDate } from '@/utils/format'
import { billingApi } from '../api/billing.api'
import { posApi } from '../api/pos.api'
import PosItemSearch from '../components/PosItemSearch.vue'
import PosCart from '../components/PosCart.vue'
import CashPaymentDialog from '../components/CashPaymentDialog.vue'
import { MAX_CART_LINES, parseQty, usePosCart } from '../composables/usePosCart'
import { usePosCheckout, type RejectedCheckout } from '../composables/usePosCheckout'
import type { CreateSalePayload, PaymentMethod, PosItem, PosUnit, Shift } from '../types/billing'

// Layar POS (billing-mvp-spec §4.9, BR-PS-01..11).
const auth = useAuthStore()
const router = useRouter()
const toast = useToastFeedback()

const cart = usePosCart()
const checkout = usePosCheckout()

const shift = ref<Shift | null>(null)
const shiftLoading = ref(true)
const shiftError = ref('')
const cashMethod = ref<PaymentMethod | null>(null)
const searchRef = ref<InstanceType<typeof PosItemSearch> | null>(null)

const paymentOpen = ref(false)
const dialogError = ref('')
const supervisorNotice = ref('')

const dialogVisible = computed(() => paymentOpen.value || checkout.phase.value !== 'idle')
// Keranjang & pencarian terkunci saat mengirim / belum pasti (BR-PS-09).
const locked = computed(() => checkout.phase.value === 'sending' || checkout.phase.value === 'uncertain')
const canOpenShift = computed(() => auth.can('billing.shift.open'))

async function loadShift() {
  shiftLoading.value = true
  shiftError.value = ''
  try {
    shift.value = await billingApi.getCurrentShift()
  } catch (error) {
    shift.value = null
    shiftError.value = apiErrorMessage(error, 'Gagal memuat shift.')
  } finally {
    shiftLoading.value = false
  }
}

async function loadPaymentMethods() {
  try {
    const methods = await billingApi.listPaymentMethods()
    cashMethod.value = methods.find((m) => m.isCash) ?? null
  } catch {
    cashMethod.value = null
  }
}

onMounted(() => {
  const userId = auth.user?.id
  const branchId = auth.context?.branchId
  // BR-PS-10: transaksi yang belum pasti dipulihkan setelah reload / login ulang.
  if (userId && branchId) checkout.restore(userId, branchId)
  loadShift()
  loadPaymentMethods()
})

onBeforeUnmount(() => checkout.dispose())

function onAdd(item: PosItem, unit: PosUnit) {
  const result = cart.add(item, unit)
  if (result === 'at-max') toast.warning(`Jumlah sudah mencapai stok tersedia (${unit.availableQuantity}).`)
  else if (result === 'cart-full') toast.warning(`Keranjang maksimal ${MAX_CART_LINES} baris.`)
}

function confirmPrices() {
  cart.lines.value.forEach((line) => (line.priceChange = null))
}

function openPayment() {
  dialogError.value = ''
  paymentOpen.value = true
}

function buildPayload(tendered: number): CreateSalePayload {
  return {
    customer_name: null,
    items: cart.lines.value.map((line) => ({
      item_id: line.itemId,
      unit_id: line.unitId,
      quantity: parseQty(line) ?? 0,
      expected_unit_price: line.unitPrice,
    })),
    payments: [{ method_code: cashMethod.value?.code ?? 'CASH', tendered_amount: tendered }],
  }
}

async function onSubmit(tendered: number) {
  if (!cart.canPay.value || !cashMethod.value || checkout.phase.value !== 'idle') return
  const userId = auth.user?.id
  const branchId = auth.context?.branchId
  if (!userId || !branchId) return

  dialogError.value = ''
  const snapshot = {
    lines: cart.lines.value.map((l) => ({
      itemName: l.itemName,
      unitName: l.unitName,
      quantity: parseQty(l) ?? 0,
      unitPrice: l.unitPrice,
    })),
    total: cart.total.value,
    tendered,
  }
  await settle(checkout.submit(buildPayload(tendered), snapshot, userId, branchId))
}

async function onRetry() {
  await settle(checkout.retry())
}

/** Menerapkan jawaban pasti dari Billing ke keranjang / UI (BR-PS-08). */
async function settle(outcome: Promise<RejectedCheckout | null>) {
  const rejected = await outcome
  if (!rejected) return
  const indexes = Object.keys(rejected.lineErrors).map(Number)
  for (const index of indexes) {
    const line = cart.lines.value[index]
    if (line) line.serverError = rejected.lineErrors[index]
  }

  switch (rejected.action) {
    case 'open-shift':
      paymentOpen.value = false
      shift.value = null
      toast.warning(rejected.message)
      break
    case 'reload-prices':
      paymentOpen.value = false
      toast.warning(rejected.message)
      await reloadPrices(indexes)
      break
    case 'supervisor':
      paymentOpen.value = false
      supervisorNotice.value = rejected.message
      toast.error(rejected.message)
      cart.clear()
      break
    default:
      if (indexes.length > 0) {
        paymentOpen.value = false
        toast.error(rejected.message)
      } else {
        // BIL_006/007/009, 400, 403: pesan di dialog bayar; keranjang tetap.
        dialogError.value = rejected.message
      }
  }
}

/** Muat ulang harga dari POS lookup untuk baris yang harganya berubah (BIL_012). */
async function reloadPrices(indexes: number[]) {
  const targets = indexes.length > 0 ? indexes : cart.lines.value.map((_, i) => i)
  for (const index of targets) {
    const line = cart.lines.value[index]
    if (!line) continue
    try {
      const items = await posApi.searchItems(line.itemCode, 20)
      const unit = items
        .find((item) => item.itemId === line.itemId)
        ?.units.find((u) => u.unitId === line.unitId)
      if (!unit || !unit.sellable || unit.unitPrice === null) {
        line.serverError = 'Item tidak lagi dapat dijual. Hapus dari keranjang.'
        continue
      }
      line.available = unit.availableQuantity
      line.serverError = null
      if (unit.unitPrice !== line.unitPrice) {
        line.priceChange = { oldPrice: line.unitPrice }
        line.unitPrice = unit.unitPrice
      }
    } catch {
      line.serverError = 'Gagal memuat ulang harga. Hapus lalu tambahkan kembali item ini.'
    }
  }
}

function onAbandon() {
  checkout.abandon()
  cart.clear()
  paymentOpen.value = false
  toast.warning('Transaksi ditinggalkan. Supervisor akan memeriksanya saat tutup shift.')
}

function onDone() {
  checkout.reset()
  cart.clear()
  paymentOpen.value = false
  searchRef.value?.refresh()
}
</script>

<template>
  <div class="pos">
    <h1 class="pos__title">Layar POS</h1>

    <p v-if="shiftLoading" class="pos__hint">Memuat shift...</p>

    <BaseCard v-else-if="shiftError">
      <BaseEmptyState icon="pi pi-exclamation-circle" title="Shift tidak dapat dimuat" :description="shiftError">
        <template #action>
          <BaseButton label="Coba lagi" variant="secondary" @click="loadShift" />
        </template>
      </BaseEmptyState>
    </BaseCard>

    <!-- BR-PS-11: tanpa shift OPEN, POS diblok dan diarahkan ke Buka Shift. -->
    <BaseCard v-else-if="!shift">
      <BaseEmptyState
        icon="pi pi-clock"
        title="Belum ada shift terbuka"
        description="Buka shift terlebih dahulu sebelum berjualan."
      >
        <template v-if="canOpenShift" #action>
          <BaseButton label="Buka Shift" icon="pi pi-play" @click="router.push('/cashier/shift')" />
        </template>
      </BaseEmptyState>
    </BaseCard>

    <template v-else>
      <div class="pos__header">
        <span>{{ auth.context?.branchName }}</span>
        <span>Shift {{ shift.shiftNumber }}</span>
        <BaseTag v-if="shift.openedBeforeToday" variant="warning" value="Lintas hari" />
        <span>Kasir: {{ shift.cashierName ?? auth.user?.name ?? '-' }}</span>
      </div>

      <p v-if="shift.openedBeforeToday" class="alert alert--warn">
        Shift dibuka {{ formatDate(shift.openedAt) }}, segera tutup.
      </p>

      <p v-if="supervisorNotice" class="alert alert--danger" role="alert">
        {{ supervisorNotice }}
        <BaseButton label="Tutup" variant="ghost" size="small" @click="supervisorNotice = ''" />
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BaseCard title="Cari Obat">
          <PosItemSearch ref="searchRef" :disabled="locked" @add="onAdd" />
        </BaseCard>

        <BaseCard title="Keranjang">
          <PosCart
            :lines="cart.lines.value"
            :total="cart.total.value"
            :locked="locked"
            :can-pay="cart.canPay.value && !!cashMethod"
            :has-price-change="cart.hasPriceChange.value"
            @step="cart.step"
            @qty="cart.setQtyText"
            @remove="cart.remove"
            @pay="openPayment"
            @confirm-prices="confirmPrices"
          />
        </BaseCard>
      </div>
    </template>

    <CashPaymentDialog
      :visible="dialogVisible"
      :phase="checkout.phase.value"
      :uncertain-reason="checkout.uncertainReason.value"
      :total="cart.total.value"
      :pending="checkout.pending.value"
      :sale="checkout.sale.value"
      :error-message="dialogError"
      @close="paymentOpen = false"
      @submit="onSubmit"
      @retry="onRetry"
      @abandon="onAbandon"
      @done="onDone"
    />
  </div>
</template>

<style scoped>
.pos {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.pos__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.pos__hint {
  color: var(--text-muted);
}

.pos__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
  font-size: var(--font-sm);
  color: var(--text-muted);
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

.alert--warn {
  color: var(--color-warning);
  border-color: var(--color-warning);
}

.alert--danger {
  color: var(--color-danger);
  border-color: var(--color-danger);
}
</style>
