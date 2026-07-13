import type { EntityStatus } from './common'

export interface Tenant {
  id: string
  name: string
  code: string
  status: EntityStatus
  createdAt: string
  updatedAt: string
}

/** Payload form. `code` hanya dikirim saat create (backend tidak menerima perubahan kode). */
export interface TenantInput {
  name: string
  code: string
  status: EntityStatus
}

export function emptyTenant(): TenantInput {
  return {
    name: '',
    code: '',
    status: 'active',
  }
}
