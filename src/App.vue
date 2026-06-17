<script setup lang="ts">
import ConfirmDialog from 'primevue/confirmdialog'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseToast from '@/components/base/BaseToast.vue'
</script>

<template>
  <DefaultLayout>
    <RouterView v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
  </DefaultLayout>

  <!-- Host global service (notifikasi & konfirmasi) -->
  <BaseToast />
  <ConfirmDialog />
</template>
