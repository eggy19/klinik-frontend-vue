<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { formatDateTimeWib, formatReceiptAmount, formatShortDateTimeWib } from '@/utils/format'
import type { Sale } from '../types/billing'
import type { ReceiptWidth } from '../composables/useReceiptWidth'
import '../styles/receipt-print.css'

// Struk kasir (billing-mvp-spec §4.8, BR-RC-01..10). Tidak tampil di layar; hanya tercetak
// lewat window.print() karena di-teleport ke <body> (lihat styles/receipt-print.css).
// Sengaja tidak memuat field BR-RC-09 (harga beli, batch, ED, dispensingNumber, golongan, penanda obat keras).
const props = defineProps<{
  sale: Sale
  /** Cadangan header bila `receipt.header` kosong (BR-RC-04). */
  branchName: string
  width: ReceiptWidth
  /** Diisi = cetak ulang: tambah penanda SALINAN + waktu cetak (BR-RC-08). */
  copyPrintedAt?: Date | null
}>()

// Aturan cetak "hanya struk" aktif selama struk PAID ter-mount (lihat styles/receipt-print.css).
const PRINT_CLASS = 'printing-receipt'
watch(
  () => props.sale.status === 'PAID',
  (printable) => document.documentElement.classList.toggle(PRINT_CLASS, printable),
  { immediate: true },
)
onBeforeUnmount(() => document.documentElement.classList.remove(PRINT_CLASS))

function textLines(text: string | null | undefined): string[] {
  const trimmed = (text ?? '').trim()
  return trimmed ? trimmed.split(/\r?\n/) : []
}

const headerLines = computed(() => {
  const lines = textLines(props.sale.receipt?.header)
  return lines.length > 0 ? lines : [props.branchName]
})
const footerLines = computed(() => textLines(props.sale.receipt?.footer))
const showTax = computed(() => props.sale.taxRate > 0)
const taxRateText = computed(() =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(props.sale.taxRate),
)

function qtyText(value: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 }).format(value)
}
</script>

<template>
  <!-- BR-RC-01: hanya sale PAID yang bisa dicetak. -->
  <Teleport v-if="sale.status === 'PAID'" to="body">
    <div class="receipt-print" :class="`receipt-print--w${width}`" aria-hidden="true">
      <div class="receipt-print__head">
        <p v-for="(line, i) in headerLines" :key="i" class="receipt-print__line">{{ line }}</p>
      </div>
      <hr class="receipt-print__rule" />

      <p class="receipt-print__line"><span class="receipt-print__label">No</span>: {{ sale.saleNumber ?? '-' }}</p>
      <p class="receipt-print__line">
        <span class="receipt-print__label">Tgl</span>: {{ formatDateTimeWib(sale.paidAt) }} (WIB)
      </p>
      <p class="receipt-print__line"><span class="receipt-print__label">Kasir</span>: {{ sale.cashierName ?? '-' }}</p>
      <p v-if="sale.customerName" class="receipt-print__line">
        <span class="receipt-print__label">Plg</span>: {{ sale.customerName }}
      </p>
      <hr class="receipt-print__rule" />

      <div v-for="item in sale.items" :key="item.lineNo">
        <p class="receipt-print__item-name">{{ item.itemName }}</p>
        <div class="receipt-print__row">
          <span class="receipt-print__indent">
            {{ qtyText(item.quantity) }} {{ item.unitName }} x {{ formatReceiptAmount(item.unitPrice) }}
          </span>
          <span>{{ formatReceiptAmount(item.lineTotal) }}</span>
        </div>
      </div>
      <hr class="receipt-print__rule" />

      <div class="receipt-print__row receipt-print__strong">
        <span>TOTAL</span><span>{{ formatReceiptAmount(sale.grandTotal) }}</span>
      </div>
      <div class="receipt-print__row">
        <span>Tunai</span><span>{{ formatReceiptAmount(sale.tenderedAmount) }}</span>
      </div>
      <div class="receipt-print__row">
        <span>Kembalian</span><span>{{ formatReceiptAmount(sale.changeAmount) }}</span>
      </div>
      <!-- BR-RC-06: baris PPN hanya bila tax_rate > 0. -->
      <div v-if="showTax" class="receipt-print__row">
        <span>Harga sudah termasuk PPN {{ taxRateText }}%:</span>
        <span>{{ formatReceiptAmount(sale.taxTotal) }}</span>
      </div>

      <!-- BR-RC-04: footer kosong tidak dicetak. -->
      <template v-if="footerLines.length > 0">
        <hr class="receipt-print__rule" />
        <div class="receipt-print__foot">
          <p v-for="(line, i) in footerLines" :key="i" class="receipt-print__line">{{ line }}</p>
        </div>
      </template>

      <p v-if="copyPrintedAt" class="receipt-print__copy">
        *** SALINAN · dicetak {{ formatShortDateTimeWib(copyPrintedAt) }} ***
      </p>
    </div>
  </Teleport>
</template>
