<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import { goodsReceiptApi } from '../api/goods-receipt.api'
import type { GoodsReceipt } from '../types/goods-receipt'

const route = useRoute()
const router = useRouter()
const toast = useToastFeedback()

const receipt = ref<GoodsReceipt | null>(null)
const loading = ref(false)

function goBack() {
  router.push('/inventory/goods-receipts')
}

function goToPo() {
  if (receipt.value) router.push(`/inventory/purchase-orders/${receipt.value.purchaseOrderId}`)
}

onMounted(async () => {
  loading.value = true
  try {
    receipt.value = await goodsReceiptApi.getById(route.params.id as string)
  } catch {
    toast.error('Gagal memuat data penerimaan barang.')
    router.push('/inventory/goods-receipts')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="gr-detail">
    <div class="gr-detail__head">
      <BaseButton icon="pi pi-arrow-left" label="Kembali" variant="ghost" @click="goBack" />
      <h1 class="gr-detail__title">Detail Penerimaan Barang</h1>
    </div>

    <div v-if="loading || !receipt" class="gr-detail__loading">Memuat data...</div>

    <template v-else>
      <BaseCard>
        <div class="gr-detail__header">
          <div>
            <div class="gr-detail__number">{{ receipt.receiptNumber }}</div>
            <div class="gr-detail__supplier">{{ receipt.supplierName }}</div>
          </div>
          <BaseButton :label="`PO ${receipt.poNumber}`" icon="pi pi-file" variant="secondary" @click="goToPo" />
        </div>
        <dl class="gr-detail__meta">
          <div>
            <dt>Tanggal Diterima</dt>
            <dd>{{ formatDateTime(receipt.receivedAt) }}</dd>
          </div>
          <div v-if="receipt.note">
            <dt>Catatan</dt>
            <dd>{{ receipt.note }}</dd>
          </div>
        </dl>
      </BaseCard>

      <BaseCard>
        <template #header>
          <span class="gr-detail__section-title">Item Diterima</span>
        </template>
        <table class="gr-detail__table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Satuan</th>
              <th class="gr-detail__col-num">Qty</th>
              <th class="gr-detail__col-num">Harga</th>
              <th>No. Batch</th>
              <th>Kadaluarsa</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in receipt.items" :key="item.id">
              <td>{{ item.itemName }}</td>
              <td>{{ item.unitName }}</td>
              <td class="gr-detail__col-num">{{ item.quantity }}</td>
              <td class="gr-detail__col-num">{{ formatCurrency(item.unitCost) }}</td>
              <td>{{ item.batchNumber }}</td>
              <td>{{ formatDate(item.expiredDate) }}</td>
            </tr>
          </tbody>
        </table>
      </BaseCard>
    </template>
  </div>
</template>

<style scoped>
.gr-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.gr-detail__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.gr-detail__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.gr-detail__section-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.gr-detail__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
}

.gr-detail__number {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.gr-detail__supplier {
  color: var(--text-muted);
}

.gr-detail__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-3);
  margin: 0;
}

.gr-detail__meta dt {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.gr-detail__meta dd {
  margin: 0;
  color: var(--text);
}

.gr-detail__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-sm);
}

.gr-detail__table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-weight: var(--font-weight-heading);
  color: var(--text-muted);
  border-bottom: 1px solid var(--surface-border);
}

.gr-detail__table td {
  padding: var(--space-2) var(--space-3);
}

.gr-detail__col-num {
  text-align: right;
}

.gr-detail__loading {
  color: var(--text-muted);
  font-size: var(--font-sm);
}
</style>
