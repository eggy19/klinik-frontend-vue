<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { itemApi } from '@/modules/inventory/api/item.api'
import { useSupplierStore } from '@/modules/inventory/stores/supplier.store'
import { useUnitStore } from '@/modules/inventory/stores/unit.store'
import type { Item } from '@/modules/inventory/types/item'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { formatDateTime } from '@/utils/format'
import { usePurchaseOrderStore } from '../stores/purchase-order.store'
import PurchaseOrderItemsTable from '../components/po-form/PurchaseOrderItemsTable.vue'
import PurchaseOrderTotals from '../components/po-form/PurchaseOrderTotals.vue'
import { emptyPurchaseOrder, type PurchaseOrderInput } from '../types/purchase-order'

const route = useRoute()
const router = useRouter()
const toast = useToastFeedback()
const store = usePurchaseOrderStore()

const supplierStore = useSupplierStore()
const unitStore = useUnitStore()

const isEditMode = computed(() => !!route.params.id)
const pageTitle = computed(() => (isEditMode.value ? 'Edit Purchase Order' : 'Buat Purchase Order'))

const form = reactive<PurchaseOrderInput>(emptyPurchaseOrder())
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)
const loadingPo = ref(false)
const supplierItems = ref<Item[]>([])

// Data tampilan-saja untuk mode edit — bukan bagian dari form/PurchaseOrderInput
// karena poNumber/createdAt dibuat server-side dan tidak pernah dikirim balik.
const poNumber = ref<string | null>(null)
const poCreatedAt = ref<string | null>(null)

const selectedSupplier = computed(
  () => supplierStore.items.find((s) => s.id === form.supplierId) ?? null,
)

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.supplierId) e.supplierId = 'Supplier wajib dipilih.'
  if (form.items.length === 0) {
    e.items = 'Tambahkan minimal satu item.'
  } else {
    form.items.forEach((row, i) => {
      if (!row.itemId) e[`items.${i}.itemId`] = 'Item wajib dipilih.'
      if (!row.unitId) e[`items.${i}.unitId`] = 'Satuan wajib dipilih.'
      if (row.quantity <= 0) e[`items.${i}.quantity`] = 'Qty harus lebih dari 0.'
      if (row.unitPrice < 0) e[`items.${i}.unitPrice`] = 'Harga tidak boleh negatif.'
    })
    const seen = new Set<string>()
    for (const row of form.items) {
      const key = `${row.itemId}:${row.unitId}`
      if (row.itemId && seen.has(key)) {
        e.items = 'Ada item dengan satuan yang sama pada lebih dari satu baris.'
        break
      }
      seen.add(key)
    }
  }

  Object.keys(errors).forEach((k) => delete errors[k])
  Object.assign(errors, e)
  return Object.keys(e).length === 0
}

async function save(): Promise<string | null> {
  if (!validate()) return null
  submitting.value = true
  try {
    if (isEditMode.value) {
      const id = route.params.id as string
      await store.update(id, { ...form, items: form.items.map((i) => ({ ...i })) })
      return id
    }
    const created = await store.create({ ...form, items: form.items.map((i) => ({ ...i })) })
    return created.id
  } finally {
    submitting.value = false
  }
}

async function onSaveDraft() {
  try {
    const id = await save()
    if (!id) return
    toast.success('Purchase order berhasil disimpan sebagai draft.')
    router.push(`/inventory/purchase-orders/${id}`)
  } catch {
    toast.error()
  }
}

async function onSaveAndSubmit() {
  try {
    const id = await save()
    if (!id) return
    await store.submit(id)
    toast.success('Purchase order berhasil disimpan dan diajukan.')
    router.push(`/inventory/purchase-orders/${id}`)
  } catch {
    toast.error()
  }
}

function goBack() {
  router.push('/inventory/purchase-orders')
}

async function loadSupplierItems(supplierId: string) {
  if (!supplierId) {
    supplierItems.value = []
    return
  }
  try {
    supplierItems.value = await itemApi.getAllForSupplier(supplierId)
  } catch {
    supplierItems.value = []
  }
}

watch(
  () => form.supplierId,
  (id, prevId) => {
    loadSupplierItems(id)
    // Ganti supplier di tengah pengisian akan membuat baris item lama tidak
    // valid lagi (item mungkin tidak terdaftar pada supplier baru) — reset.
    if (prevId && id !== prevId) {
      form.items = []
    }
  },
)

onMounted(async () => {
  await Promise.allSettled([
    supplierStore.items.length === 0 ? supplierStore.fetchAll() : Promise.resolve(),
    unitStore.items.length === 0 ? unitStore.fetchAll() : Promise.resolve(),
  ])

  if (isEditMode.value) {
    loadingPo.value = true
    try {
      const id = route.params.id as string
      const po = await store.fetchOne(id)
      if (po.status !== 'DRAFT') {
        toast.error('Hanya purchase order berstatus Draft yang dapat diedit.')
        router.push(`/inventory/purchase-orders/${id}`)
        return
      }
      poNumber.value = po.poNumber
      poCreatedAt.value = po.createdAt
      await loadSupplierItems(po.supplierId)
      Object.assign(form, {
        supplierId: po.supplierId,
        note: po.note,
        items: po.items.map((i) => ({
          itemId: i.itemId,
          unitId: i.unitId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      })
    } catch {
      toast.error('Gagal memuat data purchase order.')
      router.push('/inventory/purchase-orders')
    } finally {
      loadingPo.value = false
    }
  }
})
</script>

<template>
  <div class="po-form-view">
    <div class="po-form-view__head">
      <BaseButton icon="pi pi-arrow-left" label="Kembali" variant="ghost" @click="goBack" />
      <h1 class="po-form-view__title">{{ pageTitle }}</h1>
    </div>

    <div v-if="loadingPo" class="po-form-view__loading">Memuat data...</div>

    <template v-else>
      <div class="po-form-view__grid">
        <div class="po-form-view__main">
          <BaseCard>
            <template #header>
              <span class="po-form-view__section-title">Informasi Supplier</span>
            </template>
            <div class="po-form-view__fields">
              <BaseSelect
                v-model="form.supplierId"
                :options="supplierStore.items"
                option-label="name"
                option-value="id"
                label="Supplier"
                placeholder="Pilih supplier..."
                required
                filter
                :error="errors.supplierId"
              />
              <div v-if="selectedSupplier" class="po-form-view__supplier-preview">
                <p><i class="pi pi-map-marker" aria-hidden="true" /> {{ selectedSupplier.address || '-' }}</p>
                <p v-if="selectedSupplier.phone"><i class="pi pi-phone" aria-hidden="true" /> {{ selectedSupplier.phone }}</p>
                <p v-if="selectedSupplier.email"><i class="pi pi-envelope" aria-hidden="true" /> {{ selectedSupplier.email }}</p>
              </div>
            </div>
          </BaseCard>

          <BaseCard>
            <template #header>
              <span class="po-form-view__section-title">Detail Transaksi</span>
            </template>
            <div class="po-form-view__fields">
              <div v-if="isEditMode" class="po-form-view__meta">
                <div>
                  <span class="po-form-view__meta-label">Nomor PO</span>
                  <span class="po-form-view__meta-value">{{ poNumber }}</span>
                </div>
                <div>
                  <span class="po-form-view__meta-label">Tanggal Dibuat</span>
                  <span class="po-form-view__meta-value">{{ formatDateTime(poCreatedAt) }}</span>
                </div>
              </div>
              <p v-else class="po-form-view__hint">Nomor PO akan dibuat otomatis setelah disimpan.</p>

              <div class="po-form-view__note">
                <label class="po-form-view__note-label" for="po-note">Catatan</label>
                <textarea id="po-note" v-model="form.note" class="po-form-view__textarea" rows="2" />
              </div>
            </div>
          </BaseCard>

          <BaseCard>
            <template #header>
              <span class="po-form-view__section-title">Item</span>
            </template>
            <PurchaseOrderItemsTable
              :form="form"
              :items="supplierItems"
              :units="unitStore.items"
              :errors="errors"
            />
          </BaseCard>
        </div>

        <div class="po-form-view__side">
          <BaseCard>
            <template #header>
              <span class="po-form-view__section-title">Ringkasan Biaya</span>
            </template>
            <PurchaseOrderTotals :items="form.items" />
          </BaseCard>
        </div>
      </div>

      <div class="po-form-view__footer">
        <BaseButton label="Batal" variant="ghost" @click="goBack" />
        <BaseButton label="Simpan Draft" variant="secondary" :loading="submitting" @click="onSaveDraft" />
        <BaseButton label="Simpan & Submit" :loading="submitting" @click="onSaveAndSubmit" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.po-form-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.po-form-view__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.po-form-view__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.po-form-view__section-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.po-form-view__grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-6);
  align-items: start;
}

.po-form-view__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.po-form-view__side {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

@media (max-width: 1023px) {
  .po-form-view__grid {
    grid-template-columns: 1fr;
  }
}

.po-form-view__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.po-form-view__supplier-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--surface-0);
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.po-form-view__supplier-preview p {
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.po-form-view__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-3);
}

.po-form-view__meta-label {
  display: block;
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.po-form-view__meta-value {
  display: block;
  color: var(--text);
  font-weight: var(--font-weight-heading);
}

.po-form-view__hint {
  margin: 0;
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.po-form-view__note {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.po-form-view__note-label {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.po-form-view__textarea {
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

.po-form-view__textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.po-form-view__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.po-form-view__loading {
  color: var(--text-muted);
  font-size: var(--font-sm);
}
</style>
