<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
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
import { useToastFeedback } from '@/composables/useToastFeedback'
import { emptyItem, type ItemInput } from '../types/item'
import ItemFormBasic from '../components/item-form/ItemFormBasic.vue'
import ItemFormStock from '../components/item-form/ItemFormStock.vue'
import ItemFormSuppliers from '../components/item-form/ItemFormSuppliers.vue'
import ItemFormPrices from '../components/item-form/ItemFormPrices.vue'
import ItemFormConversions from '../components/item-form/ItemFormConversions.vue'

const route = useRoute()
const router = useRouter()
const toast = useToastFeedback()

const itemTypeStore = useItemTypeStore()
const categoryStore = useCategoryStore()
const unitStore = useUnitStore()
const supplierStore = useSupplierStore()

const isEditMode = computed(() => !!route.params.id)
const pageTitle = computed(() => (isEditMode.value ? 'Edit Item' : 'Tambah Item'))

const form = reactive<ItemInput>(emptyItem())
const errors = reactive<Record<string, string>>({})
const submitting = reactive({ value: false })
const loadingItem = reactive({ value: false })

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.itemCode.trim()) e.itemCode = 'Kode item wajib diisi.'
  if (!form.itemName.trim()) e.itemName = 'Nama item wajib diisi.'
  if (!form.itemTypeId) e.itemTypeId = 'Tipe item wajib dipilih.'
  if (!form.categoryId) e.categoryId = 'Kategori wajib dipilih.'
  if (!form.defaultUnitId) e.defaultUnitId = 'Satuan default wajib dipilih.'
  if (form.minimumStock < 0) e.minimumStock = 'Min stok tidak boleh negatif.'

  const hasCircular = form.conversions.some((c) => c.fromUnitId === c.toUnitId)
  if (hasCircular) e.conversions = 'Konversi tidak boleh dari dan ke satuan yang sama.'

  Object.keys(errors).forEach((k) => delete errors[k])
  Object.assign(errors, e)
  return Object.keys(e).length === 0
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    if (isEditMode.value) {
      await itemApi.update(route.params.id as string, { ...form })
    } else {
      await itemApi.create({ ...form })
    }
    toast.success(isEditMode.value ? 'Item berhasil diperbarui.' : 'Item berhasil ditambahkan.')
    router.push('/inventory/obat')
  } catch {
    toast.error()
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push('/inventory/obat')
}

onMounted(async () => {
  await Promise.allSettled([
    itemTypeStore.items.length === 0 ? itemTypeStore.fetchAll() : Promise.resolve(),
    categoryStore.items.length === 0 ? categoryStore.fetchAll() : Promise.resolve(),
    unitStore.items.length === 0 ? unitStore.fetchAll() : Promise.resolve(),
    supplierStore.items.length === 0 ? supplierStore.fetchAll() : Promise.resolve(),
  ])

  if (isEditMode.value) {
    loadingItem.value = true
    try {
      const item = await itemApi.getById(route.params.id as string)
      Object.assign(form, {
        itemCode: item.itemCode,
        itemName: item.itemName,
        itemTypeId: item.itemTypeId,
        categoryId: item.categoryId,
        defaultUnitId: item.defaultUnitId,
        barcode: item.barcode,
        manufacturer: item.manufacturer,
        minimumStock: item.minimumStock,
        maximumStock: item.maximumStock,
        reorderPoint: item.reorderPoint,
        trackBatch: item.trackBatch,
        trackExpiry: item.trackExpiry,
        prescriptionRequired: item.prescriptionRequired,
        suppliers: item.suppliers,
        prices: item.prices,
        conversions: item.conversions,
      })
    } catch {
      toast.error('Gagal memuat data item.')
      router.push('/inventory/obat')
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
        />
      </BaseCard>

      <!-- Tab detail di bawah Info Dasar -->
      <BaseCard>
        <Tabs value="stok">
          <TabList>
            <Tab value="stok">Stok</Tab>
            <Tab value="supplier">Supplier</Tab>
            <Tab value="harga">Harga</Tab>
            <Tab value="konversi">Konversi Satuan</Tab>
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
            <TabPanel value="harga">
              <div class="item-form-view__tab-content">
                <ItemFormPrices :form="form" :units="unitStore.items" />
              </div>
            </TabPanel>
            <TabPanel value="konversi">
              <div class="item-form-view__tab-content">
                <ItemFormConversions :form="form" :units="unitStore.items" :errors="errors" />
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
  font-size: var(--font-base);
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
