import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'

// Font self-hosted (docs/02-design-system.md): Plus Jakarta Sans (UI) + JetBrains Mono (angka/kode).
import '@fontsource/plus-jakarta-sans/latin-400.css'
import '@fontsource/plus-jakarta-sans/latin-500.css'
import '@fontsource/plus-jakarta-sans/latin-600.css'
import '@fontsource/plus-jakarta-sans/latin-700.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import '@fontsource/jetbrains-mono/latin-600.css'

import 'primeicons/primeicons.css'
import './styles/tailwind.css'
import './styles/main.scss'

import App from './App.vue'
import router from './router'
import { useThemeStore } from './stores/theme'

// Preset PrimeVue: primary hijau tua (#1f7a66 = primary.600) dan surface hangat
// kehijauan, selaras mockup UI/UX & docs/02-design-system.md.
const surfaceScale = {
  0: '#ffffff',
  50: '#f7f6f2',
  100: '#f5f4ef',
  200: '#e9e7e0',
  300: '#d3d8d4',
  400: '#a3b0ab',
  500: '#6f857e',
  600: '#5d6b66',
  700: '#2a3d37',
  800: '#1c302a',
  900: '#14231f',
  950: '#0f1d1a',
}

// Palet severity Tag/Message/Toast mengikuti token status (_colors.scss) lewat CSS variable,
// sehingga otomatis ikut tema light/dark (docs/02-design-system.md).
const tagScheme = {
  primary: { background: 'var(--color-primary-soft)', color: 'var(--color-primary-soft-text)' },
  secondary: { background: 'var(--color-neutral-soft)', color: 'var(--color-neutral-text)' },
  success: { background: 'var(--color-success-soft)', color: 'var(--color-success-text)' },
  info: { background: 'var(--color-info-soft)', color: 'var(--color-info-text)' },
  warn: { background: 'var(--color-warning-soft)', color: 'var(--color-warning-text)' },
  danger: { background: 'var(--color-danger-soft)', color: 'var(--color-danger-text)' },
}

function messageTone(soft: string, text: string, accent: string) {
  return {
    background: `var(${soft})`,
    borderColor: `color-mix(in srgb, var(${accent}), transparent 65%)`,
    color: `var(${text})`,
    detailColor: 'var(--text)',
    shadow: 'var(--shadow-md)',
    closeButton: {
      hoverBackground: `color-mix(in srgb, var(${accent}), transparent 85%)`,
      focusRing: { color: `var(${accent})`, shadow: 'none' },
    },
    outlined: { color: `var(${text})`, borderColor: `var(${accent})` },
    simple: { color: `var(${text})` },
  }
}

const messageScheme = {
  info: messageTone('--color-info-soft', '--color-info-text', '--color-info'),
  success: messageTone('--color-success-soft', '--color-success-text', '--color-success'),
  warn: messageTone('--color-warning-soft', '--color-warning-text', '--color-warning'),
  error: messageTone('--color-danger-soft', '--color-danger-text', '--color-danger'),
}

const KlinikPreset = definePreset(Aura, {
  components: {
    tag: {
      root: { fontWeight: '600', borderRadius: '6px' },
      colorScheme: { light: tagScheme, dark: tagScheme },
    },
    message: { colorScheme: { light: messageScheme, dark: messageScheme } },
    toast: { colorScheme: { light: messageScheme, dark: messageScheme } },
  },
  semantic: {
    primary: {
      50: '#e6f4ef',
      100: '#cfe9df',
      200: '#a3d4c3',
      300: '#6fb9a2',
      400: '#3fa088',
      500: '#1f8a74',
      600: '#1f7a66',
      700: '#17604f',
      800: '#14533f',
      900: '#0f3f31',
      950: '#0a2a21',
    },
    colorScheme: {
      light: {
        surface: surfaceScale,
        // Aura default memakai primary.500; mockup memakai 600 sebagai warna utama.
        primary: {
          color: '{primary.600}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.700}',
          activeColor: '{primary.800}',
        },
      },
      dark: {
        surface: surfaceScale,
        primary: {
          color: '{primary.400}',
          contrastColor: '{surface.950}',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
      },
    },
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: KlinikPreset,
    options: {
      // Dark mode mengikuti class `.app-dark` (sama dengan Tailwind & theme store).
      darkModeSelector: '.app-dark',
      // CSS layer agar Tailwind preflight tidak menimpa style PrimeVue.
      cssLayer: {
        name: 'primevue',
        order: 'tailwind-base, primevue, tailwind-utilities',
      },
    },
  },
})
app.use(ToastService)
app.use(ConfirmationService)

// Terapkan tema tersimpan sebelum mount agar tidak ada flash.
useThemeStore().init()

app.mount('#app')
