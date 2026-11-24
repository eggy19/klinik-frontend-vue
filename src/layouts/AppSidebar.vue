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
      <span class="sidebar__brand-mark" aria-hidden="true">K</span>
      <span v-if="!app.sidebarCollapsed" class="sidebar__brand-text">Klinik SaaS</span>
    </div>

    <SidebarNav :collapsed="app.sidebarCollapsed" />
  </aside>

  <!-- Mobile: sidebar menjadi drawer (docs/07) -->
  <Drawer v-model:visible="app.sidebarDrawerOpen" :modal="true" class="sidebar-drawer">
    <template #header>
      <div class="sidebar__brand sidebar__brand--drawer">
        <span class="sidebar__brand-mark" aria-hidden="true">K</span>
        <span class="sidebar__brand-text">Klinik SaaS</span>
      </div>
    </template>
    <SidebarNav @navigate="app.closeDrawer()" />
  </Drawer>
</template>

<style scoped>
.sidebar {
  width: 236px;
  flex-shrink: 0;
  background-color: var(--sidebar-bg);
  color: var(--sidebar-text);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  transition: width 0.2s ease;
}

.sidebar--collapsed {
  width: 72px;
}

.sidebar__brand {
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 var(--space-4) 0 20px;
  font-weight: var(--font-weight-strong);
  font-size: 14px;
  letter-spacing: -0.01em;
  color: var(--sidebar-text-strong);
  white-space: nowrap;
  overflow: hidden;
}

.sidebar--collapsed .sidebar__brand {
  padding: 0;
  justify-content: center;
}

.sidebar__brand--drawer {
  padding-left: 0;
}

.sidebar__brand-mark {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  background-color: var(--sidebar-brand);
  display: grid;
  place-items: center;
  color: var(--sidebar-text-strong);
  font-weight: var(--font-weight-strong);
  font-size: 14px;
}

/* Sidebar tetap disembunyikan di mobile (pakai drawer) */
@media (max-width: 767px) {
  .sidebar {
    display: none;
  }
}
</style>

<!-- Drawer di-teleport ke body, jadi styling-nya harus global. -->
<style>
.sidebar-drawer {
  --p-drawer-background: var(--sidebar-bg);
  --p-drawer-color: var(--sidebar-text);
  --p-drawer-border-color: var(--sidebar-border);
  background-color: var(--sidebar-bg);
  color: var(--sidebar-text);
}

.sidebar-drawer .p-drawer-header {
  padding: 0 var(--space-4) 0 20px;
}

.sidebar-drawer .p-drawer-content {
  padding: 0;
}

.sidebar-drawer .p-drawer-close-button {
  color: var(--sidebar-muted);
}
</style>
