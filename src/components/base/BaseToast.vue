<script setup lang="ts">
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { registerToastHost } from '@/composables/useToastFeedback'

// Daftarkan toast service agar interceptor API bisa menampilkan pesan 403.
registerToastHost(useToast())
</script>

<template>
  <!--
    Host notifikasi global. Dipasang sekali di App.vue; pemicunya lewat
    composable useToastFeedback (success/error/warning) sesuai docs/06.
  -->
  <Toast position="top-right" />
</template>
