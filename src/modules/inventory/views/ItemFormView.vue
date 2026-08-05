<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { itemApi } from '../api/item.api'
import { useItemTypeStore } from '../stores/item-type.store'
import { useCategoryStore } from '../stores/category.store'
import { useUnitStore } from '../stores/unit.store'
import { useSupplierStore } from '../stores/supplier.store'
import { useDrugGroupStore } from '../stores/drug-group.store'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { emptyItem, type ItemInput, type ItemUnitRow } from '../types/item'
import ItemFormBasic from '../components/item-form/ItemFormBasic.vue'
import ItemFormStock from '../components/item-form/ItemFormStock.vue'
import ItemFormSuppliers from '../components/item-form/ItemFormSuppliers.vue'
import ItemFormUnits from '../components/item-form/ItemFormUnits.vue'

const route = useRoute()
const router = useRouter()
const toast = useToastFeedback()

const itemTypeStore = useItemTypeStore()
const categoryStore = useCategoryStore()
const unitStore = useUnitStore()
const supplierStore = useSupplierStore()
const drugGroupStore = useDrugGroupStore()

const isEditMode = computed(() => !!route.params.id)
const pageTitle = computed(() => (isEditMode.value ? 'Edit Item' : 'Tambah Item'))

const form = reactive<ItemInput>(emptyItem())
const errors = reactive<Record<string, string>>({})
const submitting = reactive({ value: false })
const loadingItem = reactive({ value: false })
// Snapshot baris satuan seperti dimuat dari server — dipakai untuk diff saat
// simpan (baris mana yang baru/berubah/dihapus), bukan untuk ditampilkan.
const loadedUnits = ref<ItemUnitRow[]>([])

// Satuan dasar item selalu mengikuti dropdown "Satuan Default" di Info Dasar
// (baris base di tab Satuan & Harga cuma representasi baris pertama). Cuma
// relevan di mode create — di mode edit satuan dasar sudah terkunci di server.
watch(
  () => form.defaultUnitId,
  (newId) => {
    if (isEditMode.value) return
    const base = form.units.find((u) => u.isBaseUnit)
    if (base) base.unitId = newId
  },
)

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.itemCode.trim()) e.itemCode = 'Kode item wajib diisi.'
  if (!form.itemName.trim()) e.itemName = 'Nama item wajib diisi.'
  if (!form.itemTypeId) e.itemTypeId = 'Tipe item wajib dipilih.'
  if (!form.categoryId) e.categoryId = 'Kategori wajib dipilih.'
  if (!form.defaultUnitId) e.defaultUnitId = 'Satuan default wajib dipilih.'
  if (form.minimumStock < 0) e.minimumStock = 'Min stok tidak boleh negatif.'
  if (form.marginValue !== null && form.marginValue < 0) {
    e.marginValue = 'Margin tidak boleh negatif.'
  }

  if (!form.units.some((u) => u.isBaseUnit)) {
    e.units = 'Satuan dasar wajib ada.'
  }

  const seenUnitIds = new Set<string>()
  form.units.forEach((row, i) => {
    if (!row.unitId) {
      e[`units.${i}.unitId`] = 'Satuan wajib dipilih.'
    } else if (seenUnitIds.has(row.unitId)) {
      e[`units.${i}.unitId`] = 'Satuan sudah dipakai baris lain.'
    } else {
      seenUnitIds.add(row.unitId)
    }
    if (!(row.conversionFactor > 0)) {
      e[`units.${i}.factor`] = 'Faktor harus lebih dari 0.'
    }
    if (row.purchasePrice !== null && row.purchasePrice < 0) {
      e[`units.${i}.purchasePrice`] = 'Harga beli tidak boleh negatif.'
    }
  })

  const purchaseEnabledRows = form.units.filter((u) => u.purchaseEnabled)
  if (purchaseEnabledRows.length > 0 && !purchaseEnabledRows.some((u) => u.defaultPurchase)) {
    e.units = 'Pilih satu satuan sebagai Default Beli.'
  }
  const salesEnabledRows = form.units.filter((u) => u.salesEnabled)
  if (salesEnabledRows.length > 0 && !salesEnabledRows.some((u) => u.defaultSales)) {
    e.units = 'Pilih satu satuan sebagai Default Jual.'
  }

  Object.keys(errors).forEach((k) => delete errors[k])
  Object.assign(errors, e)
  return Object.keys(e).length === 0
}

/**
 * Sinkronkan baris master_item_unit (+ harga) ke server: baris baru -> POST,
 * baris tersimpan yang faktor/flag-nya berubah -> PATCH, baris yang hilang
 * dari form -> DELETE, lalu baris dengan harga beli baru/berubah -> POST
 * /prices. Dijalankan berurutan (bukan Promise.all) supaya unitLinkId baris
 * yang baru dibuat sudah tersedia sebelum dipakai menambah harganya.
 */
async function syncUnits(itemId: string) {
  for (const row of form.units) {
    if (row.unitLinkId === null) {
      const created = await itemApi.addUnit(itemId, {
        unitId: row.unitId,
        isBaseUnit: row.isBaseUnit,
        conversionFactor: row.conversionFactor,
        purchaseEnabled: row.purchaseEnabled,
        salesEnabled: row.salesEnabled,
        defaultPurchase: row.defaultPurchase,
        defaultSales: row.defaultSales,
      })
      row.unitLinkId = created.unitLinkId
    }
  }

  for (const row of form.units) {
    if (row.unitLinkId === null) continue
    const before = loadedUnits.value.find((u) => u.unitLinkId === row.unitLinkId)
    if (!before) continue // baru dibuat di loop atas, belum ada snapshot lama untuk dibandingkan
    const changed =
      before.conversionFactor !== row.conversionFactor ||
      before.purchaseEnabled !== row.purchaseEnabled ||
      before.salesEnabled !== row.salesEnabled ||
      before.defaultPurchase !== row.defaultPurchase ||
      before.defaultSales !== row.defaultSales
    if (changed) {
      await itemApi.updateUnit(itemId, row.unitLinkId, {
        conversionFactor: row.conversionFactor,
        purchaseEnabled: row.purchaseEnabled,
        salesEnabled: row.salesEnabled,
        defaultPurchase: row.defaultPurchase,
        defaultSales: row.defaultSales,
      })
    }
  }

  const currentLinkIds = new Set(
    form.units.map((u) => u.unitLinkId).filter((id): id is string => id !== null),
  )
  for (const before of loadedUnits.value) {
    if (before.unitLinkId && !currentLinkIds.has(before.unitLinkId)) {
      await itemApi.removeUnit(itemId, before.unitLinkId)
    }
  }

  for (const row of form.units) {
    if (row.unitLinkId === null) continue
    const purchasePrice = row.purchasePrice ?? 0
    if (purchasePrice <= 0) continue
    const before = row.currentPrice
    const priceChanged =
      !before ||
      before.purchasePrice !== purchasePrice ||
      before.marginType !== row.marginType ||
      before.marginValue !== row.marginValue
    if (priceChanged) {
      await itemApi.addUnitPrice(itemId, row.unitLinkId, {
        purchasePrice,
        marginType: row.marginType,
        marginValue: row.marginValue,
      })
    }
  }
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true

  let itemId: string
  try {
    if (isEditMode.value) {
      itemId = route.params.id as string
      await itemApi.update(itemId, { ...form })
    } else {
      const created = await itemApi.create({ ...form })
      itemId = created.id
    }
  } catch {
    toast.error()
    submitting.value = false
    return
  }

  try {
    if (!isEditMode.value) {
      // Baris satuan dasar otomatis terdaftar backend saat item dibuat —
      // cocokkan lewat unitId dulu supaya syncUnits tidak addUnit dobel (INV_026).
      const serverUnits = await itemApi.getUnits(itemId)
      for (const row of form.units) {
        if (row.unitLinkId === null) {
          const match = serverUnits.find((u) => u.unitId === row.unitId)
          if (match) row.unitLinkId = match.unitLinkId
        }
      }
      loadedUnits.value = serverUnits
    }
    await syncUnits(itemId)
  } catch {
    try {
      const refreshed = await itemApi.getUnits(itemId)
      form.units = refreshed
      loadedUnits.value = refreshed.map((u) => ({ ...u }))
    } catch {
      // Resync pun gagal — biarkan form apa adanya, user bisa memuat ulang manual.
    }
    toast.error('Item tersimpan, tetapi sinkronisasi satuan & harga gagal. Periksa kembali data di bawah.')
    submitting.value = false
    return
  }

  toast.success(isEditMode.value ? 'Item berhasil diperbarui.' : 'Item berhasil ditambahkan.')
  router.push('/inventory/master-data/obat')
  submitting.value = false
}

function goBack() {
  router.push('/inventory/master-data/obat')
}

onMounted(async () => {
  await Promise.allSettled([
    itemTypeStore.items.length === 0 ? itemTypeStore.fetchAll() : Promise.resolve(),
    categoryStore.items.length === 0 ? categoryStore.fetchAll() : Promise.resolve(),
    unitStore.items.length === 0 ? unitStore.fetchAll() : Promise.resolve(),
    supplierStore.items.length === 0 ? supplierStore.fetchAll() : Promise.resolve(),
    drugGroupStore.items.length === 0 ? drugGroupStore.fetchAll() : Promise.resolve(),
  ])

  if (isEditMode.value) {
    loadingItem.value = true
    try {
      const id = route.params.id as string
      // Supplier & satuan (dengan harga aktifnya masing-masing) disediakan
      // backend lewat endpoint terpisah, bukan bagian dari response detail item.
      const [item, suppliers, units] = await Promise.all([
        itemApi.getById(id),
        itemApi.getSuppliers(id).catch(() => []),
        itemApi.getUnits(id).catch(() => []),
      ])

      // Backend tidak menyimpan itemTypeId di item — turunkan dari kategorinya
      // agar dropdown Tipe Item & Kategori ter-render.
      const itemTypeId =
        item.itemTypeId ||
        categoryStore.items.find((c) => c.id === item.categoryId)?.itemTypeId ||
        ''

      Object.assign(form, {
        itemCode: item.itemCode,
        itemName: item.itemName,
        itemTypeId,
        categoryId: item.categoryId,
        defaultUnitId: item.defaultUnitId,
        drugGroupId: item.drugGroupId,
        barcode: item.barcode,
        skuCode: item.skuCode,
        minimumStock: item.minimumStock,
        maximumStock: item.maximumStock,
        reorderPoint: item.reorderPoint,
        trackBatch: item.trackBatch,
        trackExpiry: item.trackExpiry,
        prescriptionRequired: item.prescriptionRequired,
        marginType: item.marginType,
        marginValue: item.marginValue,
        suppliers,
        units: units.map((u) => ({ ...u })),
      })
      loadedUnits.value = units.map((u) => ({ ...u }))
    } catch {
      toast.error('Gagal memuat data item.')
      router.push('/inventory/master-data/obat')
    } finally {
      loadingItem.value = false
    }
  }
})
</script>

<template>
  <div class="item-form-view">
    <div class="item-form-view__head">
      <BaseButton
        icon="pi pi-arrow-left"
        label="Kembali"
        variant="ghost"
        @click="goBack"
      />
      <h1 class="item-form-view__title">{{ pageTitle }}</h1>
    </div>

    <div v-if="loadingItem.value" class="item-form-view__loading">
      Memuat data...
    </div>

    <template v-else>
      <!-- Info Dasar — selalu tampil di atas -->
      <BaseCard>
        <template #header>
          <span class="item-form-view__section-title">Info Dasar</span>
        </template>
        <ItemFormBasic
          :form="form"
          :errors="errors"
          :is-edit-mode="isEditMode"
          :item-types="itemTypeStore.items"
          :categories="categoryStore.items"
          :units="unitStore.items"
          :drug-groups="drugGroupStore.items"
        />
      </BaseCard>

      <!-- Tab detail di bawah Info Dasar -->
      <BaseCard>
        <Tabs value="stok">
          <TabList>
            <Tab value="stok">Stok</Tab>
            <Tab value="supplier">Supplier</Tab>
            <Tab value="satuan">Satuan & Harga</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="stok">
              <div class="item-form-view__tab-content">
                <ItemFormStock :form="form" :errors="errors" />
              </div>
            </TabPanel>
            <TabPanel value="supplier">
              <div class="item-form-view__tab-content">
                <ItemFormSuppliers :form="form" :suppliers="supplierStore.items" />
              </div>
            </TabPanel>
            <TabPanel value="satuan">
              <div class="item-form-view__tab-content">
                <ItemFormUnits :form="form" :units="unitStore.items" :errors="errors" />
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </BaseCard>

      <!-- Footer aksi -->
      <div class="item-form-view__footer">
        <BaseButton label="Batal" variant="ghost" @click="goBack" />
        <BaseButton label="Simpan" :loading="submitting.value" @click="onSubmit" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.item-form-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.item-form-view__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.item-form-view__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.item-form-view__section-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-heading);
  color: var(--text);
}

.item-form-view__tab-content {
  padding: var(--space-4) 0;
}

.item-form-view__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.item-form-view__loading {
  color: var(--text-muted);
  font-size: var(--font-sm);
}
</style>
