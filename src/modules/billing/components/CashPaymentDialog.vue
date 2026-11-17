<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCurrencyInput from '@/components/base/BaseCurrencyInput.vue'
import { formatCurrency } from '@/utils/format'
import type { Sale } from '../types/billing'
import type { CheckoutPhase, UncertainDisplayReason } from '../composables/usePosCheckout'
import { fromCents, toCents, type PendingCheckout } from '../utils/checkout'

// Dialog bayar tunai (§4.9) + status checkout FE (§6.4, BR-PS-08..10).
const props = defineProps<{
  visible: boolean
  phase: CheckoutPhase
  uncertainReason: UncertainDisplayReason
  /** Total keranjang saat ini (status idle). */
  total: number
  /** Transaksi yang sedang/pernah dikirim (status sending/uncertain). */
  pending: PendingCheckout | null
  sale: Sale | null
  /** Pesan penolakan pasti yang ditampilkan di dialog (BIL_006/007/009, 400). */
  errorMessage: string
}>()

const emit = defineEmits<{
  close: []
  submit: [tendered: number]
  retry: []
  abandon: []
  done: []
}>()

const tendered = ref<number | null>(null)
const confirmingAbandon = ref(false)

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      tendered.value = null
      confirmingAbandon.value = false
    }
  },
)

const changeCents = computed(() => toCents(tendered.value ?? 0) - toCents(props.total))
const enough = computed(() => tendered.value !== null && changeCents.value >= 0)

const UNCERTAIN_TEXT: Record<UncertainDisplayReason, string> = {
  timeout: 'Server tidak menjawab dalam 45 detik.',
  network: 'Koneksi terputus.',
  unavailable: 'Layanan sementara tidak tersedia.',
  unauthorized: 'Sesi berakhir. Masuk kembali lalu lanjutkan transaksi.',
  unknown: 'Hasil transaksi belum diketahui.',
  processing: 'Transaksi sebelumnya masih diproses.',
}

function onVisible(value: boolean) {
  if (value) return
  // Saat mengirim / belum pasti, dialog tidak boleh ditutup (BR-PS-09).
  if (props.phase === 'idle') emit('close')
  else if (props.phase === 'success') emit('done')
}

const header = computed(() => {
  if (props.phase === 'success') return 'Pembayaran Berhasil'
  if (props.phase === 'uncertain') return 'Ada transaksi yang belum pasti'
  return 'Bayar Tunai'
})
</script>

<template>
  <BaseDialog :visible="visible" :header="header" @update:visible="onVisible">
    <!-- SUKSES -->
    <div v-if="phase === 'success' && sale" class="pay">
      <p class="pay__status pay__status--ok">
        <i class="pi pi-check-circle" aria-hidden="true" /> Transaksi {{ sale.saleNumber }} berhasil
      </p>
      <dl class="pay__rows">
        <div><dt>Total</dt><dd>{{ formatCurrency(sale.grandTotal) }}</dd></div>
        <div><dt>Uang diterima</dt><dd>{{ formatCurrency(sale.tenderedAmount) }}</dd></div>
        <div class="pay__row--big"><dt>Kembalian</dt><dd>{{ formatCurrency(sale.changeAmount) }}</dd></div>
      </dl>
    </div>

    <!-- BELUM PASTI -->
    <div v-else-if="phase === 'uncertain' && pending" class="pay">
      <p class="pay__status pay__status--warn">
        <i class="pi pi-exclamation-triangle" aria-hidden="true" />
        {{ UNCERTAIN_TEXT[uncertainReason] }}
      </p>
      <p>
        Status pembayaran belum pasti. <strong>Jangan serahkan barang dan kembalian</strong> sebelum
        status berhasil tampil.
      </p>
      <ul class="pay__lines">
        <li v-for="(line, i) in pending.snapshot.lines" :key="i">
          {{ line.itemName }} · {{ line.unitName }} × {{ line.quantity }}
        </li>
      </ul>
      <dl class="pay__rows">
        <div><dt>Total</dt><dd>{{ formatCurrency(pending.snapshot.total) }}</dd></div>
        <div><dt>Uang diterima</dt><dd>{{ formatCurrency(pending.snapshot.tendered) }}</dd></div>
      </dl>
      <p v-if="confirmingAbandon" class="pay__confirm">
        Transaksi akan diperiksa supervisor saat tutup shift. Yakin meninggalkan transaksi ini?
      </p>
    </div>

    <!-- MENGIRIM -->
    <div v-else-if="phase === 'sending'" class="pay">
      <dl v-if="pending" class="pay__rows">
        <div class="pay__row--big"><dt>Total</dt><dd>{{ formatCurrency(pending.snapshot.total) }}</dd></div>
        <div><dt>Uang diterima</dt><dd>{{ formatCurrency(pending.snapshot.tendered) }}</dd></div>
      </dl>
      <p class="pay__info">
        <i class="pi pi-spin pi-spinner" aria-hidden="true" />
        {{ uncertainReason === 'processing' ? 'Transaksi sedang diproses...' : 'Mengirim transaksi...' }}
      </p>
    </div>

    <!-- SIAP -->
    <div v-else class="pay">
      <dl class="pay__rows">
        <div class="pay__row--big"><dt>Total</dt><dd>{{ formatCurrency(total) }}</dd></div>
      </dl>
      <BaseCurrencyInput v-model="tendered" whole-rupiah label="Uang diterima" required />
      <dl class="pay__rows">
        <div>
          <dt>Kembalian</dt>
          <dd>{{ enough ? formatCurrency(fromCents(changeCents)) : '-' }}</dd>
        </div>
      </dl>
      <p v-if="tendered !== null && !enough" class="pay__error">Uang diterima kurang dari total.</p>
      <p v-if="errorMessage" class="pay__error">{{ errorMessage }}</p>
    </div>

    <template #footer>
      <template v-if="phase === 'success'">
        <BaseButton label="Transaksi Baru" icon="pi pi-plus" @click="emit('done')" />
      </template>
      <template v-else-if="phase === 'uncertain'">
        <template v-if="confirmingAbandon">
          <BaseButton label="Kembali" variant="secondary" @click="confirmingAbandon = false" />
          <BaseButton label="Ya, tinggalkan" variant="danger" @click="emit('abandon')" />
        </template>
        <template v-else>
          <BaseButton
            label="Tinggalkan transaksi"
            variant="secondary"
            @click="confirmingAbandon = true"
          />
          <BaseButton label="Coba lagi" icon="pi pi-refresh" @click="emit('retry')" />
        </template>
      </template>
      <template v-else-if="phase === 'idle'">
        <BaseButton label="Batal" variant="secondary" @click="emit('close')" />
        <BaseButton
          label="Proses"
          icon="pi pi-check"
          :disabled="!enough"
          @click="tendered !== null && emit('submit', tendered)"
        />
      </template>
    </template>
  </BaseDialog>
</template>

<style scoped>
.pay {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  color: var(--text);
}

.pay__rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
}

.pay__rows > div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

.pay__rows dt {
  color: var(--text-muted);
}

.pay__rows dd {
  margin: 0;
  font-weight: var(--font-weight-heading);
}

.pay__row--big dd {
  font-size: var(--font-2xl);
}

.pay__lines {
  margin: 0;
  padding-left: var(--space-4);
  font-size: var(--font-sm);
}

.pay__status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: var(--font-weight-heading);
}

.pay__status--ok {
  color: var(--color-success);
}

.pay__status--warn {
  color: var(--color-warning);
}

.pay__confirm {
  font-weight: var(--font-weight-heading);
  color: var(--color-danger);
}

.pay__error {
  font-size: var(--font-sm);
  color: var(--color-danger);
}

.pay__info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-muted);
}
</style>
