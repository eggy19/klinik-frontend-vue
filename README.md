# Klinik Frontend (Vue 3)

Frontend Healthcare SaaS Platform (Inventory, Pharmacy, Clinical, Billing, BPJS, SATUSEHAT).
Dibangun mengikuti standar pada folder [`docs/`](./docs).

## Tech Stack

- Vue 3 + TypeScript + Vite
- PrimeVue 4 (preset Aura) + PrimeIcons
- TailwindCSS (layout/spacing) + SCSS design tokens
- Pinia (state) + Vue Router (lazy routes)

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + build produksi
npm run preview  # pratinjau hasil build
npm run lint     # eslint
```

## Arsitektur Singkat

```
src/
├── api/         # klien axios (mock data dipakai sementara)
├── components/base/   # Base components (wajib dipakai, bukan PrimeVue langsung)
├── composables/
├── layouts/     # DefaultLayout, AppSidebar, AppHeader
├── modules/     # per-domain: dashboard, inventory, ...
├── router/
├── stores/      # theme, app, tenant, branch
├── styles/      # tokens/, themes/ (CSS variables), main.scss
└── utils/
```

### Tema

Light/Dark dikontrol class `.app-dark` pada `<html>` (lihat `stores/theme.ts`),
dipakai bersama oleh Tailwind dan PrimeVue. Semua warna lewat CSS variables —
tidak ada hex hardcode di komponen bisnis.

### Data

Modul saat ini memakai **mock data lokal** di `modules/*/api/*.api.ts`.
Untuk beralih ke backend asli: ganti isi fungsi agar memakai `apiClient`
(`@/api/client`) dan set `VITE_API_BASE_URL` (lihat `.env.example`).

## Status MVP

- [x] Phase 1: Theme system, Base components, Layout, Inventory + Dashboard
- [ ] Phase 2: Purchasing, Stock Ledger
- [ ] Phase 3: Pharmacy
- [ ] Phase 4: Clinical
- [ ] Phase 5: Billing
