<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'
import { useTenantStore } from '@/stores/tenant'
import { useBranchStore } from '@/stores/branch'

const app = useAppStore()
const theme = useThemeStore()
const tenant = useTenantStore()
const branch = useBranchStore()

const isMobile = () => window.matchMedia('(max-width: 767px)').matches

// Hamburger: di mobile buka drawer, selain itu collapse sidebar.
function onMenuClick() {
  if (isMobile()) app.openDrawer()
  else app.toggleSidebar()
}

const themeIcon = computed(() => (theme.isDark ? 'pi pi-sun' : 'pi pi-moon'))
</script>

<template>
  <header class="header">
    <div class="header__left">
      <Button
        icon="pi pi-bars"
        text
        rounded
        aria-label="Toggle menu"
        @click="onMenuClick"
      />
      <div class="header__context">
        <span class="header__tenant">{{ tenant.current.name }}</span>
        <span class="header__branch">{{ branch.current.name }}</span>
      </div>
    </div>

    <div class="header__right">
      <Button
        :icon="themeIcon"
        text
        rounded
        :aria-label="theme.isDark ? 'Mode terang' : 'Mode gelap'"
        @click="theme.toggle()"
      />
      <Button icon="pi pi-user" text rounded aria-label="Akun" />
    </div>
  </header>
</template>

<style scoped>
.header {
  height: 64px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  background-color: var(--bg);
  border-bottom: 1px solid var(--border);
}

.header__left,
.header__right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.header__context {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.header__tenant {
  font-weight: var(--font-weight-heading);
  color: var(--text);
  font-size: var(--font-sm);
}

.header__branch {
  color: var(--text-muted);
  font-size: var(--font-xs);
}
</style>
