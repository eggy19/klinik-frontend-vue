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

/** Helper simulasi latency untuk mock API lokal. */
export function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

// Menambahkan Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Anda bisa mendapatkan ID ini dari Store atau LocalStorage
    const tenantId = localStorage.getItem('tenant_id') || 'aaaaaaaa-0000-0000-0000-000000000001';
    const branchId = localStorage.getItem('branch_id') || 'bbbbbbbb-0000-0000-0000-000000000001';

    // Menambahkan header ke konfigurasi request
    config.headers['X-Tenant-Id'] = tenantId;
    config.headers['X-Branch-Id'] = branchId;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
