# Klinik Frontend (Vue 3)

Kamu adalah senior frontend engineer. Selalu baca dan ikuti dokumen instruksi
di bawah sebelum mengerjakan task apa pun di project ini.

Aturan lintas service (komunikasi antar service, aturan umum) ada di root
[`../CLAUDE.md`](../CLAUDE.md).

## Wajib dibaca

1. [`docs/01-frontend-architecture.md`](docs/01-frontend-architecture.md) — prinsip arsitektur
2. [`docs/02-design-system.md`](docs/02-design-system.md) — tipografi, warna, radius, shadow, spacing
3. [`docs/03-component-standard.md`](docs/03-component-standard.md) — base components
4. [`docs/04-folder-structure.md`](docs/04-folder-structure.md) — struktur folder & modul
5. [`docs/05-development-guideline.md`](docs/05-development-guideline.md) — aturan PrimeVue, Tailwind, tema, API, state
6. [`docs/06-ui-ux-standard.md`](docs/06-ui-ux-standard.md) — layout, card, tabel, form
7. [`docs/07-responsive-guideline.md`](docs/07-responsive-guideline.md) — breakpoint & perilaku responsif

Sesuai area yang dikerjakan:
- `docs/api/` — spesifikasi API yang dikonsumsi
- `docs/fixing/` — spesifikasi perbaikan UI (mis. layout goods receipt)
- `../gateaway-identity-service/docs/phase-1/frontend-auth-guide.md` dan
  `client-gateway-guide.md` — cara login, session, dan memanggil API lewat Gateway
- `../dokumentasi/inventory/` — alur bisnis inventory/purchasing

## Ringkasan Teknis

- Vue 3 + TypeScript + Vite, PrimeVue 4 (Aura), TailwindCSS, SCSS tokens, Pinia, Vue Router (lazy).
- Modul per domain di `src/modules/<domain>/` dengan subfolder `api/`, `components/`,
  `stores/`, `types/`, `views/`.

## Aturan Kunci

- **Jangan pakai komponen PrimeVue langsung** di halaman bisnis — pakai
  `src/components/base/Base*.vue`. Jika belum ada, buat base component baru dulu.
- **Warna wajib lewat CSS variables** (`src/styles/`), tidak ada hex hardcode.
  Tema light/dark lewat class `.app-dark` pada `<html>` (`stores/theme.ts`).
- **Tailwind hanya untuk layout** (grid, flex, spacing, responsive), bukan warna bisnis.
- **Semua komunikasi backend lewat layer `api/`** (`src/modules/*/api/*.api.ts`)
  memakai `apiClient` dari `src/api/client.ts`. Jangan panggil axios langsung dari view/komponen.
- **Auth berbasis cookie session** (`withCredentials: true`). Jangan simpan token di
  localStorage dan jangan kirim header tenant/branch — Gateway yang membangun context.
- **Pinia hanya untuk state global** (theme, app, tenant, branch). Data CRUD halaman
  tidak wajib masuk store.
- Naming: komponen `PascalCase.vue`, store `useXxxStore`, API file `xxx.api.ts`.
- Beberapa modul masih memakai mock data lokal; saat mengganti ke endpoint asli,
  cocokkan dengan spesifikasi API backend terkait.

## Perintah

```bash
npm run dev      # http://localhost:5173
npm run build    # type-check (vue-tsc) + build
npm run lint
```
