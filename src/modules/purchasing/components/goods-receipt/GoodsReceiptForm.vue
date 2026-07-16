<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { itemApi } from '@/modules/inventory/api/item.api'
import { useUnitStore } from '@/modules/inventory/stores/unit.store'
import type { Unit } from '@/modules/inventory/types/unit'
import { receiveGoodsItemFromPoItem, type ReceiveGoodsInput, type ReceiveGoodsItemInput } from '../../types/goods-receipt'
import type { PurchaseOrder } from '../../types/purchase-order'

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
  })
  Object.keys(errors).forEach((k) => delete errors[k])
  Object.assign(errors, e)
  return Object.keys(e).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('submit', {
    note: note.value,
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

    <table v-else class="gr-form__table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Sisa</th>
          <th>Satuan</th>
          <th class="gr-form__col-num">Qty Diterima</th>
          <th class="gr-form__col-num">Harga Beli Aktual</th>
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

    <div class="gr-form__note">
      <label class="gr-form__note-label" for="gr-note">Catatan</label>
      <textarea id="gr-note" v-model="note" class="gr-form__textarea" rows="2" />
    </div>

    <div class="gr-form__footer">
      <BaseButton label="Batal" variant="ghost" @click="emit('cancel')" />
      <BaseButton
        label="Terima Barang"
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
  text-align: right;
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
