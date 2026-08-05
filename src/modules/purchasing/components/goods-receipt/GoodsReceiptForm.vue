<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { itemApi } from '@/modules/inventory/api/item.api'
import { useMarginSettingStore } from '@/modules/inventory/stores/margin-setting.store'
import { useUnitStore } from '@/modules/inventory/stores/unit.store'
import { formatCurrency, formatNominalInput, parseNominalInput } from '@/utils/format'
import type { Item } from '@/modules/inventory/types/item'
import type { Unit } from '@/modules/inventory/types/unit'
import {
  DISCOUNT_TYPE_OPTIONS,
  MARGIN_SOURCE_OPTIONS,
  MARGIN_TYPE_OPTIONS,
  receiveGoodsItemFromPoItem,
  type DiscountType,
  type MarginSource,
  type MarginType,
  type ReceiptDiscountMode,
  type ReceiveGoodsInput,
  type ReceiveGoodsItemInput,
} from '../../types/goods-receipt'
import type { PurchaseOrder } from '../../types/purchase-order'
import GoodsReceiptTotals from './GoodsReceiptTotals.vue'

const props = defineProps<{
  po: PurchaseOrder
  submitting: boolean
}>()

const emit = defineEmits<{
  submit: [value: ReceiveGoodsInput]
  cancel: []
}>()

const unitStore = useUnitStore()
const marginSettingStore = useMarginSettingStore()
const note = ref('')
const errors = reactive<Record<string, string>>({})

// Hanya baris PO yang masih punya sisa qty yang ditampilkan untuk diterima.
const rows = reactive<ReceiveGoodsItemInput[]>(
  props.po.items
    .filter((i) => i.quantity - i.receivedQuantity > 0)
    .map((i) => receiveGoodsItemFromPoItem(i)),
)

const unitOptionsByItem = reactive<Record<string, Unit[]>>({})
// Data item (marginType/marginValue/prescriptionRequired) dipakai untuk resolve
// & preview margin DEFAULT per baris — logika sama persis dengan backend
// ItemPriceService.resolveMargin, hanya untuk preview di client.
const itemById = reactive<Record<string, Item>>({})

function resolveDefaultMargin(itemId: string): { type: MarginType; value: number } {
  const item = itemById[itemId]
  if (item?.marginType && item.marginValue !== null) {
    return { type: item.marginType, value: item.marginValue }
  }
  const prescriptionRequired = item?.prescriptionRequired ?? false
  return {
    type: 'PERCENTAGE',
    value: prescriptionRequired
      ? marginSettingStore.setting.marginResepPercentage
      : marginSettingStore.setting.marginOtcPercentage,
  }
}

function effectiveMargin(row: ReceiveGoodsItemInput): { type: MarginType; value: number } {
  if (row.marginSource === 'MANUAL' && row.marginType && row.marginValue !== null) {
    return { type: row.marginType, value: row.marginValue }
  }
  return resolveDefaultMargin(row.itemId)
}

/** Biaya aktual per unit (backend: total_amount / quantity) — basis margin, bukan total baris. */
function unitCostAfterDiscount(row: ReceiveGoodsItemInput): number {
  return row.quantity > 0 ? rowActualCost(row) / row.quantity : 0
}

/** Harga jual per unit — perbaikan sama persis dengan backend: margin diterapkan ke biaya
 *  per unit, bukan ke total baris (FIXED margin jadi markup per unit, tidak "terlarut"). */
function sellingPricePerUnit(row: ReceiveGoodsItemInput): number {
  const margin = effectiveMargin(row)
  const cost = unitCostAfterDiscount(row)
  const result = margin.type === 'PERCENTAGE' ? cost * (1 + margin.value / 100) : cost + margin.value
  return round2(result)
}

/** Total nilai jual baris ini (qty × harga jual per unit) — murni tampilan, tidak dikirim ke API. */
function rowSubtotal(row: ReceiveGoodsItemInput): number {
  return round2(sellingPricePerUnit(row) * row.quantity)
}

function onRowMarginSourceChange(row: ReceiveGoodsItemInput, value: MarginSource) {
  row.marginSource = value
  if (value === 'DEFAULT') {
    row.marginType = null
    row.marginValue = null
  } else if (row.marginType === null) {
    const def = resolveDefaultMargin(row.itemId)
    row.marginType = def.type
    row.marginValue = def.value
  }
}

// Global discount dan item discount saling eksklusif dalam satu goods receipt
// (backend INV_047) — mode ini membuat kombinasi keduanya mustahil dibuat di UI,
// bukan sekadar divalidasi setelah diisi.
const discountMode = ref<ReceiptDiscountMode>('NONE')
const discountModeOptions: { label: string; value: ReceiptDiscountMode }[] = [
  { label: 'Tanpa Diskon', value: 'NONE' },
  { label: 'Diskon Global', value: 'GLOBAL' },
  { label: 'Diskon Per Item', value: 'PER_ITEM' },
]
const globalDiscountType = ref<DiscountType>('PERCENTAGE')
const globalDiscountValue = ref<number | null>(null)
const rowDiscountTypeOptions: { label: string; value: DiscountType | null }[] = [
  { label: 'Tanpa Diskon', value: null },
  ...DISCOUNT_TYPE_OPTIONS,
]
const taxRate = ref<number | null>(null)

watch(discountMode, (mode) => {
  if (mode !== 'GLOBAL') {
    globalDiscountType.value = 'PERCENTAGE'
    globalDiscountValue.value = null
  }
  if (mode !== 'PER_ITEM') {
    rows.forEach((r) => {
      r.discountType = null
      r.discountValue = null
    })
  }
})

function onRowDiscountTypeChange(row: ReceiveGoodsItemInput, value: DiscountType | null) {
  row.discountType = value
  if (value == null) row.discountValue = null
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function computeDiscountAmount(
  type: DiscountType | null,
  value: number | null,
  base: number,
): number | null {
  if (!type || value == null) return null
  return type === 'PERCENTAGE' ? round2((base * value) / 100) : round2(value)
}

/** Basis margin (backend: total_amount, spec Rule 15) — subtotal baris dikurangi item discount. */
function rowActualCost(row: ReceiveGoodsItemInput): number {
  const itemSubtotal = round2(row.quantity * row.unitCost)
  const discountAmount =
    discountMode.value === 'PER_ITEM'
      ? computeDiscountAmount(row.discountType, row.discountValue, itemSubtotal)
      : null
  return round2(itemSubtotal - (discountAmount ?? 0))
}

/** Preview client-side dari formula yang sama dengan backend (spec §6) — hanya
 *  untuk ditampilkan; server tetap yang menghitung nilai final saat submit. */
const previewTotals = computed(() => {
  const active = rows.filter((r) => r.quantity > 0)
  const items = active.map((r) => {
    const itemSubtotal = round2(r.quantity * r.unitCost)
    const discountAmount =
      discountMode.value === 'PER_ITEM'
        ? computeDiscountAmount(r.discountType, r.discountValue, itemSubtotal)
        : null
    return { subtotal: itemSubtotal, discountAmount, total: round2(itemSubtotal - (discountAmount ?? 0)) }
  })
  const subtotal = round2(items.reduce((sum, it) => sum + it.total, 0))

  let discountAmount: number | null = null
  let discountLabel: string | undefined
  if (discountMode.value === 'GLOBAL') {
    discountAmount = computeDiscountAmount(globalDiscountType.value, globalDiscountValue.value, subtotal)
    discountLabel =
      globalDiscountType.value === 'PERCENTAGE'
        ? `Diskon Global (${globalDiscountValue.value ?? 0}%)`
        : 'Diskon Global'
  } else if (discountMode.value === 'PER_ITEM' && active.some((r) => r.discountType != null)) {
    discountAmount = round2(items.reduce((sum, it) => sum + (it.discountAmount ?? 0), 0))
    discountLabel = 'Diskon Per Item'
  }

  const discountedAmount = round2(subtotal - (discountAmount ?? 0))
  const taxAmount = taxRate.value != null ? round2((discountedAmount * taxRate.value) / 100) : null
  const grandTotal = round2(discountedAmount + (taxAmount ?? 0))

  return { subtotal, discountAmount, discountLabel, taxAmount, grandTotal }
})

async function loadUnitOptions(itemId: string) {
  if (unitOptionsByItem[itemId]) return
  try {
    const links = await itemApi.getUnits(itemId)
    unitOptionsByItem[itemId] = links
      .map((l) => unitStore.items.find((u) => u.id === l.unitId))
      .filter((u): u is Unit => !!u)
  } catch {
    unitOptionsByItem[itemId] = []
  }
}

function unitOptionsFor(itemId: string): Unit[] {
  return unitOptionsByItem[itemId] ?? []
}

/** Baris PO asal (untuk kode item, qty & satuan yang dipesan) — dipakai di kolom Item Description & Ordered. */
function poItemFor(row: ReceiveGoodsItemInput) {
  return props.po.items.find((pi) => pi.id === row.purchaseOrderItemId)
}

async function loadItem(itemId: string) {
  if (itemById[itemId]) return
  try {
    itemById[itemId] = await itemApi.getById(itemId)
  } catch {
    // Item gagal dimuat — preview margin DEFAULT jatuh ke default OTC (lihat resolveDefaultMargin).
  }
}

function validate(): boolean {
  const e: Record<string, string> = {}
  const active = rows.filter((r) => r.quantity > 0)
  if (active.length === 0) e.items = 'Isi minimal satu baris untuk diterima.'
  active.forEach((r, i) => {
    if (!r.unitId) e[`items.${i}.unitId`] = 'Satuan wajib dipilih.'
    if (!r.batchNumber.trim()) e[`items.${i}.batchNumber`] = 'No. batch wajib diisi.'
    if (r.unitCost < 0) e[`items.${i}.unitCost`] = 'Harga tidak boleh negatif.'

    if (discountMode.value === 'PER_ITEM' && r.discountType) {
      const itemSubtotal = r.quantity * r.unitCost
      if (r.discountValue == null || r.discountValue < 0) {
        e[`items.${i}.discountValue`] = 'Nilai diskon wajib diisi.'
      } else if (r.discountType === 'PERCENTAGE' && r.discountValue > 100) {
        e[`items.${i}.discountValue`] = 'Diskon persentase harus 0-100.'
      } else if (r.discountType === 'FIXED' && r.discountValue > itemSubtotal) {
        e[`items.${i}.discountValue`] = 'Diskon tidak boleh melebihi subtotal baris.'
      }
    }

    if (r.marginSource === 'MANUAL') {
      if (!r.marginType || r.marginValue == null || r.marginValue < 0) {
        e[`items.${i}.marginValue`] = 'Margin manual wajib diisi.'
      }
    }
  })

  if (discountMode.value === 'GLOBAL') {
    const subtotal = active.reduce((sum, r) => sum + r.quantity * r.unitCost, 0)
    if (globalDiscountValue.value == null || globalDiscountValue.value < 0) {
      e.discount = 'Nilai diskon wajib diisi.'
    } else if (globalDiscountType.value === 'PERCENTAGE' && globalDiscountValue.value > 100) {
      e.discount = 'Diskon persentase harus 0-100.'
    } else if (globalDiscountType.value === 'FIXED' && globalDiscountValue.value > subtotal) {
      e.discount = 'Diskon tidak boleh melebihi subtotal.'
    }
  }

  if (taxRate.value != null && (taxRate.value < 0 || taxRate.value > 100)) {
    e.taxRate = 'PPN harus 0-100.'
  }

  Object.keys(errors).forEach((k) => delete errors[k])
  Object.assign(errors, e)
  return Object.keys(e).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('submit', {
    note: note.value,
    discountType: discountMode.value === 'GLOBAL' ? globalDiscountType.value : null,
    discountValue: discountMode.value === 'GLOBAL' ? globalDiscountValue.value : null,
    taxRate: taxRate.value,
    items: rows.filter((r) => r.quantity > 0),
  })
}

onMounted(async () => {
  if (unitStore.items.length === 0) await unitStore.fetchAll()
  await marginSettingStore.fetch()
  for (const row of rows) {
    const poItem = props.po.items.find((i) => i.id === row.purchaseOrderItemId)
    if (poItem) await loadUnitOptions(poItem.itemId)
    await loadItem(row.itemId)
  }
})
</script>

<template>
  <div class="gr-form">
    <p v-if="errors.items" class="gr-form__error">{{ errors.items }}</p>
    <p v-if="rows.length === 0" class="gr-form__empty">Seluruh item pada PO ini sudah diterima penuh.</p>

    <template v-else>
      <div class="gr-form__discount-controls">
        <div class="gr-form__field">
          <label class="gr-form__field-label">Mode Diskon</label>
          <BaseSelect
            :model-value="discountMode"
            :options="discountModeOptions"
            option-label="label"
            option-value="value"
            @update:model-value="discountMode = $event as ReceiptDiscountMode"
          />
        </div>

        <template v-if="discountMode === 'GLOBAL'">
          <div class="gr-form__field">
            <label class="gr-form__field-label">Jenis Diskon</label>
            <BaseSelect
              :model-value="globalDiscountType"
              :options="DISCOUNT_TYPE_OPTIONS"
              option-label="label"
              option-value="value"
              @update:model-value="globalDiscountType = $event as DiscountType"
            />
          </div>
          <div class="gr-form__field">
            <label class="gr-form__field-label">Nilai Diskon</label>
            <input
              v-if="globalDiscountType === 'FIXED'"
              type="text"
              inputmode="decimal"
              class="gr-form__input gr-form__input--text"
              :value="formatNominalInput(globalDiscountValue)"
              @input="globalDiscountValue = parseNominalInput(($event.target as HTMLInputElement).value)"
            />
            <input
              v-else
              type="number"
              class="gr-form__input gr-form__input--text"
              :value="globalDiscountValue ?? ''"
              min="0"
              step="any"
              @input="
                globalDiscountValue =
                  ($event.target as HTMLInputElement).value === ''
                    ? null
                    : Number(($event.target as HTMLInputElement).value)
              "
            />
            <p v-if="errors.discount" class="gr-form__error">{{ errors.discount }}</p>
          </div>
        </template>

        <div class="gr-form__field">
          <label class="gr-form__field-label">PPN (%)</label>
          <input
            type="number"
            class="gr-form__input gr-form__input--text"
            :value="taxRate ?? ''"
            min="0"
            max="100"
            step="any"
            @input="
              taxRate =
                ($event.target as HTMLInputElement).value === ''
                  ? null
                  : Number(($event.target as HTMLInputElement).value)
            "
          />
          <p v-if="errors.taxRate" class="gr-form__error">{{ errors.taxRate }}</p>
        </div>
      </div>

      <table class="gr-form__table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Item Description</th>
            <th>Ordered</th>
            <th>Received</th>
            <th>Expired</th>
            <th>No. Batch</th>
            <th v-if="discountMode === 'PER_ITEM'">Diskon</th>
            <th>Margin</th>
            <th class="gr-form__col-num">Harga Beli Per-item</th>
            <th class="gr-form__col-num">Harga per-item dengan margin</th>
            <th class="gr-form__col-num">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows" :key="row.purchaseOrderItemId">
            <td>{{ i + 1 }}</td>
            <td>
              <div class="gr-form__item-name">{{ row.itemName }}</div>
              <div class="gr-form__item-code">{{ poItemFor(row)?.itemCode }}</div>
            </td>
            <td>
              <div class="gr-form__cell-stack gr-form__cell-stack--static">
                <span>{{ poItemFor(row)?.quantity }}</span>
                <span>{{ poItemFor(row)?.unitCode }}</span>
              </div>
            </td>
            <td>
              <div class="gr-form__cell-stack">
                <input
                  type="number"
                  class="gr-form__input"
                  :value="row.quantity"
                  min="0"
                  step="any"
                  @input="row.quantity = Number(($event.target as HTMLInputElement).value)"
                />
                <BaseSelect
                  :model-value="row.unitId"
                  :options="unitOptionsFor(poItemFor(row)?.itemId ?? '')"
                  option-label="name"
                  option-value="id"
                  placeholder="Satuan..."
                  :error="errors[`items.${i}.unitId`]"
                  @update:model-value="row.unitId = $event as string"
                />
              </div>
            </td>
            <td>
              <input
                type="date"
                class="gr-form__input gr-form__input--text"
                :value="row.expiredDate"
                @input="row.expiredDate = ($event.target as HTMLInputElement).value"
              />
            </td>
            <td>
              <input
                type="text"
                class="gr-form__input gr-form__input--text"
                :value="row.batchNumber"
                @input="row.batchNumber = ($event.target as HTMLInputElement).value"
              />
              <p v-if="errors[`items.${i}.batchNumber`]" class="gr-form__error">
                {{ errors[`items.${i}.batchNumber`] }}
              </p>
            </td>
            <td v-if="discountMode === 'PER_ITEM'">
              <div class="gr-form__cell-stack">
                <BaseSelect
                  :model-value="row.discountType"
                  :options="rowDiscountTypeOptions"
                  option-label="label"
                  option-value="value"
                  @update:model-value="onRowDiscountTypeChange(row, $event as DiscountType | null)"
                />
                <input
                  v-if="row.discountType === 'FIXED'"
                  type="text"
                  inputmode="decimal"
                  class="gr-form__input"
                  :disabled="!row.discountType"
                  :value="formatNominalInput(row.discountValue)"
                  @input="row.discountValue = parseNominalInput(($event.target as HTMLInputElement).value)"
                />
                <input
                  v-else
                  type="number"
                  class="gr-form__input"
                  :disabled="!row.discountType"
                  :value="row.discountValue ?? ''"
                  min="0"
                  step="any"
                  @input="
                    row.discountValue =
                      ($event.target as HTMLInputElement).value === ''
                        ? null
                        : Number(($event.target as HTMLInputElement).value)
                  "
                />
                <p v-if="errors[`items.${i}.discountValue`]" class="gr-form__error">
                  {{ errors[`items.${i}.discountValue`] }}
                </p>
              </div>
            </td>
            <td>
              <div class="gr-form__cell-stack">
                <BaseSelect
                  :model-value="row.marginSource"
                  :options="MARGIN_SOURCE_OPTIONS"
                  option-label="label"
                  option-value="value"
                  @update:model-value="onRowMarginSourceChange(row, $event as MarginSource)"
                />
                <template v-if="row.marginSource === 'MANUAL'">
                  <BaseSelect
                    :model-value="row.marginType"
                    :options="MARGIN_TYPE_OPTIONS"
                    option-label="label"
                    option-value="value"
                    @update:model-value="row.marginType = $event as MarginType"
                  />
                  <input
                    v-if="row.marginType === 'FIXED'"
                    type="text"
                    inputmode="decimal"
                    class="gr-form__input"
                    :value="formatNominalInput(row.marginValue)"
                    @input="row.marginValue = parseNominalInput(($event.target as HTMLInputElement).value)"
                  />
                  <input
                    v-else
                    type="number"
                    class="gr-form__input"
                    :value="row.marginValue ?? ''"
                    min="0"
                    step="any"
                    @input="
                      row.marginValue =
                        ($event.target as HTMLInputElement).value === ''
                          ? null
                          : Number(($event.target as HTMLInputElement).value)
                    "
                  />
                  <p v-if="errors[`items.${i}.marginValue`]" class="gr-form__error">
                    {{ errors[`items.${i}.marginValue`] }}
                  </p>
                </template>
                <p v-else class="gr-form__hint">
                  {{ resolveDefaultMargin(row.itemId).value }}{{ resolveDefaultMargin(row.itemId).type === 'PERCENTAGE' ? '%' : ' Rp' }}
                </p>
              </div>
            </td>
            <td class="gr-form__col-num">
              <input
                type="text"
                inputmode="decimal"
                class="gr-form__input"
                :value="formatNominalInput(row.unitCost)"
                @input="row.unitCost = parseNominalInput(($event.target as HTMLInputElement).value) ?? 0"
              />
            </td>
            <td class="gr-form__col-num gr-form__col-computed">{{ formatCurrency(sellingPricePerUnit(row)) }}</td>
            <td class="gr-form__col-num gr-form__col-computed">{{ formatCurrency(rowSubtotal(row)) }}</td>
          </tr>
        </tbody>
      </table>

      <GoodsReceiptTotals
        :subtotal="previewTotals.subtotal"
        :discount-label="previewTotals.discountLabel"
        :discount-amount="previewTotals.discountAmount"
        :tax-rate="taxRate"
        :tax-amount="previewTotals.taxAmount"
        :grand-total="previewTotals.grandTotal"
      />
    </template>

    <div class="gr-form__note">
      <label class="gr-form__note-label" for="gr-note">Catatan</label>
      <textarea id="gr-note" v-model="note" class="gr-form__textarea" rows="2" />
    </div>

    <div class="gr-form__footer">
      <BaseButton label="Batal" variant="ghost" @click="emit('cancel')" />
      <BaseButton
        label="Simpan Draft"
        :loading="submitting"
        :disabled="rows.length === 0"
        @click="onSubmit"
      />
    </div>
  </div>
</template>

<style scoped>
.gr-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.gr-form__discount-controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: flex-start;
}

.gr-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 160px;
}

.gr-form__field-label {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.gr-form__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-sm);
}

.gr-form__table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-weight: var(--font-weight-heading);
  color: var(--text-muted);
  border-bottom: 1px solid var(--surface-border);
}

.gr-form__table td {
  padding: var(--space-2) var(--space-3);
  vertical-align: middle;
}

.gr-form__col-num {
  text-align: left;
}

.gr-form__col-computed {
  color: var(--primary-color);
  font-weight: var(--font-weight-heading);
}

/* Menumpuk 2-3 kontrol (mis. qty+satuan, atau source+type+value) dalam satu <td>. */
.gr-form__cell-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 140px;
}

.gr-form__cell-stack--static {
  gap: 0;
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.gr-form__item-name {
  color: var(--text);
}

.gr-form__item-code {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.gr-form__input {
  width: 100px;
  padding: var(--space-2);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: var(--font-sm);
  color: var(--text);
  background: var(--surface-0);
  text-align: right;
}

.gr-form__input--text {
  width: 140px;
  text-align: left;
}

.gr-form__input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.gr-form__input:disabled {
  opacity: 0.5;
}

.gr-form__note {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.gr-form__note-label {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.gr-form__textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: var(--font-sm);
  color: var(--text);
  background: var(--surface-0);
  resize: vertical;
}

.gr-form__textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.gr-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.gr-form__empty {
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.gr-form__error {
  font-size: var(--font-sm);
  color: var(--color-danger);
}

.gr-form__hint {
  margin: var(--space-1) 0 0;
  font-size: var(--font-xs);
  color: var(--text-muted);
}
</style>
