<script setup lang="ts">
</script>

<template>
  <div>Komponen Unit dalam pengembangan</div>
</template>

<style scoped>
.item-form-basic {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.item-form-basic__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
  align-items: start;
}

.item-form-basic__col--full {
  grid-column: 1 / -1;
}

.item-form-basic__status {
  display: flex;
  align-items: center;
  justify-content: end;
}

.item-form-basic__status-row {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
}

.item-form-basic__status-label {
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.item-form-basic__toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.item-form-basic__toggle input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.item-form-basic__toggle span {
  width: 2.5rem;
  height: 1.4rem;
  border-radius: 999px;
  background: var(--surface-border);
  position: relative;
  transition: background 0.2s ease;
}

.item-form-basic__toggle span::after {
  content: '';
  position: absolute;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  background: var(--surface-0);
  top: 0.15rem;
  left: 0.15rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease;
}

.item-form-basic__toggle input:checked + span {
  background: var(--primary-color);
}

.item-form-basic__toggle input:checked + span::after {
  transform: translateX(1.14rem);
}

@media (max-width: 768px) {
  .item-form-basic__row {
    grid-template-columns: 1fr;
  }
  .item-form-basic__status {
    justify-content: flex-start;
  }
}
</style>
