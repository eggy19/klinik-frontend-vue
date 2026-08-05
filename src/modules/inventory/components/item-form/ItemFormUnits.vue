<script setup lang="ts">
import { computed, onMounted } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseCurrencyInput from '@/components/base/BaseCurrencyInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { formatCurrency } from '@/utils/format'
import { useMarginSettingStore } from '../../stores/margin-setting.store'
import { MARGIN_TYPE_OPTIONS, type ItemInput, type ItemUnitRow, type MarginType } from '../../types/item'
import type { Unit } from '../../types/unit'

const props = defineProps<{
  form: ItemInput
  units: Unit[]
  errors?: Record<string, string>
}>()

const marginSettingStore = useMarginSettingStore()

onMounted(() => {
  marginSettingStore.fetch()
})

// Fallback branch OTC/Resep selalu PERCENTAGE — master_margin_setting tidak
// mendukung FIXED, hanya override per item/satuan yang bisa.
const defaultMarginPercentage = computed(() =>
  props.form.prescriptionRequired
    ? marginSettingStore.setting.marginResepPercentage
    : marginSettingStore.setting.marginOtcPercentage,
)

// --- Margin item (fallback level-2, dipakai kalau baris satuan tidak override) ---

const hasItemOverride = computed(
  () => props.form.marginType !== null && props.form.marginValue !== null,
)

function onItemMarginToggle(checked: boolean) {
  if (checked) {
    props.form.marginType = 'PERCENTAGE'
    props.form.marginValue = defaultMarginPercentage.value
  } else {
    props.form.marginType = null
    props.form.marginValue = null
  }
}

function onItemMarginValueInput(value: string) {
  props.form.marginValue = value === '' ? null : Number(value)
}

// --- Baris satuan ---

function unitName(unitId: string): string {
  return props.units.find((u) => u.id === unitId)?.name ?? '-'
}

const baseUnitId = computed(
  () => props.form.units.find((u) => u.isBaseUnit)?.unitId || props.form.defaultUnitId,
)
const baseUnitName = computed(() => unitName(baseUnitId.value))

/** Opsi satuan per baris — satuan yang sudah dipakai baris lain disembunyikan supaya tidak duplikat. */
function unitOptionsFor(index: number): Unit[] {
  const usedElsewhere = new Set(
    props.form.units.filter((_, i) => i !== index).map((u) => u.unitId),
  )
  return props.units.filter((u) => !usedElsewhere.has(u.id))
}

function addRow() {
  props.form.units.push({
    unitLinkId: null,
    unitId: '',
    conversionFactor: 1,
    purchaseEnabled: true,
    salesEnabled: true,
    defaultPurchase: false,
    defaultSales: false,
    isBaseUnit: false,
    purchasePrice: null,
    marginType: null,
    marginValue: null,
    currentPrice: null,
  })
}

function removeRow(index: number) {
  props.form.units.splice(index, 1)
}

function togglePurchaseEnabled(row: ItemUnitRow, checked: boolean) {
  row.purchaseEnabled = checked
  if (!checked) row.defaultPurchase = false
}

function toggleSalesEnabled(row: ItemUnitRow, checked: boolean) {
  row.salesEnabled = checked
  if (!checked) row.defaultSales = false
}

function setDefaultPurchase(index: number) {
  props.form.units.forEach((r, i) => {
    r.defaultPurchase = i === index
  })
}

function setDefaultSales(index: number) {
  props.form.units.forEach((r, i) => {
    r.defaultSales = i === index
  })
}

function onUnitMarginToggle(row: ItemUnitRow, checked: boolean) {
  if (checked) {
    row.marginType = 'PERCENTAGE'
    row.marginValue = defaultMarginPercentage.value
  } else {
    row.marginType = null
    row.marginValue = null
  }
}

function onUnitMarginValueInput(row: ItemUnitRow, value: string) {
  row.marginValue = value === '' ? null : Number(value)
}

/** Margin efektif satu baris: margin baris > margin item > default OTC/Resep branch — sama persis urutan resolveMarginForUnit di backend, ini cuma preview client. */
function resolvedMargin(row: ItemUnitRow): { type: MarginType; value: number } {
  if (row.marginType !== null && row.marginValue !== null) {
    return { type: row.marginType, value: row.marginValue }
  }
  if (hasItemOverride.value) {
    return { type: props.form.marginType as MarginType, value: props.form.marginValue as number }
  }
  return { type: 'PERCENTAGE', value: defaultMarginPercentage.value }
}

function previewSellingPrice(row: ItemUnitRow): number {
  const purchase = Number(row.purchasePrice) || 0
  const margin = resolvedMargin(row)
  const result =
    margin.type === 'PERCENTAGE' ? purchase * (1 + margin.value / 100) : purchase + margin.value
  return Math.round(result * 100) / 100
}

function marginLabel(type: MarginType, value: number): string {
  return `${value}${type === 'PERCENTAGE' ? '%' : ' Rp'}`
}
</script>

<template>
  <div class="item-form-units">
    <section class="item-form-units__section">
      <h3 class="item-form-units__section-title">Margin Item (fallback)</h3>
      <label class="item-form-units__checkbox">
        <input
          type="checkbox"
          :checked="hasItemOverride"
          @change="onItemMarginToggle(($event.target as HTMLInputElement).checked)"
        />
        Margin Khusus Item Ini — opsional
      </label>

      <div v-if="hasItemOverride" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span class="item-form-units__label">Jenis Margin</span>
          <BaseSelect
            :model-value="form.marginType"
            :options="MARGIN_TYPE_OPTIONS"
            option-label="label"
            option-value="value"
            @update:model-value="form.marginType = $event as MarginType"
          />
        </div>
        <BaseCurrencyInput
          v-if="form.marginType === 'FIXED'"
          :model-value="form.marginValue"
          label="Nilai Margin (Rp)"
          :error="errors?.marginValue"
          @update:model-value="form.marginValue = $event"
        />
        <BaseInput
          v-else
          :model-value="form.marginValue ?? ''"
          label="Nilai Margin (%)"
          type="number"
          :error="errors?.marginValue"
          @update:model-value="onItemMarginValueInput"
        />
      </div>

      <p class="item-form-units__hint">
        <template v-if="hasItemOverride">
          Jadi fallback semua satuan yang tidak punya margin sendiri:
          <strong>{{ marginLabel(form.marginType as MarginType, form.marginValue as number) }}</strong>
          (bukan default {{ form.prescriptionRequired ? 'Resep' : 'OTC' }} {{ defaultMarginPercentage }}%).
        </template>
        <template v-else>
          Satuan tanpa margin sendiri memakai default
          {{ form.prescriptionRequired ? 'Resep' : 'OTC' }}: <strong>{{ defaultMarginPercentage }}%</strong>.
          Ubah default di menu Pengaturan Margin.
        </template>
      </p>
    </section>

    <section class="item-form-units__section">
      <h3 class="item-form-units__section-title">Satuan &amp; Harga</h3>
      <p v-if="errors?.units" class="item-form-units__error">{{ errors.units }}</p>

      <div class="item-form-units__rows">
        <div v-for="(row, i) in form.units" :key="i" class="item-form-units__row-card">
          <div class="item-form-units__row-head">
            <div class="item-form-units__field">
              <span class="item-form-units__label">Satuan</span>
              <BaseSelect
                :model-value="row.unitId"
                :options="unitOptionsFor(i)"
                option-label="name"
                option-value="id"
                placeholder="Pilih satuan..."
                :disabled="row.isBaseUnit || row.unitLinkId !== null"
                :error="errors?.[`units.${i}.unitId`]"
                @update:model-value="row.unitId = $event as string"
              />
              <small v-if="row.isBaseUnit || row.unitLinkId !== null" class="item-form-units__note">
                Satuan terkunci — hapus lalu tambah baru untuk mengganti satuan.
              </small>
            </div>

            <div class="item-form-units__field">
              <span class="item-form-units__label">Faktor Konversi</span>
              <div class="item-form-units__factor">
                <span>1 {{ unitName(row.unitId) || '-' }} =</span>
                <input
                  type="number"
                  class="item-form-units__factor-input"
                  min="0.0001"
                  step="0.0001"
                  :value="row.conversionFactor"
                  :disabled="row.isBaseUnit"
                  @input="row.conversionFactor = Number(($event.target as HTMLInputElement).value)"
                />
                <span>{{ baseUnitName }}</span>
              </div>
              <small v-if="errors?.[`units.${i}.factor`]" class="item-form-units__error">
                {{ errors[`units.${i}.factor`] }}
              </small>
            </div>

            <BaseButton
              v-if="!row.isBaseUnit"
              icon="pi pi-trash"
              variant="danger"
              text
              rounded
              aria-label="Hapus satuan"
              @click="removeRow(i)"
            />
          </div>

          <div class="item-form-units__flags">
            <label class="item-form-units__checkbox">
              <input
                type="checkbox"
                :checked="row.purchaseEnabled"
                @change="togglePurchaseEnabled(row, ($event.target as HTMLInputElement).checked)"
              />
              Bisa Dibeli
            </label>
            <label class="item-form-units__checkbox">
              <input
                type="radio"
                name="default-purchase"
                :checked="row.defaultPurchase"
                :disabled="!row.purchaseEnabled"
                @change="setDefaultPurchase(i)"
              />
              Default Beli
            </label>
            <label class="item-form-units__checkbox">
              <input
                type="checkbox"
                :checked="row.salesEnabled"
                @change="toggleSalesEnabled(row, ($event.target as HTMLInputElement).checked)"
              />
              Bisa Dijual
            </label>
            <label class="item-form-units__checkbox">
              <input
                type="radio"
                name="default-sales"
                :checked="row.defaultSales"
                :disabled="!row.salesEnabled"
                @change="setDefaultSales(i)"
              />
              Default Jual
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseCurrencyInput
              :model-value="row.purchasePrice"
              label="Harga Beli (Rp)"
              placeholder="mis. 1.000,00"
              :disabled="!row.purchaseEnabled"
              :error="errors?.[`units.${i}.purchasePrice`]"
              @update:model-value="row.purchasePrice = $event"
            />
            <div>
              <span class="item-form-units__label">Harga Jual (Rp) — otomatis</span>
              <div class="item-form-units__computed">
                {{ formatCurrency(previewSellingPrice(row)) }}
              </div>
            </div>
          </div>

          <label class="item-form-units__checkbox">
            <input
              type="checkbox"
              :checked="row.marginType !== null"
              @change="onUnitMarginToggle(row, ($event.target as HTMLInputElement).checked)"
            />
            Margin Khusus Satuan Ini — opsional
          </label>

          <div v-if="row.marginType !== null" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span class="item-form-units__label">Jenis Margin</span>
              <BaseSelect
                :model-value="row.marginType"
                :options="MARGIN_TYPE_OPTIONS"
                option-label="label"
                option-value="value"
                @update:model-value="row.marginType = $event as MarginType"
              />
            </div>
            <BaseCurrencyInput
              v-if="row.marginType === 'FIXED'"
              :model-value="row.marginValue"
              label="Nilai Margin (Rp)"
              @update:model-value="row.marginValue = $event"
            />
            <BaseInput
              v-else
              :model-value="row.marginValue ?? ''"
              label="Nilai Margin (%)"
              type="number"
              @update:model-value="(v: string) => onUnitMarginValueInput(row, v)"
            />
          </div>

          <p v-if="row.currentPrice" class="item-form-units__hint">
            Harga aktif: {{ formatCurrency(row.currentPrice.sellingPrice) }}
            (beli {{ formatCurrency(row.currentPrice.purchasePrice) }},
            margin {{ row.currentPrice.marginType ? marginLabel(row.currentPrice.marginType, row.currentPrice.marginValue ?? 0) : 'default' }},
            sejak {{ row.currentPrice.effectiveDate }}).
            Simpan dengan harga beli baru untuk menambah entri harga.
          </p>
        </div>
      </div>

      <BaseButton label="Tambah Satuan" icon="pi pi-plus" variant="ghost" @click="addRow" />
    </section>
  </div>
</template>

<style scoped>
.item-form-units {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.item-form-units__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.item-form-units__section-title {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.item-form-units__rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.item-form-units__row-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  background: var(--surface-0);
}

.item-form-units__row-head {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
}

.item-form-units__field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.item-form-units__label {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.item-form-units__factor {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-sm);
  color: var(--text);
}

.item-form-units__factor-input {
  width: 100px;
  padding: var(--space-2);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: var(--font-sm);
  color: var(--text);
  background: var(--surface-0);
}

.item-form-units__factor-input:disabled {
  background: var(--surface-50, var(--surface-100));
  color: var(--text-muted);
}

.item-form-units__factor-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.item-form-units__flags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.item-form-units__checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.item-form-units__computed {
  margin-top: var(--space-1);
  padding: var(--space-2);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  color: var(--text-muted);
  background: var(--surface-50, var(--surface-0));
}

.item-form-units__note {
  color: var(--text-muted);
  font-size: var(--font-xs);
}

.item-form-units__hint {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.item-form-units__error {
  font-size: var(--font-xs);
  color: var(--color-danger);
}
</style>
