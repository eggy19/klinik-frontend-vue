import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'

import 'primeicons/primeicons.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import './styles/tailwind.css'
import './styles/main.scss'

import App from './App.vue'
import router from './router'
import { useThemeStore } from './stores/theme'

// Preset PrimeVue dengan primary biru (#2563EB ≈ blue.600), selaras design system.
const KlinikPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}',
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
