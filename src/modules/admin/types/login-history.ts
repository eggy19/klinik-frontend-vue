export type LoginResult =
  | 'success'
  | 'invalid_password'
  | 'account_locked'
  | 'user_disabled'
  | 'user_not_found'
  | 'session_expired'

export const LOGIN_RESULT_LABELS: Record<LoginResult, string> = {
  success: 'Berhasil',
  invalid_password: 'Password Salah',
  account_locked: 'Akun Terkunci',
  user_disabled: 'Akun Nonaktif',
  user_not_found: 'Pengguna Tidak Ditemukan',
  session_expired: 'Sesi Kedaluwarsa',
}

type TagVariant = 'success' | 'warning' | 'danger' | 'info' | 'secondary'

export const LOGIN_RESULT_VARIANTS: Record<LoginResult, TagVariant> = {
  success: 'success',
  invalid_password: 'warning',
  account_locked: 'danger',
  user_disabled: 'danger',
  user_not_found: 'secondary',
  session_expired: 'info',
}

/** Baris riwayat login (GET /admin/login-history) — nama nullable (percobaan gagal). */
export interface LoginHistoryEntry {
  id: string
  userId: string | null
  userName: string | null
  userEmail: string | null
  tenantId: string | null
  tenantName: string | null
  branchId: string | null
  branchName: string | null
  ipAddress: string | null
  userAgent: string | null
  loginResult: LoginResult
  failureReason: string | null
  createdAt: string
}
