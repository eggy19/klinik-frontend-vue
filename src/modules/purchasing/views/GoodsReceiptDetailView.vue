<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import { goodsReceiptApi } from '../api/goods-receipt.api'
import GoodsReceiptStatusTag from '../components/GoodsReceiptStatusTag.vue'
import GoodsReceiptTotals from '../components/goods-receipt/GoodsReceiptTotals.vue'
import type { GoodsReceipt } from '../types/goods-receipt'

const route = useRoute()
const router = useRouter()
const toast = useToastFeedback()
const confirm = useConfirm()

const receipt = ref<GoodsReceipt | null>(null)
const loading = ref(false)
const verifying = ref(false)
const deleting = ref(false)

const grId = computed(() => route.params.id as string)
const canVerify = computed(() => receipt.value?.status === 'DRAFT')
const canDelete = computed(() => receipt.value?.status === 'DRAFT')

/** goods_receipt.discountAmount hanya terisi untuk global discount — kalau yang
 *  dipakai item discount, receipt-level discount tetap NULL per spec §9, jadi
 *  totalnya diturunkan dari sum item di sini. */
const itemDiscountTotal = computed(() => {
  if (!receipt.value) return null
  const sum = receipt.value.items.reduce((s, it) => s + (it.discountAmount ?? 0), 0)
  return sum > 0 ? sum : null
})
const discountAmount = computed(() => receipt.value?.discountAmount ?? itemDiscountTotal.value)
const discountLabel = computed(() => {
  if (!receipt.value) return undefined
  if (receipt.value.discountType) {
    return receipt.value.discountType === 'PERCENTAGE'
      ? `Diskon Global (${receipt.value.discountValue}%)`
      : 'Diskon Global'
  }
  return itemDiscountTotal.value != null ? 'Diskon Per Item' : undefined
})

function goBack() {
  router.push('/inventory/purchasing/goods-receipts')
}

function goToPo() {
  if (receipt.value)
    router.push(`/inventory/purchasing/purchase-orders/${receipt.value.purchaseOrderId}`)
}

async function load() {
  loading.value = true
  try {
    receipt.value = await goodsReceiptApi.getById(grId.value)
  } catch {
    toast.error('Gagal memuat data penerimaan barang.')
    router.push('/inventory/purchasing/goods-receipts')
  } finally {
    loading.value = false
  }
}

function confirmVerify() {
  confirm.require({
    header: 'Verifikasi Penerimaan Barang',
    message: `Verifikasi ${receipt.value?.receiptNumber}? Stok akan langsung masuk ke inventory dan tindakan ini tidak dapat dibatalkan.`,
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Tutup',
    acceptLabel: 'Verifikasi & Posting',
    accept: async () => {
      verifying.value = true
      try {
        await goodsReceiptApi.verify(grId.value)
        toast.success('Penerimaan barang berhasil diverifikasi dan stok telah masuk.')
        await load()
      } catch {
        toast.error()
      } finally {
        verifying.value = false
      }
    },
  })
}

function confirmDelete() {
  confirm.require({
    header: 'Hapus Draft Penerimaan',
    message: `Hapus draft ${receipt.value?.receiptNumber}? Data yang sudah diisi akan hilang.`,
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Tutup',
    acceptLabel: 'Hapus Draft',
    acceptProps: { severity: 'danger' },
    accept: async () => {
      deleting.value = true
      try {
        await goodsReceiptApi.deleteDraft(grId.value)
        toast.success('Draft penerimaan berhasil dihapus.')
        if (receipt.value) router.push(`/inventory/purchasing/purchase-orders/${receipt.value.purchaseOrderId}`)
      } catch {
        toast.error()
      } finally {
        deleting.value = false
      }
    },
  })
}

onMounted(load)
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
            <div class="gr-detail__number">
              {{ receipt.receiptNumber }}
              <GoodsReceiptStatusTag :status="receipt.status" />
            </div>
            <div class="gr-detail__supplier">{{ receipt.supplierName }}</div>
          </div>
          <BaseButton :label="`PO ${receipt.poNumber}`" icon="pi pi-file" variant="secondary" @click="goToPo" />
        </div>
        <dl class="gr-detail__meta">
          <div>
            <dt>Tanggal Diterima</dt>
            <dd>{{ formatDateTime(receipt.receivedAt) }}</dd>
          </div>
          <div v-if="receipt.verifiedAt">
            <dt>Tanggal Diverifikasi</dt>
            <dd>{{ formatDateTime(receipt.verifiedAt) }}</dd>
          </div>
          <div v-if="receipt.note">
            <dt>Catatan</dt>
            <dd>{{ receipt.note }}</dd>
          </div>
        </dl>
        <div v-if="canVerify || canDelete" class="gr-detail__actions">
          <BaseButton
            v-if="canVerify"
            label="Verifikasi & Posting"
            icon="pi pi-check"
            :loading="verifying"
            @click="confirmVerify"
          />
          <BaseButton
            v-if="canDelete"
            label="Hapus Draft"
            icon="pi pi-trash"
            variant="danger"
            :loading="deleting"
            @click="confirmDelete"
          />
        </div>
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
              <th class="gr-detail__col-num">Subtotal</th>
              <th class="gr-detail__col-num">Diskon</th>
              <th>No. Batch</th>
              <th>Kadaluarsa</th>
              <th class="gr-detail__col-num">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in receipt.items" :key="item.id">
              <td>{{ item.itemName }}</td>
              <td>{{ item.unitName }}</td>
              <td class="gr-detail__col-num">{{ item.quantity }}</td>
              <td class="gr-detail__col-num">{{ formatCurrency(item.unitCost) }}</td>
              <td class="gr-detail__col-num">{{ formatCurrency(item.subtotal) }}</td>
              <td class="gr-detail__col-num">
                {{ item.discountAmount != null ? `− ${formatCurrency(item.discountAmount)}` : '-' }}
              </td>
              <td>{{ item.batchNumber }}</td>
              <td>{{ formatDate(item.expiredDate) }}</td>
              <td class="gr-detail__col-num">{{ formatCurrency(item.totalAmount) }}</td>
            </tr>
          </tbody>
        </table>

        <GoodsReceiptTotals
          class="gr-detail__totals"
          :subtotal="receipt.subtotal"
          :discount-label="discountLabel"
          :discount-amount="discountAmount"
          :tax-rate="receipt.taxRate"
          :tax-amount="receipt.taxAmount"
          :grand-total="receipt.grandTotal"
        />
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
  display: flex;
  align-items: center;
  gap: var(--space-2);
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

.gr-detail__actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-top: var(--space-4);
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
  text-align: left;
}

.gr-detail__totals {
  margin-top: var(--space-4);
}

.gr-detail__loading {
  color: var(--text-muted);
  font-size: var(--font-sm);
}
</style>
