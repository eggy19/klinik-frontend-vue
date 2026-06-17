<script setup lang="ts">
import Drawer from 'primevue/drawer'
import { useAppStore } from '@/stores/app'
import { navItems } from './navigation'

const app = useAppStore()
</script>

<template>
  <!-- Desktop / tablet: sidebar tetap (collapse ke 72px) -->
  <aside class="sidebar" :class="{ 'sidebar--collapsed': app.sidebarCollapsed }">
    <div class="sidebar__brand">
      <i class="pi pi-plus-circle sidebar__brand-icon" aria-hidden="true" />
      <span v-if="!app.sidebarCollapsed" class="sidebar__brand-text">Klinik SaaS</span>
    </div>

    <nav class="sidebar__nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="sidebar__link"
        :title="item.label"
      >
        <i :class="item.icon" class="sidebar__link-icon" aria-hidden="true" />
        <span v-if="!app.sidebarCollapsed" class="sidebar__link-label">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>

  <!-- Mobile: sidebar menjadi drawer (docs/07) -->
  <Drawer v-model:visible="app.sidebarDrawerOpen" :modal="true" class="sidebar-drawer">
    <template #header>
      <div class="sidebar__brand">
        <i class="pi pi-plus-circle sidebar__brand-icon" aria-hidden="true" />
        <span class="sidebar__brand-text">Klinik SaaS</span>
      </div>
    </template>
    <nav class="sidebar__nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="sidebar__link"
        @click="app.closeDrawer()"
      >
        <i :class="item.icon" class="sidebar__link-icon" aria-hidden="true" />
        <span class="sidebar__link-label">{{ item.label }}</span>
      </RouterLink>
    </nav>
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

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
}

.sidebar__link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--text);
  min-height: 44px;
  transition: background-color 0.15s ease;
}

.sidebar__link:hover {
  background-color: var(--surface-hover);
}

.sidebar__link.router-link-exact-active {
  background-color: var(--primary-color);
  color: var(--color-primary-contrast);
}

.sidebar__link-icon {
  font-size: 1.1rem;
  min-width: 1.1rem;
  text-align: center;
}

/* Sidebar tetap disembunyikan di mobile (pakai drawer) */
@media (max-width: 767px) {
  .sidebar {
    display: none;
  }
}
</style>
