<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { itemApi } from '@/modules/inventory/api/item.api'
import type { Item } from '@/modules/inventory/types/item'
import type { Unit } from '@/modules/inventory/types/unit'
import { formatCurrency } from '@/utils/format'
import type { PurchaseOrderItemInput } from '../../types/purchase-order'

const props = defineProps<{
  initial: PurchaseOrderItemInput
  items: Item[]
  units: Unit[]
  existingKeys: string[]
  mode: 'add' | 'edit'
}>()

const emit = defineEmits<{
  submit: [value: PurchaseOrderItemInput]
  cancel: []
}>()

const form = reactive<PurchaseOrderItemInput>({ ...props.initial })

// Link mentah master_item_unit item terpilih — dipakai untuk resolve opsi
// dropdown Satuan (nama unit) sekaligus tahu mana yang isBaseUnit (default).
const unitLinks = ref<{ unitId: string; isBaseUnit: boolean }[]>([])
const loadingUnits = ref(false)

const unitOptions = computed<Unit[]>(() =>
  unitLinks.value
    .map((l) => props.units.find((u) => u.id === l.unitId))
    .filter((u): u is Unit => !!u),
)

type ErrorMap = Partial<Record<'itemId' | 'unitId' | 'quantity' | 'unitPrice', string>>
const errors = ref<ErrorMap>({})

const subtotal = computed(() => (form.quantity || 0) * (form.unitPrice || 0))

// Tampilkan "SKU - nama item" agar item dengan nama mirip mudah dibedakan;
// fallback ke itemCode kalau skuCode belum diisi di master item.
function itemOptionLabel(item: Item): string {
  const code = item.skuCode || item.itemCode
  return code ? `${code} - ${item.itemName}` : item.itemName
}

async function loadUnitOptions(itemId: string) {
  if (!itemId) {
    unitLinks.value = []
    return
  }
  loadingUnits.value = true
  try {
    const links = await itemApi.getUnits(itemId)
    unitLinks.value = links.map((l) => ({ unitId: l.unitId, isBaseUnit: l.isBaseUnit }))
  } catch {
    unitLinks.value = []
  } finally {
    loadingUnits.value = false
  }
}

async function onItemChange(itemId: string) {
  form.itemId = itemId
  form.unitId = ''
  await loadUnitOptions(itemId)

  const baseLink = unitLinks.value.find((l) => l.isBaseUnit)
  const options = unitOptions.value
  const defaultUnit = (baseLink && options.find((u) => u.id === baseLink.unitId)) ?? options[0]
  if (defaultUnit) form.unitId = defaultUnit.id

  try {
    const price = await itemApi.getCurrentPrice(itemId)
    form.unitPrice = price?.purchasePrice ?? 0
  } catch {
    // Prefill harga gagal jangan blok pengisian form — user bisa isi manual.
  }
}

function validate(): boolean {
  const e: ErrorMap = {}
  if (!form.itemId) e.itemId = 'Item wajib dipilih.'
  if (!form.unitId) e.unitId = 'Satuan wajib dipilih.'
  if (form.quantity <= 0) e.quantity = 'Qty harus lebih dari 0.'
  if (form.unitPrice < 0) e.unitPrice = 'Harga tidak boleh negatif.'

  if (form.itemId && form.unitId && !e.unitId) {
    const key = `${form.itemId}:${form.unitId}`
    if (props.existingKeys.includes(key)) {
      e.unitId = 'Kombinasi item & satuan sudah ada di daftar.'
    }
  }

  errors.value = e
  return Object.keys(e).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('submit', { ...form })
}

onMounted(() => {
  // Mode edit: hanya muat opsi satuan, JANGAN timpa unitId/unitPrice yang sudah terisi.
  if (props.mode === 'edit' && form.itemId) {
    loadUnitOptions(form.itemId)
  }
})
</script>

<template>
  <form class="po-item-form" @submit.prevent="onSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="md:col-span-2">
        <BaseSelect
          :model-value="form.itemId"
          :options="items"
          :option-label="itemOptionLabel"
          option-value="id"
          label="Item"
          placeholder="Cari nama item atau kode SKU..."
          required
          filter
          :filter-fields="['skuCode', 'itemCode', 'itemName']"
          :error="errors.itemId"
          @update:model-value="onItemChange($event as string)"
        />
      </div>

      <BaseSelect
        v-model="form.unitId"
        :options="unitOptions"
        option-label="name"
        option-value="id"
        label="Satuan"
        placeholder="Pilih satuan..."
        required
        :disabled="!form.itemId || loadingUnits"
        :error="errors.unitId"
      />

      <BaseInput
        :model-value="form.quantity"
        type="number"
        label="Qty"
        required
        :error="errors.quantity"
        @update:model-value="form.quantity = Number($event)"
      />

      <BaseInput
        :model-value="form.unitPrice"
        type="number"
        label="Harga Beli"
        required
        :error="errors.unitPrice"
        @update:model-value="form.unitPrice = Number($event)"
      />

      <div class="po-item-form__subtotal md:col-span-2">
        <span>Subtotal</span>
        <span class="po-item-form__subtotal-value">{{ formatCurrency(subtotal) }}</span>
      </div>
    </div>

    <div class="po-item-form__actions">
      <BaseButton label="Batal" variant="ghost" type="button" @click="emit('cancel')" />
      <BaseButton :label="mode === 'edit' ? 'Simpan' : 'Tambah'" type="submit" />
    </div>
  </form>
</template>

<style scoped>
.po-item-form__subtotal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--surface-0);
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.po-item-form__subtotal-value {
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.po-item-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-6);
}
</style>
