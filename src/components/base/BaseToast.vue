<script setup lang="ts">
import Toast from 'primevue/toast'
</script>

<template>
  <!--
    Host notifikasi global. Dipasang sekali di App.vue; pemicunya lewat
    composable useToastFeedback (success/error/warning) sesuai docs/06.
  -->
  <Toast position="top-right" />
</template>
