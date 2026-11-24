<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { filterNavItems, navItems, type NavItem } from './navigation'
import SidebarNavItem from './SidebarNavItem.vue'

withDefaults(defineProps<{ collapsed?: boolean }>(), { collapsed: false })
const emit = defineEmits<{ navigate: [] }>()

const route = useRoute()
const authStore = useAuthStore()
const visibleItems = computed(() => filterNavItems(navItems, authStore.can, authStore.canAny))
const open = reactive<Record<string, boolean>>({})

function isChildActive(item: NavItem): boolean {
  return !!item.children?.some((c) =>
    c.to ? route.path.startsWith(c.to) : isChildActive(c),
  )
}

// Buka otomatis grup (dan sub-grup) yang memuat route aktif.
function openActiveGroups(item: NavItem, key: string) {
  if (!item.children) return
  if (isChildActive(item)) open[key] = true
  item.children.forEach((child) => openActiveGroups(child, `${key}/${child.label}`))
}

watch(
  () => route.path,
  () => {
    visibleItems.value.forEach((item) => openActiveGroups(item, item.label))
  },
  { immediate: true },
)
</script>

<template>
  <nav class="nav">
    <template v-for="item in visibleItems" :key="item.label">
      <!-- Item tunggal (punya route) -->
      <RouterLink
        v-if="item.to"
        :to="item.to"
        class="nav__link"
        :title="collapsed ? item.label : undefined"
        @click="emit('navigate')"
      >
        <i :class="item.icon" class="nav__icon" aria-hidden="true" />
        <span v-if="!collapsed" class="nav__label">{{ item.label }}</span>
      </RouterLink>

      <!-- Grup (punya children), mendukung nesting bertingkat -->
      <SidebarNavItem
        v-else
        :item="item"
        :item-key="item.label"
        :collapsed="collapsed"
        :open="open"
        @navigate="emit('navigate')"
      />
    </template>
  </nav>
</template>

<style scoped>
.nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3) var(--space-4);
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--sidebar-scrollbar) transparent;
}

.nav__link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  color: var(--sidebar-text-dim);
  min-height: 40px;
  width: 100%;
  background: none;
  border: none;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  text-decoration: none;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.nav__link:hover {
  background-color: var(--sidebar-hover);
  color: var(--sidebar-text-strong);
}

.nav__link.router-link-exact-active {
  background-color: var(--sidebar-active-bg);
  color: var(--sidebar-text-strong);
  font-weight: 600;
}

.nav__link:focus-visible {
  outline-color: var(--sidebar-accent);
}

.nav__icon {
  font-size: 1.1rem;
  min-width: 1.1rem;
  text-align: center;
}

.nav__label {
  flex: 1;
}
</style>
