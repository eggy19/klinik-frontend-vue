<script setup lang="ts"></script>

<template>
  <div class="blank-layout">
    <slot />
  </div>
</template>

<style scoped>
/* Layout tanpa sidebar/header — dipakai untuk halaman publik (mis. /login). */
.blank-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background-color: var(--surface);
}
</style>
