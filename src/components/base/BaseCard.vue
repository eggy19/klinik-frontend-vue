<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <section class="base-card">
    <header v-if="title || $slots.header" class="base-card__header">
      <slot name="header">
        <h3 class="base-card__title">{{ title }}</h3>
      </slot>
    </header>

    <div class="base-card__body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="base-card__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
/* Surface terpisah dari background: rounded 10px + shadow ringan (docs/06). */
.base-card {
  background-color: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.base-card__header {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--border);
}

.base-card__title {
  font-size: var(--font-lg);
  color: var(--text);
}

.base-card__body {
  padding: var(--space-6);
}

.base-card__footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--border);
}
</style>
