<script setup lang="ts">
import Drawer from 'primevue/drawer'
import SidebarNav from './SidebarNav.vue'
import { useAppStore } from '@/stores/app'

const app = useAppStore()
</script>

<template>
  <!-- Desktop / tablet: sidebar tetap (collapse ke 72px) -->
  <aside class="sidebar" :class="{ 'sidebar--collapsed': app.sidebarCollapsed }">
    <div class="sidebar__brand">
      <i class="pi pi-plus-circle sidebar__brand-icon" aria-hidden="true" />
      <span v-if="!app.sidebarCollapsed" class="sidebar__brand-text">Klinik SaaS</span>
    </div>

    <SidebarNav :collapsed="app.sidebarCollapsed" />
  </aside>

  <!-- Mobile: sidebar menjadi drawer (docs/07) -->
  <Drawer v-model:visible="app.sidebarDrawerOpen" :modal="true" class="sidebar-drawer">
    <template #header>
      <div class="sidebar__brand">
        <i class="pi pi-plus-circle sidebar__brand-icon" aria-hidden="true" />
        <span class="sidebar__brand-text">Klinik SaaS</span>
      </div>
    </template>
    <SidebarNav @navigate="app.closeDrawer()" />
  </Drawer>
</template>

<style scoped>
.sidebar {
  width: 260px;
  flex-shrink: 0;
  background-color: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
}

.sidebar--collapsed {
  width: 72px;
}

.sidebar__brand {
  height: 64px;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--border);
  font-weight: var(--font-weight-heading);
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
}

.sidebar__brand-icon {
  color: var(--primary-color);
  font-size: 1.4rem;
}

/* Sidebar tetap disembunyikan di mobile (pakai drawer) */
@media (max-width: 767px) {
  .sidebar {
    display: none;
  }
}
</style>
