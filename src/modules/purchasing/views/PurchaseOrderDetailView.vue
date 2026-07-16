<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import { usePurchaseOrderStore } from '../stores/purchase-order.store'
import { useGoodsReceiptStore } from '../stores/goods-receipt.store'
import PurchaseOrderStatusTag from '../components/PurchaseOrderStatusTag.vue'
import GoodsReceiptForm from '../components/goods-receipt/GoodsReceiptForm.vue'
import type { PurchaseOrder } from '../types/purchase-order'
import type { GoodsReceipt, ReceiveGoodsInput } from '../types/goods-receipt'

const route = useRoute()
const router = useRouter()
const toast = useToastFeedback()
const confirm = useConfirm()
const store = usePurchaseOrderStore()
const goodsReceiptStore = useGoodsReceiptStore()

const po = ref<PurchaseOrder | null>(null)
const receipts = ref<GoodsReceipt[]>([])
const loading = ref(false)
const receiveDialogVisible = ref(false)
const receiving = ref(false)

const poId = computed(() => route.params.id as string)
const canEdit = computed(() => po.value?.status === 'DRAFT')
const canSubmit = computed(() => po.value?.status === 'DRAFT')
const canCancel = computed(() => po.value?.status === 'DRAFT')
const canApprove = computed(() => po.value?.status === 'SUBMITTED')
const canReceive = computed(
  () => po.value?.status === 'APPROVED' || po.value?.status === 'PARTIALLY_RECEIVED',
)

async function load() {
  loading.value = true
  try {
    const [poData, receiptData] = await Promise.all([
      store.fetchOne(poId.value),
      goodsReceiptStore.fetchForPo(poId.value),
    ])
    po.value = poData
    receipts.value = receiptData
  } catch {
    toast.error('Gagal memuat data purchase order.')
    router.push('/inventory/purchase-orders')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/inventory/purchase-orders')
}

function goEdit() {
  router.push(`/inventory/purchase-orders/${poId.value}/edit`)
}

async function doSubmit() {
  try {
    await store.submit(poId.value)
    toast.success('Purchase order berhasil diajukan.')
    await load()
  } catch {
    toast.error()
  }
}

async function doApprove() {
  try {
    await store.approve(poId.value)
    toast.success('Purchase order berhasil disetujui.')
    await load()
  } catch {
    toast.error()
  }
}

function confirmCancel() {
  confirm.require({
    header: 'Batalkan Purchase Order',
    message: `Batalkan PO "${po.value?.poNumber}"? Tindakan ini tidak dapat dibatalkan.`,
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Tutup',
    acceptLabel: 'Batalkan PO',
    acceptProps: { severity: 'danger' },
    accept: async () => {
      try {
        await store.cancel(poId.value)
        toast.success('Purchase order berhasil dibatalkan.')
        await load()
      } catch {
        toast.error()
      }
    },
  })
}

async function onReceive(input: ReceiveGoodsInput) {
  receiving.value = true
  try {
    await goodsReceiptStore.receive(poId.value, input)
    receiveDialogVisible.value = false
    toast.success('Barang berhasil diterima.')
    await load()
  } catch {
    toast.error()
  } finally {
    receiving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="po-detail">
    <div class="po-detail__head">
      <BaseButton icon="pi pi-arrow-left" label="Kembali" variant="ghost" @click="goBack" />
      <h1 class="po-detail__title">Detail Purchase Order</h1>
    </div>

    <div v-if="loading || !po" class="po-detail__loading">Memuat data...</div>

    <template v-else>
      <BaseCard>
        <div class="po-detail__header">
          <div>
            <div class="po-detail__po-number">{{ po.poNumber }}</div>
            <div class="po-detail__supplier">{{ po.supplierName }}</div>
          </div>
          <PurchaseOrderStatusTag :status="po.status" />
        </div>

        <dl class="po-detail__meta">
          <div>
            <dt>Tanggal Dibuat</dt>
            <dd>{{ formatDateTime(po.createdAt) }}</dd>
          </div>
          <div v-if="po.submittedAt">
            <dt>Tanggal Submit</dt>
            <dd>{{ formatDateTime(po.submittedAt) }}</dd>
          </div>
          <div v-if="po.approvedAt">
            <dt>Tanggal Disetujui</dt>
            <dd>{{ formatDateTime(po.approvedAt) }}</dd>
          </div>
          <div v-if="po.cancelledAt">
            <dt>Tanggal Dibatalkan</dt>
            <dd>{{ formatDateTime(po.cancelledAt) }}</dd>
          </div>
          <div v-if="po.note">
            <dt>Catatan</dt>
            <dd>{{ po.note }}</dd>
          </div>
        </dl>

        <div class="po-detail__actions">
          <BaseButton v-if="canEdit" label="Edit" icon="pi pi-pencil" variant="secondary" @click="goEdit" />
          <BaseButton v-if="canSubmit" label="Submit" icon="pi pi-send" @click="doSubmit" />
          <BaseButton v-if="canApprove" label="Setujui" icon="pi pi-check" @click="doApprove" />
          <BaseButton
            v-if="canReceive"
            label="Terima Barang"
            icon="pi pi-inbox"
            @click="receiveDialogVisible = true"
          />
          <BaseButton v-if="canCancel" label="Batalkan" icon="pi pi-times" variant="danger" @click="confirmCancel" />
        </div>
      </BaseCard>

      <BaseCard>
        <template #header>
          <span class="po-detail__section-title">Item</span>
        </template>
        <table class="po-detail__table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Satuan</th>
              <th class="po-detail__col-num">Qty</th>
              <th class="po-detail__col-num">Diterima</th>
              <th class="po-detail__col-num">Harga Beli</th>
              <th class="po-detail__col-num">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in po.items" :key="item.id">
              <td>{{ item.itemName }}</td>
              <td>{{ item.unitName }}</td>
              <td class="po-detail__col-num">{{ item.quantity }}</td>
              <td class="po-detail__col-num">{{ item.receivedQuantity }}</td>
              <td class="po-detail__col-num">{{ formatCurrency(item.unitPrice) }}</td>
              <td class="po-detail__col-num">{{ formatCurrency(item.quantity * item.unitPrice) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="po-detail__total">
          <span>Total</span>
          <span class="po-detail__total-value">{{ formatCurrency(po.totalAmount) }}</span>
        </div>
      </BaseCard>

      <BaseCard>
        <template #header>
          <span class="po-detail__section-title">Riwayat Penerimaan</span>
        </template>
        <p v-if="receipts.length === 0" class="po-detail__empty">Belum ada barang yang diterima.</p>
        <div v-else class="po-detail__receipts">
          <div v-for="r in receipts" :key="r.id" class="po-detail__receipt">
            <div class="po-detail__receipt-head">
              <span class="po-detail__receipt-number">{{ r.receiptNumber }}</span>
              <span class="po-detail__receipt-date">{{ formatDateTime(r.receivedAt) }}</span>
            </div>
            <table class="po-detail__table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Satuan</th>
                  <th class="po-detail__col-num">Qty</th>
                  <th class="po-detail__col-num">Harga</th>
                  <th>No. Batch</th>
                  <th>Kadaluarsa</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in r.items" :key="item.id">
                  <td>{{ item.itemName }}</td>
                  <td>{{ item.unitName }}</td>
                  <td class="po-detail__col-num">{{ item.quantity }}</td>
                  <td class="po-detail__col-num">{{ formatCurrency(item.unitCost) }}</td>
                  <td>{{ item.batchNumber }}</td>
                  <td>{{ formatDate(item.expiredDate) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </BaseCard>

      <BaseDialog v-model:visible="receiveDialogVisible" header="Terima Barang">
        <GoodsReceiptForm
          :po="po"
          :submitting="receiving"
          @submit="onReceive"
          @cancel="receiveDialogVisible = false"
        />
      </BaseDialog>
    </template>
  </div>
</template>

<style scoped>
.po-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.po-detail__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.po-detail__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.po-detail__section-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.po-detail__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
}

.po-detail__po-number {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.po-detail__supplier {
  color: var(--text-muted);
}

.po-detail__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-3);
  margin: 0 0 var(--space-4);
}

.po-detail__meta dt {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.po-detail__meta dd {
  margin: 0;
  color: var(--text);
}

.po-detail__actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.po-detail__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-sm);
}

.po-detail__table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-weight: var(--font-weight-heading);
  color: var(--text-muted);
  border-bottom: 1px solid var(--surface-border);
}

.po-detail__table td {
  padding: var(--space-2) var(--space-3);
}

.po-detail__col-num {
  text-align: right;
}

.po-detail__total {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  align-items: baseline;
  padding-top: var(--space-3);
}

.po-detail__total-value {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.po-detail__receipts {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.po-detail__receipt {
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
}

.po-detail__receipt-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-2);
  font-weight: var(--font-weight-heading);
}

.po-detail__receipt-date {
  color: var(--text-muted);
  font-weight: normal;
}

.po-detail__empty {
  color: var(--text-muted);
  font-size: var(--font-sm);
}

.po-detail__loading {
  color: var(--text-muted);
  font-size: var(--font-sm);
}
</style>
