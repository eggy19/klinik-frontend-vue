<script setup lang="ts">
import { computed, onMounted } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { useMarginSettingStore } from '../../stores/margin-setting.store'
import type { CurrentItemPrice, ItemInput } from '../../types/item'
import type { Unit } from '../../types/unit'

const props = defineProps<{
  form: ItemInput
  units: Unit[]
  currentPrice?: CurrentItemPrice | null
  errors?: Record<string, string>
}>()

const marginSettingStore = useMarginSettingStore()

const defaultMarginPercentage = computed(() =>
  props.form.prescriptionRequired
    ? marginSettingStore.setting.marginResepPercentage
    : marginSettingStore.setting.marginOtcPercentage,
)

const hasOverride = computed(
  () => props.form.marginPercentage !== null && props.form.marginPercentage !== undefined,
)

// Margin yang benar-benar dipakai: override per item kalau diisi, kalau tidak
// jatuh ke default OTC/Resep branch. Backend memakai logika yang sama persis
// (ItemPriceService.resolveMarginPercentage) — ini cuma preview di client.
const effectiveMarginPercentage = computed(() =>
  hasOverride.value ? (props.form.marginPercentage as number) : defaultMarginPercentage.value,
)

const previewSellingPrice = computed(() => {
  const purchase = Number(props.form.purchasePrice) || 0
  return Math.round(purchase * (1 + effectiveMarginPercentage.value / 100) * 100) / 100
})

const defaultUnitName = computed(
  () => props.units.find((u) => u.id === props.form.defaultUnitId)?.name ?? '-',
)

function onMarginOverrideInput(value: string) {
  props.form.marginPercentage = value === '' ? null : Number(value)
}

onMounted(() => {
  marginSettingStore.fetch()
})
</script>

<template>
  <div class="item-form-prices">
    <p class="item-form-prices__hint">
      Harga berlaku per item untuk satuan dasar (<strong>{{ defaultUnitName }}</strong>) — belum
      mendukung harga berbeda per satuan lain.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BaseInput
        v-model="form.purchasePrice"
        label="Harga Beli (Rp)"
        type="number"
        placeholder="mis. 1000"
        :error="errors?.purchasePrice"
      />
      <div>
        <span class="item-form-prices__label">Harga Jual (Rp) — otomatis</span>
        <div class="item-form-prices__computed">
          {{ previewSellingPrice.toLocaleString('id-ID') }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BaseInput
        :model-value="form.marginPercentage ?? ''"
        label="Margin Khusus Item Ini (%) — opsional"
        type="number"
        :placeholder="'Kosongkan untuk pakai default ' + (form.prescriptionRequired ? 'Resep' : 'OTC') + ' (' + defaultMarginPercentage + '%)'"
        :error="errors?.marginPercentage"
        @update:model-value="onMarginOverrideInput"
      />
      <p class="item-form-prices__hint item-form-prices__margin-note">
        <template v-if="hasOverride">
          Memakai margin khusus item: <strong>{{ effectiveMarginPercentage }}%</strong> (bukan
          default {{ form.prescriptionRequired ? 'Resep' : 'OTC' }}
          {{ defaultMarginPercentage }}%).
        </template>
        <template v-else>
          Memakai default {{ form.prescriptionRequired ? 'Resep' : 'OTC' }}:
          <strong>{{ defaultMarginPercentage }}%</strong>. Ubah default di menu Pengaturan
          Margin.
        </template>
      </p>
    </div>

    <p v-if="currentPrice" class="item-form-prices__hint">
      Harga aktif saat ini: Rp{{ currentPrice.sellingPrice.toLocaleString('id-ID') }}
      (harga beli Rp{{ currentPrice.purchasePrice.toLocaleString('id-ID') }}, margin
      {{ currentPrice.marginPercentage }}%, berlaku sejak {{ currentPrice.effectiveDate }}).
      Simpan dengan harga beli baru untuk menambah entri harga.
    </p>
  </div>
</template>

<style scoped>
.item-form-prices {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.item-form-prices__label {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.item-form-prices__computed {
  margin-top: var(--space-1);
  padding: var(--space-2);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  color: var(--text-muted);
  background: var(--surface-50, var(--surface-0));
}

.item-form-prices__hint {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.item-form-prices__margin-note {
  display: flex;
  align-items: center;
}
</style>
