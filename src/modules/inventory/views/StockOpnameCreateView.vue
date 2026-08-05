<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { useStockOpnameStore } from '../stores/stock-opname.store'
import StockOpnameForm from '../components/stock-opname/StockOpnameForm.vue'
import type { CreateStockOpnameInput } from '../types/stock-opname'

const router = useRouter()
const toast = useToastFeedback()
const store = useStockOpnameStore()

const submitting = ref(false)

function goBack() {
  router.push('/inventory/management/stock-opname')
}

async function onSubmit(input: CreateStockOpnameInput) {
  submitting.value = true
  try {
    const created = await store.create(input)
    toast.success('Stock opname berhasil dibuat.')
    router.push(`/inventory/management/stock-opname/${created.id}`)
  } catch {
    toast.error()
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="opname-create">
    <div class="opname-create__head">
      <BaseButton icon="pi pi-arrow-left" label="Kembali" variant="ghost" @click="goBack" />
      <h1 class="opname-create__title">Buat Stock Opname</h1>
    </div>

    <BaseCard>
      <StockOpnameForm :submitting="submitting" @submit="onSubmit" @cancel="goBack" />
    </BaseCard>
  </div>
</template>

<style scoped>
.opname-create {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.opname-create__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.opname-create__title {
  font-size: var(--font-2xl);
  color: var(--text);
}
</style>
