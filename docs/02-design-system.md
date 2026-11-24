# Design System

Identitas visual mengikuti mockup `UI-UX/*.dc.html` (hijau tua, latar krem, sidebar gelap).
Sumber kebenaran token ada di `src/styles/tokens/` dan `src/styles/themes/`; preset PrimeVue
di `src/main.ts`. Semua warna dipakai lewat CSS variables (tidak ada hex hardcode di komponen).

## Typography

| Peran | Font | Dipakai untuk |
| ----- | ---- | ------------- |
| UI (`--font-family`, Tailwind `font-sans`) | Plus Jakarta Sans 400/500/600/700 | Seluruh teks antarmuka |
| Mono (`--font-mono`, Tailwind `font-mono`) | JetBrains Mono 400/500/600 | Angka/nominal, kode, nomor dokumen |

Fallback: `system-ui, -apple-system, 'Segoe UI', sans-serif`.

Font di-**self-host** lewat paket npm `@fontsource/plus-jakarta-sans` dan
`@fontsource/jetbrains-mono` (subset latin, diimpor di `src/main.ts`). Jangan memuat font
dari CDN (Google Fonts). Font lama (Frutiger LT di `public/font/frutiger/`) tidak dipakai lagi.

Kelas mono dipakai bertahap oleh halaman (tahap 1b): `class="font-mono"` atau
`font-family: var(--font-mono)`.

### Font Size

Density compact: base 13px (`--font-size-base`), badge 12px, caption 10px
(`overrides/_compact-density.scss`). Skala heading/elemen besar:

| Token | Size |
| ----- | ---- |
| xs    | 12px |
| sm    | 14px |
| md    | 16px |
| lg    | 18px |
| xl    | 20px |
| 2xl   | 24px |
| 3xl   | 32px |

---

## Colors

### Primary (hijau)

Skala PrimeVue `primary` (di `main.ts`); warna utama = 600.

| Step | Hex |
| ---- | --- |
| 50 | `#e6f4ef` |
| 100 | `#cfe9df` |
| 200 | `#a3d4c3` |
| 300 | `#6fb9a2` |
| 400 | `#3fa088` |
| 500 | `#1f8a74` |
| 600 | `#1f7a66` (utama, light) |
| 700 | `#17604f` (hover) |
| 800 | `#14533f` |
| 900 | `#0f3f31` |
| 950 | `#0a2a21` |

### Token CSS variable

| Variable | Light | Dark (`.app-dark`) |
| -------- | ----- | ------------------ |
| `--color-primary` / `--primary-color` | `#1f7a66` | `#3fa088` |
| `--color-primary-hover` | `#17604f` | `#6fb9a2` |
| `--color-primary-contrast` | `#ffffff` | `#0f1d1a` |
| `--color-primary-soft` / `-soft-text` | `#e6f4ef` / `#14533f` | `rgba(79,209,173,.14)` / `#8fe0c6` |
| `--color-success` | `#1f8a74` | `#4fd1ad` |
| `--color-warning` | `#d98a2b` | `#e7a553` |
| `--color-warning-text` | `#a8651a` | `#f0c27a` |
| `--color-danger` | `#c4492f` | `#ee7b62` |
| `--color-info` | `#5b74d6` | `#8fa8ff` |
| `--bg` (kartu/komponen) | `#ffffff` | `#14231f` |
| `--surface` (latar halaman) | `#f5f4ef` | `#0f1d1a` |
| `--surface-hover` | `#eeece6` | `#1c302a` |
| `--border` | `#e3e5e0` | `#2a3d37` |
| `--text` | `#14231f` | `#e6efeb` |
| `--text-muted` | `#5d6b66` | `#8ea39c` |

`--color-warning` (`#d98a2b`) hanya untuk isian/border/ikon; untuk **teks** peringatan pakai
`--color-warning-text` (kontras >= 4,5:1 di latar kartu). `--font-weight-strong` (700) untuk brand
dan nama tenant; token sidebar tambahan: `--sidebar-text-strong` (`#ffffff`), `--sidebar-scrollbar`.

Token status (latar lembut + teks), dipakai Tag/Message/Toast PrimeVue dan banner:

| Variable | Light | Dark (`.app-dark`) |
| -------- | ----- | ------------------ |
| `--color-success-soft` / `-text` | `#d4ece3` / `#14533f` | `rgba(79,209,173,.16)` / `#8fe0c6` |
| `--color-warning-soft` (teks: `--color-warning-text`) | `#fcf1dc` | `rgba(231,165,83,.16)` |
| `--color-danger-soft` / `-text` | `#fbe6df` / `#a63d24` | `rgba(238,123,98,.16)` / `#f4a592` |
| `--color-info-soft` / `-text` | `#e3ecfb` / `#2b56ad` | `rgba(143,168,255,.16)` / `#b3c4ff` |
| `--color-neutral-soft` / `-text` | `#eceae4` / `#5d6b66` | `#1c302a` / `#8ea39c` |
| `--surface-subtle` (header tabel, footer total) | `#faf9f6` | `#101f1b` |
| `--panel-dark-*` (bg, text, muted, border, accent, danger) | panel gelap konstan di kedua tema | |

Preset PrimeVue (`main.ts`) memetakan severity Tag (primary/secondary/success/info/warn/danger) dan
Message/Toast (info/success/warn/error) ke token di atas lewat `var(--...)`, sehingga otomatis
mengikuti tema. Tag: radius 6px, bobot 600.

### Pola halaman (`src/styles/patterns/_page.scss`)

Opt-in: aktif hanya di dalam wrapper `.kp-page` (halaman yang belum diselaraskan tidak berubah).
Dipakai Purchasing, Dispensing, Stock/Batch/Movement/Opname.

| Class | Fungsi |
| ----- | ------ |
| `.kp-title` | Judul halaman 20px/700 |
| `.kp-mono`, `.kp-num` | Font mono untuk nomor dokumen, batch, qty, uang (`.kp-num` + rata kanan) |
| `.kp-label` | Label mikro uppercase 12px |
| `.kp-stats` (+ `--compact`) | Grid kartu ringkasan (`BaseSummaryCard`): nilai mono 26px |
| `.kp-stat--dark` | Pembungkus kartu ringkasan gelap |
| `.kp-total` (`__label`, `__value`) | Footer total (mono) |
| `.kp-progress` | Bilah progres tipis |
| `.kp-panel--dark` | Panel gelap (`.kp-dark-row/-divider/-accent/-danger`) |
| `.kp-banner--success/warning/danger/info` | Banner status |

Di dalam `.kp-page`: `BaseCard` radius 16 tanpa shadow; header tabel PrimeVue 12px uppercase di atas
`--surface-subtle`, hover baris `--surface-hover`. Tabel native di halaman mengikuti pola yang sama
lewat style lokal (header uppercase, angka mono rata kanan).

### Sidebar

Sidebar **selalu gelap** di kedua tema. Token (konstan, `tokens/_colors.scss`):

| Variable | Nilai | Fungsi |
| -------- | ----- | ------ |
| `--sidebar-bg` | `#10201c` | Latar |
| `--sidebar-text` / `--sidebar-text-dim` | `#d9e3df` / `#b9c7c2` | Teks / item biasa |
| `--sidebar-muted` / `--sidebar-title` | `#8ea39c` / `#6f857e` | Chevron, judul grup, item nonaktif |
| `--sidebar-hover` | `rgba(255,255,255,.06)` | Hover |
| `--sidebar-active-bg` | `rgba(79,209,173,.12)` | Item aktif (teks putih, 600) |
| `--sidebar-accent` | `#4fd1ad` | Fokus/aksen |
| `--sidebar-brand` | `#2f9c84` | Kotak logo |

Lebar 236px (collapsed 72px, mobile = drawer).

---

## Border Radius

| Token | Nilai | Pakai |
| ----- | ----- | ----- |
| `--radius-sm` | 8px | Tombol, item nav, input kecil |
| `--radius-md` | 12px | Kartu (default) |
| `--radius-lg` | 16px | Panel besar |

Preset PrimeVue: sm 6px, md 8px, lg 10px, xl 14px (komponen bawaan).

## Shadow

Tinta hijau gelap, ringan (mockup lebih mengandalkan border).

| Token | Nilai |
| ----- | ----- |
| `--shadow-sm` | `0 1px 2px rgba(20,35,31,.06)` |
| `--shadow-md` | `0 4px 12px rgba(20,35,31,.08)` |
| `--shadow-lg` | `0 8px 24px rgba(20,35,31,.12)` |

---

## Dark Theme

Diaktifkan lewat class `.app-dark` pada `<html>` (`stores/theme.ts`). Varian gelap dari palet
hijau: latar halaman `#0f1d1a`, kartu `#14231f`, border `#2a3d37`, teks `#e6efeb`.
Primary diterangkan (`#3fa088`) agar terbaca; teks di atas tombol primary gelap (`#0f1d1a`).
Skala `surface` PrimeVue di `main.ts` memakai nilai yang sama untuk kedua tema
(950 = form field gelap, 900 = panel/overlay gelap).

---

## Spacing

4
8
12
16
24
32
48
64

Semua spacing menggunakan kelipatan 4.
