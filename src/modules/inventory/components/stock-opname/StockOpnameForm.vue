<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { formatDate } from '@/utils/format'
import { batchApi } from '../../api/batch.api'
import type { InventoryBatch } from '../../types/batch'
import type { CreateStockOpnameInput } from '../../types/stock-opname'

const props = defineProps<{
  submitting: boolean
}>()

const emit = defineEmits<{
  submit: [value: CreateStockOpnameInput]
  cancel: []
}>()

interface OpnameRow {
  itemId: string
  itemName: string
  itemCode: string
  batchId: string
  batchNumber: string
  expiredDate: string | null
  /** Preview client-side dari quantity batch saat baris ditambahkan — snapshot
   *  final tetap dihitung ulang di server saat disimpan (INV bisa berubah di antaranya). */
  systemQuantity: number
  physicalQuantity: number | null
}

function defaultOpnameNumber(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `OPN-${y}${m}${d}-${hh}${mm}`
}

const opnameNumber = ref(defaultOpnameNumber())
const note = ref('')
const errors = reactive<Record<string, string>>({})

const rows = reactive<OpnameRow[]>([])

const batches = ref<InventoryBatch[]>([])
const batchesLoading = ref(false)
const selectedBatchId = ref<string | null>(null)

function batchOptionLabel(batch: InventoryBatch): string {
  return `${batch.itemName} — ${batch.batchNumber} (${batch.quantity})`
}

function addRow() {
  if (!selectedBatchId.value) return
  const batch = batches.value.find((b) => b.id === selectedBatchId.value)
  if (!batch) return
  if (rows.some((r) => r.batchId === batch.id)) {
    errors.batch = 'Batch ini sudah ditambahkan.'
    return
  }
  delete errors.batch
  rows.push({
    itemId: batch.itemId,
    itemName: batch.itemName,
    itemCode: batch.itemCode,
    batchId: batch.id,
    batchNumber: batch.batchNumber,
    expiredDate: batch.expiredDate,
    systemQuantity: batch.quantity,
    physicalQuantity: null,
  })
  selectedBatchId.value = null
}

function removeRow(index: number) {
  rows.splice(index, 1)
}

function difference(row: OpnameRow): number {
  return (row.physicalQuantity ?? 0) - row.systemQuantity
}

function differenceClass(row: OpnameRow): string {
  const diff = difference(row)
  if (row.physicalQuantity === null) return ''
  if (diff === 0) return 'opname-form__diff--zero'
  return diff < 0 ? 'opname-form__diff--negative' : 'opname-form__diff--positive'
}

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!opnameNumber.value.trim()) e.opnameNumber = 'No. opname wajib diisi.'
  if (rows.length === 0) e.rows = 'Tambahkan minimal satu batch untuk dihitung.'
  rows.forEach((r, i) => {
    if (r.physicalQuantity === null || Number.isNaN(r.physicalQuantity)) {
      e[`items.${i}.physicalQuantity`] = 'Qty fisik wajib diisi.'
    } else if (r.physicalQuantity < 0) {
      e[`items.${i}.physicalQuantity`] = 'Qty fisik tidak boleh negatif.'
    }
  })

  Object.keys(errors).forEach((k) => delete errors[k])
  Object.assign(errors, e)
  return Object.keys(e).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('submit', {
    opnameNumber: opnameNumber.value.trim(),
    note: note.value.trim() || undefined,
    items: rows.map((r) => ({
      itemId: r.itemId,
      batchId: r.batchId,
      physicalQuantity: r.physicalQuantity as number,
    })),
  })
}

async function loadBatches() {
  batchesLoading.value = true
  try {
    const res = await batchApi.getAll({ limit: 500 })
    batches.value = res.items
  } finally {
    batchesLoading.value = false
  }
}

onMounted(loadBatches)
</script>

<template>
  <div class="opname-form">
    <div class="opname-form__header">
      <BaseInput v-model="opnameNumber" label="No. Opname" required :error="errors.opnameNumber" />
      <div class="opname-form__note">
        <label class="opname-form__note-label" for="opname-note">Catatan</label>
        <textarea id="opname-note" v-model="note" class="opname-form__textarea" rows="2" />
      </div>
    </div>

    <div class="opname-form__picker">
      <BaseSelect
        v-model="selectedBatchId"
        :options="batches"
        :option-label="batchOptionLabel"
        option-value="id"
        placeholder="Cari item / batch..."
        filter
        :disabled="batchesLoading"
        class="opname-form__picker-select"
        :error="errors.batch"
      />
      <BaseButton label="Tambah Batch" icon="pi pi-plus" variant="secondary" :disabled="!selectedBatchId" @click="addRow" />
    </div>
    <p v-if="errors.rows" class="opname-form__error">{{ errors.rows }}</p>

    <table v-if="rows.length > 0" class="opname-form__table">
      <thead>
        <tr>
          <th>No.</th>
          <th>Item</th>
          <th>No. Batch</th>
          <th>Expired</th>
          <th>
            Qty Sistem (per saat ini)
            <span class="opname-form__hint">Snapshot final dihitung di server saat disimpan.</span>
          </th>
          <th>Qty Fisik</th>
          <th>Selisih</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="row.batchId">
          <td>{{ i + 1 }}</td>
          <td>
            <div class="opname-form__item-name">{{ row.itemName }}</div>
            <div class="opname-form__item-code">{{ row.itemCode }}</div>
          </td>
          <td>{{ row.batchNumber }}</td>
          <td>{{ formatDate(row.expiredDate) }}</td>
          <td>{{ row.systemQuantity }}</td>
          <td>
            <input
              type="number"
              class="opname-form__input"
              :value="row.physicalQuantity ?? ''"
              min="0"
              step="any"
              @input="
                row.physicalQuantity =
                  ($event.target as HTMLInputElement).value === ''
                    ? null
                    : Number(($event.target as HTMLInputElement).value)
              "
            />
            <p v-if="errors[`items.${i}.physicalQuantity`]" class="opname-form__error">
              {{ errors[`items.${i}.physicalQuantity`] }}
            </p>
          </td>
          <td :class="differenceClass(row)">
            {{ row.physicalQuantity === null ? '-' : difference(row) }}
          </td>
          <td>
            <BaseButton icon="pi pi-trash" variant="ghost" rounded aria-label="Hapus" @click="removeRow(i)" />
          </td>
        </tr>
      </tbody>
    </table>

    <div class="opname-form__footer">
      <BaseButton label="Batal" variant="ghost" @click="emit('cancel')" />
      <BaseButton label="Simpan" :loading="props.submitting" :disabled="rows.length === 0" @click="onSubmit" />
    </div>
  </div>
</template>

<style scoped>
.opname-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.opname-form__header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: flex-start;
}

.opname-form__note {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1 1 260px;
}

.opname-form__note-label {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.opname-form__textarea {
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

.opname-form__textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.opname-form__picker {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
}

.opname-form__picker-select {
  flex: 1 1 360px;
  max-width: 480px;
}

.opname-form__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-sm);
}

.opname-form__table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-weight: var(--font-weight-heading);
  color: var(--text-muted);
  border-bottom: 1px solid var(--surface-border);
}

.opname-form__table td {
  padding: var(--space-2) var(--space-3);
  vertical-align: middle;
}

.opname-form__hint {
  display: block;
  font-size: var(--font-xs);
  font-weight: normal;
  color: var(--text-muted);
}

.opname-form__item-name {
  color: var(--text);
}

.opname-form__item-code {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.opname-form__input {
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

.opname-form__input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.opname-form__diff--zero {
  color: var(--color-success);
  font-weight: 600;
}

.opname-form__diff--negative {
  color: var(--color-danger);
  font-weight: 600;
}

.opname-form__diff--positive {
  color: var(--color-warning);
  font-weight: 600;
}

.opname-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.opname-form__error {
  font-size: var(--font-sm);
  color: var(--color-danger);
  margin: var(--space-1) 0 0;
}
</style>
