<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { navItems, type NavItem } from './navigation'

withDefaults(defineProps<{ collapsed?: boolean }>(), { collapsed: false })
const emit = defineEmits<{ navigate: [] }>()

const route = useRoute()
const open = reactive<Record<string, boolean>>({})

function isChildActive(item: NavItem): boolean {
  return !!item.children?.some((c) => c.to && route.path.startsWith(c.to))
}

// Buka otomatis grup yang memuat route aktif.
watch(
  () => route.path,
  () => {
    navItems.forEach((item) => {
      if (item.children && isChildActive(item)) open[item.label] = true
    })
  },
  { immediate: true },
)

function toggle(label: string) {
  open[label] = !open[label]
}
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

      <!-- Grup (punya children) -->
      <div v-else class="nav__group">
        <button
          type="button"
          class="nav__link nav__group-toggle"
          :class="{ 'nav__group-toggle--active': isChildActive(item) }"
          :title="collapsed ? item.label : undefined"
          @click="toggle(item.label)"
        >
          <i :class="item.icon" class="nav__icon" aria-hidden="true" />
          <template v-if="!collapsed">
            <span class="nav__label">{{ item.label }}</span>
            <i
              class="pi nav__chevron"
              :class="open[item.label] ? 'pi-chevron-down' : 'pi-chevron-right'"
              aria-hidden="true"
            />
          </template>
        </button>

        <div v-show="open[item.label]" class="nav__children">
          <RouterLink
            v-for="child in item.children"
            :key="child.to"
            :to="child.to!"
            class="nav__link nav__child"
            :class="{ 'nav__child--collapsed': collapsed }"
            :title="collapsed ? child.label : undefined"
            @click="emit('navigate')"
          >
            <i :class="child.icon" class="nav__icon" aria-hidden="true" />
            <span v-if="!collapsed" class="nav__label">{{ child.label }}</span>
          </RouterLink>
        </div>
      </div>
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

/* Indentasi anak saat sidebar penuh; saat collapse rata dengan parent. */
.nav__child {
  padding-left: var(--space-8);
}

.nav__child--collapsed {
  padding-left: var(--space-3);
}
</style>
