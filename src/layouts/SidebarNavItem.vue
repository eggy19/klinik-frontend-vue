<script setup lang="ts">
import { useRoute } from 'vue-router'
import type { NavItem } from './navigation'

const props = withDefaults(
  defineProps<{
    item: NavItem
    itemKey: string
    depth?: number
    collapsed?: boolean
    open: Record<string, boolean>
  }>(),
  { depth: 0, collapsed: false },
)
const emit = defineEmits<{ navigate: [] }>()

const route = useRoute()

function isChildActive(item: NavItem): boolean {
  return !!item.children?.some((c) =>
    c.to ? route.path.startsWith(c.to) : isChildActive(c),
  )
}

function toggle(key: string) {
  props.open[key] = !props.open[key]
}
</script>

<template>
  <!-- Item tunggal (punya route) -->
  <RouterLink
    v-if="item.to"
    :to="item.to"
    class="nav__link"
    :style="depth > 0 ? { paddingLeft: `calc(var(--space-4) + ${depth} * var(--space-4))` } : undefined"
    :title="collapsed ? item.label : undefined"
    @click="emit('navigate')"
  >
    <i :class="item.icon" class="nav__icon" aria-hidden="true" />
    <span v-if="!collapsed" class="nav__label">{{ item.label }}</span>
  </RouterLink>

  <!-- Grup (punya children) -->
  <div v-else-if="item.children" class="nav__group">
    <button
      type="button"
      class="nav__link nav__group-toggle"
      :class="{ 'nav__group-toggle--active': isChildActive(item) }"
      :style="depth > 0 ? { paddingLeft: `calc(var(--space-4) + ${depth} * var(--space-4))` } : undefined"
      :title="collapsed ? item.label : undefined"
      @click="toggle(itemKey)"
    >
      <i :class="item.icon" class="nav__icon" aria-hidden="true" />
      <template v-if="!collapsed">
        <span class="nav__label">{{ item.label }}</span>
        <i
          class="pi nav__chevron"
          :class="open[itemKey] ? 'pi-chevron-down' : 'pi-chevron-right'"
          aria-hidden="true"
        />
      </template>
    </button>

    <div v-show="open[itemKey]" class="nav__children">
      <SidebarNavItem
        v-for="child in item.children"
        :key="`${itemKey}/${child.label}`"
        :item="child"
        :item-key="`${itemKey}/${child.label}`"
        :depth="depth + 1"
        :collapsed="collapsed"
        :open="open"
        @navigate="emit('navigate')"
      />
    </div>
  </div>

  <!-- Placeholder (belum punya route maupun children) -->
  <span
    v-else
    class="nav__link nav__placeholder"
    :style="depth > 0 ? { paddingLeft: `calc(var(--space-4) + ${depth} * var(--space-4))` } : undefined"
    :title="collapsed ? item.label : 'Segera hadir'"
  >
    <i :class="item.icon" class="nav__icon" aria-hidden="true" />
    <span v-if="!collapsed" class="nav__label">{{ item.label }}</span>
  </span>
</template>

<style scoped>
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

.nav__group-toggle--active {
  color: var(--primary-color);
  font-weight: var(--font-weight-heading);
}

.nav__icon {
  font-size: 1.1rem;
  min-width: 1.1rem;
  text-align: center;
}

.nav__label {
  flex: 1;
}

.nav__chevron {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.nav__children {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-top: var(--space-1);
}

.nav__placeholder {
  cursor: not-allowed;
  color: var(--text-muted);
}
</style>
