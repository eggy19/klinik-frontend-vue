<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { useDispensingStore } from '../stores/dispensing.store'

const route = useRoute()
const router = useRouter()
const toast = useToastFeedback()
const store = useDispensingStore()

const loading = ref(false)
const expanded = reactive<Record<string, boolean>>({})

const dispensingId = computed(() => route.params.id as string)
const dispensing = computed(() => store.current)

function goBack() {
  router.push('/inventory/dispensing')
}

function toggleAllocation(itemId: string) {
  expanded[itemId] = !expanded[itemId]
}

/** Qty ditampilkan sebagaimana diinput user (satuan pilihan), fallback ke qty satuan dasar untuk baris legacy. */
function displayQuantity(item: { inputQuantity: number | null; quantity: number }): number {
  return item.inputQuantity ?? item.quantity
}

async function load() {
  loading.value = true
  try {
    await store.load(dispensingId.value)
  } catch {
    toast.error('Gagal memuat data dispensing.')
    goBack()
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="disp-detail">
    <div class="disp-detail__head">
      <BaseButton icon="pi pi-arrow-left" label="Kembali" variant="ghost" @click="goBack" />
      <h1 class="disp-detail__title">Detail Dispensing</h1>
    </div>

    <div v-if="loading || !dispensing" class="disp-detail__loading">Memuat data...</div>

    <template v-else>
      <BaseCard>
        <div class="disp-detail__header">
          <div class="disp-detail__number">{{ dispensing.dispensingNumber }}</div>
        </div>
        <dl class="disp-detail__meta">
          <div>
            <dt>Tanggal Dibuat</dt>
            <dd>{{ formatDateTime(dispensing.createdAt) }}</dd>
          </div>
          <div v-if="dispensing.note">
            <dt>Catatan</dt>
            <dd>{{ dispensing.note }}</dd>
          </div>
        </dl>
      </BaseCard>

      <BaseCard>
        <template #header>
          <span class="disp-detail__section-title">Item Dispensing</span>
        </template>
        <table class="disp-detail__table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Item</th>
              <th>Satuan</th>
              <th>Qty</th>
              <th class="disp-detail__col-num">Harga</th>
              <th class="disp-detail__col-num">Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(item, i) in dispensing.items ?? []" :key="item.id">
              <tr>
                <td>{{ i + 1 }}</td>
                <td>
                  <div class="disp-detail__item-name">{{ item.itemName }}</div>
                  <div class="disp-detail__item-code">{{ item.itemCode }}</div>
                </td>
                <td>{{ item.unitName ?? '-' }}</td>
                <td>{{ displayQuantity(item) }}</td>
                <td class="disp-detail__col-num">
                  {{ item.unitPrice != null ? formatCurrency(item.unitPrice) : '-' }}
                </td>
                <td class="disp-detail__col-num disp-detail__col-computed">
                  {{ item.subtotal != null ? formatCurrency(item.subtotal) : '-' }}
                </td>
                <td>
                  <BaseButton
                    v-if="item.batchAllocation.length > 0"
                    :icon="expanded[item.id] ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                    variant="ghost"
                    rounded
                    aria-label="Rincian batch"
                    @click="toggleAllocation(item.id)"
                  />
                </td>
              </tr>
              <tr v-if="expanded[item.id]" class="disp-detail__allocation-row">
                <td :colspan="7">
                  <table class="disp-detail__allocation-table">
                    <thead>
                      <tr>
                        <th>No. Batch</th>
                        <th class="disp-detail__col-num">Qty (satuan dasar)</th>
                        <th class="disp-detail__col-num">Harga Pokok</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="alloc in item.batchAllocation" :key="alloc.batchId">
                        <td>{{ alloc.batchNumber }}</td>
                        <td class="disp-detail__col-num">{{ alloc.quantity }}</td>
                        <td class="disp-detail__col-num">{{ formatCurrency(alloc.unitCost) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </BaseCard>
    </template>
  </div>
</template>

<style scoped>
.disp-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.disp-detail__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.disp-detail__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.disp-detail__section-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.disp-detail__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
}

.disp-detail__number {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.disp-detail__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-3);
  margin: 0;
}

.disp-detail__meta dt {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.disp-detail__meta dd {
  margin: 0;
  color: var(--text);
}

.disp-detail__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-sm);
}

.disp-detail__table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-weight: var(--font-weight-heading);
  color: var(--text-muted);
  border-bottom: 1px solid var(--surface-border);
}

.disp-detail__table td {
  padding: var(--space-2) var(--space-3);
}

.disp-detail__col-num {
  text-align: left;
}

.disp-detail__col-computed {
  color: var(--primary-color);
  font-weight: var(--font-weight-heading);
}

.disp-detail__item-name {
  color: var(--text);
}

.disp-detail__item-code {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.disp-detail__allocation-row td {
  padding: 0 var(--space-3) var(--space-3) var(--space-3);
  background: var(--surface-0);
}

.disp-detail__allocation-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-xs);
  margin-left: var(--space-6);
}

.disp-detail__allocation-table th {
  text-align: left;
  padding: var(--space-1) var(--space-2);
  font-weight: var(--font-weight-heading);
  color: var(--text-muted);
  border-bottom: 1px solid var(--surface-border);
}

.disp-detail__allocation-table td {
  padding: var(--space-1) var(--space-2);
}

.disp-detail__loading {
  color: var(--text-muted);
  font-size: var(--font-sm);
}
</style>
