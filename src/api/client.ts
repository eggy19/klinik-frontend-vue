import axios from 'axios'

// Flag custom per-request agar interceptor 401 di bawah tidak mengambil alih
// endpoint yang sudah menangani 401-nya sendiri (login, me, logout saat bootstrap).
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRedirect?: boolean
  }
}

/**
 * Klien HTTP terpusat (docs/05-development-guideline.md — seluruh komunikasi
 * backend lewat layer api/). Saat ini modul memakai mock data lokal; klien ini
 * sudah siap dipakai ketika *.api.ts ditukar ke endpoint asli.
 *
 * `withCredentials: true` wajib — backend memakai cookie-based session auth
 * (bukan Bearer token), lihat gateaway-identity-service/docs/phase-1/frontend-auth-guide.md.
 * Tidak ada header tenant/branch di sini — context tenantId/branchId dibangun
 * gateway dari session lalu diteruskan ke downstream service lewat internal JWT
 * (X-User-Context), lihat gateaway-identity-service/docs/phase-1/downstream-consumer-guide.md.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
      // Import dinamis untuk memutus circular dependency:
      // router -> auth.store -> auth.api -> client -> router.
      const [{ useAuthStore }, { default: router }] = await Promise.all([
        import('@/modules/auth/stores/auth.store'),
        import('@/router'),
      ])
      useAuthStore().clearSession()

      const current = router.currentRoute.value
      if (current.path !== '/login') {
        sessionStorage.setItem('redirectAfterLogin', current.fullPath)
        router.push('/login')
      }
    }
    return Promise.reject(error)
  },
)

/** Helper simulasi latency untuk mock API lokal. */
export function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}
