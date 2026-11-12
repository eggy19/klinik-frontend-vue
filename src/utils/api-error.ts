import { isAxiosError } from 'axios'

/** HTTP status dari error axios, atau undefined bila bukan error HTTP. */
export function apiErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined
}

export function isNotFoundError(error: unknown): boolean {
  return apiErrorStatus(error) === 404
}

/**
 * Pesan dari backend untuk error 400/404/409/422 (envelope `{ message }`,
 * bisa string atau array dari validasi). Status lain (termasuk 403 yang sudah
 * ditangani interceptor) memakai `fallback`.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const status = apiErrorStatus(error)
  if (status !== 400 && status !== 404 && status !== 409 && status !== 422) return fallback
  const message = isAxiosError(error) ? error.response?.data?.message : undefined
  if (Array.isArray(message)) return message.join(', ')
  return typeof message === 'string' && message.trim() ? message : fallback
}
