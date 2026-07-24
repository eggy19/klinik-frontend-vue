<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { usePurchaseOrderStore } from '../stores/purchase-order.store'
import { useGoodsReceiptStore } from '../stores/goods-receipt.store'
import GoodsReceiptForm from '../components/goods-receipt/GoodsReceiptForm.vue'
import type { PurchaseOrder } from '../types/purchase-order'
import type { ReceiveGoodsInput } from '../types/goods-receipt'

const route = useRoute()
const router = useRouter()
const toast = useToastFeedback()
const poStore = usePurchaseOrderStore()
const goodsReceiptStore = useGoodsReceiptStore()

const poId = computed(() => route.params.poId as string)
const po = ref<PurchaseOrder | null>(null)
const loading = ref(false)
const submitting = ref(false)

const receivable = computed(
  () => po.value?.status === 'APPROVED' || po.value?.status === 'PARTIALLY_RECEIVED',
)

function goBack() {
  router.push('/inventory/purchasing/goods-receipts')
}

async function load() {
  loading.value = true
  try {
    const data = await poStore.fetchOne(poId.value)
    if (data.status !== 'APPROVED' && data.status !== 'PARTIALLY_RECEIVED') {
      toast.error('Purchase order ini tidak lagi bisa diterima (bukan APPROVED/PARTIALLY_RECEIVED).')
      goBack()
      return
    }
    po.value = data
  } catch {
    toast.error('Gagal memuat data purchase order.')
    goBack()
  } finally {
    loading.value = false
  }
}

async function onSubmit(input: ReceiveGoodsInput) {
  submitting.value = true
  try {
    const draft = await goodsReceiptStore.createDraft(poId.value, input)
    toast.success('Draft penerimaan berhasil dibuat, silakan verifikasi.')
    router.push(`/inventory/purchasing/goods-receipts/${draft.id}`)
  } catch {
    toast.error()
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="gr-create">
    <div class="gr-create__head">
      <BaseButton icon="pi pi-arrow-left" label="Kembali" variant="ghost" @click="goBack" />
      <h1 class="gr-create__title">Terima Barang</h1>
    </div>

    <div v-if="loading || !po" class="gr-create__loading">Memuat data...</div>

    <template v-else-if="receivable">
      <BaseCard>
        <div class="gr-create__po">
          <span class="gr-create__po-number">{{ po.poNumber }}</span>
          <span class="gr-create__po-supplier">{{ po.supplierName }}</span>
        </div>
        <GoodsReceiptForm :po="po" :submitting="submitting" @submit="onSubmit" @cancel="goBack" />
      </BaseCard>
    </template>
  </div>
</template>

<style scoped>
.gr-create {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.gr-create__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.gr-create__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.gr-create__po {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-4);
}

.gr-create__po-number {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.gr-create__po-supplier {
  color: var(--text-muted);
}

.gr-create__loading {
  color: var(--text-muted);
  font-size: var(--font-sm);
}
</style>
