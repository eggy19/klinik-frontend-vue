<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSummaryCard from '@/components/base/BaseSummaryCard.vue'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { daysUntil, formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import { batchApi } from '../api/batch.api'
import ExpiryStatusTag from '../components/ExpiryStatusTag.vue'
import { computeExpiryStatus } from '../types/batch'
import type { InventoryBatch } from '../types/batch'

const route = useRoute()
const router = useRouter()
const toast = useToastFeedback()

const batch = ref<InventoryBatch | null>(null)
const loading = ref(false)

const batchId = computed(() => route.params.id as string)

/** Nilai stok batch ini (qty × harga satuan) — angka ringkas untuk stat row. */
const totalValue = computed(() => (batch.value ? batch.value.quantity * batch.value.unitCost : 0))

const expiryStat = computed(() => {
  if (!batch.value?.expiredDate) return { value: '-', variant: 'info' as const }
  const status = computeExpiryStatus(batch.value.expiredDate)
  const days = daysUntil(batch.value.expiredDate)
  const variant = status === 'EXPIRED' ? 'danger' : status === 'EXPIRING_SOON' ? 'warning' : 'success'
  const value = days < 0 ? 'Kadaluarsa' : `${days} hari lagi`
  return { value, variant: variant as 'danger' | 'warning' | 'success' }
})

function goBack() {
  router.push('/inventory/management/batch')
}

function goToGoodsReceipt() {
  if (batch.value?.goodsReceiptId) {
    router.push(`/inventory/purchasing/goods-receipts/${batch.value.goodsReceiptId}`)
  }
}

function goToPurchaseOrder() {
  if (batch.value?.purchaseOrderId) {
    router.push(`/inventory/purchasing/purchase-orders/${batch.value.purchaseOrderId}`)
  }
}

async function load() {
  loading.value = true
  try {
    batch.value = await batchApi.getById(batchId.value)
  } catch {
    toast.error('Gagal memuat data batch.')
    router.push('/inventory/management/batch')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="batch-detail kp-page">
    <div class="batch-detail__head">
      <BaseButton icon="pi pi-arrow-left" label="Kembali" variant="ghost" @click="goBack" />
      <h1 class="batch-detail__title kp-title">Detail Inventory Batch</h1>
    </div>

    <div v-if="loading || !batch" class="batch-detail__loading">Memuat data...</div>

    <template v-else>
      <BaseCard>
        <div class="batch-detail__header">
          <div>
            <div class="batch-detail__number kp-mono">
              {{ batch.batchNumber }}
              <ExpiryStatusTag :expired-date="batch.expiredDate" />
            </div>
            <div class="batch-detail__item">{{ batch.itemName }} ({{ batch.itemCode }})</div>
          </div>
        </div>
      </BaseCard>

      <div class="kp-stats">
        <BaseSummaryCard title="Quantity" :value="`${batch.quantity} ${batch.unitName}`" icon="pi pi-box" variant="info" />
        <BaseSummaryCard title="Harga Satuan" :value="formatCurrency(batch.unitCost)" icon="pi pi-tag" variant="primary" />
        <BaseSummaryCard title="Nilai Total" :value="formatCurrency(totalValue)" icon="pi pi-wallet" variant="success" />
        <BaseSummaryCard title="Kadaluarsa" :value="expiryStat.value" icon="pi pi-clock" :variant="expiryStat.variant" />
      </div>

      <BaseCard>
        <template #header>
          <span class="batch-detail__section-title">Detail Item &amp; Batch</span>
        </template>
        <dl class="batch-detail__meta">
          <div>
            <dt>Item</dt>
            <dd>{{ batch.itemName }}</dd>
          </div>
          <div>
            <dt>Kode Item</dt>
            <dd class="kp-mono">{{ batch.itemCode }}</dd>
          </div>
          <div>
            <dt>No. Batch</dt>
            <dd class="kp-mono">{{ batch.batchNumber }}</dd>
          </div>
          <div>
            <dt>Tanggal Kadaluarsa</dt>
            <dd>{{ formatDate(batch.expiredDate) }}</dd>
          </div>
        </dl>
      </BaseCard>

      <BaseCard>
        <template #header>
          <span class="batch-detail__section-title">Supplier &amp; Sumber Penerimaan</span>
        </template>
        <dl class="batch-detail__meta">
          <div>
            <dt>Supplier</dt>
            <dd>{{ batch.supplierName || '-' }}</dd>
          </div>
          <div>
            <dt>Goods Receipt</dt>
            <dd class="kp-mono">{{ batch.goodsReceiptNumber || '-' }}</dd>
          </div>
          <div>
            <dt>Tanggal Diterima</dt>
            <dd>{{ formatDateTime(batch.receivedDate) }}</dd>
          </div>
          <div>
            <dt>Purchase Order</dt>
            <dd class="kp-mono">{{ batch.poNumber || '-' }}</dd>
          </div>
        </dl>
        <div class="batch-detail__actions">
          <BaseButton
            v-if="batch.goodsReceiptId"
            :label="`Goods Receipt ${batch.goodsReceiptNumber}`"
            icon="pi pi-inbox"
            variant="secondary"
            @click="goToGoodsReceipt"
          />
          <BaseButton
            v-if="batch.purchaseOrderId"
            :label="`Purchase Order ${batch.poNumber}`"
            icon="pi pi-file"
            variant="secondary"
            @click="goToPurchaseOrder"
          />
        </div>
      </BaseCard>
    </template>
  </div>
</template>

<style scoped>
.batch-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.batch-detail__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.batch-detail__section-title {
  font-size: 15px;
  font-weight: var(--font-weight-strong);
  color: var(--text);
}

.batch-detail__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.batch-detail__number {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-xl);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.batch-detail__item {
  color: var(--text-muted);
}

.batch-detail__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-3);
  margin: 0;
}

.batch-detail__meta dt {
  font-size: var(--font-size-sm);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.batch-detail__meta dd {
  margin: 0;
  color: var(--text);
}

.batch-detail__actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-top: var(--space-4);
}

.batch-detail__loading {
  color: var(--text-muted);
  font-size: var(--font-sm);
}
</style>
