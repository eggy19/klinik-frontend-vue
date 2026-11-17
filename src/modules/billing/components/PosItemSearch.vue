<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import { useDebounce } from '@/composables/useDebounce'
import { formatCurrency } from '@/utils/format'
import { apiErrorMessage } from '@/utils/api-error'
import { posApi } from '../api/pos.api'
import type { NotSellableReason, PosItem, PosUnit } from '../types/billing'

// Pencarian obat lewat POS lookup (BR-PS-01..04). Billing tidak terlibat di langkah ini.
const MIN_QUERY_LENGTH = 2

defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ add: [item: PosItem, unit: PosUnit] }>()

const REASON_TEXT: Record<NotSellableReason, string> = {
  BLOCKED_DRUG_GROUP: 'Narkotika/psikotropika tidak dijual bebas',
  NO_PRICE: 'Harga belum diatur',
  OUT_OF_STOCK: 'Stok habis',
}

const query = ref('')
const debounced = useDebounce(query, 300)
const results = ref<PosItem[]>([])
const loading = ref(false)
const errorMessage = ref('')
const searched = ref(false)

let sequence = 0
let lastQuery = ''
let controller: AbortController | null = null

async function search(raw: string) {
  const q = raw.trim()
  if (q.length < MIN_QUERY_LENGTH) {
    controller?.abort()
    sequence += 1
    lastQuery = ''
    results.value = []
    searched.value = false
    errorMessage.value = ''
    loading.value = false
    return
  }
  // Enter dan debounce bisa memicu kueri yang sama; cukup satu.
  if (q === lastQuery && !errorMessage.value) return
  lastQuery = q
  controller?.abort()
  controller = new AbortController()
  const mine = ++sequence
  loading.value = true
  errorMessage.value = ''
  try {
    const items = await posApi.searchItems(q, 20, controller.signal)
    if (mine !== sequence) return
    results.value = items
    searched.value = true
  } catch (error) {
    if (mine !== sequence || (isAxiosError(error) && error.code === 'ERR_CANCELED')) return
    results.value = []
    searched.value = false
    errorMessage.value = apiErrorMessage(error, 'Gagal mencari obat.')
  } finally {
    if (mine === sequence) loading.value = false
  }
}

watch(debounced, (value) => search(value))

function onEnter() {
  search(query.value)
}

/** Satuan default (isDefaultSales) tampil lebih dulu bila bisa dijual (BR-PS-03). */
function orderedUnits(item: PosItem): PosUnit[] {
  return [...item.units].sort(
    (a, b) => Number(b.isDefaultSales && b.sellable) - Number(a.isDefaultSales && a.sellable),
  )
}

/** Item BLOCKED tidak pernah bisa ditambahkan, walau satuannya sellable (pertahanan berlapis). */
function canAdd(item: PosItem, unit: PosUnit): boolean {
  return unit.sellable && item.saleRestriction !== 'BLOCKED'
}

function hasSellableUnit(item: PosItem): boolean {
  return item.units.some((u) => canAdd(item, u))
}

function unitReason(item: PosItem, unit: PosUnit): string {
  if (unit.notSellableReason) return REASON_TEXT[unit.notSellableReason]
  return item.saleRestriction === 'BLOCKED' ? REASON_TEXT.BLOCKED_DRUG_GROUP : 'Tidak dapat dijual'
}

/** Muat ulang hasil dengan query saat ini (mis. setelah checkout, agar stok tidak basi). */
function refresh() {
  lastQuery = ''
  return search(query.value)
}

defineExpose({ refresh })

onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <div class="pos-search">
    <BaseInput
      v-model="query"
      label="Cari obat"
      placeholder="Nama / kode / barcode (min. 2 huruf, Enter = cari)"
      :disabled="disabled"
      @keydown.enter.prevent="onEnter"
    />

    <p v-if="loading" class="pos-search__hint">Mencari...</p>
    <p v-else-if="errorMessage" class="pos-search__error">{{ errorMessage }}</p>
    <p v-else-if="searched && results.length === 0" class="pos-search__hint">Obat tidak ditemukan.</p>

    <ul v-if="results.length > 0" class="pos-search__list">
      <li
        v-for="item in results"
        :key="item.itemId"
        class="pos-item"
        :class="{ 'pos-item--disabled': !hasSellableUnit(item) }"
      >
        <div class="pos-item__head">
          <span class="pos-item__name">{{ item.itemName }}</span>
          <span v-if="item.brandName" class="pos-item__brand">({{ item.brandName }})</span>
          <BaseTag
            v-if="item.saleRestriction === 'WARNING'"
            variant="warning"
            value="Obat keras, wajib resep"
          />
          <BaseTag
            v-else-if="item.saleRestriction === 'BLOCKED'"
            variant="danger"
            value="Narkotika/psikotropika tidak dijual bebas"
          />
        </div>

        <p v-if="item.units.length === 0" class="pos-item__reason">Tidak ada satuan jual aktif</p>

        <ul v-else class="pos-item__units">
          <li v-for="unit in orderedUnits(item)" :key="unit.unitId" class="pos-unit">
            <span class="pos-unit__name">{{ unit.unitName }}</span>
            <span class="pos-unit__price">
              {{ unit.unitPrice !== null ? formatCurrency(unit.unitPrice) : '-' }}
            </span>
            <span class="pos-unit__stock">stok {{ unit.availableQuantity }}</span>
            <BaseTag v-if="unit.sellable && unit.isDefaultSales" variant="info" value="Default" />
            <BaseButton
              v-if="canAdd(item, unit)"
              icon="pi pi-plus"
              label="Tambah"
              size="small"
              :disabled="disabled"
              @click="emit('add', item, unit)"
            />
            <span v-else class="pos-item__reason">{{ unitReason(item, unit) }}</span>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.pos-search {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.pos-search__hint {
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.pos-search__error {
  font-size: var(--font-sm);
  color: var(--color-danger);
}

.pos-search__list,
.pos-item__units {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.pos-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background-color: var(--bg);
}

/* Item yang tidak bisa dipilih tampil redup, alasannya tetap terbaca. */
.pos-item--disabled .pos-item__name,
.pos-item--disabled .pos-item__brand {
  color: var(--text-muted);
}

.pos-item__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.pos-item__name {
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.pos-item__brand {
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.pos-item__reason {
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.pos-unit {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.pos-unit__name {
  min-width: 5rem;
  color: var(--text);
}

.pos-unit__price {
  min-width: 6rem;
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.pos-unit__stock {
  font-size: var(--font-sm);
  color: var(--text-muted);
}
</style>
