<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string
    title?: string
    description?: string
  }>(),
  {
    icon: 'pi pi-inbox',
    title: 'Belum ada data',
  },
)
</script>

<template>
  <!-- Empty state: icon + deskripsi + action (docs/06-ui-ux-standard.md). -->
  <div class="empty-state">
    <i :class="icon" class="empty-state__icon" aria-hidden="true" />
    <p class="empty-state__title">{{ title }}</p>
    <p v-if="description" class="empty-state__desc">{{ description }}</p>
    <div v-if="$slots.action" class="empty-state__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-12) var(--space-6);
  text-align: center;
  color: var(--text-muted);
}

.empty-state__icon {
  font-size: 2.5rem;
  color: var(--text-muted);
  margin-bottom: var(--space-2);
}

.empty-state__title {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-heading);
  color: var(--text);
  margin: 0;
}

.empty-state__desc {
  margin: 0;
  font-size: var(--font-sm);
}

.empty-state__action {
  margin-top: var(--space-2);
}
</style>
