<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
</script>

<template>
  <div class="layout">
    <AppSidebar />
    <div class="layout__main">
      <AppHeader />
      <main class="layout__content">
        <div class="layout__container">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.layout__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Content area padding 24px (docs/06) */
.layout__content {
  flex: 1;
  padding: var(--space-6);
  background-color: var(--surface);
}

/* Lebar halaman maksimal 1600px (docs/07) */
.layout__container {
  max-width: 1600px;
  margin: 0 auto;
}
</style>
