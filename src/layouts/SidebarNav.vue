<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { navItems, type NavItem } from './navigation'
import SidebarNavItem from './SidebarNavItem.vue'

withDefaults(defineProps<{ collapsed?: boolean }>(), { collapsed: false })
const emit = defineEmits<{ navigate: [] }>()

const route = useRoute()
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
    navItems.forEach((item) => openActiveGroups(item, item.label))
  },
  { immediate: true },
)
</script>

<template>
  <nav class="nav">
    <template v-for="item in navItems" :key="item.label">
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
  padding: var(--space-3);
}

.nav__link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--text);
  min-height: 44px;
  width: 100%;
  background: none;
  border: none;
  font: inherit;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s ease;
}

.nav__link:hover {
  background-color: var(--surface-hover);
}

.nav__link.router-link-exact-active {
  background-color: var(--primary-color);
  color: var(--color-primary-contrast);
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
