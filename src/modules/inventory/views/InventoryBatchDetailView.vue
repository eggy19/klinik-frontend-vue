<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import { batchApi } from '../api/batch.api'
import ExpiryStatusTag from '../components/ExpiryStatusTag.vue'
import type { InventoryBatch } from '../types/batch'

const route = useRoute()
const router = useRouter()
const toast = useToastFeedback()

const batch = ref<InventoryBatch | null>(null)
const loading = ref(false)

const batchId = computed(() => route.params.id as string)

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
  <div class="batch-detail">
    <div class="batch-detail__head">
      <BaseButton icon="pi pi-arrow-left" label="Kembali" variant="ghost" @click="goBack" />
      <h1 class="batch-detail__title">Detail Inventory Batch</h1>
    </div>

    <div v-if="loading || !batch" class="batch-detail__loading">Memuat data...</div>

    <template v-else>
      <BaseCard>
        <div class="batch-detail__header">
          <div>
            <div class="batch-detail__number">
              {{ batch.batchNumber }}
              <ExpiryStatusTag :expired-date="batch.expiredDate" />
            </div>
            <div class="batch-detail__item">{{ batch.itemName }} ({{ batch.itemCode }})</div>
          </div>
        </div>
      </BaseCard>

      <BaseCard>
        <template #header>
          <span class="batch-detail__section-title">Informasi Item</span>
        </template>
        <dl class="batch-detail__meta">
          <div>
            <dt>Item</dt>
            <dd>{{ batch.itemName }}</dd>
          </div>
          <div>
            <dt>Kode Item</dt>
            <dd>{{ batch.itemCode }}</dd>
          </div>
        </dl>
      </BaseCard>

      <BaseCard>
        <template #header>
          <span class="batch-detail__section-title">Informasi Batch</span>
        </template>
        <dl class="batch-detail__meta">
          <div>
            <dt>No. Batch</dt>
            <dd>{{ batch.batchNumber }}</dd>
          </div>
          <div>
            <dt>Tanggal Kadaluarsa</dt>
            <dd>{{ formatDate(batch.expiredDate) }}</dd>
          </div>
          <div>
            <dt>Status Kadaluarsa</dt>
            <dd><ExpiryStatusTag :expired-date="batch.expiredDate" /></dd>
          </div>
        </dl>
      </BaseCard>

      <BaseCard>
        <template #header>
          <span class="batch-detail__section-title">Informasi Quantity</span>
        </template>
        <dl class="batch-detail__meta">
          <div>
            <dt>Quantity</dt>
            <dd>{{ batch.quantity }} {{ batch.unitName }}</dd>
          </div>
          <div>
            <dt>Satuan</dt>
            <dd>{{ batch.unitName }}</dd>
          </div>
          <div>
            <dt>Harga Satuan</dt>
            <dd>{{ formatCurrency(batch.unitCost) }}</dd>
          </div>
        </dl>
      </BaseCard>

      <BaseCard>
        <template #header>
          <span class="batch-detail__section-title">Informasi Supplier</span>
        </template>
        <dl class="batch-detail__meta">
          <div>
            <dt>Supplier</dt>
            <dd>{{ batch.supplierName || '-' }}</dd>
          </div>
        </dl>
      </BaseCard>

      <BaseCard>
        <template #header>
          <span class="batch-detail__section-title">Sumber Penerimaan (Traceability)</span>
        </template>
        <dl class="batch-detail__meta">
          <div>
            <dt>Goods Receipt</dt>
            <dd>{{ batch.goodsReceiptNumber || '-' }}</dd>
          </div>
          <div>
            <dt>Tanggal Diterima</dt>
            <dd>{{ formatDateTime(batch.receivedDate) }}</dd>
          </div>
          <div>
            <dt>Purchase Order</dt>
            <dd>{{ batch.poNumber || '-' }}</dd>
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

.batch-detail__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.batch-detail__section-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-heading);
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
  font-size: var(--font-xs);
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
