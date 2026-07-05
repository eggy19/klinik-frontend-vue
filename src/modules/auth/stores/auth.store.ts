import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '../api/auth.api'
import type { LoginPayload, User } from '../types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  // true setelah pengecekan /auth/me pertama (bootstrap) selesai — dipakai
  // router guard agar tidak memanggil /auth/me di setiap navigasi.
  const initialized = ref(false)

  const isAuthenticated = computed(() => user.value !== null)

  async function checkAuth() {
    try {
      user.value = await authApi.me()
    } catch {
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  async function login(payload: LoginPayload) {
    const loggedInUser = await authApi.login(payload)
    user.value = loggedInUser
    initialized.value = true
    return loggedInUser
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      user.value = null
    }
  }

  // Dipakai interceptor 401 global (client.ts) — sinkron, tanpa panggilan API.
  function clearSession() {
    user.value = null
  }

  return { user, initialized, isAuthenticated, checkAuth, login, logout, clearSession }
})
