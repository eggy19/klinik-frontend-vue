# Development Guideline

## PrimeVue Usage

Developer tidak diperbolehkan menggunakan PrimeVue secara langsung pada halaman bisnis.

Bad

<Button />

Good

<BaseButton />

---

## Tailwind Usage

Tailwind digunakan untuk:

* Layout
* Grid
* Flex
* Spacing
* Responsive

Tailwind tidak digunakan untuk menyimpan warna bisnis.

---

## Theme Rules

Semua warna wajib menggunakan CSS Variables.

Bad

color: #2563eb;

Good

color: var(--primary-color);

---

## Component Rules

1. Reusable terlebih dahulu.
2. Hindari duplikasi.
3. Gunakan Base Component.

---

## API Rules

Seluruh komunikasi backend melalui layer:

api/

Contoh:

inventory.api.ts

supplier.api.ts

---

## State Rules

Pinia digunakan untuk:

* Theme
* App Config
* Tenant
* Branch

Data CRUD halaman tidak wajib masuk store.

---

## Naming Convention

Component

PascalCase

BaseButton.vue

Store

camelCase

useInventoryStore.ts

API

camelCase

inventoryApi.ts

---

## MVP Scope

Phase 1

* Theme System
* Base Components
* Layout
* Inventory Module

Phase 2

* Purchasing
* Stock Ledger

Phase 3

* Pharmacy

Phase 4

* Clinical

Phase 5

* Billing
