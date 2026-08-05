<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { itemApi } from '@/modules/inventory/api/item.api'
import { useItemStore } from '@/modules/inventory/stores/item.store'
import { useUnitStore } from '@/modules/inventory/stores/unit.store'
import { formatCurrency } from '@/utils/format'
import type { ItemUnitRow } from '@/modules/inventory/types/item'
import type { CreateDispensingInput, CreateDispensingItemInput } from '../types/dispensing'

const props = defineProps<{
  submitting: boolean
}>()

const emit = defineEmits<{
  submit: [value: CreateDispensingInput]
  cancel: []
}>()

const itemStore = useItemStore()
const unitStore = useUnitStore()

interface DispensingFormRow {
  itemId: string
  unitId: string
  quantity: number | null
}

function defaultDispensingNumber(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `DSP-${y}${m}${d}-${hh}${mm}`
}

const dispensingNumber = ref(defaultDispensingNumber())
const note = ref('')
const errors = reactive<Record<string, string>>({})

const rows = reactive<DispensingFormRow[]>([{ itemId: '', unitId: '', quantity: null }])

// Seluruh satuan terdaftar per item (tanpa filter) — dipakai baik untuk opsi
// dropdown (difilter salesEnabled di bawah) maupun fallback harga dari satuan
// dasar ketika satuan terpilih belum punya harga sendiri.
const unitRowsByItem = reactive<Record<string, ItemUnitRow[]>>({})
const unitRowsLoading = reactive<Record<string, boolean>>({})

function unitOptionsFor(itemId: string): ItemUnitRow[] {
  return (unitRowsByItem[itemId] ?? []).filter((u) => u.salesEnabled)
}

function baseUnitRow(itemId: string): ItemUnitRow | undefined {
  return (unitRowsByItem[itemId] ?? []).find((u) => u.isBaseUnit)
}

function selectedUnitRow(row: DispensingFormRow): ItemUnitRow | undefined {
  return (unitRowsByItem[row.itemId] ?? []).find((u) => u.unitId === row.unitId)
}

function unitLabel(row: ItemUnitRow): string {
  return unitStore.items.find((u) => u.id === row.unitId)?.name ?? row.unitId
}

async function loadUnitsFor(itemId: string) {
  if (!itemId || unitRowsByItem[itemId]) return
  unitRowsLoading[itemId] = true
  try {
    unitRowsByItem[itemId] = await itemApi.getUnits(itemId)
  } catch {
    unitRowsByItem[itemId] = []
  } finally {
    unitRowsLoading[itemId] = false
  }
}

async function onRowItemChange(row: DispensingFormRow, itemId: string) {
  row.itemId = itemId
  row.unitId = ''
  await loadUnitsFor(itemId)
  const options = unitOptionsFor(itemId)
  // Prioritas default: satuan default_sales, lalu satuan dasar, lalu apapun yang tersedia.
  const preferred =
    options.find((u) => u.defaultSales) ?? options.find((u) => u.isBaseUnit) ?? options[0]
  row.unitId = preferred?.unitId ?? ''
}

/** Harga satuan: harga aktif satuan terpilih, atau fallback harga satuan dasar × faktor konversi
 *  (persis logika fallback di backend DispensingService.resolveLine) — hanya untuk preview. */
function unitPriceFor(row: DispensingFormRow): number | null {
  const sel = selectedUnitRow(row)
  if (!sel) return null
  if (sel.currentPrice?.sellingPrice != null) return sel.currentPrice.sellingPrice
  const base = baseUnitRow(row.itemId)
  if (base?.currentPrice?.sellingPrice != null)
    return base.currentPrice.sellingPrice * sel.conversionFactor
  return null
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function subtotalFor(row: DispensingFormRow): number | null {
  const price = unitPriceFor(row)
  if (price == null || !row.quantity) return null
  return round2(price * row.quantity)
}

const grandTotal = computed(() => round2(rows.reduce((sum, r) => sum + (subtotalFor(r) ?? 0), 0)))

function addRow() {
  rows.push({ itemId: '', unitId: '', quantity: null })
}

function removeRow(index: number) {
  rows.splice(index, 1)
}

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!dispensingNumber.value.trim()) e.dispensingNumber = 'No. dispensing wajib diisi.'
  if (rows.length === 0) e.items = 'Tambahkan minimal satu baris item.'
  rows.forEach((r, i) => {
    if (!r.itemId) e[`items.${i}.itemId`] = 'Item wajib dipilih.'
    if (!r.unitId) e[`items.${i}.unitId`] = 'Satuan wajib dipilih.'
    if (!r.quantity || r.quantity <= 0) e[`items.${i}.quantity`] = 'Qty wajib diisi, lebih dari 0.'
  })

  Object.keys(errors).forEach((k) => delete errors[k])
  Object.assign(errors, e)
  return Object.keys(e).length === 0
}

function onSubmit() {
  if (!validate()) return
  const items: CreateDispensingItemInput[] = rows.map((r) => ({
    itemId: r.itemId,
    unitId: r.unitId || undefined,
    quantity: r.quantity as number,
  }))
  emit('submit', {
    dispensingNumber: dispensingNumber.value.trim(),
    note: note.value.trim() || undefined,
    items,
  })
}

onMounted(async () => {
  await Promise.allSettled([
    itemStore.items.length === 0 ? itemStore.fetchAll() : Promise.resolve(),
    unitStore.items.length === 0 ? unitStore.fetchAll() : Promise.resolve(),
  ])
})
</script>

<template>
  <div class="disp-form">
    <div class="disp-form__header">
      <BaseInput
        v-model="dispensingNumber"
        label="No. Dispensing"
        required
        :error="errors.dispensingNumber"
      />
      <div class="disp-form__note">
        <label class="disp-form__note-label" for="disp-note">Catatan</label>
        <textarea id="disp-note" v-model="note" class="disp-form__textarea" rows="2" />
      </div>
    </div>

    <p v-if="errors.items" class="disp-form__error">{{ errors.items }}</p>

    <table class="disp-form__table">
      <thead>
        <tr>
          <th>No.</th>
          <th>Item</th>
          <th>Satuan</th>
          <th>Qty</th>
          <th class="disp-form__col-num">Harga Satuan</th>
          <th class="disp-form__col-num">Subtotal</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="i">
          <td>{{ i + 1 }}</td>
          <td>
            <BaseSelect
              :model-value="row.itemId"
              :options="itemStore.items"
              option-label="itemName"
              option-value="id"
              placeholder="Pilih item..."
              filter
              :error="errors[`items.${i}.itemId`]"
              @update:model-value="onRowItemChange(row, $event as string)"
            />
          </td>
          <td>
            <BaseSelect
              :model-value="row.unitId"
              :options="unitOptionsFor(row.itemId)"
              :option-label="unitLabel"
              option-value="unitId"
              placeholder="Satuan..."
              :disabled="!row.itemId || unitRowsLoading[row.itemId]"
              :error="errors[`items.${i}.unitId`]"
              @update:model-value="row.unitId = $event as string"
            />
          </td>
          <td>
            <input
              type="number"
              class="disp-form__input"
              :value="row.quantity ?? ''"
              min="0"
              step="any"
              @input="
                row.quantity =
                  ($event.target as HTMLInputElement).value === ''
                    ? null
                    : Number(($event.target as HTMLInputElement).value)
              "
            />
            <p v-if="errors[`items.${i}.quantity`]" class="disp-form__error">
              {{ errors[`items.${i}.quantity`] }}
            </p>
          </td>
          <td class="disp-form__col-num">
            <span v-if="unitPriceFor(row) != null">{{ formatCurrency(unitPriceFor(row)!) }}</span>
            <span v-else class="disp-form__hint">harga belum diatur</span>
          </td>
          <td class="disp-form__col-num disp-form__col-computed">
            {{ subtotalFor(row) != null ? formatCurrency(subtotalFor(row)!) : '-' }}
          </td>
          <td>
            <BaseButton
              icon="pi pi-trash"
              variant="ghost"
              rounded
              aria-label="Hapus"
              @click="removeRow(i)"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <div class="disp-form__toolbar">
      <BaseButton label="Tambah Baris" icon="pi pi-plus" variant="secondary" @click="addRow" />
      <div class="disp-form__grand-total">
        Total: <strong>{{ formatCurrency(grandTotal) }}</strong>
      </div>
    </div>

    <div class="disp-form__footer">
      <BaseButton label="Batal" variant="ghost" @click="emit('cancel')" />
      <BaseButton label="Simpan" :loading="props.submitting" @click="onSubmit" />
    </div>
  </div>
</template>

<style scoped>
.disp-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.disp-form__header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: flex-start;
}

.disp-form__note {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1 1 260px;
}

.disp-form__note-label {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.disp-form__textarea {
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

.disp-form__textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.disp-form__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-sm);
}

.disp-form__table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-weight: var(--font-weight-heading);
  color: var(--text-muted);
  border-bottom: 1px solid var(--surface-border);
}

.disp-form__table td {
  padding: var(--space-2) var(--space-3);
  vertical-align: middle;
  min-width: 140px;
}

.disp-form__col-num {
  text-align: left;
}

.disp-form__col-computed {
  color: var(--primary-color);
  font-weight: var(--font-weight-heading);
}

.disp-form__input {
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

.disp-form__input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.disp-form__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.disp-form__grand-total {
  font-size: var(--font-size-base);
  color: var(--text);
}

.disp-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.disp-form__error {
  font-size: var(--font-sm);
  color: var(--color-danger);
  margin: var(--space-1) 0 0;
}

.disp-form__hint {
  font-size: var(--font-xs);
  color: var(--text-muted);
}
</style>
