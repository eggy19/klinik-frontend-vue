<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import { formatCurrency } from '@/utils/format'
import { lineProblem, parseQty, type CartLine } from '../composables/usePosCart'
import { fromCents, toCents } from '../utils/checkout'

defineProps<{
  lines: CartLine[]
  total: number
  /** Dikunci saat mengirim atau status belum pasti (BR-PS-09). */
  locked: boolean
  canPay: boolean
  hasPriceChange: boolean
}>()

const emit = defineEmits<{
  step: [line: CartLine, delta: number]
  qty: [line: CartLine, value: string]
  remove: [key: string]
  pay: []
  confirmPrices: []
}>()

function lineTotal(line: CartLine): number {
  return fromCents(Math.round((parseQty(line) ?? 0) * toCents(line.unitPrice)))
}
</script>

<template>
  <div class="pos-cart">
    <BaseEmptyState
      v-if="lines.length === 0"
      icon="pi pi-shopping-cart"
      title="Keranjang kosong"
      description="Cari obat lalu tekan Tambah."
    />

    <ul v-else class="pos-cart__list">
      <li v-for="line in lines" :key="line.key" class="cart-line">
        <div class="cart-line__info">
          <span class="cart-line__name">{{ line.itemName }}</span>
          <span class="cart-line__meta">
            {{ line.unitName }} · {{ formatCurrency(line.unitPrice) }}
            <BaseTag v-if="line.restriction === 'WARNING'" variant="warning" value="Obat keras" />
          </span>
          <small v-if="line.priceChange" class="cart-line__warn">
            Harga berubah: {{ formatCurrency(line.priceChange.oldPrice) }} menjadi
            {{ formatCurrency(line.unitPrice) }}
          </small>
          <small v-if="line.serverError" class="cart-line__error">{{ line.serverError }}</small>
          <small v-else-if="lineProblem(line)" class="cart-line__error">{{ lineProblem(line) }}</small>
        </div>

        <div class="cart-line__qty">
          <BaseButton
            icon="pi pi-minus"
            variant="secondary"
            size="small"
            rounded
            aria-label="Kurangi"
            :disabled="locked"
            @click="emit('step', line, -1)"
          />
          <BaseInput
            :model-value="line.qtyText"
            type="text"
            :disabled="locked"
            class="cart-line__qty-input"
            @update:model-value="emit('qty', line, $event)"
          />
          <BaseButton
            icon="pi pi-plus"
            variant="secondary"
            size="small"
            rounded
            aria-label="Tambah"
            :disabled="locked"
            @click="emit('step', line, 1)"
          />
        </div>

        <span class="cart-line__total">{{ formatCurrency(lineTotal(line)) }}</span>

        <BaseButton
          icon="pi pi-trash"
          variant="danger"
          size="small"
          text
          rounded
          aria-label="Hapus"
          :disabled="locked"
          @click="emit('remove', line.key)"
        />
      </li>
    </ul>

    <div class="pos-cart__footer">
      <div class="pos-cart__total">
        <span>TOTAL</span>
        <strong>{{ formatCurrency(total) }}</strong>
      </div>
      <BaseButton
        v-if="hasPriceChange"
        label="Konfirmasi harga baru"
        icon="pi pi-check"
        variant="warning"
        :disabled="locked"
        @click="emit('confirmPrices')"
      />
      <BaseButton
        label="Bayar"
        icon="pi pi-wallet"
        :disabled="locked || !canPay"
        @click="emit('pay')"
      />
    </div>
  </div>
</template>

<style scoped>
.pos-cart {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.pos-cart__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.cart-line {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  align-items: center;
  gap: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border);
}

.cart-line__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.cart-line__name {
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.cart-line__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.cart-line__warn {
  color: var(--color-warning-text);
}

.cart-line__error {
  color: var(--color-danger);
}

.cart-line__qty {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.cart-line__qty-input {
  width: 4.5rem;
}

.cart-line__total {
  min-width: 6rem;
  text-align: right;
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.pos-cart__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-4);
}

.pos-cart__total {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  margin-right: auto;
  color: var(--text);
}

.pos-cart__total strong {
  font-size: var(--font-2xl);
}

/* Layar sempit: baris keranjang bertumpuk (docs/07). */
@media (max-width: 767px) {
  .cart-line {
    grid-template-columns: 1fr auto;
  }
}
</style>
