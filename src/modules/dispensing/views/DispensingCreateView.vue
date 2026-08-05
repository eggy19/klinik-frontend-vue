<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useToastFeedback } from '@/composables/useToastFeedback'
import type { ApiErrorResponse } from '@/api/types'
import { useDispensingStore } from '../stores/dispensing.store'
import DispensingForm from '../components/DispensingForm.vue'
import type { CreateDispensingInput } from '../types/dispensing'

const router = useRouter()
const toast = useToastFeedback()
const store = useDispensingStore()

const submitting = ref(false)

function goBack() {
  router.push('/inventory/dispensing')
}

async function onSubmit(input: CreateDispensingInput) {
  submitting.value = true
  try {
    const created = await store.create(input)
    toast.success('Dispensing berhasil dibuat dan stok telah dikurangi.')
    router.push(`/inventory/dispensing/${created.id}`)
  } catch (err) {
    // Surface pesan backend (mis. INV_003 stok tidak cukup, INV_054 satuan tidak
    // diaktifkan untuk penjualan) alih-alih pesan generik.
    let message: string | undefined
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      message = err.response?.data?.message
    }
    toast.error(message ?? 'Gagal membuat dispensing.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="disp-create">
    <div class="disp-create__head">
      <BaseButton icon="pi pi-arrow-left" label="Kembali" variant="ghost" @click="goBack" />
      <h1 class="disp-create__title">Buat Dispensing</h1>
    </div>

    <BaseCard>
      <DispensingForm :submitting="submitting" @submit="onSubmit" @cancel="goBack" />
    </BaseCard>
  </div>
</template>

<style scoped>
.disp-create {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.disp-create__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.disp-create__title {
  font-size: var(--font-2xl);
  color: var(--text);
}
</style>
