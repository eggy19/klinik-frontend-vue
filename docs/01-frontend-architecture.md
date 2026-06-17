# Frontend Architecture

## Purpose

Dokumen ini menjelaskan standar arsitektur frontend untuk Healthcare SaaS Platform yang mencakup:

* Inventory
* Pharmacy
* Clinical
* Billing
* BPJS Integration
* SATUSEHAT Integration

Frontend dibangun menggunakan:

* Vue 3
* TypeScript
* Vite
* PrimeVue
* TailwindCSS
* Pinia
* Vue Router

---

# Architecture Principles

## Modular First

Frontend dibangun berdasarkan domain bisnis, bukan jenis file.

### Good

modules/
├── inventory/
├── supplier/
├── purchasing/
└── stock-ledger/

### Avoid

pages/
components/
services/

---

## Reusable Components

Seluruh komponen UI wajib menggunakan Base Component.

Contoh:

* BaseButton
* BaseCard
* BaseInput
* BaseDialog
* BaseDataTable

Developer tidak diperbolehkan menggunakan PrimeVue secara langsung pada halaman bisnis.

---

## Separation of Concerns

# components/

Reusable UI

# modules/

Business Logic

# stores/

Global State

# api/

HTTP Communication

# styles/

Design System

---

## Theme Support

Frontend wajib mendukung:

* Light Mode
* Dark Mode

melalui CSS Variables.

---

## State Management

Menggunakan Pinia.

Store global:

* theme
* app
* tenant
* branch

Store domain:

* inventory
* supplier
* purchasing

---

## Folder Structure

src/
├── api/
├── assets/
├── components/
├── composables/
├── layouts/
├── modules/
├── router/
├── stores/
├── styles/
├── types/
└── utils/
