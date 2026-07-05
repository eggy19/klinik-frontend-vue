<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ConfirmDialog from 'primevue/confirmdialog'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BlankLayout from '@/layouts/BlankLayout.vue'
import BaseToast from '@/components/base/BaseToast.vue'

const route = useRoute()
// Route publik (mis. /login) pakai BlankLayout — tanpa sidebar/header.
const layout = computed(() => (route.meta.layout === 'blank' ? BlankLayout : DefaultLayout))
</script>

<template>
  <RouterView v-slot="{ Component }">
    <component :is="layout">
      <component :is="Component" />
    </component>
  </RouterView>

  <!-- Host global service (notifikasi & konfirmasi) -->
  <BaseToast />
  <ConfirmDialog />
</template>
