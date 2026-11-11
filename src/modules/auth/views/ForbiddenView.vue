<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'

const router = useRouter()
</script>

<template>
  <BaseCard>
    <BaseEmptyState
      icon="pi pi-lock"
      title="Akses ditolak"
      description="Anda tidak memiliki akses ke halaman ini."
    >
      <template #action>
        <BaseButton label="Kembali ke Dashboard" icon="pi pi-home" @click="router.push('/')" />
      </template>
    </BaseEmptyState>
  </BaseCard>
</template>
