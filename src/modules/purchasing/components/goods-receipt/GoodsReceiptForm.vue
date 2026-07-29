<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { itemApi } from '@/modules/inventory/api/item.api'
import { useUnitStore } from '@/modules/inventory/stores/unit.store'
import type { Unit } from '@/modules/inventory/types/unit'
import {
  DISCOUNT_TYPE_OPTIONS,
  receiveGoodsItemFromPoItem,
  type DiscountType,
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
const note = ref('')
const errors = reactive<Record<string, string>>({})

// Hanya baris PO yang masih punya sisa qty yang ditampilkan untuk diterima.
const rows = reactive<ReceiveGoodsItemInput[]>(
  props.po.items
    .filter((i) => i.quantity - i.receivedQuantity > 0)
    .map((i) => receiveGoodsItemFromPoItem(i)),
)

const unitOptionsByItem = reactive<Record<string, Unit[]>>({})

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
  for (const row of rows) {
    const poItem = props.po.items.find((i) => i.id === row.purchaseOrderItemId)
    if (poItem) await loadUnitOptions(poItem.itemId)
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
            <th>Item</th>
            <th>Qty Dipesan</th>
            <th>Satuan</th>
            <th class="gr-form__col-num">Qty Diterima</th>
            <th class="gr-form__col-num">Harga Beli Aktual</th>
            <th v-if="discountMode === 'PER_ITEM'">Jenis Diskon</th>
            <th v-if="discountMode === 'PER_ITEM'" class="gr-form__col-num">Nilai Diskon</th>
            <th>No. Batch</th>
            <th>Kadaluarsa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows" :key="row.purchaseOrderItemId">
            <td>{{ row.itemName }}</td>
            <td>{{ row.remainingQuantity }}</td>
            <td>
              <BaseSelect
                :model-value="row.unitId"
                :options="unitOptionsFor(po.items.find((pi) => pi.id === row.purchaseOrderItemId)?.itemId ?? '')"
                option-label="name"
                option-value="id"
                placeholder="Satuan..."
                :error="errors[`items.${i}.unitId`]"
                @update:model-value="row.unitId = $event as string"
              />
            </td>
            <td class="gr-form__col-num">
              <input
                type="number"
                class="gr-form__input"
                :value="row.quantity"
                min="0"
                step="any"
                @input="row.quantity = Number(($event.target as HTMLInputElement).value)"
              />
            </td>
            <td class="gr-form__col-num">
              <input
                type="number"
                class="gr-form__input"
                :value="row.unitCost"
                min="0"
                step="any"
                @input="row.unitCost = Number(($event.target as HTMLInputElement).value)"
              />
            </td>
            <td v-if="discountMode === 'PER_ITEM'">
              <BaseSelect
                :model-value="row.discountType"
                :options="rowDiscountTypeOptions"
                option-label="label"
                option-value="value"
                @update:model-value="onRowDiscountTypeChange(row, $event as DiscountType | null)"
              />
            </td>
            <td v-if="discountMode === 'PER_ITEM'" class="gr-form__col-num">
              <input
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
            </td>
            <td>
              <input
                type="text"
                class="gr-form__input gr-form__input--text"
                :value="row.batchNumber"
                @input="row.batchNumber = ($event.target as HTMLInputElement).value"
              />
            </td>
            <td>
              <input
                type="date"
                class="gr-form__input gr-form__input--text"
                :value="row.expiredDate"
                @input="row.expiredDate = ($event.target as HTMLInputElement).value"
              />
            </td>
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
</style>
