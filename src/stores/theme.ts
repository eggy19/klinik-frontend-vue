import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'klinik:theme'
const DARK_CLASS = 'app-dark'

type ThemeMode = 'light' | 'dark'

function resolveInitial(): ThemeMode {
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Theme global. Dark mode dikontrol lewat class `.app-dark` pada <html>,
 * yang sekaligus dipakai oleh Tailwind (darkMode selector) dan PrimeVue
 * (darkModeSelector). Preferensi disimpan di localStorage.
 */
export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  function apply(mode: ThemeMode) {
    isDark.value = mode === 'dark'
    document.documentElement.classList.toggle(DARK_CLASS, isDark.value)
    localStorage.setItem(STORAGE_KEY, mode)
  }

  function setDark(value: boolean) {
    apply(value ? 'dark' : 'light')
  }

  function toggle() {
    setDark(!isDark.value)
  }

  function init() {
    apply(resolveInitial())
  }

  return { isDark, setDark, toggle, init }
})
