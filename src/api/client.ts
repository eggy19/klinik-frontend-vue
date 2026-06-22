import axios from 'axios'

/**
 * Klien HTTP terpusat (docs/05-development-guideline.md — seluruh komunikasi
 * backend lewat layer api/). Saat ini modul memakai mock data lokal; klien ini
 * sudah siap dipakai ketika *.api.ts ditukar ke endpoint asli.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-Id': 'aaaaaaaa-0000-0000-0000-000000000001',
    'X-Branch-Id': 'bbbbbbbb-0000-0000-0000-000000000001',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)

/** Helper simulasi latency untuk mock API lokal. */
export function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}
