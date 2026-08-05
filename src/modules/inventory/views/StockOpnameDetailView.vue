<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { formatDateTime } from '@/utils/format'
import { useStockOpnameStore } from '../stores/stock-opname.store'
import { STOCK_OPNAME_STATUS_LABELS, STOCK_OPNAME_STATUS_VARIANT } from '../types/stock-opname'

const route = useRoute()
const router = useRouter()
const toast = useToastFeedback()
const confirm = useConfirm()
const store = useStockOpnameStore()

const loading = ref(false)
const finalizing = ref(false)

const opnameId = computed(() => route.params.id as string)
const opname = computed(() => store.current)
const canFinalize = computed(() => opname.value?.status === 'DRAFT')

function goBack() {
  router.push('/inventory/management/stock-opname')
}

function goToStockMovement() {
  router.push('/inventory/management/stock-movement')
}

async function load() {
  loading.value = true
  try {
    await store.load(opnameId.value)
  } catch {
    toast.error('Gagal memuat data stock opname.')
    goBack()
  } finally {
    loading.value = false
  }
}

function difference(diff: number): string {
  return diff.toString()
}

function differenceClass(diff: number): string {
  if (diff === 0) return 'opname-detail__diff--zero'
  return diff < 0 ? 'opname-detail__diff--negative' : 'opname-detail__diff--positive'
}

function confirmFinalize() {
  confirm.require({
    header: 'Finalisasi Stock Opname',
    message: `Finalisasi ${opname.value?.opnameNumber}? Finalisasi akan menulis penyesuaian stok dan tidak bisa dibatalkan.`,
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Tutup',
    acceptLabel: 'Finalisasi',
    accept: async () => {
      finalizing.value = true
      try {
        await store.finalize(opnameId.value)
        toast.success('Stock opname berhasil difinalisasi.')
      } catch {
        toast.error()
      } finally {
        finalizing.value = false
      }
    },
  })
}

onMounted(load)
</script>

<template>
  <div class="opname-detail">
    <div class="opname-detail__head">
      <BaseButton icon="pi pi-arrow-left" label="Kembali" variant="ghost" @click="goBack" />
      <h1 class="opname-detail__title">Detail Stock Opname</h1>
    </div>

    <div v-if="loading || !opname" class="opname-detail__loading">Memuat data...</div>

    <template v-else>
      <BaseCard>
        <div class="opname-detail__header">
          <div>
            <div class="opname-detail__number">
              {{ opname.opnameNumber }}
              <BaseTag
                :value="STOCK_OPNAME_STATUS_LABELS[opname.status]"
                :variant="STOCK_OPNAME_STATUS_VARIANT[opname.status]"
              />
            </div>
            <div v-if="opname.note" class="opname-detail__note">{{ opname.note }}</div>
          </div>
          <BaseButton
            v-if="opname.status === 'FINALIZED'"
            label="Lihat Stock Movement"
            icon="pi pi-arrow-right-arrow-left"
            variant="secondary"
            @click="goToStockMovement"
          />
        </div>
        <dl class="opname-detail__meta">
          <div>
            <dt>Tanggal Dibuat</dt>
            <dd>{{ formatDateTime(opname.createdAt) }}</dd>
          </div>
          <div v-if="opname.finalizedAt">
            <dt>Tanggal Difinalisasi</dt>
            <dd>{{ formatDateTime(opname.finalizedAt) }}</dd>
          </div>
        </dl>
        <div v-if="canFinalize" class="opname-detail__actions">
          <BaseButton
            label="Finalisasi"
            icon="pi pi-check"
            :loading="finalizing"
            @click="confirmFinalize"
          />
        </div>
      </BaseCard>

      <BaseCard>
        <template #header>
          <span class="opname-detail__section-title">Item Dihitung</span>
        </template>
        <table class="opname-detail__table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Item</th>
              <th>No. Batch</th>
              <th>Qty Sistem</th>
              <th>Qty Fisik</th>
              <th>Selisih</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in opname.items ?? []" :key="item.id">
              <td>{{ i + 1 }}</td>
              <td>
                <div class="opname-detail__item-name">{{ item.itemName }}</div>
                <div class="opname-detail__item-code">{{ item.itemCode }}</div>
              </td>
              <td>{{ item.batchNumber }}</td>
              <td>{{ item.systemQuantity }}</td>
              <td>{{ item.physicalQuantity }}</td>
              <td :class="differenceClass(item.difference)">{{ difference(item.difference) }}</td>
            </tr>
          </tbody>
        </table>
      </BaseCard>
    </template>
  </div>
</template>

<style scoped>
.opname-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.opname-detail__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.opname-detail__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.opname-detail__section-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.opname-detail__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
}

.opname-detail__number {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-xl);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.opname-detail__note {
  color: var(--text-muted);
}

.opname-detail__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-3);
  margin: 0;
}

.opname-detail__meta dt {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.opname-detail__meta dd {
  margin: 0;
  color: var(--text);
}

.opname-detail__actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-top: var(--space-4);
}

.opname-detail__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-sm);
}

.opname-detail__table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-weight: var(--font-weight-heading);
  color: var(--text-muted);
  border-bottom: 1px solid var(--surface-border);
}

.opname-detail__table td {
  padding: var(--space-2) var(--space-3);
}

.opname-detail__item-name {
  color: var(--text);
}

.opname-detail__item-code {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.opname-detail__diff--zero {
  color: var(--color-success);
  font-weight: 600;
}

.opname-detail__diff--negative {
  color: var(--color-danger);
  font-weight: 600;
}

.opname-detail__diff--positive {
  color: var(--color-warning);
  font-weight: 600;
}

.opname-detail__loading {
  color: var(--text-muted);
  font-size: var(--font-sm);
}
</style>
